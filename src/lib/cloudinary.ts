/**
 * Cloudinary helpers.
 *
 * Only the PUBLIC ID of an asset is ever stored. Delivery URLs are built here from the
 * site's own cloud name, so a page can never be pointed at media from anywhere else.
 * Admins paste a normal Cloudinary link; `parseCloudinaryInput` turns it into a public id
 * and rejects links that belong to a different cloud.
 */

export const CLOUD_NAME = ((import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) ?? "").trim();
export const cloudinaryConfigured = CLOUD_NAME !== "";

const BASE = `https://res.cloudinary.com/${CLOUD_NAME}`;
const PUBLIC_ID = /^[A-Za-z0-9_./-]{1,200}$/;

export function imageUrl(id: string, opts: { w?: number; h?: number; fill?: boolean } = {}): string {
  const t = ["f_auto", "q_auto"];
  if (opts.w) t.push(`w_${opts.w}`);
  if (opts.h) t.push(`h_${opts.h}`);
  t.push(opts.fill ? "c_fill" : "c_limit");
  return `${BASE}/image/upload/${t.join(",")}/${id}`;
}

export function videoSources(id: string, width = 1920) {
  const size = `w_${width},c_limit`;
  return {
    webm: `${BASE}/video/upload/f_webm,vc_vp9,q_auto,${size}/${id}`,
    mp4: `${BASE}/video/upload/f_mp4,vc_h264,q_auto,${size}/${id}`,
    // First frame of the video as a still. Used as the poster while it loads.
    poster: `${BASE}/video/upload/so_0,f_jpg,q_auto,${size}/${id}.jpg`,
  };
}

// Transformation segments Cloudinary puts between "upload" and the public id, e.g. f_auto,q_auto or w_800.
const TRANSFORM_SEGMENT = /^(?:[a-z]{1,4}_[^/]*,.*|(?:f|q|w|h|c|g|e|so|eo|du|vc|ac|ar|dpr|fl|l|o|r|t|x|y|z|b|bo|a|ki|sp)_[^/]*)$/;
const VERSION_SEGMENT = /^v\d+$/;

export type CloudinaryParse =
  | { ok: true; id: string; resource: "image" | "video" | "unknown" }
  | { ok: false; error: string };

/** Accepts a Cloudinary delivery link or a bare public id. */
export function parseCloudinaryInput(raw: string): CloudinaryParse {
  const input = raw.trim();
  if (!input) return { ok: false, error: "Paste a Cloudinary link." };

  if (!/^https?:\/\//i.test(input)) {
    return PUBLIC_ID.test(input) && !input.includes("..")
      ? { ok: true, id: input, resource: "unknown" }
      : { ok: false, error: "That doesn't look like a Cloudinary link or public id." };
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: "That link isn't valid." };
  }
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
    return { ok: false, error: "Only res.cloudinary.com links are accepted." };
  }
  if (!cloudinaryConfigured) {
    return { ok: false, error: "VITE_CLOUDINARY_CLOUD_NAME isn't set, so links can't be checked." };
  }

  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  // [cloud, image|video|raw, upload, ...transformations, version?, ...public id]
  const [cloud, resource, type, ...rest] = parts;
  if (cloud !== CLOUD_NAME) {
    return { ok: false, error: `That link is from a different Cloudinary account ("${cloud}"). Use media from "${CLOUD_NAME}".` };
  }
  if (resource !== "image" && resource !== "video") {
    return { ok: false, error: "Only image and video links are supported." };
  }
  if (type !== "upload") return { ok: false, error: "Only public (upload) links are supported." };

  let i = 0;
  while (i < rest.length - 1 && TRANSFORM_SEGMENT.test(rest[i])) i++;
  if (i < rest.length - 1 && VERSION_SEGMENT.test(rest[i])) i++;
  const id = rest.slice(i).join("/").replace(/\.[A-Za-z0-9]{2,5}$/, "");

  if (!PUBLIC_ID.test(id) || id.includes("..")) {
    return { ok: false, error: "The public id has characters this site can't use. Rename the asset in Cloudinary (letters, numbers, - _ . / only)." };
  }
  return { ok: true, id, resource };
}

export interface EmbedParse {
  provider: "youtube" | "vimeo";
  id: string;
}

/** Accepts a YouTube or Vimeo link. */
export function parseEmbedInput(raw: string): EmbedParse | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? { provider: "youtube", id } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    const m = url.pathname.match(/^\/(?:embed|live|shorts)\/([A-Za-z0-9_-]{6,20})/);
    const id = v ?? m?.[1] ?? "";
    return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? { provider: "youtube", id } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(\d{5,12})/);
    return m ? { provider: "vimeo", id: m[1] } : null;
  }
  return null;
}
