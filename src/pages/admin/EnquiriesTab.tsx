import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSiteData } from "@/lib/SiteData";
import type { Enquiry } from "@/lib/types";
import { ghostBtnCls, useStatus } from "./fields";

export default function EnquiriesTab() {
  const { sectors } = useSiteData();
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  const { setStatus, node } = useStatus();

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
    if (error) setStatus({ kind: "err", text: error.message });
    else setRows((data ?? []) as Enquiry[]);
  }, [setStatus]);

  useEffect(() => void load(), [load]);

  const sectorName = (slug: string) => sectors.find((s) => s.audience === slug)?.title ?? (slug === "other" ? "Something else" : slug);

  async function toggle(r: Enquiry) {
    if (!supabase) return;
    const { error } = await supabase.from("enquiries").update({ handled: !r.handled }).eq("id", r.id);
    if (error) return setStatus({ kind: "err", text: error.message });
    await load();
  }

  async function remove(r: Enquiry) {
    if (!supabase || !confirm(`Delete the enquiry from ${r.name}?`)) return;
    const { error } = await supabase.from("enquiries").delete().eq("id", r.id);
    if (error) return setStatus({ kind: "err", text: error.message });
    await load();
  }

  if (!rows) return <div>{node}<p className="text-fog">Loading…</p></div>;
  const open = rows.filter((r) => !r.handled).length;

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="font-display text-3xl italic">Enquiries</h2>
        <p className="mt-1 text-sm text-fog">
          {rows.length === 0 ? "Nothing yet. Messages from the contact form land here." : `${open} to deal with, ${rows.length - open} done.`}
        </p>
        {node}
      </div>
      {rows.map((r) => (
        <article key={r.id} className={`rounded-sm border bg-panel p-5 ${r.handled ? "border-line opacity-60" : "border-teal/40"}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-medium">{r.name}</h3>
            <time className="text-xs text-fog" dateTime={r.created_at}>
              {new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            </time>
          </div>
          <p className="mt-1 text-sm text-fog">
            <a className="text-teal hover:underline" href={`mailto:${r.email}`}>{r.email}</a>
            {r.audience && ` · ${sectorName(r.audience)}`}
            {r.location && ` · ${r.location}`}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{r.message}</p>
          <div className="mt-4 flex gap-2">
            <a className={ghostBtnCls} href={`mailto:${r.email}?subject=${encodeURIComponent("Re: your Iridiphore enquiry")}`}>Reply</a>
            <button className={ghostBtnCls} onClick={() => void toggle(r)}>{r.handled ? "Mark as open" : "Mark as done"}</button>
            <button className={ghostBtnCls} onClick={() => void remove(r)}>Delete</button>
          </div>
        </article>
      ))}
    </div>
  );
}
