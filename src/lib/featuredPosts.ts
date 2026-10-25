import type { BlogPost } from "./types";

/** Most posts the Home page's blog block will show once posts are flagged. */
export const MAX_FEATURED_POSTS = 6;
/** How many posts Home shows while NO post is flagged. */
export const DEFAULT_FEATURED_POSTS = 3;

/**
 * Which posts the Home page features. Same rule as My Liberal Pony's featured projects:
 *  - If no published post is flagged: the latest few.
 *  - Once any published post is flagged: only the flagged ones, up to the maximum.
 * Drafts never appear. Newest first.
 */
export function selectFeaturedPosts(posts: BlogPost[]): BlogPost[] {
  const live = posts
    .filter((p) => p.published)
    .sort((a, b) => b.post_date.localeCompare(a.post_date) || a.title.localeCompare(b.title));
  const flagged = live.filter((p) => p.featured === true);
  if (flagged.length === 0) return live.slice(0, DEFAULT_FEATURED_POSTS);
  return flagged.slice(0, MAX_FEATURED_POSTS);
}
