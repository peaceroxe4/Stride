// Stride Coach: serverless proxy to the Anthropic API.
// The API key lives only in the ANTHROPIC_API_KEY environment variable, never in the browser.
const n = (v, max = 400) => (Number.isFinite(+v) ? Math.min(Math.max(+v, 0), max) : 0);

export default async (req) => {
  // GET is a health check: the coach button only shows when an API key is configured.
  if (req.method === 'GET') return new Response(null, { status: process.env.ANTHROPIC_API_KEY ? 204 : 404 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  let body;
  try { body = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }

  const p = body.profile || {};
  const place = ['Home', 'Gym', 'Both'].includes(p.place) ? p.place : 'Both';
  const msgs = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-7)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));
  if (!msgs.length || msgs[0].role !== 'user' || msgs[msgs.length - 1].role !== 'user') {
    return new Response('Bad request', { status: 400 });
  }

  const system =
    'You are Stride Coach, a friendly, practical vertical-jump and dunk coach inside a training app. ' +
    'Only answer questions about jumping, strength training, recovery, nutrition for athletes and the app. ' +
    'Politely decline anything else. Reply in the same language the user writes in. ' +
    'Keep answers under 150 words, concrete and encouraging. You are not a doctor: for sharp or lasting pain, ' +
    'injuries or medical questions, tell them to see a professional. Never push heavy jumping when someone is hurt or very tired.\n' +
    `User profile: height ${n(p.height)} cm, standing reach ${n(p.reach)} cm, best jump ${n(p.best)} cm, ` +
    `goal touch ${n(p.target)} cm, trains at ${place}, ${n(p.days, 7)} days a week, plan week ${n(p.week, 16)}, ${n(p.sets, 100000)} sets logged.`;

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 400, system, messages: msgs }),
  });
  if (!r.ok) return new Response('Upstream error', { status: 502 });
  const j = await r.json();
  const text = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  return Response.json({ text });
};

export const config = { path: '/api/coach' };
