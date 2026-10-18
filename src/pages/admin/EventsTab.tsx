import { useCallback, useEffect, useState } from "react";
import { cloudinaryConfigured, imageUrl, parseCloudinaryInput, parseEmbedInput } from "@/lib/cloudinary";
import { formatDate, slugify, typeLabel } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { useSiteData } from "@/lib/SiteData";
import { EVENT_TYPE_LABELS, type EventMedia, type EventType, type SiteEvent } from "@/lib/types";
import { btnCls, CloudinaryField, Field, ghostBtnCls, inputCls, useStatus } from "./fields";

const blank = (): SiteEvent => ({
  id: "",
  slug: "",
  title: "",
  event_type: "gig",
  event_date: null,
  location: "",
  description: "",
  cover: null,
  published: false,
  event_media: [],
});

function MediaList({ event, onChange }: { event: SiteEvent; onChange: () => Promise<void> }) {
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState<"auto" | "image" | "video">("auto");
  const { setStatus, node } = useStatus();
  const media = [...event.event_media].sort((a, b) => a.position - b.position);

  async function add() {
    if (!supabase) return;
    const position = media.reduce((m, x) => Math.max(m, x.position), 0) + 1;
    let row: Omit<EventMedia, "id" | "event_id">;

    const embed = parseEmbedInput(link);
    if (embed) {
      row = { position, kind: "embed", ref: embed.id, provider: embed.provider, caption };
    } else {
      const p = parseCloudinaryInput(link);
      if (!p.ok) return setStatus({ kind: "err", text: `${p.error} For YouTube or Vimeo, paste the video link.` });
      const resolved = p.resource !== "unknown" ? p.resource : kind === "auto" ? null : kind;
      if (!resolved) return setStatus({ kind: "err", text: "Is that an image or a video? Choose one from the list." });
      row = { position, kind: resolved, ref: p.id, provider: null, caption };
    }
    const { error } = await supabase.from("event_media").insert({ event_id: event.id, ...row });
    if (error) return setStatus({ kind: "err", text: error.message });
    setLink("");
    setCaption("");
    await onChange();
  }

  async function remove(m: EventMedia) {
    if (!supabase || !confirm("Remove this item?")) return;
    const { error } = await supabase.from("event_media").delete().eq("id", m.id);
    if (error) return setStatus({ kind: "err", text: error.message });
    await onChange();
  }

  async function move(i: number, dir: -1 | 1) {
    if (!supabase) return;
    const a = media[i];
    const b = media[i + dir];
    if (!b) return;
    const [r1, r2] = await Promise.all([
      supabase.from("event_media").update({ position: b.position }).eq("id", a.id),
      supabase.from("event_media").update({ position: a.position }).eq("id", b.id),
    ]);
    const err = r1.error ?? r2.error;
    if (err) return setStatus({ kind: "err", text: err.message });
    await onChange();
  }

  async function saveCaption(m: EventMedia, text: string) {
    if (!supabase || text === m.caption) return;
    const { error } = await supabase.from("event_media").update({ caption: text }).eq("id", m.id);
    if (error) setStatus({ kind: "err", text: error.message });
    else await onChange();
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl italic">Photos, clips and videos</h3>
      {media.length === 0 && <p className="text-sm text-fog">Nothing added yet.</p>}
      <ul className="space-y-3">
        {media.map((m, i) => (
          <li key={m.id} className="flex gap-3 rounded-sm border border-line bg-ink p-3">
            <div className="flex flex-col gap-1">
              <button className={ghostBtnCls} aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)}>↑</button>
              <button className={ghostBtnCls} aria-label="Move down" disabled={i === media.length - 1} onClick={() => void move(i, 1)}>↓</button>
            </div>
            <div className="flex h-[72px] w-32 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-panel text-xs text-fog">
              {m.kind === "image" && cloudinaryConfigured ? (
                <img src={imageUrl(m.ref, { w: 256, h: 144, fill: true })} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{m.kind === "embed" ? m.provider : m.kind}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-fog">{m.kind} · {m.ref}</p>
              <input
                className={`${inputCls} mt-1`}
                defaultValue={m.caption}
                placeholder="Caption (optional)"
                maxLength={300}
                onBlur={(e) => void saveCaption(m, e.target.value)}
              />
            </div>
            <button className={`${ghostBtnCls} self-start`} onClick={() => void remove(m)}>Remove</button>
          </li>
        ))}
      </ul>

      <div className="space-y-3 rounded-sm border border-dashed border-line p-4">
        <p className="text-sm font-medium">Add one</p>
        <Field
          label="Link"
          hint="A Cloudinary image or video link, or a YouTube or Vimeo link. Put long videos and livestream recordings on YouTube."
        >
          <input className={inputCls} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Caption (optional)">
            <input className={inputCls} value={caption} maxLength={300} onChange={(e) => setCaption(e.target.value)} />
          </Field>
          <Field label="If it's a bare Cloudinary id">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="auto">Detect from link</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center gap-4">
          <button className={btnCls} disabled={!link.trim()} onClick={() => void add()}>Add</button>
          {node}
        </div>
      </div>
    </div>
  );
}

