import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSiteData } from "@/lib/SiteData";
import { cloudinaryConfigured, imageUrl } from "@/lib/cloudinary";

function Wordmark({ logo, name }: { logo: string | null; name: string }) {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="Iridiphore home">
      {logo && cloudinaryConfigured && (
        <img src={imageUrl(logo, { w: 96, h: 96, fill: true })} alt="" className="h-8 w-8 rounded-sm object-cover" />
      )}
      <span className="font-display text-xl italic tracking-[0.14em] text-paper sm:text-2xl sm:tracking-[0.18em]">{name}</span>
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { config, preview, t, shown } = useSiteData();
  const { pathname, hash } = useLocation();

  const nav = [
    { show: shown("nav.sectors"), label: t("nav.sectors"), to: { pathname: "/", hash: "#sectors" } },
    { show: shown("nav.work"), label: t("nav.work"), to: { pathname: "/work" } },
    { show: shown("nav.blog"), label: t("nav.blog"), to: { pathname: "/blog" } },
    { show: shown("nav.contact"), label: t("nav.contact"), to: { pathname: "/", hash: "#contact" } },
  ].filter((n) => n.show);

  // Scroll to #sectors / #contact after navigating, and to the top on a plain page change.
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-ink font-sans text-paper">
      {preview && (
        <div className="bg-ember/15 px-4 py-1.5 text-center text-xs text-ember">
          Template preview. This is sample content; the site isn't connected to a database yet.
        </div>
      )}
      <div className="relative">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Wordmark logo={config.logo} name={t("brand.name")} />
          <nav aria-label="Main" className="flex items-center gap-5 text-sm sm:gap-8">
            {nav.map((n) => (
              <Link key={n.label} to={n.to} className="text-fog transition-colors hover:text-paper">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      </div>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-fog sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-display text-lg italic tracking-[0.18em] text-paper">{t("brand.name")}</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {config.contact_email && shown("footer.email") && (
              <a className="hover:text-paper" href={`mailto:${config.contact_email}`}>
                {config.contact_email}
              </a>
            )}
            {config.instagram && shown("footer.instagram") && (
              <a className="hover:text-paper" href={config.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            )}
            {config.youtube && shown("footer.youtube") && (
              <a className="hover:text-paper" href={config.youtube} target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
