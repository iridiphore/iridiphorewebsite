import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { backendConfigured, supabase } from "./supabase";
import { DEFAULT_CONFIG, SAMPLE_EVENTS, SAMPLE_SECTORS } from "./defaults";
import {
  hexToTriplet,
  normalizeContent,
  resolveShow,
  resolveText,
  resolveTheme,
  type ShowKey,
  type TextKey,
  type Theme,
} from "./content";
import type { Sector, SiteConfig, SiteEvent } from "./types";

interface SiteData {
  config: SiteConfig;
  sectors: Sector[];
  events: SiteEvent[];
  loading: boolean;
  /** True when no backend is connected and sample content is showing. */
  preview: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Wording: the admin's override if there is one, otherwise the standard text. */
  t: (key: TextKey) => string;
  /** Whether a part of the page is switched on. */
  shown: (key: ShowKey) => boolean;
  theme: Theme;
}

const Ctx = createContext<SiteData | null>(null);

const byDateDesc = (a: SiteEvent, b: SiteEvent) => (b.event_date ?? "").localeCompare(a.event_date ?? "");

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [sectors, setSectors] = useState<Sector[]>(backendConfigured ? [] : SAMPLE_SECTORS);
  const [events, setEvents] = useState<SiteEvent[]>(backendConfigured ? [] : SAMPLE_EVENTS);
  const [loading, setLoading] = useState(backendConfigured);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const [c, s, e] = await Promise.all([
      supabase.from("site_config").select("*").eq("id", 1).maybeSingle(),
      supabase.from("sectors").select("*").eq("published", true).order("position"),
      supabase.from("events").select("*, event_media(*)").eq("published", true),
    ]);
    const failure = c.error ?? s.error ?? e.error;
    if (failure) {
      setError(failure.message);
    } else {
      setError(null);
      if (c.data) setConfig({ ...DEFAULT_CONFIG, ...(c.data as SiteConfig) });
      setSectors((s.data ?? []) as Sector[]);
      const events = ((e.data ?? []) as SiteEvent[]).map((ev) => ({
        ...ev,
        event_media: [...(ev.event_media ?? [])].sort((a, b) => a.position - b.position),
      }));
      setEvents(events.sort(byDateDesc));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const content = useMemo(() => normalizeContent(config.content), [config.content]);
  const theme = useMemo(() => resolveTheme(content), [content]);

  // Colours are CSS variables, so Tailwind classes like text-teal and bg-ember/15 follow them.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--accent", hexToTriplet(theme.accent));
    root.setProperty("--accent-2", hexToTriplet(theme.accent2));
  }, [theme]);

  const value = useMemo<SiteData>(
    () => ({
      config,
      sectors,
      events,
      loading,
      preview: !backendConfigured,
      error,
      refresh,
      t: (key) => resolveText(content, key),
      shown: (key) => resolveShow(content, key),
      theme,
    }),
    [config, sectors, events, loading, error, refresh, content, theme],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteData(): SiteData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSiteData must be used inside SiteDataProvider");
  return v;
}
