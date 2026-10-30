import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ContactForm, StoryForm, JoinForm, ApprovedStories } from './forms.jsx';
import '../css/style.css';
import '../css/redesign.css';
import '../css/hero-extras.css';
import '../css/polish.css';
import '../css/luxe.css';
import '../css/spacing.css';
import { Icon } from './icons.jsx';
import { Photo, photoProps, image } from './photo.jsx';
import { ScrollUI, Crossfade } from './ui.jsx';
import { PARTNERS, PARTNERSHIP_EMAIL } from './partners.js';

const Admin = lazy(() => import('./admin.jsx'));

// The real community photos, named by what they show.
const PHOTO = {
  welcome: 'WhatsApp Image 2026-10-24 at 09.14.51.jpeg', // line-up holding welcome signs
  couch: 'WhatsApp Image 2026-10-24 at 17.15.43.jpeg', // everyone together on the sofa
  passport: 'WhatsApp Image 2026-10-24 at 09.23.59.jpeg', // smiling, holding a passport
  group: 'WhatsApp Image 2026-10-24 at 09.23.59 (1).jpeg', // big laughing group under the trees
  facepaint: 'WhatsApp Image 2026-10-24 at 09.14.50 (2).jpeg', // portrait with flag face paint
  circle: 'WhatsApp Image 2026-10-24 at 09.14.50 (1).jpeg', // friends sharing an activity
  gathered: 'WhatsApp Image 2026-10-24 at 09.23.59 (2).jpeg', // friends gathered together
  hands: 'WhatsApp Image 2026-10-24 at 09.14.50.jpeg', // hands together over a shared activity
  invite: 'WhatsApp Image 2026-10-24 at 09.17.10.jpeg', // the Passport Picnic invitation
};
const ALT = {
  welcome: 'HomeAFar community members holding welcome signs and passports outdoors',
  couch: 'Friends sitting together at a community gathering',
  passport: 'A community member smiling and holding a HomeAFar passport',
  group: 'Community members smiling together beneath the trees',
  facepaint: 'A community member wearing face paint at an outdoor gathering',
  circle: 'Friends gathered around a shared outdoor activity',
  gathered: 'Friends gathered together outdoors',
  hands: 'Friends with their hands together over a shared activity outdoors',
  invite: 'The Passport Picnic invitation: 30 August 2026, 2 to 6 pm, Tineretului Park, Bucharest',
};
const shot = (key, pos) => ({ file: PHOTO[key], alt: ALT[key], pos });

// Homepage slideshow: three documentary photographs, each with its own message and focal point.
const HERO = {
  growth: 'vrFYk.jpg',
  community: PHOTO.group,
  roots: '06-savanna-silhouette-roots.jpg',
};
const slides = [
  {
    file: HERO.growth,
    eyebrow: 'Rooted in home',
    title: 'A home you',
    accent: 'can carry.',
    copy: 'HomeAFar helps young Africans abroad stay connected to culture, community and opportunity.',
    alt: 'Young plants growing among the roots of a tree in warm sunlight.',
    pos: 'center',
    posM: 'center 58%',
  },
  {
    file: HERO.community,
    eyebrow: 'Find your people',
    title: 'Belonging lives',
    accent: 'wherever you are.',
    copy: 'Meet a generous community that celebrates where you come from and where you are going.',
    alt: 'HomeAFar community members smiling together outdoors.',
    pos: 'center 54%',
    posM: 'center 58%',
  },
  {
    file: HERO.roots,
    eyebrow: 'Wherever the road leads',
    title: 'Africa is',
    accent: 'always with you.',
    copy: 'Distance changes the view, never the roots. Carry home in your story, your food, your music and your people.',
    alt: 'A person looking across an African landscape beneath a connected map of Africa.',
    pos: 'center center',
    posM: 'center center',
  },
];

// Section slideshows. Each frame cycles through photos that suit its shape; focal points keep faces in view.
const SHOW = {
  about: [shot('passport', 'center 20%'), shot('facepaint', 'center 62%'), shot('gathered', 'center 76%')],
  programs: [shot('group', 'center 56%')],
  team: [shot('couch', 'center 50%'), shot('group', 'center 56%'), shot('welcome', 'center 45%')],
  events: [shot('welcome', 'center 45%'), shot('passport', 'center 20%'), shot('facepaint', 'center 66%')],
  opportunities: [shot('circle', 'center 42%')],
  contact: [shot('couch', 'center 50%'), shot('welcome', 'center 45%')],
  join: [shot('group', 'center 56%'), shot('welcome', 'center 45%'), shot('couch', 'center 52%')],
};

// One wordmark everywhere: the header, the footer and the emblem section share this markup and its styles.
const Wordmark = () => (
  <span className="brand-name wordmark"><span className="wm-word">Home</span><span className="brand-name-a wm-a">A</span><span className="wm-word">Far</span></span>
);

