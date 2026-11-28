import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
export const OWNER_EMAIL = 'libinvarghese16@gmail.com';
export const SESSION_MS = 15 * 60 * 1000;
export class AccessError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function assertOwner(user, ownerUid) {
  if (!ownerUid || user.uid !== ownerUid || user.email?.toLowerCase() !== OWNER_EMAIL || !user.emailVerified || user.disabled) {
    throw new AccessError(403, 'This section is restricted to the verified owner account.');
  }
}
export function validatePin(pin) {
  if (typeof pin !== 'string' || !/^\d{8,12}$/.test(pin)) throw new AccessError(400, 'Use a PIN containing 8 to 12 digits.');
}
export async function hashPin(pin) {
  validatePin(pin);
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(pin, salt, 64)).toString('hex');
  return { salt, hash };
}
export async function verifyPin(pin, record) {
  validatePin(pin);
  const actual = await scrypt(pin, record.salt, 64);
  const expected = Buffer.from(record.hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('hex');
export function assertRecentLogin(decoded, now) {
  if (!Number.isFinite(decoded.auth_time) || now / 1000 - decoded.auth_time > 300 || decoded.auth_time > now / 1000 + 30) {
    throw new AccessError(401, 'Sign out and sign in again before setting or changing your PIN.');
  }
}
export function publicUser(user) {
  return { uid: user.uid, email: user.email ?? '', name: user.displayName ?? '', disabled: user.disabled,
    paidAccess: typeof user.customClaims?.paidAccess === 'boolean' ? user.customClaims.paidAccess : null,
    createdAt: user.metadata?.creationTime ?? '', lastSignInAt: user.metadata?.lastSignInTime ?? '' };
}

/** All state is in the private server database; none is trusted from the browser. */
export function createAdminService({ auth, db, ownerUid, now = Date.now }) {
  const collection = db.collection('security');
  const pinRef = () => collection.doc(`pin_${ownerUid}`);
  const limiterRef = () => collection.doc(`attempts_${ownerUid}`);
  async function reserveAttempt() {
    await db.runTransaction(async tx => {
      const ref = limiterRef(); const data = (await tx.get(ref)).data(); const time = now();
      if (data?.until > time && data.count >= 5) throw new AccessError(429, 'Too many PIN attempts. Try again in 15 minutes.');
      tx.set(ref, { count: data?.until > time ? data.count + 1 : 1, until: data?.until > time ? data.until : time + SESSION_MS });
    });
  }
  async function session(token, uid, purpose) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new AccessError(401, 'Enter your PIN to unlock this section.');
    const ref = collection.doc(`session_${tokenHash(token)}`);
    const [saved, pin] = await Promise.all([ref.get(), pinRef().get()]);
    const data = saved.data();
    if (!data || data.uid !== uid || data.purpose !== purpose || data.expiresAt <= now() || data.version !== pin.data()?.version) {
      throw new AccessError(401, 'Your PIN session expired. Unlock again.');
    }
    return ref;
  }
  async function audit(uid, action, targetUid, status, id = newToken()) {
    await collection.doc(`audit_${id}`).set({ uid, action, targetUid, status, at: now() }, { merge: true });
    return id;
  }
  return async function execute({ action, body = {}, idToken, sessionToken }) {
    const decoded = await auth.verifyIdToken(idToken, true);
    const user = await auth.getUser(decoded.uid);
    if (user.disabled) throw new AccessError(403, 'This account is disabled.');
    if (action === 'access') return { enabled: true, owner: user.uid === ownerUid && user.email?.toLowerCase() === OWNER_EMAIL && user.emailVerified,
      paidAccess: typeof user.customClaims?.paidAccess === 'boolean' ? user.customClaims.paidAccess : null };
    assertOwner(user, ownerUid);
    if (action === 'status') return { configured: (await pinRef().get()).exists };
    if (action === 'setup') {
      assertRecentLogin(decoded, now());
      const credential = await hashPin(body.pin);
      await db.runTransaction(async tx => {
        if ((await tx.get(pinRef())).exists) throw new AccessError(409, 'A PIN is already configured. Unlock with your existing PIN.');
        tx.set(pinRef(), { ...credential, version: newToken(), createdAt: now() });
      });
      await audit(user.uid, 'setup-pin', user.uid, 'completed');
      return { ok: true };
    }
    if (action === 'unlock') {
      if (!['login', 'management'].includes(body.purpose)) throw new AccessError(400, 'Choose the section to unlock.');
      validatePin(body.pin);
      await reserveAttempt();
      const pin = (await pinRef().get()).data();
      if (!pin || !await verifyPin(body.pin, pin)) throw new AccessError(401, 'Incorrect PIN.');
      const token = newToken(); const expiresAt = now() + SESSION_MS;
      await collection.doc(`session_${tokenHash(token)}`).set({ uid: user.uid, purpose: body.purpose, version: pin.version, expiresAt });
      await limiterRef().delete();
      return { token, expiresAt };
    }
    if (action === 'login-check') { await session(sessionToken, user.uid, 'login'); return { ok: true }; }
    if (action === 'lock') {
      if (!['login', 'management'].includes(body.purpose)) throw new AccessError(400, 'Invalid section.');
      await (await session(sessionToken, user.uid, body.purpose)).delete();
      return { ok: true };
    }
    await session(sessionToken, user.uid, 'management');
    if (action === 'change-pin') {
      assertRecentLogin(decoded, now());
      await reserveAttempt();
      const saved = await pinRef().get();
      if (!await verifyPin(body.currentPin, saved.data())) throw new AccessError(401, 'Incorrect current PIN.');
      const credential = await hashPin(body.pin);
      await db.runTransaction(async tx => {
        if ((await tx.get(pinRef())).data()?.version !== saved.data().version) throw new AccessError(409, 'PIN changed. Sign in again.');
        tx.set(pinRef(), { ...credential, version: newToken(), createdAt: now() });
      });
      await audit(user.uid, 'change-pin', user.uid, 'completed');
      return { ok: true };
    }
    if (action === 'users') {
      if (body.email) {
        if (typeof body.email !== 'string' || body.email.length > 254) throw new AccessError(400, 'Enter a valid email.');
        try { return { users: [publicUser(await auth.getUserByEmail(body.email.trim()))], nextPage: null }; }
        catch (error) { if (error.code === 'auth/user-not-found') return { users: [], nextPage: null }; throw error; }
      }
      if (body.pageToken && (typeof body.pageToken !== 'string' || body.pageToken.length > 2000)) throw new AccessError(400, 'Invalid page.');
      const page = await auth.listUsers(50, body.pageToken || undefined);
      return { users: page.users.map(publicUser), nextPage: page.pageToken ?? null };
    }
    if (!['enable', 'disable', 'revoke-sessions', 'grant-paid', 'revoke-paid'].includes(action)) throw new AccessError(400, 'Unsupported action.');
    if (typeof body.uid !== 'string' || !body.uid || body.uid.length > 128 || body.uid === ownerUid) throw new AccessError(400, 'Choose another account. Owner access cannot be changed here.');
    const target = await auth.getUser(body.uid);
    const id = await audit(user.uid, action, target.uid, 'requested');
    try {
      if (action === 'enable' || action === 'disable') await auth.updateUser(target.uid, { disabled: action === 'disable' });
      if (action === 'grant-paid' || action === 'revoke-paid') await auth.setCustomUserClaims(target.uid, { ...target.customClaims, paidAccess: action === 'grant-paid' });
      if (['disable', 'revoke-sessions', 'revoke-paid'].includes(action)) await auth.revokeRefreshTokens(target.uid);
      await audit(user.uid, action, target.uid, 'completed', id);
      return { ok: true };
    } catch (error) {
      await audit(user.uid, action, target.uid, 'failed-or-partial', id);
      throw error;
    }
  };
}
