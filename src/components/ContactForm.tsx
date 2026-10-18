import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { fillEmail } from "@/lib/content";
import { useSiteData } from "@/lib/SiteData";
import { backendConfigured, supabase } from "@/lib/supabase";

const field =
  "w-full rounded-sm border border-line bg-ink px-3 py-2.5 text-sm text-paper placeholder:text-fog/60 focus:border-teal focus:outline-none";
const label = "mb-1.5 block text-xs font-medium uppercase tracking-wider text-fog";

export default function ContactForm() {
  const { sectors, config, t } = useSiteData();
  const [params] = useSearchParams();
  const [audience, setAudience] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  // Sector cards link here as /?audience=<slug>#contact
  useEffect(() => {
    const a = params.get("audience");
    if (a) setAudience(a);
  }, [params]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    // Honeypot: real visitors never see or fill this field.
    if (String(form.get("website") ?? "") !== "") {
      setStatus("sent");
      return;
    }
    if (!supabase || !backendConfigured) {
      setError("Preview mode: nothing is sent until the database is connected.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError("");
    const { error: err } = await supabase.from("enquiries").insert({
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      location: String(form.get("location") ?? "").trim(),
      audience,
      message: String(form.get("message") ?? "").trim(),
    });
    if (err) {
      setError(fillEmail(t("form.error"), config.contact_email));
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-sm border border-teal/40 bg-panel p-8">
        <p className="font-display text-3xl italic">{t("form.success_title")}</p>
        <p className="mt-2 text-fog">{t("form.success_text")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-sm border border-line bg-panel p-6 sm:grid-cols-2 sm:p-8">
      <div>
        <label htmlFor="name" className={label}>{t("form.name")}</label>
        <input id="name" name="name" required maxLength={120} autoComplete="name" className={field} />
      </div>
      <div>
        <label htmlFor="email" className={label}>{t("form.email")}</label>
        <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className={field} />
      </div>
      <div>
        <label htmlFor="location" className={label}>{t("form.location")}</label>
        <input id="location" name="location" maxLength={160} className={field} />
      </div>
      <div>
        <label htmlFor="audience" className={label}>{t("form.audience")}</label>
        <select id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className={field}>
          <option value="">{t("form.audience_placeholder")}</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.audience}>{s.title}</option>
          ))}
          <option value="other">{t("form.audience_other")}</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className={label}>{t("form.message")}</label>
        <textarea id="message" name="message" required rows={5} maxLength={4000} className={field} />
      </div>
      {/* Honeypot */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-sm bg-paper px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-teal disabled:opacity-60"
        >
          {status === "sending" ? t("form.sending") : t("form.send")}
        </button>
        {status === "error" && <p role="alert" className="text-sm text-ember">{error}</p>}
      </div>
    </form>
  );
}
