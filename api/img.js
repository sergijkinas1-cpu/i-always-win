// Photos for the dream gallery, stored one per file so the main state stays small.
// GET /api/img?id=ID -> data URL text;  PUT /api/img?id=ID  body = data URL text
import { get, put } from '@vercel/blob';
import { json, userDir, readText } from './_lib.js';

const idOf = request => {
  const id = new URL(request.url).searchParams.get('id') || '';
  return /^[a-z0-9_-]{4,40}$/i.test(id) ? id : null;
};

export async function GET(request) {
  const dir = userDir(request); const id = idOf(request);
  if (!dir || !id) return json(400, { error: 'bad_request' });
  const r = await get(dir + '/img/' + id + '.txt', { access: 'private' });
  if (!r || r.statusCode !== 200) return json(404, { error: 'not_found' });
  return new Response(await readText(r.stream), { headers: { 'content-type': 'text/plain', 'cache-control': 'private, max-age=31536000, immutable' } });
}

export async function PUT(request) {
  const dir = userDir(request); const id = idOf(request);
  if (!dir || !id) return json(400, { error: 'bad_request' });
  const text = await request.text();
  if (!text.startsWith('data:image/') || text.length > 4 * 1024 * 1024) return json(400, { error: 'bad_image' });
  await put(dir + '/img/' + id + '.txt', text, { access: 'private', contentType: 'text/plain', addRandomSuffix: false, allowOverwrite: true });
  return json(200, { ok: true });
}
