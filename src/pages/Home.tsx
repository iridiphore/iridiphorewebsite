import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import HeroVideo from "@/components/HeroVideo";
import EventCard from "@/components/EventCard";
import ContactForm from "@/components/ContactForm";
import EmailText from "@/components/EmailText";
import { useSiteData } from "@/lib/SiteData";

export default function Home() {
  const { config, sectors, events, t, shown, theme } = useSiteData();
  const recent = events.slice(0, 3);

  return (
    <Layout>
      <SEO
        title={t("seo.home_title")}
        description={t("seo.home_description")}
        path="/"
      />

      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <HeroVideo video={config.hero_video} poster={config.hero_poster} dim={theme.dim} />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 pt-40 sm:px-8 sm:pb-28">
          <h1 className="max-w-4xl font-display text-6xl italic leading-[0.95] sm:text-8xl">{config.headline}</h1>
          {config.tagline && <p className="mt-6 max-w-xl text-lg text-paper/80">{config.tagline}</p>}
          {shown("home.hero_buttons") && (
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/work"
              className="rounded-sm bg-paper px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-teal"
            >
              {t("home.cta_work")}
            </Link>
            <Link
              to={{ pathname: "/", hash: "#contact" }}
              className="rounded-sm border border-paper/40 px-6 py-3 text-sm font-semibold transition-colors hover:border-paper"
            >
              {t("home.cta_contact")}
            </Link>
          </div>
          )}
        </div>
      </section>

      {shown("home.about") && (
        <section aria-label="About" className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-10 md:grid-cols-3 md:gap-12">
            {([1, 2, 3] as const).map((n) => (
              <div key={n}>
                <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-teal">{t(`home.about_${n}_title`)}</h2>
                <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-paper/85">{t(`home.about_${n}_text`)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {shown("home.sectors") && sectors.length > 0 && (
        <section id="sectors" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-20 sm:px-8">
          <h2 className="font-display text-4xl italic sm:text-5xl">{t("home.sectors_title")}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {sectors.map((s) => (
              <Link
                key={s.id}
                to={{ pathname: "/", search: `?audience=${s.audience}`, hash: "#contact" }}
                className="group flex flex-col rounded-sm border border-line bg-panel p-6 transition-colors hover:border-teal/50"
              >
                <h3 className="font-display text-2xl italic">{s.title}</h3>
                <p className="mt-3 flex-1 text-fog">{s.description}</p>
                <span className="mt-6 text-sm text-teal transition-transform group-hover:translate-x-1">{t("home.sector_link")}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {shown("home.recent") && recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-4xl italic sm:text-5xl">{t("home.recent_title")}</h2>
            <Link to="/work" className="text-sm text-teal hover:underline">{t("home.recent_all")}</Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {recent.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}

      <section id="contact" className="mx-auto max-w-3xl scroll-mt-8 px-5 py-20 sm:px-8">
        <h2 className="font-display text-4xl italic sm:text-5xl">{t("home.contact_title")}</h2>
        <p className="mb-8 mt-3 text-fog">
          <EmailText text={t("home.contact_intro")} email={config.contact_email} className="text-teal hover:underline" />
        </p>
        <ContactForm />
      </section>
    </Layout>
  );
}
