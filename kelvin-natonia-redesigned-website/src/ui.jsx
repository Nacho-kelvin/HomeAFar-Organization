import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { Photo, reducedMotion } from './photo.jsx';

const RING = 2 * Math.PI * 24; // circumference of the progress ring around the button

// Thin reading-progress bar along the top + a "back to top" button that appears after the first screen.
export function ScrollUI() {
  const bar = useRef(null);
  const ring = useRef(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
      if (ring.current) ring.current.style.strokeDashoffset = String(RING * (1 - progress));
      setShow(window.scrollY > Math.max(520, window.innerHeight * 0.6));
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });

  return (
    <>
      <div className="scroll-progress" ref={bar} aria-hidden="true" />
      <button className={`to-top${show ? ' is-visible' : ''}`} type="button" aria-label="Back to top" onClick={toTop}>
        <svg className="to-top-ring" viewBox="0 0 52 52" aria-hidden="true">
          <circle className="to-top-track" cx="26" cy="26" r="24" />
          <circle className="to-top-bar" ref={ring} cx="26" cy="26" r="24" strokeDasharray={RING} strokeDashoffset={RING} />
        </svg>
        <Icon name="arrowUp" size={20} />
      </button>
    </>
  );
}

// Photo slideshow that cross-fades inside whatever frame it is placed in.
// Pauses when off-screen, when the tab is hidden, while hovered/focused, and for visitors who prefer reduced motion.
export function Crossfade({ slides, label, sizes, interval = 5600, start = 0, className = '' }) {
  const count = slides.length;
  const [index, setIndex] = useState(start % count);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);
  const [held, setHeld] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !('IntersectionObserver' in window)) { setInView(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (count < 2 || !inView || !tabVisible || held || reducedMotion()) return undefined;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), interval);
    return () => window.clearTimeout(timer);
  }, [count, index, inView, tabVisible, held, interval]);

  return (
    <div className={`xf ${className}`} ref={root} role="group" aria-roledescription="slideshow" aria-label={label}
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      {slides.map((slide, i) => (
        <div className={`xf-slide${i === index ? ' is-active' : ''}`} key={slide.file} aria-hidden={i === index ? undefined : 'true'}>
          <Photo file={slide.file} alt={slide.alt} sizes={sizes} style={{ '--pos': slide.pos }} />
        </div>
      ))}
      {count > 1 && (
        <div className="xf-dots">
          {slides.map((slide, i) => (
            <button type="button" key={slide.file} className={`xf-dot${i === index ? ' is-active' : ''}`} aria-label={`Show photo ${i + 1} of ${count}`} aria-current={i === index ? 'true' : undefined} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
