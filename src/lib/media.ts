import { cloudinaryConfigured, imageUrl } from "./cloudinary";
import { photoUrl } from "./storage";
import type { MediaSource } from "./types";

/**
 * The address to show an image from. `upload` = a file in this project's Supabase Storage,
 * anything else = a Cloudinary public id. Returns null when it can't be built (Cloudinary not
 * configured), so callers can fall back to the iridescent placeholder.
 */
export function mediaImageUrl(
  source: MediaSource | null | undefined,
  ref: string,
  opts: { w?: number; h?: number; fill?: boolean } = {},
): string | null {
  if (source === "upload") return photoUrl(ref);
  return cloudinaryConfigured ? imageUrl(ref, opts) : null;
}