const Brand = ({ footer = false }) => (
  <a className={`brand${footer ? ' footer-brand' : ''}`} href="#home">
    <img className="brand-mark" src={image('homeafar-logo.png')} alt="" width="52" height="52" />
    <span className="brand-copy">
      <Wordmark />{' '}
      <span className="brand-tagline">Connect · Share · Grow</span>
    </span>
  </a>
);

const Eyebrow = ({ children, light = false }) => (
  <p className={`eyebrow${light ? ' eyebrow-light' : ''}`}><span className="eyebrow-line" />{children}</p>
);

const SectionTitle = ({ eyebrow, title, id, children }) => (
  <div className="section-heading-row reveal">
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="section-heading" id={id}>{title}</h2>
    </div>
    {children}
  </div>
);

const stories = [
  {
    file: PHOTO.welcome,
    alt: 'Community members holding welcome signs and HomeAFar passports outdoors',
    kicker: 'A welcome in our own words',
    title: 'Making space for each other.',
    copy: 'A welcome is more than a sign. It is an invitation to meet, share a little of ourselves, and help shape a community together.',
    icon: 'people',
  },
  {
    file: PHOTO.hands,
    alt: ALT.hands,
    kicker: 'Small moments, shared',
    title: 'Connection starts side by side.',
    copy: 'Sometimes it begins with a simple activity: people gathering around, taking part, and enjoying a moment together.',
    icon: 'spark',
  },
  {
    file: PHOTO.passport,
    alt: 'A community member smiling and holding a HomeAFar passport',
    kicker: 'Every person has a story',
    title: 'The next chapter is yours.',
    copy: 'Each person brings their own experiences, memories, and hopes. We want those stories shared in the storyteller’s own voice, only when they choose.',
    icon: 'story',
  },
  {
    file: PHOTO.couch,
    alt: 'Friends sitting together at a community gathering',
    kicker: 'Finding familiar company',
    title: 'A room can feel more like home.',
    copy: 'Time together creates room to listen, exchange experiences, and find the familiar comfort of being among people.',
    icon: 'heart',
  },
];

const programs = [
  {
    status: 'In development',
    thumb: ['04-traveler-airport-backview.jpg', 'A traveller with a suitcase walking through an airport terminal'],
    icon: 'plane',
    title: 'Safe Landing',
    text: 'Practical information and signposting for Africans living in or visiting Romania, with a focus on navigating a new place with greater confidence.',
    note: 'Housing information and referrals are planned; no accommodation placements are offered here.',
  },
  {
    status: 'Culture & exchange',
    thumb: ['03-hands-connection-cafe.jpg', 'Kente cloth, wooden beads, a carved mask and a passport on a table'],
    icon: 'globe',
    title: 'African Culture & Tourism',
    text: 'Celebrate the continent’s many destinations, languages, histories, food, music and local experiences—without reducing Africa to one story.',
    note: 'Country features and future travel connections are being developed.',
  },
  {
    status: 'Information & referrals',
    thumb: ['06-savanna-silhouette-roots.jpg', 'Two people holding hands across a table'],
    icon: 'scales',
    title: 'Protection, Fairness & Justice',
    text: 'Build pathways to credible information and appropriate support for Africans facing discrimination, exploitation or unfair treatment.',
    note: 'HomeAFar is not a legal practice or emergency service.',
  },
  {
    status: 'Long-term vision',
    thumb: ['vrFYk.jpg', 'Young seedlings growing from the roots of a large tree'],
    icon: 'pulse',
    title: 'Women’s Health & Community Impact',
    text: 'A long-term commitment to awareness, dignity and more accessible women’s healthcare in vulnerable communities.',
    note: 'HomeAFar is not a clinic or medical provider. This vision depends on qualified partners.',
  },
];

const opportunityTypes = [['cap', 'Scholarships'], ['briefcase', 'Jobs'], ['compass', 'Internships'], ['story', 'Training'], ['heart', 'Volunteering'], ['palette', 'Creative work']];

// Gallery: real photographs, best first. Every image keeps its own proportions (no cropping).
const moments = [
  { key: 'group', alt: ALT.group },
  { key: 'passport', alt: ALT.passport },
  { key: 'welcome', alt: ALT.welcome },
  { key: 'facepaint', alt: ALT.facepaint },
  { key: 'couch', alt: ALT.couch },
  { key: 'gathered', alt: ALT.gathered },
].map((item) => ({ ...item, file: PHOTO[item.key] }));

const teamMembers = [
  { name: 'Murugi Njiru', role: 'Founder & Managing Director', bio: 'Originated the HomeAFar vision and leads its direction, events, storytelling concepts and community growth.', photo: null, icon: 'compass', gradientStart: '#D4A574', gradientEnd: '#8B6F47' },
  { name: 'Charles', role: 'Co-founder', bio: 'Builds meaningful partnerships and community connections.', photo: null, icon: 'handshake', gradientStart: '#A0826D', gradientEnd: '#6B5D52' },
  { name: 'Marcell', role: 'Technical Co-Founder & Director of Strategy, Creative & Technology', bio: 'Contributes to strategy, digital and technology direction, and partnership development.', photo: null, icon: 'gear', gradientStart: '#8B7355', gradientEnd: '#5D4E47' },
  { name: 'Eunice Wangui', role: 'Events & Experiences Lead', bio: 'Supports the planning and coordination of HomeAFar events and community experiences.', photo: null, icon: 'star', gradientStart: '#C9A961', gradientEnd: '#8B6F47' },
];

