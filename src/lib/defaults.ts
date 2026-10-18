import type { Sector, SiteConfig, SiteEvent } from "./types";

/**
 * Sample content shown in PREVIEW MODE only (no Supabase configured). Once the backend is
 * connected the database is the single source of truth and none of this is used, apart from
 * DEFAULT_CONFIG as a fallback if the config row is missing.
 *
 * All copy here is a plain first draft for the crew to rewrite in /admin.
 */

export const DEFAULT_CONFIG: SiteConfig = {
  headline: "Live visuals for live music.",
  tagline: "Iridiphore is a visual collective. We make the visuals for gigs, EMOM nights and livestreams.",
  intro: "",
  hero_video: null,
  hero_poster: null,
  logo: null,
  contact_email: "iridiphore@gmail.com",
  instagram: "",
  youtube: "",
};

export const SAMPLE_SECTORS: Sector[] = [
  { id: "s1", position: 1, title: "Artists & Label Work", description: "Live visuals for your set, and video content for releases and tours.", audience: "artists-labels", published: true },
  { id: "s2", position: 2, title: "Promoters & Managers", description: "Visuals for your nights and your acts, from a single event to a run of dates.", audience: "promoters-managers", published: true },
  { id: "s3", position: 3, title: "Festivals & Venues", description: "A visual rig and crew for your stage, or a resident setup for your venue.", audience: "festivals-venues", published: true },
];

export const SAMPLE_EVENTS: SiteEvent[] = [
  {
    id: "e1", slug: "sample-emom-night", title: "Sample: EMOM night", event_type: "emom",
    event_date: "2026-09-12", location: "Reading", cover: null, published: true,
    description: "Placeholder event. In the real site this is written and edited in /admin, with photos, clips and links added underneath.",
    event_media: [],
  },
  {
    id: "e2", slug: "sample-livestream", title: "Sample: Livestream", event_type: "livestream",
    event_date: "2026-08-02", location: "Online", cover: null, published: true,
    description: "Placeholder event. Livestream recordings are added as YouTube or Vimeo links, not uploaded to Cloudinary.",
    event_media: [],
  },
  {
    id: "e3", slug: "sample-gig", title: "Sample: Gig", event_type: "gig",
    event_date: "2026-06-20", location: "London", cover: null, published: true,
    description: "Placeholder event. Each event can hold several images, clips and embeds.",
    event_media: [],
  },
];
