import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const A = "/vendor";

/**
 * The Lovable animated send button (rotating gradient ring, dotted texture,
 * shine sweep, arrow swap). Repurposed as the "Generate PDF" trigger.
 */
export default function SendButton({
  onClick,
  loading = false,
  disabled = false,
}: {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [arrowToggle, setArrowToggle] = useState(0);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ angle: 0, speed: 0, last: 0, raf: 0, hovered: false });

  useEffect(() => {
    stateRef.current.hovered = hovered || loading;
    const tick = (now: number) => {
      const s = stateRef.current;
      const dt = s.last ? now - s.last : 16;
      s.last = now;
      const target = s.hovered ? 360 / 1500 : 0;
      const tau = s.hovered ? 250 : 700;
      const k = 1 - Math.exp(-dt / tau);
      s.speed += (target - s.speed) * k;
      s.angle = (s.angle + s.speed * dt) % 360;
      if (ringRef.current) ringRef.current.style.transform = `rotate(${s.angle}deg)`;
      if (!s.hovered && Math.abs(s.speed) < 0.0005) {
        s.raf = 0;
        s.last = 0;
        return;
      }
      s.raf = requestAnimationFrame(tick);
    };
    if (!stateRef.current.raf) {
      stateRef.current.last = 0;
      stateRef.current.raf = requestAnimationFrame(tick);
    }
    return () => {
      if (stateRef.current.raf) {
        cancelAnimationFrame(stateRef.current.raf);
        stateRef.current.raf = 0;
      }
    };
  }, [hovered, loading]);

  return (
    <motion.div
      onHoverStart={() => {
        setArrowToggle((v) => v + 1);
        setHovered(true);
      }}
      onHoverEnd={() => setHovered(false)}
      onClick={() => {
        if (!disabled && !loading) onClick?.();
      }}
      animate={{ scale: hovered && !disabled ? 1.05 : 1 }}
      transition={{ duration: 0.2 }}
      role="button"
      aria-label="Générer le PDF"
      style={{
        position: "relative",
        width: 44,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 15,
          background: "rgb(95 126 167 / 15%)",
          width: 44,
          height: 44,
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 36,
          height: 36,
          borderRadius: 12,
          background:
            "linear-gradient(var(--send-btn-angle, 180deg), #ff660e 0%, #646aed 100%)",
          animation: "send-btn-bg-rotate 4s linear infinite",
          boxShadow:
            "inset 0 1px 18px 2px rgba(173,208,255,0.20), inset 0 1px 4px 2px rgba(222,236,255,0.80), 0 42px 107px 0 rgba(61,130,222,0.34), 0 10px 10px 0 rgba(61,130,222,0.20), 0 3.714px 4.846px 0 rgba(61,130,222,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: 8,
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: 13,
            padding: 1,
            zIndex: 3,
            pointerEvents: "none",
            background:
              "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, #FFFFFF 60deg, #9EC7FF 120deg, rgba(255,255,255,0) 200deg, rgba(255,255,255,0) 360deg)",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
          }}
        >
          <div ref={ringRef} style={{ width: "100%", height: "100%", borderRadius: 13 }} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            border: "1px solid #9EC7FF",
            pointerEvents: "none",
            zIndex: 4,
          }}
        />
        <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
          <img
            src={`${A}/dots.svg`}
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
            alt=""
          />
        </div>
        {arrowToggle > 0 && !loading && (
          <motion.div
            key={`blink-${arrowToggle}`}
            initial={{ x: "-120%" }}
            animate={{ x: "120%" }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              pointerEvents: "none",
              background:
                "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
              mixBlendMode: "screen",
            }}
          />
        )}
        <div style={{ position: "relative", width: 16, height: 16, zIndex: 5, overflow: "hidden" }}>
          {loading ? (
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "#fff",
                animation: "spin 0.7s linear infinite",
                margin: "1px",
              }}
            />
          ) : (
            <>
              <motion.img
                key={`out-${arrowToggle}`}
                src={`${A}/arrow-up.svg`}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.65, 0, 0.35, 1] }}
                style={{ position: "absolute", inset: 0, width: 16, height: 16, objectFit: "contain" }}
                alt=""
              />
              <motion.img
                key={`in-${arrowToggle}`}
                src={`${A}/arrow-up.svg`}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.32, ease: [0.65, 0, 0.35, 1] }}
                style={{ position: "absolute", inset: 0, width: 16, height: 16, objectFit: "contain" }}
                alt=""
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
