import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';

const LEVELS = [
  'Hint 1: a gentle nudge — what to notice about the constraints or structure. One or two sentences. No algorithm names.',
  'Hint 2: name the key idea or technique and why it applies. Two or three sentences. No code.',
  'Approach: a concise step-by-step solution outline with the time complexity. No full code.',
];

interface HintRequest {
  title: string;
  url: string;
  judge: string;
  level: number;
  note?: string;
  previous?: string[];
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 20_000) throw new Error('Request too large');
  }
  return JSON.parse(raw);
}

export function hintMiddleware(env: Record<string, string | undefined>, base: string): Connect.NextHandleFunction {
  const key = env.OPENAI_API_KEY;
  const model = env.OPENAI_MODEL || 'gpt-4o-mini';
  const apiBase = (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  return async (req, res, next) => {
    const path = (req.url ?? '').split('?')[0];
    if (path === `${base}api/hint/status`) return send(res, 200, { enabled: !!key, model: key ? model : undefined });
    if (path !== `${base}api/hint` || req.method !== 'POST') return next();
    if (!key) return send(res, 503, { error: 'AI hints are disabled (no OPENAI_API_KEY on the server).' });
    try {
      const body = (await readJson(req)) as HintRequest;
      const level = Math.min(3, Math.max(1, Math.floor(Number(body.level) || 1)));
      const messages = [
        {
          role: 'system',
          content:
            'You are a competitive programming coach helping a student re-solve a problem they previously got wrong. ' +
            'Give only the requested hint level, never more. Be concrete and brief. If you do not recognise the problem, say so and give a generic hint based on the title.',
        },
        {
          role: 'user',
          content: [
            `Problem: ${String(body.title).slice(0, 200)} (${String(body.judge).slice(0, 30)})`,
            `URL: ${String(body.url).slice(0, 300)}`,
            body.note ? `Student's note about their past mistake: ${String(body.note).slice(0, 500)}` : '',
            body.previous?.length ? `Hints already given:\n${body.previous.slice(0, 2).map((h) => String(h).slice(0, 800)).join('\n')}` : '',
            `Now give ${LEVELS[level - 1]}`,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ];
      const r = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 400 }),
      });
      const data = (await r.json()) as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
      const hint = data.choices?.[0]?.message?.content?.trim();
      if (!r.ok || !hint) return send(res, 502, { error: data.error?.message ?? `LLM request failed (HTTP ${r.status})` });
      send(res, 200, { hint, level });
    } catch (e) {
      send(res, 400, { error: e instanceof Error ? e.message : 'Bad request' });
    }
  };
}

/** Serves /api/hint from the Vite dev and preview servers so the API key never reaches the browser. */
export function hintPlugin(env: Record<string, string | undefined>): Plugin {
  let base = '/';
  return {
    name: 'review-loop-hints',
    configResolved(c) {
      base = c.base;
    },
    configureServer(server) {
      server.middlewares.use(hintMiddleware(env, base));
    },
    configurePreviewServer(server) {
      server.middlewares.use(hintMiddleware(env, base));
    },
  };
}
