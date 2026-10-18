import { useEffect, useState, type ReactNode } from "react";
import { cloudinaryConfigured, imageUrl, parseCloudinaryInput } from "@/lib/cloudinary";

export const inputCls =
  "w-full rounded-sm border border-line bg-ink px-3 py-2 text-sm text-paper placeholder:text-fog/60 focus:border-teal focus:outline-none";
export const btnCls =
  "rounded-sm bg-paper px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-teal disabled:opacity-50";
export const ghostBtnCls =
  "rounded-sm border border-line px-3 py-1.5 text-sm text-fog transition-colors hover:border-fog hover:text-paper disabled:opacity-40";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-fog">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-fog/80">{hint}</span>}
    </label>
  );
}

/**
 * A text box for one Cloudinary asset. Paste any Cloudinary link (or a public id): it is
 * checked, reduced to the public id and stored. Links from other accounts are refused.
 */
export function CloudinaryField({
  label,
  value,
  onChange,
  resource = "image",
  hint,
}: {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  resource?: "image" | "video";
  hint?: string;
}) {
  const [text, setText] = useState(value ?? "");
  const [error, setError] = useState("");

  useEffect(() => setText(value ?? ""), [value]);

  function commit(raw: string) {
    setText(raw);
    if (raw.trim() === "") {
      setError("");
      onChange(null);
      return;
    }
    const parsed = parseCloudinaryInput(raw);
    if (!parsed.ok) return setError(parsed.error);
    if (parsed.resource !== "unknown" && parsed.resource !== resource) {
      return setError(`That's a ${parsed.resource} link, but this box needs a ${resource}.`);
    }
    setError("");
    setText(parsed.id);
    onChange(parsed.id);
  }

  return (
    <div>
      <Field label={label} hint={hint}>
        <input
          className={inputCls}
          value={text}
          placeholder="Paste a Cloudinary link"
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            commit(e.clipboardData.getData("text"));
          }}
          onBlur={() => text !== (value ?? "") && commit(text)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), commit(text))}
        />
      </Field>
      {error && <p role="alert" className="mt-1 text-xs text-ember">{error}</p>}
      {!error && value && cloudinaryConfigured && resource === "image" && (
        <img src={imageUrl(value, { w: 240, h: 135, fill: true })} alt="" className="mt-2 h-[68px] rounded-sm" />
      )}
      {!error && value && resource === "video" && <p className="mt-1 text-xs text-teal">Saved: {value}</p>}
    </div>
  );
}

export function useStatus() {
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  useEffect(() => {
    if (status?.kind !== "ok") return;
    const t = setTimeout(() => setStatus(null), 3000);
    return () => clearTimeout(t);
  }, [status]);
  const node = status && (
    <span role={status.kind === "err" ? "alert" : "status"} className={`text-sm ${status.kind === "err" ? "text-ember" : "text-teal"}`}>
      {status.text}
    </span>
  );
  return { setStatus, node };
}
