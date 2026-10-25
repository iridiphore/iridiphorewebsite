import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import PostCard from "@/components/PostCard";
import { useSiteData } from "@/lib/SiteData";

export default function Blog() {
  const { posts, categories, loading, t, shown } = useSiteData();
  const [filter, setFilter] = useState<string>("all");

  // Only offer a filter for categories that have at least one published post.
  const used = useMemo(() => categories.filter((c) => posts.some((p) => p.category === c.slug)), [categories, posts]);
  const visible = filter === "all" ? posts : posts.filter((p) => p.category === filter);

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition-colors ${
      active ? "border-paper bg-paper text-ink" : "border-line text-fog hover:border-fog hover:text-paper"
    }`;

  return (
    <Layout>
      <SEO title={t("seo.blog_title")} description={t("seo.blog_description")} path="/blog" />
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
        <h1 className="font-display text-6xl italic sm:text-7xl">{t("blog.title")}</h1>
        <p className="mt-4 max-w-xl text-fog">{t("blog.subtitle")}</p>

        {shown("blog.filters") && used.length > 1 && (
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <button type="button" className={pill(filter === "all")} onClick={() => setFilter("all")}>
              {t("blog.filter_all")}
            </button>
            {used.map((c) => (
              <button key={c.id} type="button" className={pill(filter === c.slug)} onClick={() => setFilter(c.slug)}>
                {c.title}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="mt-12 text-fog">{t("blog.loading")}</p>
        ) : visible.length === 0 ? (
          <p className="mt-12 text-fog">{t("blog.empty")}</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
