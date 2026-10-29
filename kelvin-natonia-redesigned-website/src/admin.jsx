import { useCallback, useEffect, useState } from 'react';
import { getSupabase, isConfigured, NOT_CONFIGURED_MESSAGE } from './lib/supabase.js';

const when = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const TABS = [['stories', 'Stories'], ['contact_messages', 'Messages'], ['member_interests', 'Community interest']];
const FILTERS = { stories: ['pending', 'approved', 'rejected', 'all'], contact_messages: ['new', 'read', 'archived', 'all'], member_interests: ['new', 'contacted', 'archived', 'all'] };
const ACTIONS = {
  stories: [['approved', 'Approve & publish'], ['rejected', 'Reject'], ['pending', 'Back to pending']],
  contact_messages: [['read', 'Mark read'], ['archived', 'Archive']],
  member_interests: [['contacted', 'Mark contacted'], ['archived', 'Archive']],
};

// Authentication is Supabase Auth. Authorisation is enforced by Row Level Security (public.is_admin()):
// a signed-in user who is not in the admins table receives no rows and cannot change anything,
// whatever this page shows.
export default function Admin() {
  const [supabase, setSupabase] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | signin | denied | ready | unconfigured | unavailable
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const check = useCallback(async (client) => {
    if (!client) { setPhase('unconfigured'); return; }
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) { setError('The Supabase session could not be checked.'); setPhase('unavailable'); return; }
    if (!sessionData.session) { setPhase('signin'); return; }
    const { data: isAdmin, error: adminError } = await client.rpc('is_admin');
    if (adminError) {
      setError('The admin database check is unavailable. Confirm the HomeAFar database schema has been applied.');
      setPhase('unavailable');
      return;
    }
    setPhase(isAdmin === true ? 'ready' : 'denied');
  }, []);

  useEffect(() => {
    document.title = 'Admin — HomeAFar';
    if (!isConfigured) { setPhase('unconfigured'); return undefined; }
    let subscription;
    getSupabase().then((client) => {
      setSupabase(client);
      check(client);
      subscription = client.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') setPhase('signin'); }).data.subscription;
    });
    return () => subscription?.unsubscribe();
  }, [check]);

  const signIn = async (event) => {
    event.preventDefault();
    if (signingIn) return;
    const form = new FormData(event.currentTarget);
    setSigningIn(true); setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email: String(form.get('email')).trim(), password: String(form.get('password')) });
    setSigningIn(false);
    if (authError) { setError('Those details did not work. Please check your email and password.'); return; }
    check(supabase);
  };
  const signOut = async () => { await supabase.auth.signOut(); setPhase('signin'); };

  return (
    <main className="admin-page" id="main">
      <header className="admin-top"><a href="/" className="admin-back">← Back to website</a><h1>HomeAFar admin</h1>{(phase === 'ready' || phase === 'denied') && <button className="admin-link" type="button" onClick={signOut}>Sign out</button>}</header>
      {phase === 'loading' && <p className="admin-note">Loading…</p>}
      {phase === 'unconfigured' && <p className="form-banner">{NOT_CONFIGURED_MESSAGE} Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable this dashboard.</p>}
      {phase === 'signin' && (
        <form className="hf-form admin-signin" onSubmit={signIn}>
          <h2>Sign in</h2>
          <div className="field"><label htmlFor="admin-email">Email</label><input id="admin-email" name="email" type="email" autoComplete="username" required /></div>
          <div className="field"><label htmlFor="admin-password">Password</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required /></div>
          {error && <p className="form-banner form-banner-error" role="alert">{error}</p>}
          <button className="button button-dark form-submit" type="submit" disabled={signingIn}>{signingIn ? 'Signing in…' : 'Sign in'}</button>
        </form>
      )}
      {phase === 'denied' && <p className="form-banner form-banner-error" role="alert">This account is signed in but is not authorised as a HomeAFar administrator, so no data can be shown.</p>}
      {phase === 'unavailable' && <p className="form-banner form-banner-error" role="alert">{error}</p>}
      {phase === 'ready' && <Dashboard supabase={supabase} />}
    </main>
  );
}

