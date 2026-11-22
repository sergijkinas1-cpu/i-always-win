// GET  /api/sync  -> { state, etag } (state is null when nothing is saved yet)
// PUT  /api/sync  body { state, etag } -> { etag }; 409 when someone else saved first
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { json, userDir, readText } from './_lib.js';

const MAX = 4 * 1024 * 1024;

export async function GET(request) {
  const dir = userDir(request);
  if (!dir) return json(401, { error: 'bad_key' });
  const r = await get(dir + '/state.json', { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200) return json(200, { state: null, etag: null });
  const text = await readText(r.stream);
  return json(200, { state: JSON.parse(text), etag: r.blob.etag });
}

export async function PUT(request) {
  const dir = userDir(request);
  if (!dir) return json(401, { error: 'bad_key' });
  const text = await request.text();
  if (text.length > MAX) return json(413, { error: 'too_large' });
  let body;
  try { body = JSON.parse(text); } catch (e) { return json(400, { error: 'bad_json' }); }
  if (!body || typeof body.state !== 'object' || body.state === null) return json(400, { error: 'bad_state' });
  const opts = { access: 'private', contentType: 'application/json', addRandomSuffix: false, cacheControlMaxAge: 60 };
  if (body.etag) opts.ifMatch = body.etag; // only overwrite the version this device merged with
  try {
    const res = await put(dir + '/state.json', JSON.stringify(body.state), opts);
    return json(200, { etag: res.etag });
  } catch (e) {
    if (e instanceof BlobPreconditionFailedError || /already exists|precondition/i.test(String(e && e.message))) return json(409, { error: 'conflict' });
    throw e;
  }
}
