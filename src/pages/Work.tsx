import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import EventCard from "@/components/EventCard";
import { useSiteData } from "@/lib/SiteData";
import type { EventType } from "@/lib/types";

export default function Work() {
  const { events, loading, t, shown } = useSiteData();
  const [filter, setFilter] = useState<EventType | "all">("all");

  // Only offer filters for event types that actually exist.
  const types = useMemo(() => [...new Set(events.map((e) => e.event_type))], [events]);
  const visible = filter === "all" ? events : events.filter((e) => e.event_type === filter);

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active ? "border-paper bg-paper text-ink" : "border-line text-fog hover:border-fog hover:text-paper"
    }`;

  return (
    <Layout>
      <SEO
        title={t("seo.work_title")}
        description={t("seo.work_description")}
        path="/work"
      />
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
        <h1 className="font-display text-6xl italic sm:text-7xl">{t("work.title")}</h1>
        <p className="mt-4 max-w-xl text-fog">{t("work.subtitle")}</p>

        {shown("work.filters") && types.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
            <button type="button" className={pill(filter === "all")} onClick={() => setFilter("all")}>{t("work.filter_all")}</button>
            {types.map((ty) => (
              <button key={ty} type="button" className={pill(filter === ty)} onClick={() => setFilter(ty)}>
                {t(`type.${ty}`)}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="mt-12 text-fog">{t("work.loading")}</p>
        ) : visible.length === 0 ? (
          <p className="mt-12 text-fog">{t("work.empty")}</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
