# HomeAFar forms: setup (about 15 minutes)

1. **Create a Supabase project** (supabase.com, free tier is enough to start; check current limits).
2. **SQL Editor:** run `supabase/schema.sql`, then `supabase/storage.sql`.
3. **Create your admin login:** Authentication > Users > Add user (email + strong password). Copy the user's UUID, then run:
   `insert into public.admins (user_id) values ('PASTE-UUID-HERE');`
   Also turn OFF "Allow new users to sign up" (Authentication > Sign In / Providers) so strangers cannot create accounts.
4. **Environment variables** (Vercel > Project > Settings > Environment Variables, and `.env.local` locally; see `.env.example`):
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Project Settings > API, the anon/public key). Never use the service_role key. Redeploy after adding them.
5. **Auth URL:** Authentication > URL Configuration: set Site URL to your live domain.
6. **Test on the live site:** send a contact message, submit a story, open `/#/admin`, sign in, approve the story, confirm it appears under Stories.

Admin dashboard: `https://YOUR-SITE/#/admin` (not linked from the public menu; security comes from the database rules, not from hiding the link).

Not included (needs a decision or a paid/third-party service): email notifications, CAPTCHA/rate limiting (the forms have a honeypot only; consider Cloudflare Turnstile), and a formal privacy notice.
Run the checks: `npm test` (form behaviour) and `bash supabase/test-rls.sh` (database security rules; needs a local Postgres).
