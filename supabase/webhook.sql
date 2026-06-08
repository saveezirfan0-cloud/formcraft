-- ============================================================
-- Outbound webhook: new entry  ->  Make scenario
-- Run AFTER schema.sql. Requires the pg_net extension (enabled
-- by default on Supabase). Replace the Make webhook URL below.
-- ============================================================

create extension if not exists pg_net;

create or replace function public.notify_make_on_entry()
returns trigger language plpgsql security definer as $$
declare
  make_url text := 'https://hook.eu2.make.com/REPLACE_WITH_YOUR_WEBHOOK';
begin
  perform net.http_post(
    url     := make_url,
    headers := jsonb_build_object('Content-Type','application/json'),
    body    := jsonb_build_object(
                 'event','entry.created',
                 'entry_id', new.id,
                 'form_id',  new.form_id,
                 'data',     new.data,
                 'created_at', new.created_at
               )
  );
  return new;
end; $$;

drop trigger if exists entries_notify_make on public.entries;
create trigger entries_notify_make after insert on public.entries
  for each row execute function public.notify_make_on_entry();

-- Alternatively, configure this in the Dashboard:
--   Database -> Webhooks -> Create -> table=entries, event=INSERT,
--   type=HTTP Request, URL=<your Make custom-webhook URL>.
-- The Dashboard route is easier to manage; the SQL above is the
-- code-first equivalent.
