import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import MediaItem from "@/components/MediaItem";
import NotFound from "./NotFound";
import { useSiteData } from "@/lib/SiteData";
import { cloudinaryConfigured, imageUrl } from "@/lib/cloudinary";
import { formatDate, typeLabel } from "@/lib/format";

export default function EventDetail() {
  const { slug } = useParams();
  const { events, loading } = useSiteData();
  const event = events.find((e) => e.slug === slug);

  if (loading) {
    return (
      <Layout>
        <p className="px-8 pt-40 text-fog">Loading…</p>
      </Layout>
    );
  }
  if (!event) return <NotFound />;

  const meta = [typeLabel(event.event_type), formatDate(event.event_date), event.location].filter(Boolean).join(" · ");
  const ogImage = event.cover && cloudinaryConfigured ? imageUrl(event.cover, { w: 1200, h: 630, fill: true }) : undefined;

  return (
    <Layout>
      <SEO
        title={`${event.title} | Iridiphore`}
        description={event.description.slice(0, 160) || `${event.title}: visuals by Iridiphore.`}
        path={`/work/${event.slug}`}
        ogImage={ogImage}
      />
      <article className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8">
        <Link to="/work" className="text-sm text-fog hover:text-paper">← All work</Link>
        <h1 className="mt-6 font-display text-5xl italic leading-tight sm:text-7xl">{event.title}</h1>
        {meta && <p className="mt-4 text-fog">{meta}</p>}
        {event.description && (
          <p className="mt-8 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-paper/85">{event.description}</p>
        )}
        {event.event_media.length > 0 && (
          <div className="mt-12 space-y-8">
            {event.event_media.map((m) => (
              <MediaItem key={m.id} media={m} />
            ))}
          </div>
        )}
      </article>
    </Layout>
  );
}
