import { useRef, useState } from "react";
import { parseCloudinaryInput, parseEmbedInput } from "@/lib/cloudinary";
import { mediaImageUrl } from "@/lib/media";
import { uploadPhoto } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import type { MediaKind, MediaSource } from "@/lib/types";
import { btnCls, Field, ghostBtnCls, inputCls, useStatus } from "./fields";

export interface MediaRow {
  id: string;
  position: number;
  kind: MediaKind;
  ref: string;
  provider: "youtube" | "vimeo" | null;
  caption: string;
  source?: MediaSource | null;
  credit?: string;
}

interface Props {
  /** Work events use event_media; blog posts use blog_media (which also takes uploads and credits). */
  table: "event_media" | "blog_media";
  parentColumn: "event_id" | "post_id";
  parentId: string;
  items: MediaRow[];
  /** Called after any change so the parent can reload. */
  onChange: () => Promise<void>;
}

/**
 * The "photos, clips and videos" list under an event or a blog post: add (Cloudinary link,
 * YouTube/Vimeo link, or, for blog posts, upload a photo), reorder, caption, remove.
 */
export default function MediaEditor({ table, parentColumn, parentId, items, onChange }: Props) {
  const blog = table === "blog_media";
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState<"auto" | "image" | "video">("auto");
  const [uploading, setUploading] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { setStatus, node } = useStatus();
  const media = [...items].sort((a, b) => a.position - b.position);
  const nextPosition = () => media.reduce((m, x) => Math.max(m, x.position), 0) + 1;

  async function insert(row: Record<string, unknown>): Promise<string | null> {
    if (!supabase) return "Not connected to a database.";
    const { error } = await supabase.from(table).insert({ [parentColumn]: parentId, ...row });
    return error ? error.message : null;
  }

  async function addLink() {
    const position = nextPosition();
    let row: Record<string, unknown>;

    const embed = parseEmbedInput(link);
    if (embed) {
      row = { position, kind: "embed", ref: embed.id, provider: embed.provider, caption, ...(blog ? { source: null } : {}) };
    } else {
      const p = parseCloudinaryInput(link);
      if (!p.ok) return setStatus({ kind: "err", text: `${p.error} For YouTube or Vimeo, paste the video link.` });
      const resolved = p.resource !== "unknown" ? p.resource : kind === "auto" ? null : kind;
      if (!resolved) return setStatus({ kind: "err", text: "Is that an image or a video? Choose one from the list." });
      row = { position, kind: resolved, ref: p.id, provider: null, caption, ...(blog ? { source: "cloudinary" } : {}) };
    }
    const error = await insert(row);
    if (error) return setStatus({ kind: "err", text: error });
    setLink("");
    setCaption("");
    await onChange();
  }

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    let position = nextPosition();
    let done = 0;
    for (const [i, file] of list.entries()) {
      setUploading(`Uploading ${i + 1} of ${list.length}…`);
      const up = await uploadPhoto(file);
      if (!up.ok) {
        setStatus({ kind: "err", text: `${file.name}: ${up.error}` });
        break;
      }
      const error = await insert({ position: position++, kind: "image", source: "upload", ref: up.path, provider: null, caption: list.length === 1 ? caption : "" });
      if (error) {
        setStatus({ kind: "err", text: error });
        break;
      }
      done++;
    }
    setUploading("");
    if (fileRef.current) fileRef.current.value = "";
    if (done > 0) {
      setCaption("");
      setStatus({ kind: "ok", text: done === 1 ? "Photo added." : `${done} photos added.` });
      await onChange();
    }
  }

  async function remove(m: MediaRow) {
    if (!supabase) return;
    const note = m.source === "upload" ? " (An uploaded photo's file stays in storage.)" : "";
    if (!confirm(`Remove this item?${note}`)) return;
    const { error } = await supabase.from(table).delete().eq("id", m.id);
    if (error) return setStatus({ kind: "err", text: error.message });
    await onChange();
  }

  async function move(i: number, dir: -1 | 1) {
    if (!supabase) return;
    const a = media[i];
    const b = media[i + dir];
    if (!b) return;
    const [r1, r2] = await Promise.all([
      supabase.from(table).update({ position: b.position }).eq("id", a.id),
      supabase.from(table).update({ position: a.position }).eq("id", b.id),
    ]);
    const err = r1.error ?? r2.error;
    if (err) return setStatus({ kind: "err", text: err.message });
    await onChange();
  }

  async function saveField(m: MediaRow, field: "caption" | "credit", text: string) {
    if (!supabase || text === (m[field] ?? "")) return;
    const { error } = await supabase.from(table).update({ [field]: text }).eq("id", m.id);
    if (error) setStatus({ kind: "err", text: error.message });
    else await onChange();
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl italic">Photos, clips and videos</h3>
      {media.length === 0 && <p className="text-sm text-fog">Nothing added yet.</p>}
      <ul className="space-y-3">
        {media.map((m, i) => {
          const thumb = m.kind === "image" ? mediaImageUrl(m.source, m.ref, { w: 256, h: 144, fill: true }) : null;
          return (
            <li key={m.id} className="flex gap-3 rounded-sm border border-line bg-ink p-3">
              <div className="flex flex-col gap-1">
                <button className={ghostBtnCls} aria-label="Move up" disabled={i === 0} onClick={() => void move(i, -1)}>↑</button>
                <button className={ghostBtnCls} aria-label="Move down" disabled={i === media.length - 1} onClick={() => void move(i, 1)}>↓</button>
              </div>
              <div className="flex h-[72px] w-32 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-panel text-xs text-fog">
                {thumb ? (
                  <img src={thumb} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{m.kind === "embed" ? m.provider : m.kind}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-xs text-fog">
                  {m.kind}
                  {m.source === "upload" ? " (uploaded)" : ""} · {m.ref}
                </p>
                <input
                  className={inputCls}
                  defaultValue={m.caption}
                  placeholder="Caption (optional)"
                  maxLength={300}
                  onBlur={(e) => void saveField(m, "caption", e.target.value)}
                />
                {blog && m.kind !== "embed" && (
                  <input
                    className={inputCls}
                    defaultValue={m.credit ?? ""}
                    placeholder="Photo credit (optional)"
                    maxLength={120}
                    onBlur={(e) => void saveField(m, "credit", e.target.value)}
                  />
                )}
              </div>
              <button className={`${ghostBtnCls} self-start`} onClick={() => void remove(m)}>Remove</button>
            </li>
          );
        })}
      </ul>

      <div className="space-y-3 rounded-sm border border-dashed border-line p-4">
        <p className="text-sm font-medium">Add one</p>
        {blog && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className={btnCls} disabled={!!uploading} onClick={() => fileRef.current?.click()}>
                {uploading || "Upload photos"}
              </button>
              <span className="text-xs text-fog">JPG, PNG, WebP or GIF, up to 10 MB each. You can pick several.</span>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              aria-label="Upload photos"
              className="hidden"
              onChange={(e) => void addFiles(e.target.files)}
            />
            <p className="text-xs text-fog">or add by link:</p>
          </div>
        )}
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
          <button className={btnCls} disabled={!link.trim()} onClick={() => void addLink()}>Add</button>
          {node}
        </div>
      </div>
    </div>
  );
}
