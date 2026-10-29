// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root = (...p) => resolve(process.cwd(), ...p);

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = vi.fn();
  window.Image = class { set src(v) {} decode() { return Promise.resolve(); } };
});
afterEach(() => cleanup());

import App from '../src/App.jsx';

describe('accessibility regressions', () => {
  it('brand links take their accessible name from the visible text (WCAG label-in-name)', () => {
    const { container } = render(<App />);
    const brands = container.querySelectorAll('a.brand');
    expect(brands.length).toBeGreaterThanOrEqual(2);
    brands.forEach((a) => {
      expect(a.hasAttribute('aria-label')).toBe(false);
      expect(a.textContent).toMatch(/HomeAFar\s+Connect/);
    });
  });

  it('every in-page link points at an element that exists', () => {
    const { container } = render(<App />);
    const ids = new Set([...container.querySelectorAll('[id]')].map((e) => e.id));
    const missing = [...container.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && h !== '#main' && !ids.has(h.slice(1)));
    expect(missing).toEqual([]);
  });
});

describe('spacing system', () => {
  const css = (f) => readFileSync(root('css', f), 'utf8');
  it('section padding and page gutters are declared in exactly one stylesheet', () => {
    const owners = readdirSync(root('css')).filter((f) => /^\s*\.(section-space|page-width)\s*\{/m.test(css(f)));
    expect(owners).toEqual(['spacing.css']);
  });
  it('spacing.css is the last stylesheet imported', () => {
    const imports = [...readFileSync(root('src', 'App.jsx'), 'utf8').matchAll(/import '\.\.\/css\/([\w-]+\.css)'/g)].map((m) => m[1]);
    expect(imports.at(-1)).toBe('spacing.css');
  });
});
