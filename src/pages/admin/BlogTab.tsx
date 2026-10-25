import { useCallback, useEffect, useState } from "react";
import { formatDate, slugify } from "@/lib/format";
import { DEFAULT_FEATURED_POSTS, MAX_FEATURED_POSTS, selectFeaturedPosts } from "@/lib/featuredPosts";
import { supabase } from "@/lib/supabase";
import { useSiteData } from "@/lib/SiteData";
import type { BlogCategory, BlogPost } from "@/lib/types";
import CoverField from "./CoverField";
import MediaEditor from "./MediaEditor";
import { btnCls, Field, ghostBtnCls, inputCls, useStatus } from "./fields";

const today = () => new Date().toISOString().slice(0, 10);

const blank = (): BlogPost => ({
  id: "",
  slug: "",
  title: "",
  category: null,
  post_date: today(),
  description: "",
  cover: null,
  cover_source: null,
  featured: false,
  published: false,
  blog_media: [],
});

// ---------------------------------------------------------------------------- categories
function CategoryRow({ category, onChanged }: { category: BlogCategory; onChanged: () => Promise<void> }) {
  const [c, setC] = useState(category);
  const [busy, setBusy] = useState(false);
  const { setStatus, node } = useStatus();
  const dirty = c.title !== category.title || c.slug !== category.slug;
  useEffect(() => setC(category), [category]);

  async function save() {
    if (!supabase) return;
    if (!c.title.trim() || !c.slug) return setStatus({ kind: "err", text: "A category needs a name and a web address." });
    setBusy(true);
    const { error } = await supabase.from("blog_categories").update({ title: c.title.trim(), slug: c.slug }).eq("id", c.id);
    setBusy(false);
    if (error) return setStatus({ kind: "err", text: error.code === "23505" ? "Another category already uses that web address." : error.message });
    setStatus({ kind: "ok", text: "Saved" });
    await onChanged();
  }

  async function remove() {
    if (!supabase || !confirm(`Delete the category "${category.title}"? Its posts are kept and become uncategorised.`)) return;
    const { error } = await supabase.from("blog_categories").delete().eq("id", c.id);
    if (error) return setStatus({ kind: "err", text: error.message });
    await onChanged();
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[10rem] flex-1">
        <Field label="Name">
          <input className={inputCls} value={c.title} maxLength={60} onChange={(e) => setC({ ...c, title: e.target.value })} aria-label={`Category name: ${category.title}`} />
        </Field>
      </div>
      <div className="min-w-[10rem] flex-1">
        <Field label="Web address">
          <input className={inputCls} value={c.slug} maxLength={40} onChange={(e) => setC({ ...c, slug: slugify(e.target.value) })} />
        </Field>
      </div>
      <button className={btnCls} disabled={!dirty || busy} onClick={() => void save()}>Save</button>
      <button className={ghostBtnCls} onClick={() => void remove()}>Delete</button>
      {node}
    </div>
  );
}