function Editor({ initial, onSaved, onDeleted }: { initial: SiteEvent; onSaved: (id: string) => Promise<void>; onDeleted: () => Promise<void> }) {
  const [e, setE] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [busy, setBusy] = useState(false);
  const { setStatus, node } = useStatus();
  const isNew = !initial.id;

  useEffect(() => {
    setE(initial);
    setSlugTouched(!!initial.id);
  }, [initial]);

  const set = <K extends keyof SiteEvent>(k: K, v: SiteEvent[K]) => setE((cur) => ({ ...cur, [k]: v }));

  async function save() {
    if (!supabase) return;
    if (!e.title.trim()) return setStatus({ kind: "err", text: "Give it a title." });
    if (!e.slug) return setStatus({ kind: "err", text: "The web address part is empty." });
    setBusy(true);
    const row = {
      slug: e.slug,
      title: e.title.trim(),
      event_type: e.event_type,
      event_date: e.event_date || null,
      location: e.location,
      description: e.description,
      cover: e.cover,
      published: e.published,
    };
    const res = isNew
      ? await supabase.from("events").insert(row).select("id").single()
      : await supabase.from("events").update(row).eq("id", e.id).select("id").single();
    setBusy(false);
    if (res.error) {
      const dup = res.error.code === "23505";
      return setStatus({ kind: "err", text: dup ? "Another event already uses that web address. Change it." : res.error.message });
    }
    setStatus({ kind: "ok", text: e.published ? "Saved. It's live on the site." : "Saved as a draft." });
    await onSaved((res.data as { id: string }).id);
  }

  async function remove() {
    if (!supabase || isNew || !confirm(`Delete "${e.title}" and all its media? This can't be undone.`)) return;
    const { error } = await supabase.from("events").delete().eq("id", e.id);
    if (error) return setStatus({ kind: "err", text: error.message });
    await onDeleted();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Field label="Title">
          <input
            className={inputCls}
            value={e.title}
            maxLength={160}
            onChange={(ev) => {
              set("title", ev.target.value);
              if (!slugTouched) set("slug", slugify(ev.target.value));
            }}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Type">
            <select className={inputCls} value={e.event_type} onChange={(ev) => set("event_type", ev.target.value as EventType)}>
              {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={e.event_date ?? ""} onChange={(ev) => set("event_date", ev.target.value || null)} />
          </Field>
          <Field label="Location">
            <input className={inputCls} value={e.location} maxLength={160} onChange={(ev) => set("location", ev.target.value)} />
          </Field>
        </div>
        <Field label="Description">
          <textarea className={inputCls} rows={5} value={e.description} maxLength={4000} onChange={(ev) => set("description", ev.target.value)} />
        </Field>
        <CloudinaryField label="Cover image" value={e.cover} onChange={(v) => set("cover", v)} hint="Shown on the Work page and the home page." />
        <Field label="Web address" hint={`/work/${e.slug || "…"}`}>
          <input
            className={inputCls}
            value={e.slug}
            maxLength={80}
            onChange={(ev) => {
              setSlugTouched(true);
              set("slug", slugify(ev.target.value));
            }}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={e.published} onChange={(ev) => set("published", ev.target.checked)} />
          Published (visible on the site). Leave unticked to keep it as a draft.
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <button className={btnCls} disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : isNew ? "Create" : "Save"}</button>
          {!isNew && <button className={ghostBtnCls} onClick={() => void remove()}>Delete event</button>}
          {node}
        </div>
      </div>

      {isNew ? (
        <p className="rounded-sm border border-dashed border-line p-4 text-sm text-fog">
          Save the event first, then you can add photos, clips and videos to it.
        </p>
      ) : (
        <MediaList event={e} onChange={async () => { await onSaved(e.id); }} />
      )}
    </div>
  );
}

export default function EventsTab() {
  const { refresh } = useSiteData();
  const [events, setEvents] = useState<SiteEvent[] | null>(null);
  const [selected, setSelected] = useState<string | "new" | null>(null);
  const { setStatus, node } = useStatus();

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("events").select("*, event_media(*)").order("event_date", { ascending: false, nullsFirst: true });
    if (error) return setStatus({ kind: "err", text: error.message });
    setEvents((data ?? []) as SiteEvent[]);
  }, [setStatus]);

  useEffect(() => void load(), [load]);

  const afterSave = async (id: string) => {
    await load();
    await refresh();
    setSelected(id);
  };

  if (!events) return <div>{node}<p className="text-fog">Loading…</p></div>;
  const current = selected === "new" ? blank() : events.find((e) => e.id === selected);

  return (
    <div className="grid gap-8 md:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        <button className={`${btnCls} w-full`} onClick={() => setSelected("new")}>New event</button>
        {node}
        <ul className="space-y-1">
          {events.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => setSelected(e.id)}
                className={`w-full rounded-sm border px-3 py-2 text-left text-sm transition-colors ${
                  selected === e.id ? "border-teal bg-panel" : "border-line hover:border-fog"
                }`}
              >
                <span className="block truncate font-medium">{e.title}</span>
                <span className="block text-xs text-fog">
                  {typeLabel(e.event_type)}
                  {e.event_date ? ` · ${formatDate(e.event_date)}` : ""}
                  {e.published ? "" : " · Draft"}
                </span>
              </button>
            </li>
          ))}
          {events.length === 0 && <li className="text-sm text-fog">No events yet.</li>}
        </ul>
      </aside>
      <section>
        {current ? (
          <Editor
            key={current.id || "new"}
            initial={current}
            onSaved={afterSave}
            onDeleted={async () => {
              setSelected(null);
              await load();
              await refresh();
            }}
          />
        ) : (
          <div>
            <h2 className="font-display text-3xl italic">Work</h2>
            <p className="mt-2 max-w-md text-fog">
              Each event is one gig, EMOM night or livestream. Pick one on the left to edit it, or add a new one.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
