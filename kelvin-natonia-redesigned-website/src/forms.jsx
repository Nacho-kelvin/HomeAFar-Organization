import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons.jsx';
import { getSupabase, isConfigured, storyImageUrl, NOT_CONFIGURED_MESSAGE, FormError } from './lib/supabase.js';
import { validateContact, validateStory, validateJoin, validateImage, STORY_CATEGORIES, INTEREST_OPTIONS, IMAGE_TYPES } from './lib/validate.js';

const requireClient = async () => {
  const supabase = await getSupabase();
  if (!supabase) throw new FormError(NOT_CONFIGURED_MESSAGE);
  return supabase;
};
const friendly = (error) => {
  if (error instanceof FormError) return error.userMessage;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'You appear to be offline. Please check your connection and try again.';
  return 'Something went wrong and your submission was not saved. Please try again in a moment, or email homeafar26@gmail.com.';
};

// One hook for every form: validation, loading state, duplicate-submit guard, success and error messages.
function useForm({ initial, validate, send }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  const formRef = useRef(null);

  const set = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  };
  const submit = async (event, extra) => {
    event.preventDefault();
    if (busy.current) return; // blocks double-clicks and double-taps
    if (values.website) { setStatus('success'); return; } // honeypot: bots fill the hidden field
    const found = validate(values, extra);
    const keys = Object.keys(found).filter((key) => found[key]);
    setErrors(found);
    if (keys.length) {
      setStatus('idle');
      window.requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    busy.current = true;
    setStatus('submitting');
    try {
      await send(values, extra);
      setStatus('success');
      setValues(initial);
    } catch (error) {
      setMessage(friendly(error));
      setStatus('error');
    } finally {
      busy.current = false;
    }
  };
  const again = () => { setStatus('idle'); setErrors({}); };
  return { values, errors, status, message, set, submit, again, formRef };
}

