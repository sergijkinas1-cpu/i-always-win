// Shared helpers for the sync API. Data lives in a private Vercel Blob store.
// Each person is identified only by their secret sync code; the store path is a hash of it.
import { createHash } from 'node:crypto';

export const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

export function userDir(request) {
  const raw = request.headers.get('x-sync-key') || '';
  const key = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (key.length < 16 || key.length > 64) return null;
  return 'u/' + createHash('sha256').update('iaw-sync:' + key).digest('hex');
}

export async function readText(stream) {
  return await new Response(stream).text();
}
