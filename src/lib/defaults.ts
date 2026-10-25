import type { BlogCategory, BlogPost, Sector, SiteConfig, SiteEvent } from "./types";

/**
 * Sample content shown in PREVIEW MODE only (no Supabase configured). Once the backend is
 * connected the database is the single source of truth and none of this is used, apart from
 * DEFAULT_CONFIG as a fallback if the config row is missing.
 *
 * All copy here is a plain first draft for the crew to rewrite in /admin.
 */

export const DEFAULT_CONFIG: SiteConfig = {
  headline: "Live visuals for live music.",
  tagline: "We turn gigs into audio-visual events people talk about and remember.",
  hero_video: null,
  hero_poster: null,
  logo: null,
  contact_email: "iridiphore@gmail.com",
  instagram: "",
  youtube: "",
  content: {},
};

export const SAMPLE_SECTORS: Sector[] = [
  { id: "s1", position: 1, title: "Artists & Label Work", description: "Bespoke visuals for your set, album launch or livestream, made after talking to you about your style.", audience: "artists-labels", published: true },
  { id: "s2", position: 2, title: "Promoters & Managers", description: "Turn a night into an audio-visual event people talk about and remember.", audience: "promoters-managers", published: true },
  { id: "s3", position: 3, title: "Festivals & Venues", description: "Live visuals and projection mapping for your stage or room.", audience: "festivals-venues", published: true },
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

export const SAMPLE_CATEGORIES: BlogCategory[] = [
  { id: "c1", slug: "news", title: "News", position: 1 },
  { id: "c2", slug: "behind-the-scenes", title: "Behind the scenes", position: 2 },
  { id: "c3", slug: "gigs-events", title: "Gigs & events", position: 3 },
  { id: "c4", slug: "livestreams", title: "Livestreams", position: 4 },
];

const samplePost = (n: number, title: string, category: string, date: string, description: string, featured = false): BlogPost => ({
  id: `p${n}`, slug: `sample-post-${n}`, title, category, post_date: date, description,
  cover: null, cover_source: null, featured, published: true, blog_media: [],
});

export const SAMPLE_POSTS: BlogPost[] = [
  samplePost(1, "Sample post: a night in the lights", "gigs-events", "2026-10-02",
    "Placeholder post. Posts are written and edited in /admin: a title, a category, a cover image, the text itself, and any number of photos and videos underneath."),
  samplePost(2, "Sample post: behind the scenes", "behind-the-scenes", "2026-09-14",
    "Placeholder post. Photos can be uploaded straight from a phone or laptop, or pasted from Cloudinary. Videos come from Cloudinary or as YouTube and Vimeo links."),
  samplePost(3, "Sample post: news", "news", "2026-08-30",
    "Placeholder post. Switch on \"Featured on Home\" for the posts that should appear on the home page. Until you do, the latest three show there."),
];
