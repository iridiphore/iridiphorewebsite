export type EventType = "gig" | "emom" | "livestream" | "other";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  gig: "Gig",
  emom: "EMOM",
  livestream: "Livestream",
  other: "Other",
};

export interface SiteConfig {
  headline: string;
  tagline: string;
  hero_video: string | null;
  hero_poster: string | null;
  logo: string | null;
  contact_email: string;
  instagram: string;
  youtube: string;
  /** Raw JSON from the database; always read through normalizeContent(). */
  content: unknown;
}

export interface Sector {
  id: string;
  position: number;
  title: string;
  description: string;
  audience: string;
  published: boolean;
}

export type MediaKind = "image" | "video" | "embed";

/** Where an image or clip lives: a Cloudinary public id, or a file uploaded to this project's Supabase Storage. */
export type MediaSource = "cloudinary" | "upload";

/** One photo, clip or embed. Events leave `source` and `credit` unset (always Cloudinary). */
export interface EventMedia {
  id: string;
  event_id: string;
  position: number;
  kind: MediaKind;
  ref: string;
  provider: "youtube" | "vimeo" | null;
  caption: string;
  source?: MediaSource | null;
  credit?: string;
}

export interface BlogCategory {
  id: string;
  slug: string;
  title: string;
  position: number;
}

export interface BlogMedia {
  id: string;
  post_id: string;
  position: number;
  kind: MediaKind;
  source: MediaSource | null;
  ref: string;
  provider: "youtube" | "vimeo" | null;
  caption: string;
  credit: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  /** Category slug, or null for uncategorised. */
  category: string | null;
  post_date: string;
  description: string;
  cover: string | null;
  cover_source: MediaSource | null;
  featured: boolean;
  published: boolean;
  blog_media: BlogMedia[];
}

export interface SiteEvent {
  id: string;
  slug: string;
  title: string;
  event_type: EventType;
  event_date: string | null;
  location: string;
  description: string;
  cover: string | null;
  published: boolean;
  event_media: EventMedia[];
}

export interface Enquiry {
  id: string;
  created_at: string;
  name: string;
  email: string;
  location: string;
  audience: string;
  message: string;
  handled: boolean;
}