function Dashboard({ supabase }) {
  const [tab, setTab] = useState('stories');
  const [filter, setFilter] = useState('pending');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setRows(null); setError('');
    let query = supabase.from(tab).select('*').order('created_at', { ascending: false }).limit(200);
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error: loadError } = await query;
    if (loadError) { setError('Could not load submissions. You may have been signed out.'); setRows([]); return; }
    setRows(data);
  }, [supabase, tab, filter]);
  useEffect(() => { load(); }, [load]);

  const switchTab = (next) => { setTab(next); setFilter(FILTERS[next][0]); };
  const setStatus = async (row, status) => {
    if (busyId) return;
    setBusyId(row.id); setError('');
    const { error: updateError } = await supabase.from(tab).update({ status }).eq('id', row.id);
    setBusyId(null);
    if (updateError) setError('That change was not saved. Please try again.'); else load();
  };
  const remove = async (row) => {
    if (busyId || !window.confirm('Delete this permanently? This cannot be undone.')) return;
    setBusyId(row.id); setError('');
    const { error: deleteError } = await supabase.from(tab).delete().eq('id', row.id);
    if (!deleteError && row.image_path) await supabase.storage.from('story-images').remove([row.image_path]);
    setBusyId(null);
    if (deleteError) setError('That item was not deleted. Please try again.'); else load();
  };

  return (
    <section aria-label="Submissions">
      <div className="admin-tabs" role="tablist">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={`admin-tab${tab === id ? ' is-active' : ''}`} onClick={() => switchTab(id)}>{label}</button>)}</div>
      <div className="admin-filters" role="group" aria-label="Filter by status">{FILTERS[tab].map((name) => <button key={name} type="button" aria-pressed={filter === name} className={`admin-chip${filter === name ? ' is-active' : ''}`} onClick={() => setFilter(name)}>{name}</button>)}</div>
      {error && <p className="form-banner form-banner-error" role="alert">{error}</p>}
      {rows === null && <p className="admin-note">Loading…</p>}
      {rows && !rows.length && !error && <p className="admin-note">Nothing here.</p>}
      <div className="admin-list">{rows?.map((row) => (
        <article className="admin-card" key={row.id}>
          <div className="admin-meta"><span className={`status status-${row.status}`}>{row.status}</span><span>{when(row.created_at)}</span>{row.published_at && <span>Published {when(row.published_at)}</span>}</div>
          {tab === 'stories' && <><h2>{row.title}</h2><p className="admin-by">{row.display_name} · {row.country} · {row.category} · <a href={`mailto:${row.email}`}>{row.email}</a></p><p className="admin-body">{row.body}</p>{row.image_path && <p className="admin-by">Has a supporting image (shown publicly only once approved).</p>}</>}
          {tab === 'contact_messages' && <><h2>{row.subject}</h2><p className="admin-by">{row.full_name} · <a href={`mailto:${row.email}`}>{row.email}</a></p><p className="admin-body">{row.message}</p></>}
          {tab === 'member_interests' && <><h2>{row.full_name}</h2><p className="admin-by"><a href={`mailto:${row.email}`}>{row.email}</a>{row.location ? ` · ${row.location}` : ''} · {(row.interests || []).join(', ')}</p>{row.message && <p className="admin-body">{row.message}</p>}</>}
          <div className="admin-actions">
            {ACTIONS[tab].filter(([status]) => status !== row.status).map(([status, label]) => <button key={status} type="button" className={`admin-btn${status === 'approved' ? ' admin-btn-primary' : ''}`} disabled={busyId === row.id} onClick={() => setStatus(row, status)}>{label}</button>)}
            <button type="button" className="admin-btn admin-btn-danger" disabled={busyId === row.id} onClick={() => remove(row)}>Delete</button>
          </div>
        </article>
      ))}</div>
    </section>
  );
}
