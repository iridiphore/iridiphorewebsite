import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/format";
import { useSiteData } from "@/lib/SiteData";
import type { Sector } from "@/lib/types";
import { btnCls, Field, ghostBtnCls, inputCls, useStatus } from "./fields";

function Row({ sector, onChange }: { sector: Sector; onChange: () => Promise<void> }) {
  const [s, setS] = useState(sector);
  const [busy, setBusy] = useState(false);
  const { setStatus, node } = useStatus();
  const dirty = JSON.stringify(s) !== JSON.stringify(sector);

  useEffect(() => setS(sector), [sector]);

  async function save() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase
      .from("sectors")
      .update({ title: s.title, description: s.description, audience: s.audience, published: s.published })
      .eq("id", s.id);
    setBusy(false);
    if (error) return setStatus({ kind: "err", text: error.message });
    setStatus({ kind: "ok", text: "Saved" });
    await onChange();
  }

  async function remove() {
    if (!supabase || !confirm(`Delete "${s.title}"?`)) return;
    const { error } = await supabase.from("sectors").delete().eq("id", s.id);
    if (error) return setStatus({ kind: "err", text: error.message });
    await onChange();
  }

  return (
    <div className="space-y-4 rounded-sm border border-line bg-panel p-5">
      <Field label="Title">
        <input className={inputCls} value={s.title} maxLength={80} onChange={(e) => setS({ ...s, title: e.target.value })} />
      </Field>
      <Field label="Description">
        <textarea className={inputCls} rows={2} value={s.description} maxLength={400} onChange={(e) => setS({ ...s, description: e.target.value })} />
      </Field>
      <Field label="Form value" hint="What the contact form records when someone clicks this card. Lowercase letters, numbers and dashes.">
        <input
          className={inputCls}
          value={s.audience}
          maxLength={40}
          onChange={(e) => setS({ ...s, audience: slugify(e.target.value) })}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.published} onChange={(e) => setS({ ...s, published: e.target.checked })} />
          Shown on the site
        </label>
        <button className={btnCls} disabled={!dirty || busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button>
        <button className={ghostBtnCls} onClick={() => void remove()}>Delete</button>
        {node}
      </div>
    </div>
  );
}

export default function SectorsTab() {
  const { refresh } = useSiteData();
  const [rows, setRows] = useState<Sector[] | null>(null);
  const { setStatus, node } = useStatus();

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("sectors").select("*").order("position");
    if (error) setStatus({ kind: "err", text: error.message });
    else setRows((data ?? []) as Sector[]);
  }, [setStatus]);

  useEffect(() => void load(), [load]);

  const changed = async () => {
    await load();
    await refresh();
  };

  async function move(i: number, dir: -1 | 1) {
    if (!supabase || !rows) return;
    const a = rows[i];
    const b = rows[i + dir];
    if (!b) return;
    const [r1, r2] = await Promise.all([
      supabase.from("sectors").update({ position: b.position }).eq("id", a.id),
      supabase.from("sectors").update({ position: a.position }).eq("id", b.id),
    ]);
    const err = r1.error ?? r2.error;
    if (err) return setStatus({ kind: "err", text: err.message });
    await changed();
  }

  async function add() {
    if (!supabase || !rows) return;
    const position = rows.reduce((m, r) => Math.max(m, r.position), 0) + 1;
    const { error } = await supabase
      .from("sectors")
      .insert({ position, title: "New sector", description: "", audience: `sector-${position}-${Date.now().toString(36)}`, published: false });
    if (error) return setStatus({ kind: "err", text: error.message });
    await changed();
  }

  if (!rows) return <p className="text-fog">Loading…</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="font-display text-3xl italic">Sectors</h2>
        <p className="mt-1 text-sm text-fog">The cards under "Who we work with". Each one links to the contact form.</p>
      </div>
      {rows.map((r, i) => (
        <div key={r.id} className="flex gap-3">
          <div className="flex flex-col gap-1 pt-2">
            <button className={ghostBtnCls} aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)}>↑</button>
            <button className={ghostBtnCls} aria-label="Move down" disabled={i === rows.length - 1} onClick={() => void move(i, 1)}>↓</button>
          </div>
          <div className="flex-1">
            <Row sector={r} onChange={changed} />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4">
        <button className={btnCls} onClick={() => void add()}>Add a sector</button>
        {node}
      </div>
    </div>
  );
}