const Avatar = ({ member }) => {
  const icons = {
    compass: <svg viewBox="0 0 24 24" fill="currentColor" className="avatar-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5 5 5-5 5z"/></svg>,
    handshake: <svg viewBox="0 0 24 24" fill="currentColor" className="avatar-icon"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>,
    gear: <svg viewBox="0 0 24 24" fill="currentColor" className="avatar-icon"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.62l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.48.11.62l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.11.62l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.48-.12-.62l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>,
    star: <svg viewBox="0 0 24 24" fill="currentColor" className="avatar-icon"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2l-2.81 6.63L2 9.24l5.46 4.73L5.82 21 12 17.27z"/></svg>,
  };

  return (
    <div className={`team-photo${member.open ? ' is-open' : ''}`} style={{ background: `linear-gradient(135deg, ${member.gradientStart} 0%, ${member.gradientEnd} 100%)` }}>
      {member.photo
        ? <img src={`/images/team/${member.photo}`} alt={`Portrait of ${member.name}`} width="96" height="96" loading="lazy" decoding="async" />
        : <div className="avatar-placeholder" aria-hidden="true">{icons[member.icon] || icons.compass}</div>}
    </div>
  );
};

const useReveals = (route) => {
  useEffect(() => {
    document.documentElement.classList.add('js');
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [route]);
};

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);
  const [activeSection, setActiveSection] = useState('home');
  const links = [
    ['home', 'Home'],
    ['about', 'Our story'],
    ['programs', 'Programs'],
    ['events', 'Events'],
    ['stories', 'Stories'],
    ['opportunities', 'Opportunities'],
    ['partners', 'Partners'],
    ['contact', 'Contact'],
  ];

  useEffect(() => {
    const header = document.querySelector('#site-header');
    const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    const sections = links.map(([id]) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSection(entry.target.id);
      });
    }, { rootMargin: '-28% 0px -62% 0px' });
    sections.forEach((section) => observer.observe(section));
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth > 980) setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', updateHeader);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <header className="site-header" id="site-header">
      <div className="nav-shell">
        <Brand />
        <button className="menu-toggle" id="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span />
        </button>
        <nav className={`primary-nav${menuOpen ? ' is-open' : ''}`} id="primary-navigation" aria-label="Main navigation">
          {links.map(([id, title]) => <a className={`nav-link${activeSection === id ? ' is-active' : ''}`} href={`#${id}`} key={id} onClick={() => setMenuOpen(false)}>{title}</a>)}
          <a className="nav-join" href="#get-involved" onClick={() => setMenuOpen(false)}>Get involved <Icon name="arrow" size={16} /></a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const [active, setActive] = useState(0); // slide the visitor asked for
  const [shown, setShown] = useState(0); // slide whose photo is actually on screen
  const [paused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [held, setHeld] = useState(false); // autoplay waits while the visitor hovers or focuses the hero
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const touch = useRef(null);

  useEffect(() => {
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  // Load the chosen photo first, swap only when it is ready (no blank flash), then warm up the next one.
  useEffect(() => {
    let cancelled = false;
    const requestedIndex = active;
    const load = (index) => new Promise((resolve) => {
      const img = new Image();
      img.fetchPriority = index === requestedIndex ? 'high' : 'low';
      const props = photoProps(slides[index].file);
      img.sizes = props.sizes;
      img.srcset = props.srcSet;
      img.onload = resolve;
      img.onerror = resolve;
      img.src = props.src;
      if (img.decode) img.decode().then(resolve, resolve);
    });
    load(requestedIndex).then(() => {
      if (cancelled) return;
      setShown(requestedIndex);
      load((requestedIndex + 1) % slides.length);
    });
    return () => { cancelled = true; };
  }, [active, slides]);

  // Autoplay: every manual change restarts the 6 second countdown.
  useEffect(() => {
    if (paused || held || !documentVisible) return undefined;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % slides.length), 6000);
    return () => window.clearTimeout(timer);
  }, [paused, held, documentVisible, active, shown]);

  const move = (amount) => setActive((index) => (index + amount + slides.length) % slides.length);
  const current = slides[shown];

  const onTouchStart = (event) => {
    const point = event.changedTouches[0];
    touch.current = { x: point.clientX, y: point.clientY };
  };
  const onTouchEnd = (event) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    // only a clearly horizontal swipe changes the photo, so scrolling the page never flips it
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx > 0 ? -1 : 1);
  };
  const onControlsKeyDown = (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  };

  return (
    <section className="hero" id="home" aria-label="HomeAFar photo slideshow" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <Photo className="hero-image" key={current.file} file={current.file} alt={current.alt} eager fetchPriority={shown === 0 ? 'high' : 'auto'} style={{ '--pos': current.pos, '--pos-m': current.posM }} />
      <a className="scroll-cue" href="#about" aria-label="Scroll to our story"><span /></a>
      <div className="hero-controls" role="group" aria-label="Photo slideshow controls" onKeyDown={onControlsKeyDown}>
        <div className="slide-indicators" role="group" aria-label="Choose a photo">
          {slides.map((slide, index) => <button className={`slide-indicator${active === index ? ' is-active' : ''}`} type="button" aria-label={`Show photo ${index + 1}: ${slide.eyebrow}`} aria-current={active === index ? 'true' : undefined} key={slide.file} onClick={() => setActive(index)} />)}
        </div>
        <span className="slide-count" aria-live={paused ? 'polite' : 'off'}><span>{String(active + 1).padStart(2, '0')}</span><span className="slide-divider">/</span><span>{String(slides.length).padStart(2, '0')}</span></span>
      </div>
    </section>
  );
}

