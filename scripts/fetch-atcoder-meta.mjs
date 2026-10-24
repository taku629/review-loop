// Build-time snapshot of AtCoder problem titles/difficulties (fallback when the browser can't fetch them directly).
import { mkdirSync, writeFileSync } from 'node:fs';

const RES = 'https://kenkoooo.com/atcoder/resources';
const out = new URL('../public/atcoder-meta.json', import.meta.url);
mkdirSync(new URL('.', out), { recursive: true });
try {
  const [problems, models] = await Promise.all([
    fetch(`${RES}/problems.json`).then((r) => r.json()),
    fetch(`${RES}/problem-models.json`).then((r) => r.json()),
  ]);
  const meta = {};
  for (const p of problems) {
    const d = models[p.id]?.difficulty;
    meta[p.id] = d === undefined ? [p.contest_id, p.title] : [p.contest_id, p.title, Math.round(d)];
  }
  writeFileSync(out, JSON.stringify(meta));
  console.log(`atcoder-meta.json: ${problems.length} problems`);
} catch (e) {
  writeFileSync(out, '{}');
  console.warn('atcoder-meta.json: fetch failed, wrote empty fallback —', e.message);
}
