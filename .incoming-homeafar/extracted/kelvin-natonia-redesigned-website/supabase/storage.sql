-- Optional story images. Run after schema.sql.
-- The bucket is public-read so approved stories can show their image; file names are random UUIDs.
-- Visitors can upload (images only, max 3 MB) but cannot list, overwrite or delete anything.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-images', 'story-images', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "visitors upload story images" on storage.objects;
create policy "visitors upload story images" on storage.objects for insert to anon, authenticated with check (bucket_id = 'story-images');
drop policy if exists "admins delete story images" on storage.objects;
create policy "admins delete story images" on storage.objects for delete to authenticated using (bucket_id = 'story-images' and public.is_admin());