const Field = ({ id, label, error, hint, optional, children }) => (
  <div className={`field${error ? ' has-error' : ''}`}>
    <label htmlFor={id}>{label}{optional && <span className="field-optional"> (optional)</span>}</label>
    {children}
    {hint && !error && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
    {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
  </div>
);
const aria = (id, error, hint) => ({ id, name: id, 'aria-invalid': error ? 'true' : 'false', 'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined });
const Honeypot = ({ value, onChange }) => (
  <div className="hp-field" aria-hidden="true"><label>Leave this empty<input type="text" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} /></label></div>
);
const SubmitButton = ({ status, children, busyText = 'Sending…' }) => (
  <button className="button button-dark form-submit" type="submit" disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
    {status === 'submitting' ? <span className="spinner" aria-hidden="true" /> : null}{status === 'submitting' ? busyText : <>{children}<Icon name="send" size={16} /></>}
  </button>
);
const Banner = ({ status, message }) => status === 'error' ? <p className="form-banner form-banner-error" role="alert">{message}</p> : null;
const Success = ({ title, children, onAgain, again }) => (
  <div className="form-success" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
    <span className="success-mark" aria-hidden="true"><Icon name="check" size={22} /></span><h3>{title}</h3><p>{children}</p>
    <button className="underlined-link" type="button" onClick={onAgain}>{again}</button>
  </div>
);
const Setup = () => !isConfigured ? <p className="form-banner">This form is temporarily unavailable. Please email homeafar26@gmail.com and we will get back to you.</p> : null;

export function ContactForm() {
  const f = useForm({
    initial: { full_name: '', email: '', subject: '', message: '', website: '' },
    validate: validateContact,
    send: async (v) => {
      const supabase = await requireClient();
      const { error } = await supabase.from('contact_messages').insert({ full_name: v.full_name.trim(), email: v.email.trim(), subject: v.subject.trim(), message: v.message.trim() });
      if (error) throw error;
    },
  });
  if (f.status === 'success') return <Success title="Thank you, your message is in." onAgain={f.again} again="Send another message">The HomeAFar team will read it and reply by email. This form does not send an automatic confirmation email.</Success>;
  const { values: v, errors: e, set } = f;
  return (
    <form className="hf-form" ref={f.formRef} onSubmit={f.submit} noValidate aria-labelledby="contact-form-title">
      <h3 id="contact-form-title"><Icon name="mail" size={22} />Send us a message</h3>
      <Setup />
      <div className="field-row">
        <Field id="contact-name" label="Full name" error={e.full_name}><input {...aria('contact-name', e.full_name)} type="text" autoComplete="name" maxLength={120} required value={v.full_name} onChange={(x) => set('full_name', x.target.value)} /></Field>
        <Field id="contact-email" label="Email address" error={e.email}><input {...aria('contact-email', e.email)} type="email" autoComplete="email" inputMode="email" maxLength={254} required value={v.email} onChange={(x) => set('email', x.target.value)} /></Field>
      </div>
      <Field id="contact-subject" label="Subject" error={e.subject}><input {...aria('contact-subject', e.subject)} type="text" maxLength={150} required value={v.subject} onChange={(x) => set('subject', x.target.value)} /></Field>
      <Field id="contact-message" label="Message" error={e.message}><textarea {...aria('contact-message', e.message)} rows={5} maxLength={5000} required value={v.message} onChange={(x) => set('message', x.target.value)} /><span className="field-counter" aria-live="polite">{v.message.length.toLocaleString()} / 5,000</span></Field>
      <Honeypot value={v.website} onChange={(x) => set('website', x)} />
      <p className="form-privacy">We use your details only to reply to you. Please do not include health, immigration or legal-case details.</p>
      <Banner status={f.status} message={f.message} />
      <SubmitButton status={f.status}>Send message</SubmitButton>
    </form>
  );
}

export function StoryForm() {
  const [file, setFile] = useState(null);
  const fileInput = useRef(null);
  const [imageProblem, setImageProblem] = useState(null);
  const f = useForm({
    initial: { title: '', display_name: '', email: '', country: '', category: '', body: '', consent: false, website: '' },
    validate: (v) => validateStory(v, file),
    send: async (v) => {
      const supabase = await requireClient();
      let image_path = null;
      if (file) {
        image_path = `${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`;
        const { error: uploadError } = await supabase.storage.from('story-images').upload(image_path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new FormError('Your image could not be uploaded, so nothing was saved. Please try a different image or submit without one.');
      }
      const { error } = await supabase.from('stories').insert({
        title: v.title.trim(), display_name: v.display_name.trim(), email: v.email.trim(), country: v.country.trim(),
        category: v.category, body: v.body.trim(), image_path, consent: true,
      });
      if (error) throw error;
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    },
  });
  if (f.status === 'success') return <Success title="Thank you for sharing your story." onAgain={f.again} again="Share another story">Your story has been saved as pending approval. Someone from HomeAFar will review it before anything is published, and we will not publish it without that review.</Success>;
  const { values: v, errors: e, set } = f;
  const pickFile = (event) => {
    const chosen = event.target.files?.[0] || null;
    const problem = validateImage(chosen);
    setImageProblem(problem);
    if (problem) { event.target.value = ''; setFile(null); return; }
    setFile(chosen);
  };
  return (
    <form className="hf-form story-form" id="share-story" ref={f.formRef} onSubmit={f.submit} noValidate aria-labelledby="story-form-title">
      <h3 id="story-form-title"><Icon name="story" size={22} />Share your story</h3>
      <p className="form-lede">Stories From Afar are written by the people who lived them. Every story is reviewed before publication. Your email is never published.</p>
      <Setup />
      <Field id="story-title" label="Story title" error={e.title}><input {...aria('story-title', e.title)} type="text" maxLength={150} required value={v.title} onChange={(x) => set('title', x.target.value)} /></Field>
      <div className="field-row">
        <Field id="story-name" label="Name to display" error={e.display_name} hint="A first name or nickname is fine."><input {...aria('story-name', e.display_name, true)} type="text" autoComplete="nickname" maxLength={80} required value={v.display_name} onChange={(x) => set('display_name', x.target.value)} /></Field>
        <Field id="story-email" label="Email address" error={e.email} hint="Kept private, used only to contact you."><input {...aria('story-email', e.email, true)} type="email" autoComplete="email" inputMode="email" maxLength={254} required value={v.email} onChange={(x) => set('email', x.target.value)} /></Field>
      </div>
      <div className="field-row">
        <Field id="story-country" label="Country of residence" error={e.country}><input {...aria('story-country', e.country)} type="text" autoComplete="country-name" maxLength={80} required value={v.country} onChange={(x) => set('country', x.target.value)} /></Field>
        <Field id="story-category" label="Story category" error={e.category}>
          <select {...aria('story-category', e.category)} required value={v.category} onChange={(x) => set('category', x.target.value)}><option value="">Choose a category</option>{STORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </Field>
      </div>
      <Field id="story-body" label="Your story" error={e.body} hint={`${v.body.trim().length} / 10,000 characters (minimum 100). English or French.`}><textarea {...aria('story-body', e.body, true)} rows={9} maxLength={10000} required value={v.body} onChange={(x) => set('body', x.target.value)} /></Field>
      <Field id="story-image" label="Supporting image" optional error={e.image || imageProblem} hint="JPG, PNG or WebP, up to 3 MB. Only include people who have agreed to appear.">
        <input id="story-image" name="story-image" type="file" accept="image/jpeg,image/png,image/webp" ref={fileInput} onChange={pickFile} aria-describedby="story-image-hint" />
      </Field>
      <div className={`field field-check${e.consent ? ' has-error' : ''}`}>
        <label className="check"><input {...aria('story-consent', e.consent)} type="checkbox" checked={v.consent} onChange={(x) => set('consent', x.target.checked)} required /><span>I confirm this story is mine to share and I give HomeAFar permission to publish it on this website after review, with the name I chose above.</span></label>
        {e.consent && <p className="field-error" id="story-consent-error" role="alert">{e.consent}</p>}
      </div>
      <Honeypot value={v.website} onChange={(x) => set('website', x)} />
      <Banner status={f.status} message={f.message} />
      <SubmitButton status={f.status} busyText={file ? 'Uploading and saving…' : 'Saving…'}>Submit story</SubmitButton>
    </form>
  );
}

export function JoinForm() {
  const f = useForm({
    initial: { full_name: '', email: '', location: '', interests: [], message: '', consent: false, website: '' },
    validate: validateJoin,
    send: async (v) => {
      const supabase = await requireClient();
      const { error } = await supabase.from('member_interests').insert({
        full_name: v.full_name.trim(), email: v.email.trim(), location: v.location.trim() || null,
        interests: v.interests, message: v.message.trim() || null, consent: true,
      });
      if (error) throw error;
    },
  });
  if (f.status === 'success') return <Success title="Thank you, we have your interest." onAgain={f.again} again="Register another person">This is an expression of interest, not automatic membership. The team will be in touch by email.</Success>;
  const { values: v, errors: e, set } = f;
  const toggle = (option) => set('interests', v.interests.includes(option) ? v.interests.filter((x) => x !== option) : [...v.interests, option]);
  return (
    <form className="hf-form" ref={f.formRef} onSubmit={f.submit} noValidate aria-labelledby="join-form-title">
      <h3 id="join-form-title"><Icon name="people" size={22} />Tell us how you would like to get involved</h3>
      <Setup />
      <div className="field-row">
        <Field id="join-name" label="Full name" error={e.full_name}><input {...aria('join-name', e.full_name)} type="text" autoComplete="name" maxLength={120} required value={v.full_name} onChange={(x) => set('full_name', x.target.value)} /></Field>
        <Field id="join-email" label="Email address" error={e.email}><input {...aria('join-email', e.email)} type="email" autoComplete="email" inputMode="email" maxLength={254} required value={v.email} onChange={(x) => set('email', x.target.value)} /></Field>
      </div>
      <Field id="join-location" label="City or country" optional error={e.location}><input {...aria('join-location', e.location)} type="text" maxLength={120} value={v.location} onChange={(x) => set('location', x.target.value)} /></Field>
      <fieldset className={`field fieldset${e.interests ? ' has-error' : ''}`} aria-describedby={e.interests ? 'join-interests-error' : undefined}>
        <legend>I am interested in</legend>
        <div className="check-grid">{INTEREST_OPTIONS.map((option) => <label className="check" key={option}><input type="checkbox" checked={v.interests.includes(option)} onChange={() => toggle(option)} /><span>{option}</span></label>)}</div>
        {e.interests && <p className="field-error" id="join-interests-error" role="alert">{e.interests}</p>}
      </fieldset>
      <Field id="join-message" label="Anything you would like us to know" optional error={e.message}><textarea {...aria('join-message', e.message)} rows={4} maxLength={2000} value={v.message} onChange={(x) => set('message', x.target.value)} /></Field>
      <div className={`field field-check${e.consent ? ' has-error' : ''}`}>
        <label className="check"><input {...aria('join-consent', e.consent)} type="checkbox" checked={v.consent} onChange={(x) => set('consent', x.target.checked)} required /><span>I agree that HomeAFar may contact me by email about this. This is an expression of interest, not automatic membership.</span></label>
        {e.consent && <p className="field-error" id="join-consent-error" role="alert">{e.consent}</p>}
      </div>
      <Honeypot value={v.website} onChange={(x) => set('website', x)} />
      <p className="form-privacy">Please do not include health, immigration or legal-case details.</p>
      <Banner status={f.status} message={f.message} />
      <SubmitButton status={f.status}>Send my interest</SubmitButton>
    </form>
  );
}

// Reads ONLY the public_stories view (approved stories, safe columns). Renders nothing when there are none.
export function ApprovedStories() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    let cancelled = false;
    // Wait until the page has loaded and the browser is idle so the database code never competes with the first paint.
    const whenIdle = () => new Promise((resolve) => {
      const go = () => ('requestIdleCallback' in window ? window.requestIdleCallback(() => resolve(), { timeout: 4000 }) : setTimeout(resolve, 2500));
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    });
    whenIdle().then(() => (cancelled ? null : getSupabase())).then(async (supabase) => {
      if (!supabase || cancelled) return;
      const { data, error } = await supabase.from('public_stories').select('id,title,display_name,country,category,body,image_path,published_at').order('published_at', { ascending: false }).limit(12);
      if (!cancelled && !error && data) setItems(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  if (!items.length) return null;
  return (
    <div className="shared-stories" aria-label="Stories shared by our community">
      <h3 className="shared-heading">Shared by our community</h3>
      <div className="shared-grid">{items.map((s) => (
        <article className="shared-card" key={s.id}>
          {s.image_path && <img src={storyImageUrl(s.image_path)} alt="" loading="lazy" decoding="async" />}
          <div><span className="editorial-kicker">{s.category}</span><h4>{s.title}</h4><p className="shared-body">{s.body}</p><p className="shared-by">{s.display_name} · {s.country}</p></div>
        </article>
      ))}</div>
    </div>
  );
}
