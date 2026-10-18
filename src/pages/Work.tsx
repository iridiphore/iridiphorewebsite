import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import EventCard from "@/components/EventCard";
import { useSiteData } from "@/lib/SiteData";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/types";

export default function Work() {
  const { events, loading } = useSiteData();
  const [filter, setFilter] = useState<EventType | "all">("all");

  // Only offer filters for event types that actually exist.
  const types = useMemo(() => [...new Set(events.map((e) => e.event_type))], [events]);
  const shown = filter === "all" ? events : events.filter((e) => e.event_type === filter);

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active ? "border-paper bg-paper text-ink" : "border-line text-fog hover:border-fog hover:text-paper"
    }`;

  return (
    <Layout>
      <SEO
        title="Work | Iridiphore"
        description="Events Iridiphore has made visuals for: gigs, EMOM nights and livestreams."
        path="/work"
      />
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
        <h1 className="font-display text-6xl italic sm:text-7xl">Work</h1>
        <p className="mt-4 max-w-xl text-fog">Events we've made visuals for.</p>

        {types.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
            <button type="button" className={pill(filter === "all")} onClick={() => setFilter("all")}>All</button>
            {types.map((t) => (
              <button key={t} type="button" className={pill(filter === t)} onClick={() => setFilter(t)}>
                {EVENT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="mt-12 text-fog">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="mt-12 text-fog">Nothing here yet.</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
