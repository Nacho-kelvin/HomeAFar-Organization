// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const calls = { inserts: [], uploads: [] };
let configured = true;
let insertDelay = 0;
let insertError = null;
vi.mock('../src/lib/supabase.js', async () => {
  const real = await vi.importActual('../src/lib/supabase.js');
  const client = {
    from: (table) => ({ insert: async (row) => { calls.inserts.push({ table, row }); if (insertDelay) await new Promise((r) => setTimeout(r, insertDelay)); return { error: insertError }; } }),
    storage: { from: () => ({ upload: async (path, file) => { calls.uploads.push(path); return { error: null }; } }) },
  };
  return { ...real, get isConfigured() { return configured; }, getSupabase: async () => (configured ? client : null) };
});
import { ContactForm, StoryForm, JoinForm } from '../src/forms.jsx';
import { validateContact, validateStory, validateImage, validateJoin } from '../src/lib/validate.js';

beforeEach(() => { cleanup(); calls.inserts.length = 0; calls.uploads.length = 0; configured = true; insertDelay = 0; insertError = null; });
const LONG = 'A story about moving abroad and finding people who feel like home. '.repeat(3);

describe('validators', () => {
  it('rejects invalid emails and short fields', () => {
    expect(validateContact({ full_name: 'A', email: 'nope', subject: 'x', message: 'short' })).toMatchObject({ full_name: expect.any(String), email: expect.any(String), subject: expect.any(String), message: expect.any(String) });
    expect(validateContact({ full_name: 'Ada Obi', email: 'a@b.co', subject: 'Hello', message: 'Hello there friends' })).toEqual({});
  });
  it('image rules', () => {
    expect(validateImage({ type: 'image/gif', size: 10 })).toBeTruthy();
    expect(validateImage({ type: 'image/png', size: 4 * 1024 * 1024 })).toBeTruthy();
    expect(validateImage({ type: 'image/png', size: 1000 })).toBeNull();
  });
  it('story needs consent, category and 100+ chars', () => {
    const e = validateStory({ title: 'Title', display_name: 'Ada', email: 'a@b.co', country: 'Romania', category: '', body: 'x', consent: false }, null);
    expect(Object.keys(e).sort()).toEqual(['body', 'category', 'consent']);
  });
  it('join needs an interest and consent', () => {
    expect(Object.keys(validateJoin({ full_name: 'Ada Obi', email: 'a@b.co', interests: [], consent: false })).sort()).toEqual(['consent', 'interests']);
  });
});

describe('ContactForm', () => {
  it('shows errors and saves nothing when empty or invalid', async () => {
    const u = userEvent.setup(); render(<ContactForm />);
    await u.click(screen.getByRole('button', { name: /send message/i }));
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThanOrEqual(4);
    await u.type(screen.getByLabelText(/full name/i), 'Ada Obi'); await u.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await u.type(screen.getByLabelText(/subject/i), 'Hello'); await u.type(screen.getByLabelText(/^message/i), 'Hello there friends');
    await u.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText(/valid email address/i)).toBeTruthy();
    expect(calls.inserts).toHaveLength(0);
  });
  it('saves once on valid input, even with a double click, then confirms', async () => {
    insertDelay = 80; const u = userEvent.setup(); render(<ContactForm />);
    await u.type(screen.getByLabelText(/full name/i), 'Ada Obi'); await u.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await u.type(screen.getByLabelText(/subject/i), 'Hello'); await u.type(screen.getByLabelText(/^message/i), 'Hello there friends');
    const button = screen.getByRole('button', { name: /send message/i });
    await u.dblClick(button);
    expect(await screen.findByText(/your message is in/i)).toBeTruthy();
    expect(calls.inserts).toHaveLength(1);
    expect(calls.inserts[0]).toMatchObject({ table: 'contact_messages', row: { full_name: 'Ada Obi', email: 'ada@example.com' } });
  });
  it('shows an error (not a fake success) when the database rejects the insert', async () => {
    insertError = { message: 'boom' }; const u = userEvent.setup(); render(<ContactForm />);
    await u.type(screen.getByLabelText(/full name/i), 'Ada Obi'); await u.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await u.type(screen.getByLabelText(/subject/i), 'Hello'); await u.type(screen.getByLabelText(/^message/i), 'Hello there friends');
    await u.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText(/was not saved/i)).toBeTruthy(); expect(screen.queryByText(/your message is in/i)).toBeNull();
  });
  it('is honest when Supabase is not configured', async () => {
    configured = false; const u = userEvent.setup(); render(<ContactForm />);
    await u.type(screen.getByLabelText(/full name/i), 'Ada Obi'); await u.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await u.type(screen.getByLabelText(/subject/i), 'Hello'); await u.type(screen.getByLabelText(/^message/i), 'Hello there friends');
    await u.click(screen.getByRole('button', { name: /send message/i }));
    expect(await screen.findByText(/not switched on yet/i)).toBeTruthy(); expect(screen.queryByText(/your message is in/i)).toBeNull();
  });
  it('honeypot submissions are not saved', async () => {
    const u = userEvent.setup(); const { container } = render(<ContactForm />);
    await u.type(screen.getByLabelText(/full name/i), 'Bot Bot'); await u.type(screen.getByLabelText(/email address/i), 'bot@example.com');
    await u.type(screen.getByLabelText(/subject/i), 'Buy now'); await u.type(screen.getByLabelText(/^message/i), 'Spam spam spam spam');
    await u.type(container.querySelector('input[name="website"]'), 'http://spam');
    await u.click(screen.getByRole('button', { name: /send message/i }));
    expect(calls.inserts).toHaveLength(0);
  });
});

