import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../api/account-admin.mjs';

function response() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(value) { this.body = value; return this; } }; }
test('HTTP endpoint rejects non-POST requests and never caches account data', async () => {
  const res = response(); await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 405); assert.match(res.headers['Cache-Control'], /no-store/);
});
test('HTTP endpoint rejects cross-origin requests before touching credentials', async () => {
  const previous = process.env.ACCOUNT_ADMIN_ENABLED;
  try {
    process.env.ACCOUNT_ADMIN_ENABLED = 'true';
    const res = response(); await handler({ method: 'POST', headers: { origin: 'https://attacker.example' } }, res);
    assert.equal(res.statusCode, 403);
  } finally { if (previous === undefined) delete process.env.ACCOUNT_ADMIN_ENABLED; else process.env.ACCOUNT_ADMIN_ENABLED = previous; }
});
test('feature is inactive until explicitly enabled; broken active setup must fail closed', async () => {
  const previous = process.env.ACCOUNT_ADMIN_ENABLED;
  try {
    delete process.env.ACCOUNT_ADMIN_ENABLED;
    const disabled = response(); await handler({ method: 'POST', headers: {} }, disabled);
    assert.equal(disabled.statusCode, 503); assert.equal(disabled.body.code, 'setup-required');
    process.env.ACCOUNT_ADMIN_ENABLED = 'true';
    const missing = response(); await handler({ method: 'POST', headers: {} }, missing);
    assert.equal(missing.statusCode, 503); assert.equal(missing.body.code, undefined);
  } finally { if (previous === undefined) delete process.env.ACCOUNT_ADMIN_ENABLED; else process.env.ACCOUNT_ADMIN_ENABLED = previous; }
});
