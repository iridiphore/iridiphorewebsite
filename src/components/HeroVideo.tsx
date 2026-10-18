import { useEffect, useState } from "react";
import Iridescence from "./Iridescence";
import { cloudinaryConfigured, imageUrl, videoSources } from "@/lib/cloudinary";

interface Props {
  video: string | null;
  poster: string | null;
  /** Overlay darkness at the top, 0 to 90 (set in admin, Look tab). */
  dim: number;
}

/**
 * Full-bleed looping background. The iridescent layer is always underneath; the poster and
 * then the video fade in on top. No video is requested if none is set or the visitor
 * prefers reduced motion (they get the poster instead).
 */
export default function HeroVideo({ video, poster, dim }: Props) {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const sources = cloudinaryConfigured && video ? videoSources(video) : null;
  const posterSrc = !cloudinaryConfigured ? null : poster ? imageUrl(poster, { w: 1920 }) : (sources?.poster ?? null);

  return (
    <div className="absolute inset-0">
      <Iridescence />
      {posterSrc && <img src={posterSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      {sources && !reduced && (
        <video
          key={video}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onCanPlay={() => setReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
        >
          <source src={sources.webm} type="video/webm" />
          <source src={sources.mp4} type="video/mp4" />
        </video>
      )}
      {/* Keeps text legible over any footage */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(7,9,12,${dim / 100}), rgba(7,9,12,${dim / 300}), #07090c)`,
        }}
      />
    </div>
  );
}