describe('StoryForm', () => {
  const fill = async (u) => {
    await u.type(screen.getByLabelText(/story title/i), 'Finding home'); await u.type(screen.getByLabelText(/name to display/i), 'Ada');
    await u.type(screen.getByLabelText(/email address/i), 'ada@example.com'); await u.type(screen.getByLabelText(/country of residence/i), 'Romania');
    await u.selectOptions(screen.getByLabelText(/story category/i), 'Belonging'); await u.click(screen.getByLabelText(/^your story/i)); await u.paste(LONG);
  };
  it('blocks submission without consent', async () => {
    const u = userEvent.setup(); render(<StoryForm />); await fill(u);
    await u.click(screen.getByRole('button', { name: /submit story/i }));
    expect(await screen.findByText(/give permission to publish/i)).toBeTruthy(); expect(calls.inserts).toHaveLength(0);
  });
  it('saves as consented story without setting status (database forces pending), with optional image upload', async () => {
    const u = userEvent.setup(); render(<StoryForm />); await fill(u);
    await u.upload(screen.getByLabelText(/supporting image/i), new File(['x'], 'p.png', { type: 'image/png' }));
    await u.click(screen.getByLabelText(/i confirm this story is mine/i));
    await u.click(screen.getByRole('button', { name: /submit story/i }));
    expect(await screen.findByText(/pending approval/i)).toBeTruthy();
    expect(calls.inserts).toHaveLength(1);
    const { table, row } = calls.inserts[0];
    expect(table).toBe('stories'); expect(row.consent).toBe(true); expect(row).not.toHaveProperty('status'); expect(row.image_path).toMatch(/^[0-9a-f-]{36}\.png$/); expect(calls.uploads).toHaveLength(1);
  });
});

describe('JoinForm', () => {
  it('requires an interest and consent, then saves', async () => {
    const u = userEvent.setup(); render(<JoinForm />);
    await u.type(screen.getByLabelText(/full name/i), 'Ada Obi'); await u.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await u.click(screen.getByRole('button', { name: /send my interest/i }));
    expect(await screen.findByText(/at least one way/i)).toBeTruthy(); expect(calls.inserts).toHaveLength(0);
    await u.click(screen.getByLabelText('Volunteering')); await u.click(screen.getByLabelText(/i agree that homeafar may contact me/i));
    await u.click(screen.getByRole('button', { name: /send my interest/i }));
    expect(await screen.findByText(/we have your interest/i)).toBeTruthy();
    expect(calls.inserts[0]).toMatchObject({ table: 'member_interests', row: { interests: ['Volunteering'], consent: true } });
  });
});