function About() {
  return (
    <section className="intro section-space" id="about" aria-labelledby="about-title">
      <div className="page-width intro-grid">
        <div className="intro-copy reveal reveal-left">
          <Eyebrow>A community across borders</Eyebrow>
          <h2 className="section-heading" id="about-title">Home is not only<br /><em>a place on a map.</em></h2>
          <p className="body-copy">HomeAFar is an African-founded community and impact initiative connecting people across borders. Beginning with African experiences in Romania and Eastern Europe, our wider vision is a place for belonging, cultural exchange and opportunity.</p>
          <a className="underlined-link" href="#team">Meet HomeAFar <Icon name="arrow" size={17} /></a>
        </div>
        <div className="intro-visual reveal reveal-right">
          <div className="photo-frame photo-frame-tall"><Crossfade slides={SHOW.about} label="Moments from the HomeAFar community" sizes="(max-width: 720px) 78vw, 40vw" /></div>
          <div className="photo-inset"><Photo file={PHOTO.couch} alt="HomeAFar community members sharing a moment together indoors" sizes="(max-width: 720px) 40vw, 20vw" /></div>
          <div className="photo-caption"><span>Home is where we find each other</span></div>
        </div>
      </div>
    </section>
  );
}

function Programs() {
  return (
    <section className="programs-section" id="programs" aria-labelledby="programs-title">
      <div className="page-width programs-intro section-space">
        <SectionTitle eyebrow="Connected parts of one mission" id="programs-title" title={<>A bridge to belonging,<br /><em>opportunity and impact.</em></>}>
          <p className="programs-lede">These are HomeAFar’s program directions. Some are being developed; our women’s health work is a long-term vision. We will share services as they are confirmed.</p>
        </SectionTitle>
      </div>
      <div className="program-bands">{programs.map((program, i) => (
        <article className={`program-band program-band-${i % 4}${i % 2 ? ' is-flipped' : ''}`} key={program.title}>
          <div className="page-width program-band-grid">
            <div className="program-thumb reveal"><Photo file={program.thumb[0]} alt={program.thumb[1]} sizes="(max-width: 860px) 92vw, 46vw" /></div>
            <div className="program-text reveal">
              <span className="program-status">{program.status}</span>
              <h3><span className="program-icon"><Icon name={program.icon} size={26} /></span>{program.title}</h3>
              <p>{program.text}</p>
              <small>{program.note}</small>
            </div>
          </div>
        </article>
      ))}</div>
      <div className="page-width programs-outro">
        <div className="mission-vision reveal">
          <article><div className="mv-head"><div className="mv-icon"><Icon name="compass" size={22} /></div><span>Our mission</span></div><p>Strengthen African presence and connection in Eastern Europe through community, economic opportunities, events and cultural exchange.</p></article>
          <article><div className="mv-head"><div className="mv-icon"><Icon name="eye" size={22} /></div><span>Our vision</span></div><p>A connected African community where people thrive with dignity, belonging and opportunity—and contribute to lasting social impact.</p></article>
        </div>
        <figure className="program-community-photo reveal">
          <Crossfade slides={SHOW.programs} label="HomeAFar community moments" sizes="(max-width: 720px) 100vw, 1100px" start={0} />
          <figcaption><Icon name="people" size={20} />A community built through shared time and connection.</figcaption>
        </figure>
      </div>
    </section>
  );
}

