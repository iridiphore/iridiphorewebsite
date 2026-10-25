import { Link } from "react-router-dom";
import Iridescence from "./Iridescence";
import { mediaImageUrl } from "@/lib/media";
import { formatDate } from "@/lib/format";
import { useSiteData } from "@/lib/SiteData";
import type { BlogPost } from "@/lib/types";

/** First sentence-ish chunk of the post text for the card. */
function excerpt(text: string, max = 130): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).replace(/[,;:.\-–]+$/, "") + "…";
}

export default function PostCard({ post }: { post: BlogPost }) {
  const { categories } = useSiteData();
  const category = categories.find((c) => c.slug === post.category)?.title;
  const cover = post.cover ? mediaImageUrl(post.cover_source, post.cover, { w: 900, h: 506, fill: true }) : null;
  const summary = excerpt(post.description);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-sm border border-line bg-panel transition-colors hover:border-teal/50"
    >
      <div className="relative aspect-video overflow-hidden">
        <Iridescence />
        {cover && (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        {category && (
          <span className="absolute left-3 top-3 rounded-sm bg-ink/70 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-paper backdrop-blur">
            {category}
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-sm text-fog">{formatDate(post.post_date)}</p>
        <h3 className="mt-1 font-display text-2xl italic leading-tight">{post.title}</h3>
        {summary && <p className="mt-3 text-sm leading-relaxed text-fog">{summary}</p>}
      </div>
    </Link>
  );
}
