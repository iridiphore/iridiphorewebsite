import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useSiteData } from "@/lib/SiteData";

export default function NotFound() {
  const { t } = useSiteData();
  return (
    <Layout>
      <SEO title={`${t("notfound.title")} | ${t("seo.site_name")}`} description={t("notfound.text")} path="/404" noindex />
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-40 sm:px-8">
        <h1 className="font-display text-6xl italic">{t("notfound.title")}</h1>
        <p className="mt-4 text-fog">{t("notfound.text")}</p>
        <Link to="/" className="mt-8 inline-block text-teal hover:underline">{t("notfound.link")}</Link>
      </div>
    </Layout>
  );
}
