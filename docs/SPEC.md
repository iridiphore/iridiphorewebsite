# Spec: Iridiphore template site

## Goal
A template the Iridiphore crew (three people, two of whom will edit) can review before the real footage arrives. Same operating model as My Liberal Pony: GitHub Pages, its own Supabase project, Cloudinary media, `/admin` for quick edits.

## Decisions (from the design discussion)
- **Message:** "Live visuals for live music." Visuals lead; the hero is a full-bleed background video.
- **Style:** clean, no terminal styling. The footage does the work. Iridescent colour is the brand backdrop, and the permanent fallback behind the video.
- **Sections kept:** hero, "Who we work with", contact. **Removed:** Rig, and the three "Vibe" cards (the most generic copy).
- **Sectors (3):** Artists & Label Work, Promoters & Managers, Festivals & Venues. Each links to the contact form with the audience pre-filled.
- **Work:** `/work` lists discrete events (gig, EMOM, livestream, other). Each event has its own page with any number of images, Cloudinary clips and YouTube/Vimeo embeds.
- **Media:** paste a Cloudinary link in admin. No upload widget (nothing secret in the browser). Only the public id is stored; links from other accounts are refused. Livestream recordings go on YouTube/Vimeo, not Cloudinary.
- **Enquiries:** stored in the database and shown in admin. Email notification is undecided.
- **Admins:** two, via `user_roles`.
- **Customisation over brevity:** all page wording, show/hide switches and the two accent colours are editable in admin (Text and Look tabs), stored as overrides in `site_config.content` and defined once in `src/lib/content.ts`. A blank box means "standard wording"; hiding is done with explicit switches. Fonts, layout, the backdrop colours and the event type list stay in code.
- **Copy:** the crew supplied the description of what Iridiphore does (the idea, track record, how a night works). It is lightly edited into the tagline, three "about" blocks under the hero, the sector blurbs and the search description. The blocks are Text-tab fields with a show/hide switch, defaulted in code so they show before anyone has admin access. The old single `intro` field is gone from the app; its database column is left in place, unused.
- **Not carried over from My Liberal Pony:** Google Sheet content, Lovable preview-auth shim, seeded admin ids, MLP's Cloudinary cloud, Plausible tag, unused UI component library.

## Data model
`site_config` (single row), `sectors`, `events`, `event_media`, `enquiries`, `user_roles`. Schema and Row-Level Security: `supabase/migrations/`.

## Tickets (built in this order)
1. Scaffold: Vite/React/Tailwind, routing, GitHub Pages deploy, base-path handling.
2. Schema + RLS migration, checked against a local Postgres.
3. Cloudinary link parsing and delivery URLs, with tests for refusal cases.
4. Public site: hero video with iridescent fallback, sectors, recent work, contact form, Work and event pages.
5. Admin: sign-in, role check, Home page, Sectors, Work (with media), Enquiries.
6. Docs: README, SETUP.
7. Full customisation: `site_config.content` migration, `content.ts`, Text and Look tabs, every public string routed through `t()`.
8. Crew copy: about section, tagline, sector blurbs, search description; migration that updates old placeholder text only where unedited.

## Open items
- **Copy:** built from the crew's own text, lightly edited. Worth a read by the crew, in particular the claim "dozens of artists". The sector blurbs are written from that text and are the most likely to need rewording.
- **Logo and brand mark:** none supplied. A text wordmark is used; a logo can be set in admin.
- **Enquiry email:** decide whether to add email delivery.
- **Hero footage:** due next Wednesday. Until then the iridescent backdrop shows.
- **Domain cutover:** `iridiphore.co.uk` still points at the old site; see docs/SETUP.md step 6.
- **Mobile check on real devices**, especially iOS Low Power Mode, where autoplay is blocked and the poster shows instead.
