-- Blog: categories, posts and their photos/videos, plus a Storage bucket for uploaded photos.
-- Same security model as events: visitors can read PUBLISHED posts, only admins can write.

------------------------------------------------------------------ reference rules
-- A Cloudinary asset is stored as its public id; an uploaded photo as its path inside the
-- `site-photos` bucket (always `blog/<name>.<jpg|jpeg|png|webp|gif>`). Never an arbitrary URL,
-- so pages can only load media from the site's own Cloudinary cloud and its own Supabase project.

------------------------------------------------------------------ categories
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 40),
  title text not null check (char_length(title) between 1 and 60),
  position int not null default 0
);

insert into public.blog_categories (slug, title, position) values
  ('news', 'News', 1),
  ('behind-the-scenes', 'Behind the scenes', 2),
  ('gigs-events', 'Gigs & events', 3),
  ('livestreams', 'Livestreams', 4);

------------------------------------------------------------------ posts
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 1 and 160),
  -- Deleting a category leaves its posts uncategorised rather than deleting them.
  category text references public.blog_categories (slug) on update cascade on delete set null,
  post_date date not null default current_date,
  description text not null default '' check (char_length(description) <= 20000),
  cover text check (char_length(cover) between 1 and 200),
  cover_source text check (cover_source in ('cloudinary', 'upload')),
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check ((cover is null) = (cover_source is null)),
  check (
    cover is null
    or (cover_source is not distinct from 'cloudinary' and cover ~ '^[A-Za-z0-9_./-]+$' and cover !~ '\.\.')
    or (cover_source is not distinct from 'upload' and cover ~ '^blog/[a-z0-9][a-z0-9_.-]{0,120}\.(jpg|jpeg|png|webp|gif)$' and cover !~ '\.\.')
  )
);
create index blog_posts_date_idx on public.blog_posts (post_date desc);

------------------------------------------------------------------ photos and videos on a post
create table public.blog_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.blog_posts (id) on delete cascade,
  position int not null default 0,
  kind text not null check (kind in ('image', 'video', 'embed')),
  -- image: cloudinary or upload. video: cloudinary. embed (YouTube/Vimeo): no source.
  source text check (source in ('cloudinary', 'upload')),
  -- cloudinary: public id. upload: path in the bucket. embed: the YouTube/Vimeo video id.
  ref text not null check (char_length(ref) between 1 and 200),
  provider text check (provider in ('youtube', 'vimeo')),
  caption text not null default '' check (char_length(caption) <= 300),
  credit text not null default '' check (char_length(credit) <= 120),
  check ((kind = 'embed') = (provider is not null)),
  check (
    (kind = 'embed' and source is null and ref ~ '^[A-Za-z0-9_-]{3,40}$')
    or (kind = 'image' and source is not distinct from 'cloudinary' and ref ~ '^[A-Za-z0-9_./-]+$' and ref !~ '\.\.')
    or (kind = 'image' and source is not distinct from 'upload' and ref ~ '^blog/[a-z0-9][a-z0-9_.-]{0,120}\.(jpg|jpeg|png|webp|gif)$' and ref !~ '\.\.')
    or (kind = 'video' and source is not distinct from 'cloudinary' and ref ~ '^[A-Za-z0-9_./-]+$' and ref !~ '\.\.')
  )
);
create index blog_media_post_idx on public.blog_media (post_id, position);

------------------------------------------------------------------ grants
grant select on public.blog_categories, public.blog_posts, public.blog_media to anon, authenticated;
grant insert, update, delete on public.blog_categories, public.blog_posts, public.blog_media to authenticated;

------------------------------------------------------------------ row level security
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_media enable row level security;

-- Public reads
create policy "Anyone can read blog categories" on public.blog_categories for select using (true);
create policy "Anyone can read published posts" on public.blog_posts for select using (published);
create policy "Anyone can read media of published posts" on public.blog_media for select
  using (exists (select 1 from public.blog_posts p where p.id = post_id and p.published));

-- Admin reads (including drafts)
create policy "Admins read all posts" on public.blog_posts for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins read all blog media" on public.blog_media for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Admin writes
create policy "Admins write blog categories" on public.blog_categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins write posts" on public.blog_posts for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins write blog media" on public.blog_media for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

------------------------------------------------------------------ storage: uploaded photos
-- Public bucket (anyone can VIEW a photo by its link). Only admins can add, change or remove
-- files. The bucket itself enforces images only (no SVG, which can carry scripts) and 10 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-photos', 'site-photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins read site photo files" on storage.objects;
drop policy if exists "Admins add site photos" on storage.objects;
drop policy if exists "Admins change site photos" on storage.objects;
drop policy if exists "Admins remove site photos" on storage.objects;

create policy "Admins read site photo files" on storage.objects for select to authenticated
  using (bucket_id = 'site-photos' and public.has_role(auth.uid(), 'admin'));
create policy "Admins add site photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'site-photos' and public.has_role(auth.uid(), 'admin'));
create policy "Admins change site photos" on storage.objects for update to authenticated
  using (bucket_id = 'site-photos' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'site-photos' and public.has_role(auth.uid(), 'admin'));
create policy "Admins remove site photos" on storage.objects for delete to authenticated
  using (bucket_id = 'site-photos' and public.has_role(auth.uid(), 'admin'));
