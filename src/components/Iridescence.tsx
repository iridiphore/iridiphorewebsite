/**
 * The brand's own backdrop: slow-moving iridescent colour. It is the permanent fallback
 * behind the hero video, so the page looks intentional before any footage exists, while the
 * video is loading, on iOS Low Power Mode (which blocks autoplay) and with reduced motion.
 */
export default function Iridescence({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden bg-ink ${className}`}>
      <div
        className="absolute -inset-1/4 opacity-70 motion-safe:animate-drift"
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, #0f766e, #2dd4bf, #818cf8, #c084fc, #fb923c, #2dd4bf, #0f766e)",
          filter: "blur(90px) saturate(1.15)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 40%, transparent 0%, rgba(7,9,12,0.65) 75%)" }}
      />
    </div>
  );
}
