import { SUPABASE_URL, supabase } from "./supabase";

/**
 * Photo uploads from the admin go to this project's own Supabase Storage bucket. The bucket
 * (see supabase/migrations/20261025000000_blog.sql) is public to read, but only admins can write,
 * and it only accepts these image types up to 10 MB. Nothing secret is in the browser.
 */
export const PHOTO_BUCKET = "site-photos";
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
/** Longest side after the browser shrinks a photo before uploading. Keeps pages fast. */
export const MAX_PHOTO_EDGE = 2400;

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

/** Same rule as the database: blog/<name>.<ext>, no dots-dots. */
const UPLOAD_PATH = /^blog\/[a-z0-9][a-z0-9_.-]{0,120}\.(jpg|jpeg|png|webp|gif)$/;
export const isUploadPath = (p: string) => UPLOAD_PATH.test(p) && !p.includes("..");

/** Public link to an uploaded photo. Built only from this project's Supabase address. */
export function photoUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** A safe storage path for a file name, e.g. "My Gig Photo.JPG" -> "blog/my-gig-photo-1700000000000.jpg". */
export function photoPath(originalName: string, ext: string, now = Date.now()): string {
  const dot = originalName.lastIndexOf(".");
  const base =
    (dot > 0 ? originalName.slice(0, dot) : originalName)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "photo";
  return `blog/${base}-${now}.${ext}`;
}

/** Returns a plain-English problem with the file, or null if it can be uploaded. */
export function validatePhotoFile(file: { name: string; type: string; size: number }): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    const heic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    return heic
      ? "That photo is in HEIC format. On iPhone, set Settings > Camera > Formats > Most Compatible, or export it as a JPG first."
      : "Please choose a JPG, PNG, WebP or GIF image. (SVG and other formats aren't allowed.)";
  }
  if (file.size > MAX_PHOTO_BYTES) return "That image is larger than 10 MB.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

/**
 * Shrinks a photo to MAX_PHOTO_EDGE and re-saves it as WebP. This keeps pages fast (cards would
 * otherwise load a full-size original) and drops hidden metadata such as GPS location. GIFs are
 * left alone so they keep animating. If the browser can't do it, the original is uploaded.
 */
async function prepare(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  const original = { blob: file as Blob, ext: EXT[file.type], type: file.type };
  if (file.type === "image/gif") return original;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob || blob.type !== "image/webp") return original;
    return { blob, ext: "webp", type: "image/webp" };
  } catch {
    return original;
  }
}

export type UploadResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadPhoto(file: File): Promise<UploadResult> {
  if (!supabase) return { ok: false, error: "Not connected to a database." };
  const problem = validatePhotoFile(file);
  if (problem) return { ok: false, error: problem };

  const { blob, ext, type } = await prepare(file);
  const path = photoPath(file.name, ext);
  if (!isUploadPath(path)) return { ok: false, error: "That file name can't be used. Rename the file and try again." };

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { cacheControl: "31536000", upsert: false, contentType: type });
  if (error) return { ok: false, error: error.message || "Upload failed." };
  return { ok: true, path };
}
