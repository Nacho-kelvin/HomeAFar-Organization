// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act, waitFor } from '@testing-library/react';
import { existsSync } from 'node:fs';

beforeAll(() => {
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = vi.fn();
  window.Image = class { set src(v) {} decode() { return Promise.resolve(); } };
});
afterEach(() => cleanup());

import App from '../src/App.jsx';

describe('whole page', () => {
  it('renders, with one h1, hero slideshow dots without prev/next/pause buttons and no empty accent element', () => {
    const { container } = render(<App />);
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(container.querySelectorAll('h1 em:empty')).toHaveLength(0);
    // the hero has no previous/next/play/pause buttons; the dots remain, and swiping still changes photos
    expect(screen.queryByRole('button', { name: /show next photo|show previous photo|pause slideshow|play slideshow/i })).toBeNull();
    expect(container.querySelectorAll('.slide-indicator')).toHaveLength(5);
  });

  it('every image on the page points at a file that exists', () => {
    const { container } = render(<App />);
    const imgs = [...container.querySelectorAll('img')];
    expect(imgs.length).toBeGreaterThan(10);
    for (const img of imgs) {
      expect(img.getAttribute('alt')).not.toBeNull(); // empty alt is allowed, missing is not
      const src = decodeURIComponent(img.getAttribute('src'));
      if (/^https?:\/\//.test(src)) continue;
      expect(existsSync(`assets${src}`), `${src} does not exist`).toBe(true);
    }
  });

  it('section photo slideshows exist, each with labelled dots, and only one slide is exposed at a time', () => {
    const { container } = render(<App />);
    const staticShows = [
      container.querySelector('.program-community-photo .xf'),
      container.querySelector('.opportunities-photo .xf'),
    ];
    const shows = [...container.querySelectorAll('.xf')].filter((show) => !staticShows.includes(show));
    expect(shows.length).toBeGreaterThanOrEqual(5);
    shows.forEach((show) => {
      expect(show.getAttribute('aria-label')).toBeTruthy();
      expect(show.querySelectorAll('.xf-slide:not([aria-hidden])')).toHaveLength(1);
      expect(show.querySelectorAll('.xf-dot').length).toBeGreaterThan(1);
    });
    staticShows.forEach((show) => {
      expect(show).toBeTruthy();
      expect(show.querySelectorAll('.xf-slide')).toHaveLength(1);
      expect(show.querySelectorAll('.xf-dot')).toHaveLength(0);
    });
    const first = container.querySelector('.xf');
    const dots = first.querySelectorAll('.xf-dot');
    fireEvent.click(dots[1]);
    expect(first.querySelector('.xf-slide.is-active img').getAttribute('alt')).toBeTruthy();
    expect(dots[1].getAttribute('aria-current')).toBe('true');
  });

  it('back-to-top appears after scrolling and scrolls to the top', async () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /back to top/i });
    expect(button.className).not.toContain('is-visible');
    act(() => { Object.defineProperty(window, 'scrollY', { value: 1500, configurable: true }); window.dispatchEvent(new Event('scroll')); });
    await waitFor(() => expect(button.className).toContain('is-visible'));
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });
});
