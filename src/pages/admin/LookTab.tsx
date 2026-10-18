import { useEffect, useState } from "react";
import {
  BACKGROUND_HEX,
  DIM_MAX,
  SHOW_FIELDS,
  THEME_DEFAULTS,
  contrastRatio,
  isHex,
  type ShowKey,
  type Theme,
} from "@/lib/content";
import { loadContent, saveContent } from "@/lib/contentApi";
import { useSiteData } from "@/lib/SiteData";
import { btnCls, Field, ghostBtnCls, inputCls, useStatus } from "./fields";

type Show = Partial<Record<ShowKey, boolean>>;
const GROUPS = [...new Set(SHOW_FIELDS.map((f) => f.group))];
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function ColourField({
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | undefined;
  fallback: string;
  onChange: (hex: string | undefined) => void;
}) {
  const current = value ?? fallback;
  const [text, setText] = useState(current);
  useEffect(() => setText(current), [current]);

  const ratio = contrastRatio(current, BACKGROUND_HEX);
  const low = ratio < 4.5;

  return (
    <div className="space-y-2">
      <Field label={label} hint={hint}>
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label={`${label} colour picker`}
            value={current}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-sm border border-line bg-ink p-1"
          />
          <input
            className={`${inputCls} max-w-[9rem] font-mono`}
            value={text}
            maxLength={7}
            onChange={(e) => {
              setText(e.target.value);
              if (isHex(e.target.value)) onChange(e.target.value.toLowerCase());
            }}
          />
          {value !== undefined && (
            <button type="button" className="text-xs text-teal hover:underline" onClick={() => onChange(undefined)}>
              Reset to standard
            </button>
          )}
        </div>
      </Field>
      {text !== "" && !isHex(text) && <p role="alert" className="text-xs text-ember">Use a colour like #2dd4bf (a # and six letters or numbers).</p>}
      <p className="flex items-center gap-2 text-xs">
        <span
          className="inline-block rounded-sm px-2 py-0.5 font-medium text-ink"
          style={{ background: current }}
        >
          Sample
        </span>
        <span style={{ color: current }}>Sample text</span>
        <span className={low ? "text-ember" : "text-fog"}>
          Contrast {ratio.toFixed(1)}:1 {low ? "(low: hard to read on the dark background. 4.5 or more is best)" : "(good)"}
        </span>
      </p>
    </div>
  );
}

export default function LookTab() {
  const { refresh } = useSiteData();
  const [saved, setSaved] = useState<{ show: Show; theme: Partial<Theme> } | null>(null);
  const [show, setShow] = useState<Show>({});
  const [theme, setTheme] = useState<Partial<Theme>>({});
  const [busy, setBusy] = useState(false);
  const { setStatus, node } = useStatus();

  useEffect(() => {
    void loadContent().then(({ content, error }) => {
      if (error) setStatus({ kind: "err", text: error });
      setSaved({ show: content.show, theme: content.theme });
      setShow(content.show);
      setTheme(content.theme);
    });
  }, [setStatus]);

  if (!saved) return <div>{node}<p className="text-fog">Loading…</p></div>;
  const dirty = !same(saved, { show, theme });
  const dim = theme.dim ?? THEME_DEFAULTS.dim;

  async function save() {
    setBusy(true);
    // Store only values that differ from the standard look.
    const nextShow: Show = {};
    for (const f of SHOW_FIELDS) if (show[f.key] === false) nextShow[f.key] = false;
    const nextTheme: Partial<Theme> = {};
    if (theme.accent && theme.accent !== THEME_DEFAULTS.accent) nextTheme.accent = theme.accent;
    if (theme.accent2 && theme.accent2 !== THEME_DEFAULTS.accent2) nextTheme.accent2 = theme.accent2;
    if (theme.dim !== undefined && theme.dim !== THEME_DEFAULTS.dim) nextTheme.dim = theme.dim;

    const error = await saveContent((c) => ({ ...c, show: nextShow, theme: nextTheme }));
    setBusy(false);
    if (error) return setStatus({ kind: "err", text: error });
    setSaved({ show: nextShow, theme: nextTheme });
    setShow(nextShow);
    setTheme(nextTheme);
    await refresh();
    setStatus({ kind: "ok", text: "Saved. The site is updated." });
  }

  return (
    <div className="max-w-2xl space-y-10 pb-24">
      <div>
        <h2 className="font-display text-3xl italic">Look and sections</h2>
        <p className="mt-1 text-sm text-fog">Switch parts of the site on or off, and set the colours.</p>
      </div>

      <section className="space-y-6">
        <h3 className="font-display text-2xl italic">Colours</h3>
        <ColourField
          label="Accent colour"
          hint="Links, highlights and hover colours."
          value={theme.accent}
          fallback={THEME_DEFAULTS.accent}
          onChange={(hex) => setTheme((t) => ({ ...t, accent: hex }))}
        />
        <ColourField
          label="Second colour"
          hint="Warnings, error messages and the preview banner."
          value={theme.accent2}
          fallback={THEME_DEFAULTS.accent2}
          onChange={(hex) => setTheme((t) => ({ ...t, accent2: hex }))}
        />
        <Field
          label={`Hero darkness: ${dim}%`}
          hint="How dark the top of the hero video is. Lower shows more of the video, but text is harder to read over bright footage."
        >
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={DIM_MAX}
              step={5}
              value={dim}
              onChange={(e) => setTheme((t) => ({ ...t, dim: Number(e.target.value) }))}
              className="w-full max-w-xs accent-teal"
            />
            {theme.dim !== undefined && (
              <button type="button" className="text-xs text-teal hover:underline" onClick={() => setTheme((t) => ({ ...t, dim: undefined }))}>
                Reset to standard
              </button>
            )}
          </div>
        </Field>
      </section>

      <section className="space-y-6">
        <h3 className="font-display text-2xl italic">Show or hide</h3>
        {GROUPS.map((group) => (
          <fieldset key={group} className="space-y-2">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-fog">{group}</legend>
            {SHOW_FIELDS.filter((f) => f.group === group).map((f) => (
              <label key={f.key} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={show[f.key] !== false}
                  onChange={(e) => setShow((s) => ({ ...s, [f.key]: e.target.checked }))}
                />
                {f.label}
              </label>
            ))}
          </fieldset>
        ))}
        <p className="text-xs text-fog/80">
          The intro paragraph hides itself when its box on the Home page tab is empty. Sectors and events hide
          themselves when there are none published.
        </p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-3">
          <button className={btnCls} disabled={!dirty || busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button
            className={ghostBtnCls}
            disabled={Object.keys(show).length === 0 && Object.keys(theme).length === 0}
            onClick={() => confirm("Put the colours and switches back to the standard look? You still need to press Save.") && (setShow({}), setTheme({}))}
          >
            Reset all to standard
          </button>
          {dirty && <span className="text-sm text-fog">Unsaved changes</span>}
          {node}
        </div>
      </div>
    </div>
  );
}
