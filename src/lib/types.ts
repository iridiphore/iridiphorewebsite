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

export interface EventMedia {
  id: string;
  event_id: string;
  position: number;
  kind: MediaKind;
  ref: string;
  provider: "youtube" | "vimeo" | null;
  caption: string;
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
