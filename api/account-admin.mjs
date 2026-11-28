import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { AccessError, createAdminService } from '../server/admin-security.mjs';

let service;
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }); }
  // No CORS and no cookies. Every operation needs an explicit Firebase bearer token.
  if (process.env.ACCOUNT_ADMIN_ENABLED !== 'true') return res.status(503).json({ error: 'Account management is awaiting secure server setup.', code: 'setup-required' });
  const origin = req.headers.origin;
  const allowedOrigins = (process.env.ADMIN_ALLOWED_ORIGINS || 'https://api-calc-x-mobile.vercel.app').split(',').map(value => value.trim());
  if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Origin not allowed.' });
  if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || !process.env.ADMIN_OWNER_UID) return res.status(503).json({ error: 'Account management is unavailable. Contact the owner.' });
  try {
    if (!service) {
      const credentials = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
      if (credentials.project_id !== 'api-calc-x') throw new Error('Unexpected Firebase project.');
      const app = getApps().find(item => item.name === 'account-admin') ?? initializeApp({ credential: cert(credentials), projectId: 'api-calc-x' }, 'account-admin');
      // This project's newly provisioned default database is private: deny all client reads/writes.
      service = createAdminService({ auth: getAuth(app), db: getFirestore(app), ownerUid: process.env.ADMIN_OWNER_UID });
    }
    const authorization = req.headers.authorization;
    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ') || authorization.length > 10000) throw new AccessError(401, 'Sign in again.');
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 5000) throw new AccessError(400, 'Invalid request.');
    const result = await service({ action: body.action, body, idToken: authorization.slice(7), sessionToken: req.headers['x-admin-session'] });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AccessError) return res.status(error.status).json({ error: error.message });
    if (error instanceof SyntaxError) return res.status(400).json({ error: 'Invalid request.' });
    if (['auth/id-token-expired', 'auth/id-token-revoked', 'auth/user-disabled', 'auth/argument-error', 'auth/invalid-id-token', 'auth/user-not-found'].includes(error.code)) return res.status(401).json({ error: 'Sign in again. Your session is no longer valid.' });
    // Do not log request bodies, credentials, tokens, PINs or account records.
    console.error('Account administration failed:', error.code || error.name);
    return res.status(503).json({ error: 'Account management is unavailable. Try again later.' });
  }
}
