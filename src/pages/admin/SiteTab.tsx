import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { DEFAULT_CONFIG } from "@/lib/defaults";
import { useSiteData } from "@/lib/SiteData";
import type { SiteConfig } from "@/lib/types";
import { btnCls, CloudinaryField, Field, inputCls, useStatus } from "./fields";

export default function SiteTab() {
  const { refresh } = useSiteData();
  const [cfg, setCfg] = useState<SiteConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const { setStatus, node } = useStatus();

  useEffect(() => {
    void supabase
      ?.from("site_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setStatus({ kind: "err", text: error.message });
        setCfg({ ...DEFAULT_CONFIG, ...((data as SiteConfig | null) ?? {}) });
      });
  }, [setStatus]);

  if (!cfg) return <p className="text-fog">Loading…</p>;
  const set = <K extends keyof SiteConfig>(k: K, v: SiteConfig[K]) => setCfg({ ...cfg, [k]: v });

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !cfg) return;
    setBusy(true);
    const { error } = await supabase.from("site_config").upsert({ id: 1, ...cfg, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return setStatus({ kind: "err", text: error.message });
    await refresh();
    setStatus({ kind: "ok", text: "Saved. The site is updated." });
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl italic">Home page</h2>
        <p className="mt-1 text-sm text-fog">The top of the home page and the contact details in the footer.</p>
      </div>

      <Field label="Headline">
        <input className={inputCls} value={cfg.headline} maxLength={120} onChange={(e) => set("headline", e.target.value)} />
      </Field>
      <Field label="Line under the headline">
        <textarea className={inputCls} rows={2} value={cfg.tagline} maxLength={300} onChange={(e) => set("tagline", e.target.value)} />
      </Field>
      <Field label="Intro paragraph" hint="Optional. Shown below the video. Leave empty to hide it.">
        <textarea className={inputCls} rows={4} value={cfg.intro} maxLength={1200} onChange={(e) => set("intro", e.target.value)} />
      </Field>

      <CloudinaryField
        label="Background video"
        resource="video"
        value={cfg.hero_video}
        onChange={(v) => set("hero_video", v)}
        hint="Paste the Cloudinary video link. A short (8 to 15 second) loop works best."
      />
      <CloudinaryField
        label="Background still (optional)"
        value={cfg.hero_poster}
        onChange={(v) => set("hero_poster", v)}
        hint="Shown while the video loads. If empty, the first frame of the video is used."
      />
      <CloudinaryField label="Logo (optional)" value={cfg.logo} onChange={(v) => set("logo", v)} hint="Shown next to the name in the header." />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact email">
          <input type="email" className={inputCls} value={cfg.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
        </Field>
        <span />
        <Field label="Instagram link">
          <input type="url" className={inputCls} value={cfg.instagram} placeholder="https://instagram.com/…" onChange={(e) => set("instagram", e.target.value)} />
        </Field>
        <Field label="YouTube link">
          <input type="url" className={inputCls} value={cfg.youtube} placeholder="https://youtube.com/…" onChange={(e) => set("youtube", e.target.value)} />
        </Field>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className={btnCls}>{busy ? "Saving…" : "Save"}</button>
        {node}
      </div>
    </form>
  );
}
