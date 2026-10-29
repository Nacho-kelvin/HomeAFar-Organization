// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = vi.fn();
  window.Image = class { set src(v) {} decode() { return Promise.resolve(); } };
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
});
afterEach(() => cleanup());

import App, { PartnerLogos } from '../src/App.jsx';

const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const publicSources = [...walk('src'), 'index.html'].filter((f) => /\.(jsx?|html)$/.test(f));

describe('founder name', () => {
  it('is Murugi Njiru wherever it appears, and the previous name is gone from the whole project source', () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain('Murugi Njiru');
    for (const file of publicSources) expect(readFileSync(file, 'utf8'), file).not.toMatch(/Gloria/i);
  });
});

describe('public wording audit', () => {
  const banned = [/illustrative/i, /placeholder content/i, /sample text/i, /example content/i, /for demonstration/i, /image representing/i, /this section explains/i, /lorem ipsum/i, /coming soon/i, /to be added/i, /to be filled/i, /\bTODO\b/, /not connected to a database/i];
  it('rendered page text contains no placeholder or development wording', () => {
    const { container } = render(<App />);
    const text = container.textContent;
    for (const pattern of banned) expect(text).not.toMatch(pattern);
    for (const img of container.querySelectorAll('img')) for (const pattern of banned) expect(img.getAttribute('alt') || '').not.toMatch(pattern);
    for (const el of container.querySelectorAll('[aria-label]')) for (const pattern of banned) expect(el.getAttribute('aria-label')).not.toMatch(pattern);
  });
  it('index.html metadata contains none either', () => {
    const html = readFileSync('index.html', 'utf8');
    for (const pattern of banned) expect(html).not.toMatch(pattern);
  });
});

describe('wordmark', () => {
  it('spells HomeAFar exactly in the header and footer', () => {
    const { container } = render(<App />);
    const marks = [...container.querySelectorAll('.wordmark')];
    expect(marks.length).toBeGreaterThanOrEqual(3); // header, emblem section, footer
    for (const mark of marks) expect(mark.textContent).toBe('HomeAFar');
  });
});

describe('Our emblem', () => {
  it('shows the original emblem file with descriptive alt text', () => {
    const { container } = render(<App />);
    const section = container.querySelector('#emblem');
    expect(section).toBeTruthy();
    expect(section.querySelector('img').getAttribute('src')).toContain('homeafar-logo.png');
    expect(section.querySelector('img').getAttribute('alt')).toMatch(/emblem/i);
    expect(section.querySelector('h2')).toBeTruthy();
  });
});

describe('Partners & collaborators', () => {
  it('has the section, categories, a working email call to action and no invented partner logos', () => {
    const { container } = render(<App />);
    const section = container.querySelector('#partners');
    expect(section.textContent).toMatch(/Together, we bring/i);
    expect(section.querySelectorAll('.partner-category').length).toBeGreaterThanOrEqual(5);
    expect(section.querySelector('a[href^="mailto:homeafar26@gmail.com"]').getAttribute('href')).toContain('partnership');
    expect(section.querySelector('.partner-logos')).toBeNull();
  });
  it('renders a logo grid with safe external links as soon as a partner is added', () => {
    const { container } = render(<PartnerLogos partners={[{ name: 'Example Org', logo: '/x.svg', url: 'https://example.org', width: 200, height: 80 }, { name: 'No Link Org', logo: '/y.svg', width: 100, height: 100 }]} />);
    const links = container.querySelectorAll('.partner-logos a');
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
    expect(container.querySelectorAll('.partner-logos img')).toHaveLength(2);
    expect(container.querySelector('img').getAttribute('width')).toBe('200');
  });
  it('renders nothing when there are no confirmed partners', () => {
    const { container } = render(<PartnerLogos partners={[]} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('gallery and navigation', () => {
  it('gallery images keep their own proportions and open in an accessible viewer', () => {
    const { container } = render(<App />);
    const thumbs = [...container.querySelectorAll('.moment img')];
    expect(thumbs.length).toBe(6);
    for (const img of thumbs) { expect(img.getAttribute('alt')).toBeTruthy(); expect(img.style.aspectRatio).toMatch(/\d+ \/ \d+/); }
    fireEvent.click(container.querySelector('.moment button'));
    const dialog = container.querySelector('dialog.image-dialog');
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.querySelector('.dialog-close').getAttribute('aria-label')).toBe('Close photo');
    const before = dialog.querySelector('img').getAttribute('alt');
    fireEvent.click(dialog.querySelector('.dialog-next'));
    expect(container.querySelector('dialog.image-dialog img').getAttribute('alt')).not.toBe(before);
  });
  it('every in-page link in the navigation and footer points at a real section', () => {
    const { container } = render(<App />);
    const hrefs = [...container.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1);
    expect(hrefs).toContain('#partners');
    expect(hrefs).toContain('#emblem');
    for (const h of hrefs) expect(container.querySelector(h), h).toBeTruthy();
  });
});
