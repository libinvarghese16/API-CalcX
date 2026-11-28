import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('server loads and resolves signing keys without CommonJS-to-ESM require support', () => {
  const script = `
    import { createRequire } from 'node:module';
    import { generateKeyPairSync, createPublicKey } from 'node:crypto';
    import handler from './apps/mobile/api/account-admin.mjs';
    const require = createRequire(import.meta.url);
    const adminRequire = createRequire(require.resolve('firebase-admin/app'));
    const jwksClient = adminRequire('jwks-rsa');
    const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'runtime-test', alg: 'RS256', use: 'sig' };
    const client = jwksClient({ jwksUri: 'https://unused.invalid', getKeysInterceptor: async () => [jwk] });
    const key = await client.getSigningKey('runtime-test');
    if (createPublicKey(key.getPublicKey()).export({ format: 'jwk' }).n !== jwk.n) throw new Error('Signing key mismatch');
    if (typeof handler !== 'function') throw new Error('Missing handler');
  `;
  const result = spawnSync(process.execPath, ['--no-experimental-require-module', '--input-type=module', '-e', script], {
    cwd: new URL('../../', import.meta.url), encoding: 'utf8', timeout: 20000,
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});
