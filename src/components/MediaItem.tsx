import { useState } from "react";
import { cloudinaryConfigured, imageUrl, videoSources } from "@/lib/cloudinary";
import type { EventMedia } from "@/lib/types";

function Embed({ media }: { media: EventMedia }) {
  const [play, setPlay] = useState(false);

  if (media.provider === "vimeo") {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${media.ref}`}
        title={media.caption || "Video"}
        loading="lazy"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-sm"
      />
    );
  }

  // YouTube: show a thumbnail and only load the player after a click (lighter page).
  return (
    <div className="relative aspect-video overflow-hidden rounded-sm bg-panel">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${media.ref}?autoplay=1`}
          title={media.caption || "Video"}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlay(true)}
          aria-label={`Play ${media.caption || "video"}`}
          className="group absolute inset-0 h-full w-full"
        >
          <img
            src={`https://img.youtube.com/vi/${media.ref}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-ink/30 transition-colors group-hover:bg-ink/10" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-paper/70 bg-ink/50 backdrop-blur">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        </button>
      )}
    </div>
  );
}

export default function MediaItem({ media }: { media: EventMedia }) {
  let body = null;

  if (media.kind === "embed") {
    body = <Embed media={media} />;
  } else if (cloudinaryConfigured && media.kind === "image") {
    body = (
      <a href={imageUrl(media.ref)} target="_blank" rel="noopener noreferrer">
        <img
          src={imageUrl(media.ref, { w: 1600 })}
          alt={media.caption}
          loading="lazy"
          className="w-full rounded-sm"
        />
      </a>
    );
  } else if (cloudinaryConfigured && media.kind === "video") {
    const s = videoSources(media.ref, 1280);
    body = (
      <video controls playsInline preload="metadata" poster={s.poster} className="aspect-video w-full rounded-sm bg-panel">
        <source src={s.webm} type="video/webm" />
        <source src={s.mp4} type="video/mp4" />
      </video>
    );
  }
  if (!body) return null;

  return (
    <figure>
      {body}
      {media.caption && <figcaption className="mt-2 text-sm text-fog">{media.caption}</figcaption>}
    </figure>
  );
}
