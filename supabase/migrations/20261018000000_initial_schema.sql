-- Iridiphore initial schema.
-- Public visitors can READ published content and INSERT enquiries. Everything else
-- requires a signed-in user who has the 'admin' role in public.user_roles.

------------------------------------------------------------------ roles
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create policy "Users can read their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

------------------------------------------------------------------ media reference rule
-- Media is stored as a Cloudinary PUBLIC ID only (never an arbitrary URL), so a page
-- can only ever load media from the site's own Cloudinary cloud. The admin screen turns a
-- pasted Cloudinary link into a public id before saving.
create domain public.cloudinary_id as text
  check (value ~ '^[A-Za-z0-9_./-]{1,200}$' and value !~ '\.\.');

------------------------------------------------------------------ site config (single row)
create table public.site_config (
  id int primary key default 1 check (id = 1),
  headline text not null default 'Live visuals for live music.',
  tagline text not null default 'Iridiphore is a visual collective. We make the visuals for gigs, EMOM nights and livestreams.',
  intro text not null default '',
  hero_video public.cloudinary_id,
  hero_poster public.cloudinary_id,
  logo public.cloudinary_id,
  contact_email text not null default 'iridiphore@gmail.com',
  instagram text not null default '',
  youtube text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.site_config (id) values (1);

------------------------------------------------------------------ sectors (who we work with)
create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  audience text not null unique check (audience ~ '^[a-z0-9-]{1,40}$'),
  published boolean not null default true
);

insert into public.sectors (position, title, description, audience) values
  (1, 'Artists & Label Work', 'Live visuals for your set, and video content for releases and tours.', 'artists-labels'),
  (2, 'Promoters & Managers', 'Visuals for your nights and your acts, from a single event to a run of dates.', 'promoters-managers'),
  (3, 'Festivals & Venues', 'A visual rig and crew for your stage, or a resident setup for your venue.', 'festivals-venues');

------------------------------------------------------------------ events (the Work page)
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 1 and 160),
  event_type text not null default 'gig' check (event_type in ('gig', 'emom', 'livestream', 'other')),
  event_date date,
  location text not null default '' check (char_length(location) <= 160),
  description text not null default '' check (char_length(description) <= 4000),
  cover public.cloudinary_id,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  position int not null default 0,
  kind text not null check (kind in ('image', 'video', 'embed')),
  -- kind = image/video: a Cloudinary public id. kind = embed: a YouTube/Vimeo video id.
  ref text not null check (char_length(ref) between 1 and 200),
  provider text check (provider in ('youtube', 'vimeo')),
  caption text not null default '' check (char_length(caption) <= 300),
  check ((kind = 'embed') = (provider is not null)),
  check (kind = 'embed' or ref ~ '^[A-Za-z0-9_./-]+$'),
  check (kind <> 'embed' or ref ~ '^[A-Za-z0-9_-]{3,40}$')
);
create index event_media_event_idx on public.event_media (event_id, position);

------------------------------------------------------------------ enquiries (contact form)
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  location text not null default '' check (char_length(location) <= 160),
  audience text not null default '' check (char_length(audience) <= 40),
  message text not null check (char_length(message) between 1 and 4000),
  handled boolean not null default false
);

------------------------------------------------------------------ grants
grant select on public.site_config, public.sectors, public.events, public.event_media to anon, authenticated;
grant insert on public.enquiries to anon, authenticated;
grant insert, update, delete on public.site_config, public.sectors, public.events, public.event_media to authenticated;
grant select, update, delete on public.enquiries to authenticated;

------------------------------------------------------------------ row level security
alter table public.site_config enable row level security;
alter table public.sectors enable row level security;
alter table public.events enable row level security;
alter table public.event_media enable row level security;
alter table public.enquiries enable row level security;

-- Public reads
create policy "Anyone can read site config" on public.site_config for select using (true);
create policy "Anyone can read published sectors" on public.sectors for select using (published);
create policy "Anyone can read published events" on public.events for select using (published);
create policy "Anyone can read media of published events" on public.event_media for select
  using (exists (select 1 from public.events e where e.id = event_id and e.published));

-- Admin reads (including drafts)
create policy "Admins read all sectors" on public.sectors for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins read all events" on public.events for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins read all event media" on public.event_media for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Admin writes
create policy "Admins write site config" on public.site_config for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins write sectors" on public.sectors for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins write events" on public.events for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins write event media" on public.event_media for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Enquiries: anyone may INSERT (new, unhandled rows only). Only admins may read or change them.
create policy "Anyone can send an enquiry" on public.enquiries for insert to anon, authenticated
  with check (handled = false);
create policy "Admins read enquiries" on public.enquiries for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update enquiries" on public.enquiries for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete enquiries" on public.enquiries for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
