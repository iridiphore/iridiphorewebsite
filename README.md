# Iridiphore

Website for Iridiphore, a visual collective making live visuals for live music.

A single-page React app hosted on **GitHub Pages**, with a **Supabase** backend (content, enquiries, admin sign-in) and **Cloudinary** for images and video. Content is edited at `/admin`, no deploy needed.

## What's on the site

| Page | What it is | Edited in admin |
| --- | --- | --- |
| `/` | Full-screen background video, headline, "Who we work with" cards, recent work, contact form | **Home page**, **Sectors** |
| `/work` | Every event: gigs, EMOM nights, livestreams. Filter by type | **Work** |
| `/work/<event>` | One event with its photos, clips and YouTube/Vimeo videos | **Work** |
| `/admin` | Sign-in protected editor, plus the enquiries inbox | |

## Preview mode

While `VITE_SUPABASE_URL` in `.env` is blank, the site shows sample content and a banner saying so. That lets anyone review the layout before the backend exists. Fill in `.env` (see [docs/SETUP.md](docs/SETUP.md)) and it switches to real data.

## Running it

```sh
npm ci          # install exact dependencies
npm run dev     # http://localhost:8080
npm run build   # typecheck + production build into dist/
npm run preview # serve the production build
```

Pushing to `main` builds and publishes via `.github/workflows/deploy.yml`.

## Media (Cloudinary)

Only the **public id** of an asset is stored, never a URL. In admin, paste any Cloudinary link and it is checked and reduced to the public id. Links from other accounts or other hosts are refused. The site builds delivery URLs from `VITE_CLOUDINARY_CLOUD_NAME`, so pages can only ever load media from Iridiphore's own cloud.

- **Hero video**: a short (8 to 15 second) loop. Delivered as WebM and MP4, with the first frame as the poster.
- **Photos and clips**: any number per event.
- **Long videos and livestream recordings**: put them on YouTube or Vimeo and paste that link. Don't host them on Cloudinary.

Cloudinary asset names should use letters, numbers, `-`, `_`, `.` and `/` only.

## Security model

- The Supabase **publishable** key and the Cloudinary **cloud name** are in `.env`. Both are public by design. Never commit a `service_role` key or any API secret.
- All access control is Row-Level Security in `supabase/migrations/`. Visitors can read published content and insert enquiries, and nothing else. Writing content or reading enquiries needs a signed-in user with the `admin` role.
- The contact form has a honeypot field, and the database rejects malformed or oversized submissions.

## Layout

```
src/pages/            Home, Work, EventDetail, Login, ResetPassword
src/pages/admin/      Admin shell + one file per tab
src/components/       HeroVideo, Iridescence (brand backdrop), EventCard, MediaItem, ContactForm
src/lib/              cloudinary.ts (link parsing + URLs), SiteData.tsx (data loading), defaults.ts (preview content)
supabase/migrations/  The whole backend schema
docs/                 SETUP.md, SPEC.md
```

## Origin

Built from the same plumbing as the My Liberal Pony site (Vite + React, Supabase RLS admin, GitHub Pages), with a new content model for a visual collective.
