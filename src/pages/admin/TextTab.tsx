import { useEffect, useMemo, useState } from "react";
import { TEXT_FIELD_LIST, type TextKey } from "@/lib/content";
import { loadContent, saveContent } from "@/lib/contentApi";
import { useSiteData } from "@/lib/SiteData";
import { btnCls, ghostBtnCls, inputCls, useStatus } from "./fields";

type Draft = Partial<Record<TextKey, string>>;

const GROUPS = [...new Set(TEXT_FIELD_LIST.map((f) => f.group))];

const same = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);

export default function TextTab() {
  const { refresh } = useSiteData();
  const [saved, setSaved] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const { setStatus, node } = useStatus();

  useEffect(() => {
    void loadContent().then(({ content, error }) => {
      if (error) setStatus({ kind: "err", text: error });
      setSaved(content.text);
      setDraft(content.text);
    });
  }, [setStatus]);

  const dirty = saved !== null && !same(saved, draft);

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      TEXT_FIELD_LIST.filter(
        (f) => !q || `${f.label} ${f.default} ${f.group}`.toLowerCase().includes(q),
      ),
    [q],
  );

  if (!saved) return <div>{node}<p className="text-fog">Loading…</p></div>;

  const set = (key: TextKey, value: string) => {
    const next = { ...draft };
    if (value === "") delete next[key];
    else next[key] = value;
    setDraft(next);
  };

  async function save() {
    setBusy(true);
    // Only fields that actually differ from the standard wording are stored.
    const text: Draft = {};
    for (const f of TEXT_FIELD_LIST) {
      const key = f.key as TextKey;
      const v = draft[key];
      if (v !== undefined && v.trim() !== "" && v !== f.default) text[key] = v;
    }
    const error = await saveContent((c) => ({ ...c, text }));
    setBusy(false);
    if (error) return setStatus({ kind: "err", text: error });
    setSaved(text);
    setDraft(text);
    await refresh();
    setStatus({ kind: "ok", text: "Saved. The site is updated." });
  }

  const changedCount = Object.keys(draft).length;

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="font-display text-3xl italic">Text</h2>
        <p className="mt-1 max-w-2xl text-sm text-fog">
          Every heading, button and message on the site. Leave a box empty to use the standard wording, shown in grey
          inside the box. The headline and the line under it are on the <b>Home page</b> tab, and
          the cards on <b>Sectors</b>.
        </p>
      </div>

      <input
        className={`${inputCls} max-w-md`}
        type="search"
        placeholder="Find a piece of text…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Find a piece of text"
      />

      {GROUPS.map((group) => {
        const fields = visible.filter((f) => f.group === group);
        if (fields.length === 0) return null;
        return (
          <details key={group} open={q !== "" || group === GROUPS[0]} className="rounded-sm border border-line bg-panel">
            <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium">
              {group}
              <span className="ml-2 text-xs text-fog">
                {fields.filter((f) => draft[f.key as TextKey] !== undefined).length > 0
                  ? `${fields.filter((f) => draft[f.key as TextKey] !== undefined).length} changed`
                  : ""}
              </span>
            </summary>
            <div className="space-y-5 border-t border-line p-5">
              {fields.map((f) => {
                const value = draft[f.key as TextKey] ?? "";
                const Input = f.multiline ? "textarea" : "input";
                return (
                  <div key={f.key}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <label htmlFor={`t-${f.key}`} className="text-xs font-medium uppercase tracking-wider text-fog">
                        {f.label}
                      </label>
                      {value !== "" && (
                        <button type="button" className="text-xs text-teal hover:underline" onClick={() => set(f.key as TextKey, "")}>
                          Reset to standard
                        </button>
                      )}
                    </div>
                    <Input
                      id={`t-${f.key}`}
                      className={inputCls}
                      value={value}
                      placeholder={f.default}
                      maxLength={f.max}
                      {...(f.multiline ? { rows: 3 } : {})}
                      onChange={(e) => set(f.key as TextKey, e.target.value)}
                    />
                    {f.hint && <p className="mt-1 text-xs text-fog/80">{f.hint}</p>}
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
      {visible.length === 0 && <p className="text-fog">Nothing matches "{query}".</p>}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-3">
          <button className={btnCls} disabled={!dirty || busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            className={ghostBtnCls}
            disabled={changedCount === 0}
            onClick={() => confirm("Put every piece of text back to the standard wording? You still need to press Save.") && setDraft({})}
          >
            Reset all to standard
          </button>
          <span className="text-sm text-fog">{dirty ? "Unsaved changes" : changedCount > 0 ? `${changedCount} customised` : ""}</span>
          {node}
        </div>
      </div>
    </div>
  );
}
