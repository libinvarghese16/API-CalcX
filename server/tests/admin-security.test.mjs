import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminService, hashPin, verifyPin, SESSION_MS, OWNER_EMAIL, tokenHash } from '../admin-security.mjs';

const owner = { uid: 'owner-uid', email: OWNER_EMAIL, emailVerified: true, disabled: false };
function fixture() {
  const records = new Map(); const calls = [];
  const accounts = new Map([[owner.uid, structuredClone(owner)], ['customer', { uid: 'customer', email: 'customer@example.com', disabled: false, emailVerified: true, customClaims: { unrelated: 'preserved' } }]]);
  let time = 1000000; let current = owner.uid; let revoked = false; let authTime = time / 1000;
  const ref = id => ({ id, async get() { return { exists: records.has(id), data: () => structuredClone(records.get(id)) }; }, async set(value, options) { records.set(id, options?.merge ? { ...records.get(id), ...value } : structuredClone(value)); }, async delete() { records.delete(id); } });
  const db = { collection: () => ({ doc: ref }), async runTransaction(fn) { return fn({ get: r => r.get(), set: (r, data) => r.set(data) }); } };
  const auth = {
    async verifyIdToken(token, checkRevoked) { assert.equal(checkRevoked, true); if (token !== 'valid' || revoked) throw new Error('invalid token'); return { uid: current, auth_time: authTime }; },
    async getUser(uid) { if (!accounts.has(uid)) throw new Error('not found'); return structuredClone(accounts.get(uid)); },
    async getUserByEmail(email) { const user = [...accounts.values()].find(x => x.email === email); if (!user) { const e = new Error(); e.code = 'auth/user-not-found'; throw e; } return structuredClone(user); },
    async listUsers(limit, page) { assert.equal(limit, 50); return { users: [...accounts.values()], pageToken: 'next' }; },
    async updateUser(uid, change) { calls.push(['update', uid, change]); Object.assign(accounts.get(uid), change); },
    async setCustomUserClaims(uid, claims) { calls.push(['claims', uid, claims]); accounts.get(uid).customClaims = claims; },
    async revokeRefreshTokens(uid) { calls.push(['revoke', uid]); },
  };
  const execute = createAdminService({ auth, db, ownerUid: owner.uid, now: () => time });
  const request = (action, body = {}, sessionToken) => execute({ action, body, sessionToken, idToken: 'valid' });
  const setup = () => request('setup', { pin: '82461937' });
  const unlock = (purpose = 'management') => request('unlock', { pin: '82461937', purpose });
  return { request, setup, unlock, records, accounts, calls, setUser: uid => { current = uid; }, advance: ms => { time += ms; }, expireLogin: () => { authTime -= 301; }, revoke: () => { revoked = true; } };
}
test('PIN hashing is salted and verifies without storing the PIN', async () => {
  const a = await hashPin('82461937'); const b = await hashPin('82461937');
  assert.notEqual(a.hash, b.hash); assert.equal(JSON.stringify(a).includes('82461937'), false);
  assert.equal(await verifyPin('82461937', a), true); assert.equal(await verifyPin('11111111', a), false);
  await assert.rejects(hashPin('1234'), /8 to 12/);
});
test('only pinned UID AND verified owner email may administer', async () => {
  const f = fixture(); f.setUser('customer');
  for (const action of ['status', 'setup', 'unlock', 'users', 'grant-paid']) await assert.rejects(f.request(action), /restricted/);
  f.accounts.get('customer').email = OWNER_EMAIL;
  await assert.rejects(f.request('status'), /restricted/);
  f.setUser(owner.uid); f.accounts.get(owner.uid).emailVerified = false;
  await assert.rejects(f.request('status'), /restricted/);
});
test('first PIN setup requires recent login and cannot replace existing PIN', async () => {
  const f = fixture(); await f.setup(); await assert.rejects(f.setup(), /already configured/);
  const stale = fixture(); stale.expireLogin(); await assert.rejects(stale.setup(), /Sign out/);
});
test('wrong PIN attempts lock out for 15 minutes', async () => {
  const f = fixture(); await f.setup();
  for (let i = 0; i < 5; i++) await assert.rejects(f.request('unlock', { pin: '11111111', purpose: 'management' }), /Incorrect/);
  await assert.rejects(f.unlock(), error => error.status === 429);
  f.advance(SESSION_MS + 1); assert.ok((await f.unlock()).token);
});
test('login unlock cannot authorize management; expired sessions fail', async () => {
  const f = fixture(); await f.setup(); const login = await f.unlock('login');
  await f.request('login-check', {}, login.token);
  await assert.rejects(f.request('users', {}, login.token), /expired/);
  const admin = await f.unlock(); assert.equal((await f.request('users', {}, admin.token)).users.length, 2);
  assert.equal(f.records.has(`session_${admin.token}`), false);
  assert.ok(f.records.has(`session_${tokenHash(admin.token)}`));
  f.advance(SESSION_MS + 1); await assert.rejects(f.request('users', {}, admin.token), /expired/);
});
test('paid access changes preserve unrelated claims and audit each action', async () => {
  const f = fixture(); await f.setup(); const { token } = await f.unlock();
  await f.request('grant-paid', { uid: 'customer' }, token);
  assert.deepEqual(f.accounts.get('customer').customClaims, { unrelated: 'preserved', paidAccess: true });
  await f.request('revoke-paid', { uid: 'customer' }, token);
  assert.equal(f.accounts.get('customer').customClaims.paidAccess, false);
  assert.ok(f.calls.some(call => call[0] === 'revoke' && call[1] === 'customer'));
  assert.equal([...f.records.values()].filter(x => x.status === 'completed').length, 3);
  for (const action of ['disable', 'revoke-sessions', 'revoke-paid', 'grant-paid']) await assert.rejects(f.request(action, { uid: owner.uid }, token), /another account/);
});
test('enable, disable and revoke sessions work; revoked identity is rejected', async () => {
  const f = fixture(); await f.setup(); const { token } = await f.unlock();
  await f.request('disable', { uid: 'customer' }, token); assert.equal(f.accounts.get('customer').disabled, true);
  await f.request('enable', { uid: 'customer' }, token); assert.equal(f.accounts.get('customer').disabled, false);
  await f.request('revoke-sessions', { uid: 'customer' }, token);
  f.revoke(); await assert.rejects(f.request('users', {}, token), /invalid token/);
});
test('PIN change invalidates both login and management sessions; explicit lock revokes token', async () => {
  const f = fixture(); await f.setup(); const a = await f.unlock(); const b = await f.unlock('login');
  await f.request('change-pin', { currentPin: '82461937', pin: '91628473' }, a.token);
  await assert.rejects(f.request('users', {}, a.token), /expired/);
  await assert.rejects(f.request('login-check', {}, b.token), /expired/);
  const c = await f.request('unlock', { pin: '91628473', purpose: 'management' });
  await f.request('lock', { purpose: 'management' }, c.token);
  await assert.rejects(f.request('users', {}, c.token), /expired/);
});
test('user listing excludes secrets and access reflects server claims', async () => {
  const f = fixture(); f.accounts.get('customer').passwordHash = 'secret'; await f.setup(); const { token } = await f.unlock();
  const list = await f.request('users', { email: 'customer@example.com' }, token);
  assert.equal(JSON.stringify(list).includes('secret'), false);
  f.setUser('customer'); assert.deepEqual(await f.request('access'), { enabled: true, owner: false, paidAccess: null });
  f.accounts.get('customer').customClaims.paidAccess = false;
  assert.equal((await f.request('access')).paidAccess, false);
});
test('invalid management tokens and unsupported operations fail closed', async () => {
  const f = fixture(); await f.setup();
  await assert.rejects(f.request('users'), /Enter your PIN/);
  await assert.rejects(f.request('users', {}, '0'.repeat(64)), /expired/);
  const { token } = await f.unlock(); await assert.rejects(f.request('delete-everyone', {}, token), /Unsupported/);
});
