import { useEffect, useRef, useState } from "react";
import { parseCloudinaryInput } from "@/lib/cloudinary";
import { mediaImageUrl } from "@/lib/media";
import { uploadPhoto } from "@/lib/storage";
import type { MediaSource } from "@/lib/types";
import { Field, ghostBtnCls, inputCls, btnCls } from "./fields";

interface Props {
  label: string;
  source: MediaSource | null;
  value: string | null;
  onChange: (source: MediaSource | null, value: string | null) => void;
  hint?: string;
}

/**
 * Cover image: upload a photo, or paste a Cloudinary link. Like My Liberal Pony's photo field,
 * but a pasted link is checked and reduced to the Cloudinary public id (other accounts and
 * hosts are refused), and an upload is stored in this project's own Supabase Storage.
 */
export default function CoverField({ label, source, value, onChange, hint }: Props) {
  const [text, setText] = useState(source === "cloudinary" ? (value ?? "") : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setText(source === "cloudinary" ? (value ?? "") : ""), [source, value]);

  function commit(raw: string) {
    setText(raw);
    if (raw.trim() === "") {
      setError("");
      if (source === "cloudinary") onChange(null, null);
      return;
    }
    const parsed = parseCloudinaryInput(raw);
    if (!parsed.ok) return setError(parsed.error);
    if (parsed.resource === "video") return setError("That's a video link, but the cover needs an image.");
    setError("");
    setText(parsed.id);
    onChange("cloudinary", parsed.id);
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    const result = await uploadPhoto(file);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!result.ok) return setError(result.error);
    setText("");
    onChange("upload", result.path);
  }

  const preview = value ? mediaImageUrl(source, value, { w: 240, h: 135, fill: true }) : null;

  return (
    <div className="space-y-2">
      <Field label={label} hint={hint}>
        <input
          className={inputCls}
          value={text}
          placeholder={source === "upload" ? "Uploaded photo. Paste a Cloudinary link to replace it." : "Paste a Cloudinary link"}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            commit(e.clipboardData.getData("text"));
          }}
          onBlur={() => text !== (source === "cloudinary" ? (value ?? "") : "") && commit(text)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit(text))}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnCls} disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? "Uploading…" : "Upload photo"}
        </button>
        {value && (
          <button type="button" className={ghostBtnCls} onClick={() => (setError(""), onChange(null, null))}>
            Remove cover
          </button>
        )}
        <span className="text-xs text-fog">JPG, PNG, WebP or GIF, up to 10 MB.</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-label={`${label}: upload photo`}
          className="hidden"
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </div>
      {error && <p role="alert" className="text-xs text-ember">{error}</p>}
      {!error && preview && <img src={preview} alt="" className="h-[68px] rounded-sm" />}
      {!error && value && source === "upload" && <p className="text-xs text-teal">Uploaded: {value.replace(/^blog\//, "")}</p>}
    </div>
  );
}