function CategoriesPanel({ categories, onChanged }: { categories: BlogCategory[]; onChanged: () => Promise<void> }) {
  const { setStatus, node } = useStatus();

  async function add() {
    if (!supabase) return;
    const position = categories.reduce((m, c) => Math.max(m, c.position), 0) + 1;
    const { error } = await supabase
      .from("blog_categories")
      .insert({ position, title: "New category", slug: `category-${Date.now().toString(36)}` });
    if (error) return setStatus({ kind: "err", text: error.message });
    await onChanged();
  }

  return (
    <div className="space-y-4 rounded-sm border border-line bg-panel p-5">
      <p className="text-sm text-fog">
        Categories group posts and become the filter buttons on the Blog page. Deleting one doesn't delete its posts.
      </p>
      {categories.map((c) => (
        <CategoryRow key={c.id} category={c} onChanged={onChanged} />
      ))}
      <div className="flex items-center gap-4">
        <button className={btnCls} onClick={() => void add()}>Add a category</button>
        {node}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------- post editor
function Editor({
  initial,
  categories,
  showingOnHome,
  onSaved,
  onDeleted,
}: {
  initial: BlogPost;
  categories: BlogCategory[];
  showingOnHome: boolean;
  onSaved: (id: string) => Promise<void>;
  onDeleted: () => Promise<void>;
}) {
  const [p, setP] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [busy, setBusy] = useState(false);
  const { setStatus, node } = useStatus();
  const isNew = !initial.id;

  useEffect(() => {
    setP(initial);
    setSlugTouched(!!initial.id);
  }, [initial]);

  const set = <K extends keyof BlogPost>(k: K, v: BlogPost[K]) => setP((cur) => ({ ...cur, [k]: v }));

  async function save() {
    if (!supabase) return;
    if (!p.title.trim()) return setStatus({ kind: "err", text: "Give it a title." });
    if (!p.slug) return setStatus({ kind: "err", text: "The web address part is empty." });
    setBusy(true);
    const row = {
      slug: p.slug,
      title: p.title.trim(),
      category: p.category || null,
      post_date: p.post_date || today(),
      description: p.description,
      cover: p.cover,
      cover_source: p.cover ? p.cover_source : null,
      featured: p.featured,
      published: p.published,
    };
    const res = isNew
      ? await supabase.from("blog_posts").insert(row).select("id").single()
      : await supabase.from("blog_posts").update(row).eq("id", p.id).select("id").single();
    setBusy(false);
    if (res.error) {
      const dup = res.error.code === "23505";
      return setStatus({ kind: "err", text: dup ? "Another post already uses that web address. Change it." : res.error.message });
    }
    setStatus({ kind: "ok", text: p.published ? "Saved. It's live on the site." : "Saved as a draft." });
    await onSaved((res.data as { id: string }).id);
  }

  async function remove() {
    if (!supabase || isNew) return;
    if (!confirm(`Delete "${p.title}" and its photos and videos? Photos you uploaded stay in storage. This can't be undone.`)) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", p.id);
    if (error) return setStatus({ kind: "err", text: error.message });
    await onDeleted();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Field label="Title">
          <input
            className={inputCls}
            value={p.title}
            maxLength={160}
            onChange={(e) => {
              set("title", e.target.value);
              if (!slugTouched) set("slug", slugify(e.target.value));
            }}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Web address" hint={`/blog/${p.slug || "…"}`}>
            <input
              className={inputCls}
              value={p.slug}
              maxLength={80}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={p.category ?? ""} onChange={(e) => set("category", e.target.value || null)}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={p.post_date} onChange={(e) => set("post_date", e.target.value)} />
          </Field>
        </div>

        <CoverField
          label="Cover image"
          source={p.cover_source}
          value={p.cover}
          onChange={(source, value) => setP((cur) => ({ ...cur, cover_source: source, cover: value }))}
          hint="The big photo at the top of the post and on its card."
        />

        <Field label="Description" hint="The text of the post. Leave a blank line between paragraphs.">
          <textarea className={inputCls} rows={14} value={p.description} maxLength={20000} onChange={(e) => set("description", e.target.value)} />
        </Field>

        <div className="space-y-2">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={p.featured} onChange={(e) => set("featured", e.target.checked)} />
            Featured on Home
            {showingOnHome && <span className="rounded-sm bg-teal/15 px-2 py-0.5 text-xs text-teal">Showing on Home</span>}
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={p.published} onChange={(e) => set("published", e.target.checked)} />
            Published (visible on the site). Leave unticked to keep it as a draft.
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button className={btnCls} disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : isNew ? "Create" : "Save"}</button>
          {!isNew && <button className={ghostBtnCls} onClick={() => void remove()}>Delete post</button>}
          {node}
        </div>
      </div>

      {isNew ? (
        <p className="rounded-sm border border-dashed border-line p-4 text-sm text-fog">
          Save the post first, then you can add photos, clips and videos to it.
        </p>
      ) : (
        <MediaEditor
          table="blog_media"
          parentColumn="post_id"
          parentId={p.id}
          items={p.blog_media}
          onChange={async () => {
            await onSaved(p.id);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------- the tab
export default function BlogTab() {
  const { refresh } = useSiteData();
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selected, setSelected] = useState<string | "new" | null>(null);
  // The editor is only rebuilt when you open a different item. Creating one keeps the same editor,
  // so its "Saved" message stays on screen instead of vanishing as the new id is assigned.
  const [editorKey, setEditorKey] = useState("none");
  const open = (id: string | "new") => {
    setEditorKey(id === "new" ? `new-${Date.now()}` : id);
    setSelected(id);
  };
  const [showCats, setShowCats] = useState(false);
  const { setStatus, node } = useStatus();

  const load = useCallback(async () => {
    if (!supabase) return;
    const [p, c] = await Promise.all([
      supabase.from("blog_posts").select("*, blog_media(*)").order("post_date", { ascending: false }),
      supabase.from("blog_categories").select("*").order("position"),
    ]);
    const err = p.error ?? c.error;
    if (err) {
      const missing = /relation .* does not exist|Could not find the table/i.test(err.message);
      return setStatus({
        kind: "err",
        text: missing ? "The blog tables are missing. Apply the newest migration in supabase/migrations (see docs/SETUP.md)." : err.message,
      });
    }
    setPosts((p.data ?? []) as BlogPost[]);
    setCategories((c.data ?? []) as BlogCategory[]);
  }, [setStatus]);

  useEffect(() => void load(), [load]);

  const afterSave = async (id: string) => {
    await load();
    await refresh();
    setSelected(id);
  };

  if (!posts) return <div>{node}<p className="text-fog">Loading…</p></div>;

  const current = selected === "new" ? blank() : posts.find((x) => x.id === selected);
  const onHome = new Set(selectFeaturedPosts(posts).map((x) => x.id));
  const flagged = posts.filter((x) => x.published && x.featured).length;
  const featuredNote =
    flagged === 0
      ? `No published post is featured, so Home shows your latest ${DEFAULT_FEATURED_POSTS}. Tick "Featured on Home" on any post and Home shows only the featured ones (up to ${MAX_FEATURED_POSTS}).`
      : flagged > MAX_FEATURED_POSTS
        ? `${flagged} posts are featured, but Home shows at most ${MAX_FEATURED_POSTS}: the newest ${MAX_FEATURED_POSTS}.`
        : `${flagged} featured post${flagged === 1 ? " is" : "s are"} showing on Home.`;

  return (
    <div className="grid gap-8 md:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <button className={`${btnCls} w-full`} onClick={() => open("new")}>New post</button>
        <button className={`${ghostBtnCls} w-full`} aria-expanded={showCats} onClick={() => setShowCats((v) => !v)}>
          {showCats ? "Hide categories" : "Manage categories"}
        </button>
        {node}
        <p className="text-xs leading-relaxed text-fog">{featuredNote}</p>
        <ul className="space-y-1">
          {posts.map((x) => (
            <li key={x.id}>
              <button
                onClick={() => (setShowCats(false), open(x.id))}
                className={`w-full rounded-sm border px-3 py-2 text-left text-sm transition-colors ${
                  selected === x.id ? "border-teal bg-panel" : "border-line hover:border-fog"
                }`}
              >
                <span className="block truncate font-medium">{x.title}</span>
                <span className="block text-xs text-fog">
                  {formatDate(x.post_date)}
                  {x.published ? "" : " · Draft"}
                  {x.featured ? " · Featured" : ""}
                  {onHome.has(x.id) ? " · On Home" : ""}
                </span>
              </button>
            </li>
          ))}
          {posts.length === 0 && <li className="text-sm text-fog">No posts yet.</li>}
        </ul>
      </aside>
      <section>
        {showCats ? (
          <div className="space-y-4">
            <h2 className="font-display text-3xl italic">Categories</h2>
            <CategoriesPanel
              categories={categories}
              onChanged={async () => {
                await load();
                await refresh();
              }}
            />
          </div>
        ) : current ? (
          <Editor
            key={editorKey}
            initial={current}
            categories={categories}
            showingOnHome={onHome.has(current.id)}
            onSaved={afterSave}
            onDeleted={async () => {
              setSelected(null);
              await load();
              await refresh();
            }}
          />
        ) : (
          <div>
            <h2 className="font-display text-3xl italic">Blog</h2>
            <p className="mt-2 max-w-md text-fog">
              Pick a post on the left to edit it, or write a new one. Tick "Featured on Home" on the key posts.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