function Stories() {
  return (
    <section className="stories-section section-space" id="stories" aria-labelledby="stories-title">
      <div className="page-width">
        <SectionTitle eyebrow="Stories From Afar" id="stories-title" title={<>Many journeys.<br /><em>Many voices.</em></>}>
          <p className="story-lede">Moments from our gatherings, and an open invitation to share your own. Personal stories are published in the storyteller’s own words, and only with permission.</p>
        </SectionTitle>
        <div className="story-grid">{stories.map((story, i) => (
          <article className={`editorial-card story-editorial reveal story-${i}`} key={story.file} style={{ '--i': i }}>
            <Photo file={story.file} alt={story.alt} sizes={i === 0 ? '(max-width: 860px) 92vw, 60vw' : '(max-width: 860px) 92vw, 32vw'} />
            <div className="editorial-copy">
              <span className="editorial-kicker"><Icon name={story.icon} size={15} />{story.kicker}</span>
              <h3>{story.title}</h3><p>{story.copy}</p>
            </div>
          </article>
        ))}</div>
        <ApprovedStories />
        <div className="story-invitation reveal">
          <div><span className="editorial-kicker"><Icon name="story" size={15} />Stories From Afar</span><h3>Your story belongs here.</h3><p>Stories may be shared in English or French. Every contribution is reviewed, and personal stories or photographs are published only with informed consent.</p></div>
          <a className="underlined-link" href="#share-story">Share your story <Icon name="arrow" size={17} /></a>
        </div>
        <StoryForm />
        <div className="country-series reveal">
          <div><span className="editorial-kicker"><Icon name="globe" size={15} />Beyond the Borders by HomeAFar</span><h3>Africa, in all its many stories.</h3><p>A planned country and culture series exploring history, language, food, music, fashion, tourism and contemporary life.</p></div>
          <div><p className="country-list">{['Kenya', 'Uganda', 'Rwanda', 'Zimbabwe', 'DR Congo', 'Republic of the Congo', 'Senegal', 'Romania'].map((country) => <span key={country}>{country}</span>)}</p><small>The Democratic Republic of the Congo and the Republic of the Congo are distinct countries.</small></div>
        </div>
        <Gallery />
      </div>
    </section>
  );
}

// Accessible image viewer built on the native <dialog>: Escape closes it, focus returns to the thumbnail, arrow keys step through.
function ImageDialog({ items, index, onClose, onStep }) {
  const ref = useRef(null);
  const open = index !== null && index !== undefined;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || typeof dialog.showModal !== 'function') return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  if (!open) return null;
  const item = items[index];
  const many = items.length > 1;
  const props = photoProps(item.file, '(max-width: 900px) 96vw, 1100px');
  const onKeyDown = (event) => {
    if (!many) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); onStep(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); onStep(1); }
  };
  return (
    <dialog className="image-dialog" ref={ref} aria-label={item.caption || item.alt} onClose={onClose} onKeyDown={onKeyDown}
      onClick={(event) => { if (event.target === ref.current) ref.current.close(); }}>
      <figure>
        <img {...props} alt={item.alt} loading="lazy" decoding="async" />
        {item.caption && <figcaption>{item.caption}</figcaption>}
      </figure>
      <button className="dialog-close" type="button" autoFocus aria-label="Close photo" onClick={() => ref.current.close()}><span aria-hidden="true">×</span></button>
      {many && <>
        <button className="dialog-step dialog-prev" type="button" aria-label="Previous photo" onClick={() => onStep(-1)}><Icon name="arrow" size={20} className="icon-back" /></button>
        <button className="dialog-step dialog-next" type="button" aria-label="Next photo" onClick={() => onStep(1)}><Icon name="arrow" size={20} /></button>
      </>}
    </dialog>
  );
}

function Gallery() {
  const [openIndex, setOpenIndex] = useState(null);
  const step = (amount) => setOpenIndex((index) => (index + amount + moments.length) % moments.length);
  return (
    <div className="gallery reveal" id="gallery">
      <div className="gallery-head">
        <span className="editorial-kicker"><Icon name="spark" size={15} />Moments together</span>
        <h3>Faces, laughter and shared tables.</h3>
      </div>
      <ul className="moments" aria-label="Photo gallery">
        {moments.map((item, i) => {
          const props = photoProps(item.file, '(max-width: 620px) 48vw, (max-width: 980px) 46vw, 380px');
          return (
            <li className="moment" key={item.key}>
              <button type="button" onClick={() => setOpenIndex(i)} aria-label={`Open photo: ${item.caption || item.alt}`} aria-haspopup="dialog">
                <img {...props} alt={item.alt} loading="lazy" decoding="async" style={{ aspectRatio: `${props.width} / ${props.height}` }} />
              </button>
            </li>
          );
        })}
      </ul>
      <ImageDialog items={moments} index={openIndex} onClose={() => setOpenIndex(null)} onStep={step} />
    </div>
  );
}

