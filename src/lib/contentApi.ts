import { supabase } from "./supabase";
import { normalizeContent, type SiteContent } from "./content";

/** The stored content as it is in the database right now (not what the page loaded earlier). */
export async function loadContent(): Promise<{ content: SiteContent; error?: string }> {
  if (!supabase) return { content: normalizeContent(null), error: "Not connected to a database." };
  const { data, error } = await supabase.from("site_config").select("content").eq("id", 1).maybeSingle();
  if (error) return { content: normalizeContent(null), error: error.message };
  return { content: normalizeContent((data as { content?: unknown } | null)?.content) };
}

/**
 * Saves one slice of the content. It re-reads the latest value first and changes only what
 * `patch` touches, so saving on the Text tab never overwrites something just saved on the Look
 * tab (or by the other admin).
 */
export async function saveContent(patch: (current: SiteContent) => SiteContent): Promise<string | null> {
  if (!supabase) return "Not connected to a database.";
  const latest = await loadContent();
  if (latest.error) return latest.error;
  const next = normalizeContent(patch(latest.content));
  const { error } = await supabase.from("site_config").upsert({ id: 1, content: next, updated_at: new Date().toISOString() });
  return error ? error.message : null;
}
