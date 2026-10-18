import { Link } from "react-router-dom";
import Iridescence from "./Iridescence";
import { cloudinaryConfigured, imageUrl } from "@/lib/cloudinary";
import { formatDate } from "@/lib/format";
import { useSiteData } from "@/lib/SiteData";
import type { SiteEvent } from "@/lib/types";

export default function EventCard({ event }: { event: SiteEvent }) {
  const { t } = useSiteData();
  const meta = [formatDate(event.event_date), event.location].filter(Boolean).join(" · ");
  return (
    <Link
      to={`/work/${event.slug}`}
      className="group block overflow-hidden rounded-sm border border-line bg-panel transition-colors hover:border-teal/50"
    >
      <div className="relative aspect-video overflow-hidden">
        <Iridescence />
        {event.cover && cloudinaryConfigured && (
          <img
            src={imageUrl(event.cover, { w: 900, h: 506, fill: true })}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <span className="absolute left-3 top-3 rounded-sm bg-ink/70 px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-paper backdrop-blur">
          {t(`type.${event.event_type}`)}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-2xl italic leading-tight">{event.title}</h3>
        {meta && <p className="mt-2 text-sm text-fog">{meta}</p>}
      </div>
    </Link>
  );
}
