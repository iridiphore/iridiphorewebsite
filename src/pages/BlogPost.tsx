import { Link, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import MediaItem from "@/components/MediaItem";
import Iridescence from "@/components/Iridescence";
import NotFound from "./NotFound";
import { useSiteData } from "@/lib/SiteData";
import { mediaImageUrl } from "@/lib/media";
import { formatDate } from "@/lib/format";

export default function BlogPost() {
  const { slug } = useParams();
  const { posts, categories, loading, t } = useSiteData();
  const post = posts.find((p) => p.slug === slug);

  if (loading) {
    return (
      <Layout>
        <p className="px-8 pt-40 text-fog">{t("blog.loading")}</p>
      </Layout>
    );
  }
  if (!post) return <NotFound />;

  const category = categories.find((c) => c.slug === post.category)?.title;
  const meta = [formatDate(post.post_date), category].filter(Boolean).join(" · ");
  const cover = post.cover ? mediaImageUrl(post.cover_source, post.cover, { w: 1600 }) : null;
  const ogImage = post.cover ? mediaImageUrl(post.cover_source, post.cover, { w: 1200, h: 630, fill: true }) ?? undefined : undefined;
  const paragraphs = post.description.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <Layout>
      <SEO
        title={`${post.title} | ${t("seo.site_name")}`}
        description={post.description.replace(/\s+/g, " ").trim().slice(0, 160) || `${post.title}: from the ${t("seo.site_name")} blog.`}
        path={`/blog/${post.slug}`}
        ogImage={ogImage}
      />
      <article>
        <div className="relative h-[46svh] min-h-[320px] w-full overflow-hidden">
          <Iridescence />
          {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-ink" />
        </div>
        <div className="mx-auto -mt-24 max-w-3xl px-5 pb-24 sm:px-8">
          <Link to="/blog" className="relative text-sm text-fog hover:text-paper">{t("blog.back")}</Link>
          <h1 className="relative mt-6 font-display text-5xl italic leading-tight sm:text-6xl">{post.title}</h1>
          {meta && <p className="relative mt-4 text-fog">{meta}</p>}
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-paper/85">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
          {post.blog_media.length > 0 && (
            <div className="mt-12 space-y-8">
              {post.blog_media.map((m, i) => (
                <MediaItem key={m.id} media={m} altFallback={`${post.title}, photo ${i + 1}`} />
              ))}
            </div>
          )}
        </div>
      </article>
    </Layout>
  );
}
