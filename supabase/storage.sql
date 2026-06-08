-- ============================================================
-- File uploads (POP field, and any future "file" field)
-- Run AFTER schema.sql. Creates a public-read storage bucket
-- and policies allowing public uploads to published forms.
-- ============================================================

-- Bucket for form file uploads
insert into storage.buckets (id, name, public)
values ('form-uploads', 'form-uploads', true)
on conflict (id) do nothing;

-- Anyone can upload (respondents are anonymous on public forms).
-- Files are namespaced by form id in the object path: <form_id>/<filename>.
drop policy if exists form_uploads_public_insert on storage.objects;
create policy form_uploads_public_insert on storage.objects
  for insert to anon, authenticated
  with check ( bucket_id = 'form-uploads' );

-- Anyone can read (bucket is public; links work in the entry viewer).
drop policy if exists form_uploads_public_read on storage.objects;
create policy form_uploads_public_read on storage.objects
  for select to anon, authenticated
  using ( bucket_id = 'form-uploads' );

-- Owners can delete their files (optional cleanup).
drop policy if exists form_uploads_owner_delete on storage.objects;
create policy form_uploads_owner_delete on storage.objects
  for delete to authenticated
  using ( bucket_id = 'form-uploads' );
