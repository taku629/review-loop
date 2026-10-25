import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));

describe('PWA files', () => {
  it('has an installable manifest scoped to the Pages base path', () => {
    expect(manifest.start_url).toBe('/review-loop/');
    expect(manifest.scope).toBe('/review-loop/');
    expect(manifest.display).toBe('standalone');
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  });

  it('ships every icon it references and a service worker', () => {
    for (const icon of manifest.icons) expect(existsSync(`public/${icon.src}`), icon.src).toBe(true);
    const sw = readFileSync('public/sw.js', 'utf8');
    expect(sw).toContain("addEventListener('fetch'");
    expect(sw).toContain('demo/snapshot.json');
  });

  it('is linked from index.html', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('name="theme-color"');
  });
});