function Emblem() {
  return (
    <section className="emblem-section section-space" id="emblem" aria-labelledby="emblem-title">
      <div className="page-width emblem-grid">
        <div className="emblem-stage reveal">
          <div className="emblem-plate">
            <img src={image('homeafar-logo.png')} alt="The HomeAFar emblem: the African continent in bold patterns and colour, encircled by a golden orbit" width="256" height="256" loading="lazy" decoding="async" />
          </div>
          <p className="emblem-wordmark" aria-hidden="true"><Wordmark /></p>
        </div>
        <div className="emblem-copy reveal">
          <Eyebrow light>Our emblem</Eyebrow>
          <h2 className="section-heading" id="emblem-title">Africa, at the heart<br /><em>of everything we do.</em></h2>
          <p className="emblem-lede">The HomeAFar emblem places the African continent at its centre, dressed in bold pattern and colour and held within a ring of gold. It is the mark you will find on our invitations and across this site.</p>
          <ul className="emblem-values">
            <li><span className="emblem-value-icon"><Icon name="home" size={20} /></span><div><h3>Belonging</h3><p>A place for everyone who carries Africa with them, wherever they are.</p></div></li>
            <li><span className="emblem-value-icon"><Icon name="globe" size={20} /></span><div><h3>Culture</h3><p>Many countries, languages, foods and stories, never a single one.</p></div></li>
            <li><span className="emblem-value-icon"><Icon name="people" size={20} /></span><div><h3>Community</h3><p>People showing up for each other, in person and online.</p></div></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

const partnerCategories = [
  { icon: 'compass', title: 'Strategic partners', text: 'Organisations that share our mission and want to help shape where HomeAFar goes next.' },
  { icon: 'people', title: 'Community & cultural partners', text: 'Associations, cultural and heritage groups and community organisations in Romania and beyond.' },
  { icon: 'plane', title: 'Travel & tourism partners', text: 'Partners who celebrate African destinations and help people stay connected to home.' },
  { icon: 'briefcase', title: 'Brand & corporate partners', text: 'Businesses that want to support belonging, opportunity and diaspora communities.' },
  { icon: 'palette', title: 'Media & creative partners', text: 'Photographers, filmmakers, writers and publications who tell African stories well.' },
  { icon: 'spark', title: 'Technology partners', text: 'People and platforms who help us build and run a community site that is easy to use.' },
];

const partnerBenefits = [
  ['Visibility', 'Recognition on our website and on our Instagram, alongside the work we do together.'],
  ['Joint gatherings', 'Co-host or support community events like Passport Picnic.'],
  ['Stories and content', 'Create features, series and campaigns together, including our Beyond the Borders country series.'],
  ['A welcoming community', 'Meet Africans building lives in Romania and Eastern Europe, on terms that respect them.'],
];

export function PartnerLogos({ partners }) {
  if (!partners.length) return null;
  return (
    <div className="partner-showcase">
      <h3>Our partners</h3>
      <ul className="partner-logos">
        {partners.map((partner) => {
          const logo = <img src={partner.logo} alt={partner.name} width={partner.width} height={partner.height} loading="lazy" decoding="async" />;
          return <li key={partner.name}>{partner.url ? <a href={partner.url} target="_blank" rel="noopener noreferrer" aria-label={`${partner.name} (opens in a new tab)`}>{logo}</a> : logo}</li>;
        })}
      </ul>
    </div>
  );
}

function Partners() {
  const mail = `mailto:${PARTNERSHIP_EMAIL}?subject=${encodeURIComponent('HomeAFar partnership')}`;
  return (
    <section className="partners-section section-space" id="partners" aria-labelledby="partners-title">
      <div className="page-width">
        <SectionTitle eyebrow="Partners & collaborators" id="partners-title" title={<>Together, we bring<br /><em>communities closer.</em></>}>
          <p className="story-lede">HomeAFar is stronger with others. We welcome organisations, businesses and creatives who care about belonging, culture and opportunity for Africans abroad, and who want to build something lasting with us.</p>
        </SectionTitle>
        <ul className="partner-categories">
          {partnerCategories.map((category, i) => (
            <li className="partner-category reveal" key={category.title} style={{ '--i': i }}>
              <span className="partner-category-icon"><Icon name={category.icon} size={22} /></span>
              <h3>{category.title}</h3>
              <p>{category.text}</p>
            </li>
          ))}
        </ul>
        <div className="partner-benefits reveal">
          <div className="partner-benefits-intro">
            <Eyebrow>What working together can look like</Eyebrow>
            <h3>Collaboration that benefits everyone involved.</h3>
          </div>
          <dl>{partnerBenefits.map(([title, text]) => <div key={title}><dt>{title}</dt><dd>{text}</dd></div>)}</dl>
        </div>
        <PartnerLogos partners={PARTNERS} />
        <div className="partner-cta reveal">
          <div>
            <span className="editorial-kicker"><Icon name="heart" size={15} />Become a partner</span>
            <h3>Be among our first partners.</h3>
            <p>Tell us about your organisation and what you have in mind. We will reply to talk through how we might work together, and every partnership is agreed openly and in writing.</p>
          </div>
          <div className="partner-cta-actions">
            <a className="button button-gold" href={mail}>Email us about partnering <Icon name="arrow" size={18} /></a>
            <a className="underlined-link" href="#contact">Use the contact form <Icon name="arrow" size={17} /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

function InviteCard() {
  const [open, setOpen] = useState(null);
  const item = { file: PHOTO.invite, alt: ALT.invite, caption: 'The Passport Picnic invitation' };
  const props = photoProps(item.file, '120px');
  return (
    <>
      <button className="invite-card" type="button" aria-haspopup="dialog" onClick={() => setOpen(0)}>
        <img {...props} alt="" loading="lazy" decoding="async" />
        <span><b>See the invitation</b><small>Passport Picnic, 30 August 2026</small></span>
        <Icon name="arrow" size={18} />
      </button>
      <ImageDialog items={[item]} index={open} onClose={() => setOpen(null)} onStep={() => {}} />
    </>
  );
}

function Team() {
  return (
    <section className="team-section section-space" id="team" aria-labelledby="team-title">
      <div className="page-width">
        <SectionTitle eyebrow="The people behind HomeAFar" id="team-title" title={<>Built around people.<br /><em>Growing together.</em></>}>
          <p className="story-lede">HomeAFar was founded by people who believe connection can make a new place feel more like home.</p>
        </SectionTitle>
        <figure className="team-community-photo reveal"><Crossfade slides={SHOW.team} label="The HomeAFar community together" sizes="(max-width: 720px) 100vw, 1100px" start={1} /><figcaption><Icon name="people" size={19} />The community at the heart of HomeAFar</figcaption></figure>
        <div className="team-grid">
          {teamMembers.map((member, i) => (
            <article className="team-card reveal" key={member.name} style={{ '--i': i }}>
              <Avatar member={member} />
              <div><h3>{member.name}</h3><p className="team-role">{member.role}</p>{member.bio && <p className="team-bio">{member.bio}</p>}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Events() {
  return (
    <section className="gathering-section section-space" id="events" aria-labelledby="events-title">
      <div className="page-width gathering-grid">
        <div className="gathering-copy reveal reveal-left">
          <Eyebrow>Events &amp; experiences</Eyebrow>
          <h2 className="section-heading" id="events-title">Passport Picnic<br /><em>2026.</em></h2>
          <div className="event-head"><time className="date-badge" dateTime="2026-08-30"><b>30</b><span>Aug 2026</span></time><span className="event-status"><Icon name="calendar" size={15} />Past community gathering</span></div>
          <p className="body-copy">Passport Picnic brought people together for a cultural potluck and games.</p>
          <ul className="event-meta">
                        <li><span className="meta-icon"><Icon name="pin" size={18} /></span><span className="location-tag">Tineretului Park, Bucharest</span></li>
            <li><span className="meta-icon"><Icon name="people" size={18} /></span><span>Participants connected to Kenya, the Republic of the Congo, Rwanda, Senegal and Zambia</span></li>
          </ul>
          <p className="event-note">Details of our next gathering will be shared on Instagram and here on the site.</p>
          <InviteCard />
          <a className="underlined-link" href="mailto:homeafar26@gmail.com?subject=HomeAFar%20event%20updates">Ask about future events <Icon name="arrow" size={17} /></a>
        </div>
        <figure className="gathering-photo reveal reveal-right">
          <Crossfade slides={SHOW.events} label="Passport Picnic 2026 photos" sizes="(max-width: 720px) 90vw, 55vw" start={0} />
          <figcaption className="gathering-stamp"><span>Passport<br />Picnic</span><Icon name="calendar" size={22} /></figcaption>
        </figure>
      </div>
    </section>
  );
}

function Opportunities() {
  return (
    <section className="opportunities-section section-space" id="opportunities" aria-labelledby="opportunities-title">
      <div className="page-width opportunities-layout">
        <figure className="opportunities-photo reveal reveal-left"><Crossfade slides={SHOW.opportunities} label="Community members sharing and learning together" sizes="(max-width: 720px) 100vw, 50vw" start={1} /><figcaption><Icon name="spark" size={19} />Possibility grows when we connect.</figcaption></figure>
        <div className="opportunities-inner reveal reveal-right">
          <span className="opportunity-icon"><Icon name="spark" size={22} /></span>
          <Eyebrow>Opportunities &amp; connections</Eyebrow>
          <h2 className="section-heading" id="opportunities-title">Useful opportunities,<br /><em>shared with care.</em></h2>
          <p className="body-copy">We are gathering scholarships, jobs, internships, training, volunteering and creative opportunities. Each one is checked before it is shared, and every post will name its original source and any deadline.</p>
          <ul className="chip-list" aria-label="Types of opportunity we share">{opportunityTypes.map(([icon, label], i) => <li className="chip reveal" key={label} style={{ '--i': i }}><Icon name={icon} size={16} />{label}</li>)}</ul>
          <a className="underlined-link" href="mailto:homeafar26@gmail.com?subject=Share%20an%20opportunity">Suggest an opportunity <Icon name="arrow" size={17} /></a>
        </div>
      </div>
    </section>
  );
}

function GetInvolved() {
  return (
    <>
    <section className="join-section" id="get-involved" aria-labelledby="join-title">
      <Crossfade className="join-xf" slides={SHOW.join} label="HomeAFar community photos" sizes="100vw" interval={6500} start={2} />
      <div className="join-overlay" />
      <div className="join-content page-width reveal">
        <Eyebrow light>There is room for you here</Eyebrow>
        <h2 id="join-title">Help build a place<br /><em>where we belong.</em></h2>
        <p>Interested in membership, volunteering, sharing a story or collaborating? Get in touch and tell us what you have in mind. An enquiry is an expression of interest, not automatic membership.</p>
        <a className="button button-gold" href="#join-form">Express your interest <Icon name="arrow" size={18} /></a>
      </div>
    </section>
    <section className="join-form-section" id="join-form" aria-label="Express your interest"><div className="page-width join-form-inner"><JoinForm /></div></section>
    </>
  );
}

function Contact() {
  return (
    <section className="contact-section section-space" id="contact" aria-labelledby="contact-title">
      <div className="page-width contact-inner">
        <div className="contact-copy reveal reveal-left"><Eyebrow>Start a conversation</Eyebrow><h2 className="section-heading" id="contact-title">Let’s find a way<br /><em>to connect.</em></h2><p className="body-copy">For general questions, membership interest, volunteering, stories, partnerships or opportunities, contact the HomeAFar team.</p>
          <figure className="contact-photo"><Crossfade slides={SHOW.contact} label="Friends connecting at HomeAFar gatherings" sizes="(max-width: 720px) 100vw, 520px" start={0} /><figcaption><Icon name="heart" size={18} />Connection can make a new place feel like home.</figcaption></figure>
        </div>
        <div className="contact-details reveal reveal-right">
          <a className="contact-detail" href="mailto:homeafar26@gmail.com"><span className="contact-icon"><Icon name="mail" size={19} /></span><span><small>Email</small>homeafar26@gmail.com</span><Icon name="arrow" size={17} className="contact-arrow" /></a>
          <a className="contact-detail" href="https://www.instagram.com/home.a.far/" target="_blank" rel="noopener noreferrer"><span className="contact-icon"><Icon name="instagram" size={19} /></span><span><small>Instagram</small>@home.a.far</span><Icon name="arrow" size={17} className="contact-arrow" /></a>
          <ContactForm />
          <p className="contact-note">Email links open your email app. HomeAFar does not provide emergency, legal, medical or accommodation services.</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <>
      <section className="privacy-section" id="privacy" aria-labelledby="privacy-title">
        <div className="page-width privacy-inner"><Eyebrow>Privacy &amp; content care</Eyebrow><h2 id="privacy-title"><Icon name="lock" size={22} />A few important notes.</h2><p>This site does not use analytics. If you use a form, the details you enter are stored securely so the HomeAFar team can read and reply to them; they are visible only to authorised HomeAFar administrators, and your email is never published. Stories are published only after review and with your consent. To ask for your details to be corrected or deleted, email homeafar26@gmail.com. Please do not send sensitive health, immigration or legal-case details.</p></div>
      </section>
      <footer className="site-footer ft">
        <div className="page-width ft-inner">
          <div className="ft-brand">
            <Brand footer />
            <ul className="ft-social" aria-label="HomeAFar on social media">
              <li><a href="https://www.instagram.com/home.a.far/" target="_blank" rel="noopener noreferrer" aria-label="HomeAFar on Instagram (opens in a new tab)"><Icon name="instagram" size={22} /></a></li>
            </ul>
          </div>
          <nav className="ft-col" aria-labelledby="ft-explore">
            <h3 id="ft-explore">Explore</h3>
            <a href="#about">Our story</a><a href="#emblem">Our emblem</a><a href="#programs">Programs</a><a href="#events">Events</a><a href="#stories">Stories</a>
          </nav>
          <nav className="ft-col" aria-labelledby="ft-take-part">
            <h3 id="ft-take-part">Take part</h3>
            <a href="#get-involved">Get involved</a><a href="#share-story">Share your story</a><a href="#opportunities">Opportunities</a><a href="#partners">Partners</a>
          </nav>
          <div className="ft-col ft-contact">
            <h3>Contact</h3>
            <a className="ft-email" href={`mailto:${PARTNERSHIP_EMAIL}`}><Icon name="mail" size={18} />{PARTNERSHIP_EMAIL}</a>
          </div>
        </div>
        <div className="page-width ft-bottom">
          <p>© {new Date().getFullYear()} HomeAFar. All rights reserved.</p>
          <p className="ft-motto">Connect · Share · Grow</p>
          <a href="#privacy">Privacy &amp; content care</a>
        </div>
      </footer>
    </>
  );
}

export default function App() {
  const readRoute = () => `${window.location.pathname}${window.location.hash}`;
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => { window.removeEventListener('hashchange', onChange); window.removeEventListener('popstate', onChange); };
  }, []);
  const isAdmin = /^\/admin\/?(#|$)/.test(route) || route.includes('#/admin');
  useReveals(isAdmin);
  if (isAdmin) return <Suspense fallback={<p className="admin-note">Loading…</p>}><Admin /></Suspense>;
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Emblem />
        <Programs />
        <Stories />
        <Team />
        <Events />
        <Opportunities />
        <Partners />
        <GetInvolved />
        <Contact />
      </main>
      <Footer />
      <ScrollUI />
    </>
  );
}
