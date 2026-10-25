import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSiteData } from "@/lib/SiteData";
import type { Enquiry, NotificationSettings } from "@/lib/types";
import { Field, btnCls, ghostBtnCls, inputCls, useStatus } from "./fields";

const TEST_RESULT: Record<string, { kind: "ok" | "err"; text: string }> = {
  sent: { kind: "ok", text: "Test email sent. Check the inbox (and spam) in a minute." },
  disabled: { kind: "err", text: "Forwarding is switched off." },
  no_address: { kind: "err", text: "Save an address first." },
  not_configured: { kind: "err", text: "The email sender isn't set up yet. See the setup guide (Forwarding enquiries)." },
};

/** Where new enquiries are emailed. The address is private: only signed-in admins can read it. */
function ForwardPanel() {
  const [saved, setSaved] = useState<NotificationSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const { setStatus, node } = useStatus();

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("notification_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return setStatus({ kind: "err", text: error.message });
        const s = (data as NotificationSettings | null) ?? { id: 1 as const, forward_enabled: false, forward_to: "" };
        setSaved(s);
        setEnabled(s.forward_enabled);
        setTo(s.forward_to);
      });
  }, [setStatus]);

  const dirty = saved !== null && (enabled !== saved.forward_enabled || to.trim() !== saved.forward_to);

  async function save() {
    if (!supabase) return;
    const address = to.trim();
    if (enabled && !address) return setStatus({ kind: "err", text: "Enter an email address to forward to." });
    setBusy(true);
    const { error } = await supabase
      .from("notification_settings")
      .upsert({ id: 1, forward_enabled: enabled, forward_to: address, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) {
      return setStatus({ kind: "err", text: error.code === "23514" ? "That doesn't look like a valid email address." : error.message });
    }
    setSaved({ id: 1, forward_enabled: enabled, forward_to: address });
    setTo(address);
    setStatus({ kind: "ok", text: enabled ? `Saved. New enquiries will be emailed to ${address}.` : "Saved. Forwarding is off." });
  }

  async function test() {
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("send_test_forward");
    setBusy(false);
    if (error) return setStatus({ kind: "err", text: error.message });
    setStatus(TEST_RESULT[String(data)] ?? { kind: "err", text: "Something went wrong sending the test." });
  }

  if (!saved) return null;
  return (
    <section aria-label="Email forwarding" className="space-y-4 rounded-sm border border-line bg-panel p-5">
      <div>
        <h3 className="font-medium">Forward new enquiries by email</h3>
        <p className="mt-1 text-sm text-fog">Every new enquiry is also emailed here. Replying to that email goes straight to the person who wrote in.</p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Forward enquiries to email
      </label>
      <Field label="Send to" hint="One address.">
        <input
          type="email"
          className={inputCls}
          value={to}
          maxLength={254}
          placeholder="you@example.com"
          onChange={(e) => setTo(e.target.value)}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button className={btnCls} disabled={busy || !dirty} onClick={() => void save()}>Save</button>
        <button className={ghostBtnCls} disabled={busy || dirty || !saved.forward_to} onClick={() => void test()}>
          Send test email
        </button>
      </div>
      {node}
    </section>
  );
}

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
      <ForwardPanel />
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
