-- Forward new enquiries by email.
-- Flow: enquiry saved > trigger > pg_net POST > a Google Apps Script web app > Gmail.
-- The Apps Script address and its shared secret live in Vault (names below), never in the
-- repo or the browser. The recipient is set by an admin on the Enquiries tab.
--   vault secret 'enquiry_webhook_url'    the Apps Script web app URL
--   vault secret 'enquiry_webhook_secret' random string the script checks before sending
-- Sending is best effort: a failure here must never stop an enquiry being saved.

create extension if not exists pg_net;

------------------------------------------------------------------ settings (admin only)
-- Kept apart from site_config because that table is public; this address must not be.
create table public.notification_settings (
  id int primary key default 1 check (id = 1),
  forward_enabled boolean not null default false,
  forward_to text not null default ''
    check (
      char_length(forward_to) <= 254
      and (forward_to = '' or forward_to ~* '^[^@[:space:],;]+@[^@[:space:],;]+\.[^@[:space:],;]+$')
    ),
  updated_at timestamptz not null default now(),
  check (not forward_enabled or forward_to <> '')
);
insert into public.notification_settings (id) values (1);

revoke all on public.notification_settings from anon;
grant select, insert, update on public.notification_settings to authenticated;
alter table public.notification_settings enable row level security;
create policy "Admins manage notification settings" on public.notification_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

------------------------------------------------------------------ sender
-- Returns 'sent', 'disabled', 'no_address' or 'not_configured'. `_force` skips the on/off switch
-- (used by the admin's test button).
create or replace function public.send_forward_mail(_subject text, _reply_to text, _body text, _force boolean)
returns text
language plpgsql security definer
set search_path = public, extensions, net, vault
as $$
declare
  s public.notification_settings;
  _url text;
  _secret text;
begin
  select * into s from public.notification_settings where id = 1;
  if s.forward_to is null or s.forward_to = '' then return 'no_address'; end if;
  if not (s.forward_enabled or _force) then return 'disabled'; end if;

  select decrypted_secret into _url from vault.decrypted_secrets where name = 'enquiry_webhook_url';
  select decrypted_secret into _secret from vault.decrypted_secrets where name = 'enquiry_webhook_secret';
  if _url is null or _secret is null then return 'not_configured'; end if;

  perform net.http_post(
    url := _url,
    body := jsonb_build_object(
      'secret', _secret,
      'to', s.forward_to,
      'reply_to', coalesce(_reply_to, ''),
      'subject', regexp_replace(_subject, '[\r\n]+', ' ', 'g'),
      'body', _body
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return 'sent';
end
$$;
revoke all on function public.send_forward_mail(text, text, text, boolean) from public, anon, authenticated;

------------------------------------------------------------------ trigger
create or replace function public.forward_enquiry()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  begin
    -- Anyone can insert enquiries directly, so cap forwarding at 10 an hour. Extra ones are
    -- still saved and shown in admin. Keeps spam out of the inbox and under Gmail's daily limit.
    if (select count(*) from public.enquiries where created_at > now() - interval '1 hour') <= 10 then
      perform public.send_forward_mail(
        'New Iridiphore enquiry from ' || left(new.name, 80),
        new.email,
        'Name: ' || new.name || E'\n' ||
        'Email: ' || new.email || E'\n' ||
        'Location: ' || new.location || E'\n' ||
        'Interested in: ' || new.audience || E'\n\n' ||
        new.message,
        false
      );
    end if;
  exception when others then
    null;
  end;
  return new;
end
$$;
revoke all on function public.forward_enquiry() from public, anon, authenticated;

create trigger enquiries_forward after insert on public.enquiries
  for each row execute function public.forward_enquiry();

------------------------------------------------------------------ admin test button
create or replace function public.send_test_forward()
returns text
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Admins only';
  end if;
  return public.send_forward_mail(
    'Iridiphore test email',
    '',
    'This is a test from the Enquiries tab. If you can read it, forwarding works.',
    true
  );
end
$$;
revoke all on function public.send_test_forward() from public, anon;
grant execute on function public.send_test_forward() to authenticated;
