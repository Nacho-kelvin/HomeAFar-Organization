import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import manifest from '../src/images.json';

const dir = 'assets/images/homeafar';
const source = ['src/App.jsx', 'src/forms.jsx', 'src/admin.jsx'].map((f) => readFileSync(f, 'utf8')).join('\n') + readFileSync('index.html', 'utf8');
const slugOf = (file) => file.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Every photo named anywhere in the code (any quoted .jpg/.jpeg file name).
const referenced = new Set([...source.matchAll(/["']([^"'/]+\.jpe?g)["']/g)].map((m) => slugOf(m[1])));

describe('image assets', () => {
  it('every photo used in the code is in the manifest and exists on disk at every listed width', () => {
    for (const slug of referenced) {
      expect(manifest[slug], `${slug} missing from images.json`).toBeTruthy();
      for (const w of manifest[slug].w) expect(existsSync(`${dir}/${slug}-${w}.webp`), `${slug}-${w}.webp missing`).toBe(true);
    }
  });
  it('nothing unused is shipped: no manifest entries or files that the code does not reference', () => {
    expect(Object.keys(manifest).filter((s) => !referenced.has(s))).toEqual([]);
    const orphans = readdirSync(dir).filter((f) => /-\d+\.webp$/.test(f)).filter((f) => {
      const m = f.match(/^(.+)-(\d+)\.webp$/);
      return !referenced.has(m[1]) || !manifest[m[1]]?.w.includes(Number(m[2]));
    });
    expect(orphans).toEqual([]);
  });
});
