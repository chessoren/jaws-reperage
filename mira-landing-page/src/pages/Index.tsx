import { useCallback, useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { motion, useAnimate } from "framer-motion";
import {
  ChevronDown,
  Copy,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from "lucide-react";

const A = "https://qclay.design/lovable/sixsense";

/**
 * Assets are served from /public/assets so the page renders instantly and never
 * depends on a third party host. Flip this to true to pull the original artwork
 * from `A` instead — a failed remote request still falls back to the local twin
 * through `onAssetError`, it just costs a round trip first.
 */
const USE_REMOTE_ASSETS = false;

/** Local twin of every remote asset, keyed by its remote file name. */
const FALLBACK: Record<string, string> = {
  "chat.svg": "/assets/chat.svg",
  "search.svg": "/assets/search.svg",
  "folder-0.svg?v=2": "/assets/folder-0.svg",
  "folder-1.svg": "/assets/folder-1.svg",
  "folder-2.svg": "/assets/folder-2.svg",
  "folder-3.svg": "/assets/folder-3.svg",
  "blue-light.svg": "/assets/blue-light.svg",
  "blue-light-2.svg": "/assets/blue-light-2.svg",
  "light-1.svg": "/assets/light-1.svg",
  "light-2.svg": "/assets/light-2.svg",
  "small-light.svg": "/assets/small-light.svg",
  "small-light-2.svg": "/assets/small-light-2.svg",
  "image-1.png": "/assets/image-1.svg",
  "image-2.png": "/assets/image-2.svg",
  "image-3.png": "/assets/image-3.svg",
  "ai-select.svg": "/assets/ai-select.svg",
  "image.svg": "/assets/image.svg",
  "Capa_1.svg": "/assets/Capa_1.svg",
  "dots.svg": "/assets/dots.svg",
  "arrow-up.svg": "/assets/arrow-up.svg",
};

const assetSrc = (name: string) =>
  USE_REMOTE_ASSETS ? `${A}/${name}` : (FALLBACK[name] ?? `${A}/${name}`);

const onAssetError =
  (name: string) => (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const local = FALLBACK[name];
    if (!local || img.dataset.fallback === "1") return;
    img.dataset.fallback = "1";
    img.src = local;
  };

/* -------------------------------------------------------------------------- */
/*                             Responsive layout                              */
/* -------------------------------------------------------------------------- */

type Layout = {
  vw: number;
  /** below 640px — phones */
  phone: boolean;
  /** below 1024px — phones and tablets */
  compact: boolean;
  heroScale: number;
  headingSize: number;
  subtitleSize: number;
  gridDim: number;
  gridShift: number;
};

function layoutFor(vw: number): Layout {
  const phone = vw < 640;
  const compact = vw < 1024;
  return {
    vw,
    phone,
    compact,
    heroScale: phone ? 0.78 : compact ? 0.9 : 1,
    headingSize: phone ? 24 : compact ? 28 : 32,
    subtitleSize: phone ? 13 : 14,
    gridDim: phone ? 0.35 : compact ? 0.6 : 1,
    gridShift: phone ? 150 : compact ? 90 : 0,
  };
}

function useLayout(): Layout {
  const [layout, setLayout] = useState(() =>
    layoutFor(typeof window === "undefined" ? 1440 : window.innerWidth),
  );

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setLayout(layoutFor(window.innerWidth));
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return layout;
}

/* -------------------------------------------------------------------------- */
/*                            Pixel grid background                           */
/* -------------------------------------------------------------------------- */

const TILE = 32;
const GAP = 1;
const CELL = TILE + GAP;
const COLS = 12;
const ROWS = 16;
const TOTAL = COLS * ROWS;

const BASE_FILL_RATIO = 0.35;
const HOVER_FILL_RATIO = 0.7;
const HOVER_RADIUS = 4;

const TILE_SOURCES = [
  "/tiles/tile-empty.svg",
  "/tiles/tile-1.svg",
  "/tiles/tile-2.svg",
  "/tiles/tile-3.svg",
  "/tiles/tile-4.svg",
  "/tiles/tile-5.svg",
];

/** Module level cache: the sprites are rasterized once for the whole app. */
let spritesPromise: Promise<HTMLCanvasElement[]> | null = null;

function loadSprites(): Promise<HTMLCanvasElement[]> {
  if (spritesPromise) return spritesPromise;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = Math.round(TILE * dpr);

  spritesPromise = Promise.all(
    TILE_SOURCES.map(
      (src) =>
        new Promise<HTMLCanvasElement>((resolve) => {
          const off = document.createElement("canvas");
          off.width = size;
          off.height = size;
          const octx = off.getContext("2d");
          const img = new Image();
          img.onload = () => {
            octx?.drawImage(img, 0, 0, size, size);
            resolve(off);
          };
          img.onerror = () => resolve(off);
          img.src = src;
        }),
    ),
  );

  return spritesPromise;
}

function PixelGrid({
  side,
  dim = 1,
  shift = 0,
}: {
  side: "left" | "right";
  dim?: number;
  shift?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = COLS * CELL - GAP;
    const cssH = ROWS * CELL - GAP;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const base = new Uint8Array(TOTAL);
    const on = new Uint8Array(TOTAL);
    const variant = new Uint8Array(TOTAL);
    for (let i = 0; i < TOTAL; i += 1) {
      base[i] = Math.random() < BASE_FILL_RATIO ? 1 : 0;
      variant[i] = 1 + Math.floor(Math.random() * 5);
    }

    let sprites: HTMLCanvasElement[] | null = null;
    let hoverSet = new Set<number>();
    let disposed = false;
    let raf = 0;
    let hoverRaf = 0;
    const timers: number[] = [];

    const spriteSize = Math.round(TILE * dpr);

    const paintCell = (i: number) => {
      if (!sprites) return;
      const col = i % COLS;
      const row = (i / COLS) | 0;
      const x = Math.round(col * CELL * dpr);
      const y = Math.round(row * CELL * dpr);
      ctx.clearRect(x, y, spriteSize, spriteSize);
      ctx.drawImage(
        on[i] ? sprites[variant[i]] : sprites[0],
        x,
        y,
        spriteSize,
        spriteSize,
      );
    };

    const paintAll = () => {
      for (let i = 0; i < TOTAL; i += 1) paintCell(i);
    };

    /* ------------------------------ hover blob ----------------------------- */

    let pointerX = 0;
    let pointerY = 0;

    const applyHover = () => {
      hoverRaf = 0;
      if (disposed || !sprites) return;

      const rect = canvas.getBoundingClientRect();
      const cx = (pointerX - rect.left) / CELL - 0.5;
      const cy = (pointerY - rect.top) / CELL - 0.5;
      const t = performance.now();

      const next = new Set<number>();
      const reach = HOVER_RADIUS * 2;
      const minCol = Math.max(0, Math.floor(cx - reach));
      const maxCol = Math.min(COLS - 1, Math.ceil(cx + reach));
      const minRow = Math.max(0, Math.floor(cy - reach));
      const maxRow = Math.min(ROWS - 1, Math.ceil(cy + reach));

      for (let row = minRow; row <= maxRow; row += 1) {
        for (let col = minCol; col <= maxCol; col += 1) {
          const dx = col - cx;
          const dy = row - cy;
          const dist = Math.hypot(dx, dy);
          if (dist > reach) continue;

          const angle = Math.atan2(dy, dx);
          const n =
            Math.sin(angle * 3 + t * 0.0011) * 0.55 +
            Math.sin(angle * 5 - t * 0.0017 + 1.3) * 0.3 +
            Math.sin(angle * 2 + t * 0.0007 + 2.1) * 0.2;
          const rMax = HOVER_RADIUS * (0.95 + n * 0.3);

          let inside = false;
          if (dist <= rMax - 0.5) {
            inside = true;
          } else if (dist <= rMax + 0.4) {
            inside =
              (Math.sin(col * 12.9898 + row * 78.233 + t * 0.002) + 1) * 0.5 >
              0.45;
          }

          if (inside) next.add(row * COLS + col);
        }
      }

      // Cells leaving the blob fall back to their base state.
      hoverSet.forEach((i) => {
        if (!next.has(i)) {
          on[i] = base[i];
          paintCell(i);
        }
      });
      // Cells entering the blob light up with the hover fill ratio.
      next.forEach((i) => {
        if (!hoverSet.has(i)) {
          on[i] = Math.random() < HOVER_FILL_RATIO ? 1 : 0;
          paintCell(i);
        }
      });
      hoverSet = next;
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      if (hoverRaf) return;
      hoverRaf = requestAnimationFrame(applyHover);
    };

    /* ------------------------------- flicker ------------------------------- */

    const startFlicker = () => {
      const ambient = () => {
        if (disposed) return;
        for (let n = 0; n < 3; n += 1) {
          const i = Math.floor(Math.random() * TOTAL);
          if (hoverSet.has(i)) continue;
          base[i] = Math.random() < BASE_FILL_RATIO ? 1 : 0;
          on[i] = base[i];
          paintCell(i);
        }
        timers.push(window.setTimeout(ambient, 120 + Math.random() * 180));
      };
      timers.push(window.setTimeout(ambient, 120 + Math.random() * 180));

      const hoverFlicker = () => {
        if (disposed) return;
        hoverSet.forEach((i) => {
          if (Math.random() < 0.18) {
            on[i] = Math.random() < HOVER_FILL_RATIO ? 1 : 0;
            paintCell(i);
          }
        });
        timers.push(window.setTimeout(hoverFlicker, 70 + Math.random() * 90));
      };
      timers.push(window.setTimeout(hoverFlicker, 70 + Math.random() * 90));
    };

    /* -------------------------------- reveal ------------------------------- */

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    loadSprites().then((loaded) => {
      if (disposed) return;
      sprites = loaded;

      if (reduced) {
        on.set(base);
        paintAll();
        return;
      }

      paintAll();

      const order = Array.from({ length: TOTAL }, (_, i) => i);
      for (let i = order.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }

      const perTick = Math.ceil(TOTAL / 18);
      let cursor = 0;
      const step = () => {
        if (disposed) return;
        for (let n = 0; n < perTick && cursor < TOTAL; n += 1, cursor += 1) {
          const i = order[cursor];
          if (base[i]) {
            on[i] = 1;
            paintCell(i);
          }
        }
        if (cursor < TOTAL) {
          raf = requestAnimationFrame(step);
        } else {
          raf = 0;
          startFlicker();
        }
      };
      raf = requestAnimationFrame(step);

      window.addEventListener("pointermove", onPointerMove, { passive: true });
    });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (hoverRaf) cancelAnimationFrame(hoverRaf);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  const mask = `radial-gradient(ellipse 80% 80% at ${
    side === "left" ? "30%" : "70%"
  } 50%, black 0%, transparent 75%)`;

  return (
    <div
      style={{
        position: "absolute",
        left: side === "left" ? -shift : undefined,
        right: side === "right" ? -shift : undefined,
        top: "50%",
        transform: "translateY(-40%)",
        zIndex: 0,
        opacity: dim,
        transition: "opacity 0.6s ease",
        pointerEvents: "none",
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Navbar                                   */
/* -------------------------------------------------------------------------- */

function Navbar() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        zIndex: 50,
        background: "transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 22,
          marginLeft: 22,
          height: 16,
        }}
      >
        <img
          src="/mira-logo.svg"
          alt="Mira"
          style={{ height: 16, width: "auto", display: "block" }}
        />
        <span
          style={{
            fontFamily: '"Inter Tight", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.3px",
            lineHeight: "16px",
            color: "#11315D",
          }}
        >
          Mira
        </span>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Sidebar                                   */
/* -------------------------------------------------------------------------- */

function Sidebar({ hidden }: { hidden: boolean }) {
  const [hovered, setHovered] = useState<"chat" | "search" | null>(null);

  if (hidden) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <button
        type="button"
        onMouseEnter={() => setHovered("chat")}
        onMouseLeave={() => setHovered(null)}
        style={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          border: "1px solid rgba(34,106,205,0.05)",
          background:
            hovered === "chat" ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.90)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "background 0.2s",
          cursor: "pointer",
        }}
      >
        <img
          src={assetSrc("chat.svg")}
          onError={onAssetError("chat.svg")}
          alt=""
          style={{ width: 18, height: 18 }}
        />
      </button>

      <button
        type="button"
        onMouseEnter={() => setHovered("search")}
        onMouseLeave={() => setHovered(null)}
        style={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          border: "none",
          background:
            hovered === "search" ? "rgba(255,255,255,0.5)" : "transparent",
          transition: "background 0.2s",
          cursor: "pointer",
        }}
      >
        <img
          src={assetSrc("search.svg")}
          onError={onAssetError("search.svg")}
          alt=""
          style={{ width: 18, height: 18 }}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Folder + lights stack                          */
/* -------------------------------------------------------------------------- */

const FOLDER_W = 113.67;
const FOLDER_CENTER = FOLDER_W / 2;

type StackItem = {
  src: string;
  z: number;
  bottom: number;
  left: number;
  center?: boolean;
  width: number;
  height: number;
  fade: { duration: number; delay: number };
  rise?: boolean;
};

const STACK: StackItem[] = [
  {
    src: "blue-light-2.svg",
    z: 1,
    bottom: 50,
    left: 54.6,
    center: true,
    width: 104,
    height: 170,
    fade: { duration: 0.8, delay: 1.0 },
  },
  {
    src: "blue-light.svg",
    z: 2,
    bottom: 28,
    left: 54.6,
    center: true,
    width: 104,
    height: 170,
    fade: { duration: 0.8, delay: 1.0 },
  },
  {
    src: "light-1.svg",
    z: 3,
    bottom: 35,
    left: 57.2,
    center: true,
    width: 180.5,
    height: 124.5,
    fade: { duration: 1.0, delay: 1.0 },
  },
  {
    src: "folder-3.svg",
    z: 4,
    bottom: 60,
    left: 23.4,
    width: 69.71,
    height: 45,
    fade: { duration: 0.6, delay: 0.8 },
    rise: true,
  },
  {
    src: "small-light-2.svg",
    z: 5,
    bottom: 55,
    left: 67.6,
    center: true,
    width: 39,
    height: 17,
    fade: { duration: 0.6, delay: 1.4 },
  },
  {
    src: "small-light.svg",
    z: 6,
    bottom: 50,
    left: 44.2,
    center: true,
    width: 39,
    height: 25,
    fade: { duration: 0.6, delay: 1.4 },
  },
  {
    src: "folder-2.svg",
    z: 7,
    bottom: 45,
    left: 18.98,
    width: 79,
    height: 51,
    fade: { duration: 0.6, delay: 0.6 },
    rise: true,
  },
  {
    src: "light-2.svg",
    z: 8,
    bottom: 20,
    left: 57.2,
    center: true,
    width: 109,
    height: 162.5,
    fade: { duration: 1.0, delay: 1.1 },
  },
  {
    src: "folder-1.svg",
    z: 9,
    bottom: 30,
    left: 13,
    width: 91,
    height: 58,
    fade: { duration: 0.6, delay: 0.4 },
    rise: true,
  },
  {
    src: "folder-0.svg?v=2",
    z: 10,
    bottom: 0,
    left: 0,
    width: FOLDER_W,
    height: 76.5,
    fade: { duration: 0.6, delay: 0.0 },
    rise: true,
  },
];

type CardSpec = {
  src: string;
  width: number;
  height: number;
  x: number;
  y: number;
  rotate: number;
  startX: number;
  startY: number;
  float: { y: number[]; rot: number[]; duration: number };
};

const CARDS: CardSpec[] = [
  {
    src: "image-1.png",
    width: 88.55,
    height: 68.46,
    x: -82,
    y: 123,
    rotate: -16,
    startX: -5,
    startY: 7,
    float: { y: [0, -6, 0, 4, 0], rot: [0, -2, 0, 2, 0], duration: 6 },
  },
  {
    src: "image-2.png",
    width: 105,
    height: 87,
    x: 68,
    y: 124,
    rotate: 24,
    startX: 35,
    startY: 33,
    float: { y: [0, 5, 0, -5, 0], rot: [0, 2, 0, -2, 0], duration: 7 },
  },
  {
    src: "image-3.png",
    width: 105,
    height: 96,
    x: -4,
    y: 148,
    rotate: -4,
    startX: -4,
    startY: 27,
    float: { y: [0, -4, 0, 6, 0], rot: [0, -1.5, 0, 1.5, 0], duration: 8 },
  },
];

const START_SIZE = 20;

function FolderStack({ scale = 1 }: { scale?: number }) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div
      style={{
        position: "relative",
        width: FOLDER_W * scale,
        height: 220 * scale,
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: FOLDER_W,
          height: 220,
          overflow: "visible",
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "bottom center",
        }}
      >
      {STACK.map((item) => (
        <motion.img
          key={item.src}
          src={assetSrc(item.src)}
          onError={onAssetError(item.src)}
          alt=""
          initial={item.rise ? { opacity: 0, y: 30 } : { opacity: 0 }}
          animate={item.rise ? { opacity: 1, y: 0 } : { opacity: 1 }}
          transition={{
            duration: item.fade.duration,
            delay: item.fade.delay,
            ease: item.rise ? [0.22, 1, 0.36, 1] : "easeOut",
          }}
          style={{
            position: "absolute",
            zIndex: item.z,
            bottom: item.bottom,
            left: item.left,
            width: item.width,
            height: item.height,
            transform: item.center ? "translateX(-50%)" : undefined,
            pointerEvents: "none",
          }}
        />
      ))}

      {CARDS.map((card, i) => {
        const isHovered = hoveredCard === i;
        const anyHovered = hoveredCard !== null;

        return (
          <motion.div
            key={card.src}
            initial={{
              opacity: 0,
              width: START_SIZE,
              height: START_SIZE,
              left: FOLDER_CENTER + card.startX - START_SIZE / 2,
              bottom: card.startY,
              rotate: 0,
            }}
            animate={{
              opacity: 1,
              width: card.width,
              height: card.height,
              left: FOLDER_CENTER + card.x - card.width / 2,
              bottom: card.y,
              rotate: card.rotate,
            }}
            transition={{
              duration: 1.4,
              delay: 0.6 + i * 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: "absolute",
              zIndex: isHovered ? 20 : 11 + i,
              transformOrigin: "50% 100%",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredCard(i)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <motion.div
              animate={
                anyHovered
                  ? { y: 0, rotate: 0, scale: isHovered ? 1.08 : 1 }
                  : {
                      y: card.float.y,
                      rotate: card.float.rot,
                      scale: 1,
                    }
              }
              transition={
                anyHovered
                  ? { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                  : {
                      duration: card.float.duration,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 10,
                overflow: "hidden",
                transformOrigin: "50% 100%",
                boxShadow:
                  "0 16px 40px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.10)",
              }}
            >
              <img
                src={assetSrc(card.src)}
                onError={onAssetError(card.src)}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </motion.div>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Typewriter                                 */
/* -------------------------------------------------------------------------- */

const PHRASES = [
  "Hire an AI Employee for lead research",
  "Ask Mira to clear the inbox before 9am",
  "Turn this spreadsheet into a weekly report",
  "Let Mira handle onboarding tickets",
  "Watch Mira use your apps while you sleep",
];

const DEMO_PROMPT = "Hey, what can Mira do for me?";

type TypeMode = "cycle" | "demo" | "hold";

function useTypewriter(mode: TypeMode, onDemoTyped: () => void) {
  const [text, setText] = useState("");
  const doneRef = useRef(onDemoTyped);
  doneRef.current = onDemoTyped;

  useEffect(() => {
    if (mode === "hold") return;

    let timer = 0;

    if (mode === "demo") {
      let chars = 0;
      setText("");
      const type = () => {
        chars += 1;
        setText(DEMO_PROMPT.slice(0, chars));
        if (chars >= DEMO_PROMPT.length) {
          doneRef.current();
          return;
        }
        timer = window.setTimeout(type, 34 + Math.random() * 44);
      };
      timer = window.setTimeout(type, 220);
      return () => window.clearTimeout(timer);
    }

    let phrase = 0;
    let chars = 0;
    let deleting = false;

    const step = () => {
      const current = PHRASES[phrase];

      if (!deleting) {
        chars += 1;
        setText(current.slice(0, chars));
        if (chars >= current.length) {
          deleting = true;
          timer = window.setTimeout(step, 1400);
          return;
        }
        timer = window.setTimeout(step, 22 + Math.random() * 25);
      } else {
        chars -= 1;
        setText(current.slice(0, chars));
        if (chars <= 0) {
          deleting = false;
          phrase = (phrase + 1) % PHRASES.length;
          timer = window.setTimeout(step, 22 + Math.random() * 25);
          return;
        }
        timer = window.setTimeout(step, 14);
      }
    };

    timer = window.setTimeout(step, 22 + Math.random() * 25);
    return () => window.clearTimeout(timer);
  }, [mode]);

  return text;
}

/* -------------------------------------------------------------------------- */
/*                                 Send button                                */
/* -------------------------------------------------------------------------- */

function SendButton({
  buttonRef,
  demoActive = false,
  demoPressed = false,
}: {
  buttonRef?: React.RefObject<HTMLDivElement>;
  demoActive?: boolean;
  demoPressed?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [arrowToggle, setArrowToggle] = useState(0);
  const active = hovered || demoActive;

  const ringRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<() => void>(() => {});
  const hoveredRef = useRef(false);
  const angleRef = useRef(0);
  const speedRef = useRef(0); // degrees per millisecond
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  useEffect(() => {
    const loop = (now: number) => {
      const dt = Math.min(now - lastRef.current, 64);
      lastRef.current = now;

      const target = hoveredRef.current ? 360 / 1500 : 0;
      const tau = hoveredRef.current ? 250 : 700;
      const k = 1 - Math.exp(-dt / tau);
      speedRef.current += (target - speedRef.current) * k;

      angleRef.current = (angleRef.current + speedRef.current * dt) % 360;
      if (ringRef.current) {
        ringRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }

      if (!hoveredRef.current && speedRef.current < 0.0005) {
        speedRef.current = 0;
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    startRef.current = () => {
      if (rafRef.current !== null) return;
      lastRef.current = performance.now();
      rafRef.current = requestAnimationFrame(loop);
    };

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  useEffect(() => {
    hoveredRef.current = active;
    if (active) setArrowToggle((v) => v + 1);
    startRef.current();
  }, [active]);

  const arrowTransition = { duration: 0.32, ease: [0.65, 0, 0.35, 1] };

  return (
    <motion.div
      ref={buttonRef}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ scale: demoPressed ? 0.94 : active ? 1.05 : 1 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "relative",
        width: 44,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        translateY: "10%",
      }}
    >
      {/* halo */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 15,
          background: "rgba(151,195,255,0.15)",
          zIndex: 1,
        }}
      />

      {/* click ripple, fired by the demo cursor */}
      {demoPressed && (
        <motion.div
          initial={{ opacity: 0.55, scale: 0.7 }}
          animate={{ opacity: 0, scale: 1.9 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 15,
            border: "1.5px solid rgba(61,130,222,0.55)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}

      {/* button body */}
      <div
        style={{
          position: "relative",
          width: 36,
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          background: "linear-gradient(180deg, #70A8F2 0%, #3D82DE 100%)",
          padding: 8,
          overflow: "hidden",
          zIndex: 2,
          boxShadow:
            "inset 0 1px 18px 2px rgba(173,208,255,0.20), inset 0 1px 4px 2px rgba(222,236,255,0.80), 0 42px 107px 0 rgba(61,130,222,0.34), 0 10px 10px 0 rgba(61,130,222,0.20), 0 3.714px 4.846px 0 rgba(61,130,222,0.15)",
        }}
      >
        {/* spinning conic border */}
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: 13,
            padding: 1,
            zIndex: 3,
            pointerEvents: "none",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
          }}
        >
          <div
            ref={ringRef}
            style={{
              position: "absolute",
              inset: "-50%",
              background:
                "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, #FFFFFF 60deg, #9EC7FF 120deg, rgba(255,255,255,0) 200deg, rgba(255,255,255,0) 360deg)",
            }}
          />
        </div>

        {/* static fallback border */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            border: "1px solid #9EC7FF",
            zIndex: 4,
            pointerEvents: "none",
          }}
        />

        {/* dots overlay */}
        <img
          src={assetSrc("dots.svg")}
          onError={onAssetError("dots.svg")}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.7,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* shine sweep, replayed on every hover start */}
        {arrowToggle > 0 && (
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
              mixBlendMode: "screen",
              background:
                "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
            }}
          />
        )}

        {/* arrow swap */}
        <div
          style={{
            position: "relative",
            width: 16,
            height: 16,
            overflow: "hidden",
            zIndex: 5,
          }}
        >
          {arrowToggle > 0 && (
            <motion.img
              key={`out-${arrowToggle}`}
              src={assetSrc("arrow-up.svg")}
              onError={onAssetError("arrow-up.svg")}
              alt=""
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -16, opacity: 0 }}
              transition={arrowTransition}
              style={{
                position: "absolute",
                inset: 0,
                width: 16,
                height: 16,
              }}
            />
          )}
          <motion.img
            key={`in-${arrowToggle}`}
            src={assetSrc("arrow-up.svg")}
            onError={onAssetError("arrow-up.svg")}
            alt=""
            initial={arrowToggle > 0 ? { y: 16, opacity: 0 } : false}
            animate={{ y: 0, opacity: 1 }}
            transition={arrowTransition}
            style={{
              position: "absolute",
              inset: 0,
              width: 16,
              height: 16,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Prompt box                                 */
/* -------------------------------------------------------------------------- */

function ToolbarButton({ icon, name }: { icon: string; name: string }) {
  return (
    <button
      type="button"
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "rgba(255,255,255,0.80)",
        cursor: "pointer",
      }}
    >
      <img
        src={icon}
        onError={onAssetError(name)}
        alt=""
        style={{ width: 14, height: 14 }}
      />
    </button>
  );
}

function PromptBox({
  lineRef,
  sendRef,
  mode,
  onDemoTyped,
  demoActive,
  demoPressed,
  focused,
  phone,
}: {
  lineRef: React.RefObject<HTMLDivElement>;
  sendRef: React.RefObject<HTMLDivElement>;
  mode: TypeMode;
  onDemoTyped: () => void;
  demoActive: boolean;
  demoPressed: boolean;
  focused: boolean;
  phone: boolean;
}) {
  const typed = useTypewriter(mode, onDemoTyped);
  // Everything the page types on its own is placeholder copy, so it stays grey;
  // only what the Mira cursor types reads as real input.
  const isInput = mode === "demo" || mode === "hold";
  const textColor = isInput ? "#0D1B4B" : "rgba(13,27,75,0.38)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, delay: 0.55, ease: "easeOut" }}
      style={{
        width: 702,
        maxWidth: "100%",
        margin: "0 auto",
        padding: 4,
        borderRadius: 24,
        border: "0.5px solid rgba(0,0,0,0.05)",
        background: "rgba(157,196,250,0.15)",
        backdropFilter: "blur(50px)",
        WebkitBackdropFilter: "blur(50px)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 116,
          background: "#FFFFFF",
          borderRadius: 20,
          border: focused
            ? "1px solid rgba(61,130,222,0.35)"
            : "1px solid rgba(34,106,205,0.05)",
          boxShadow: focused ? "0 0 0 4px rgba(112,168,242,0.12)" : "none",
          transition: "border-color 0.3s, box-shadow 0.3s",
          padding: "14px 14px 12px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          ref={lineRef}
          style={{
            height: 32,
            display: "flex",
            alignItems: "center",
            fontFamily: '"Inter Tight", sans-serif',
            fontSize: 15,
            lineHeight: "22px",
            fontWeight: 400,
            color: textColor,
            transition: "color 0.2s",
            paddingBottom: 10,
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "clip",
              whiteSpace: "nowrap",
            }}
          >
            {typed}
          </span>
          <span
            style={{
              display: "inline-block",
              flexShrink: 0,
              width: 2,
              height: 18,
              background: textColor,
              marginLeft: 2,
              animation: "promptCaretBlink 1s steps(1) infinite",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
              transform: "translateY(35%)",
            }}
          >
            {/* model selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                width: phone ? 98 : 110,
                flexShrink: 0,
                height: 28,
                background: "#E8F1FF",
                borderRadius: 8,
                padding: "0 8px",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background:
                    "linear-gradient(166deg, #A0E4FF 9.8%, #9CA4FB 184.41%)",
                  flexShrink: 0,
                }}
              >
                <img
                  src={assetSrc("ai-select.svg")}
                  onError={onAssetError("ai-select.svg")}
                  alt=""
                  style={{ width: 8, height: 8 }}
                />
              </span>
              <span
                style={{
                  flex: 1,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontFamily: '"Inter Tight", sans-serif',
                  fontSize: 12,
                  lineHeight: "16px",
                  color: "#5085CE",
                }}
              >
                Mira AI
              </span>
              <ChevronDown size={12} color="#5085CE" style={{ flexShrink: 0 }} />
            </div>

            {!phone && (
              <>
                <ToolbarButton icon={assetSrc("image.svg")} name="image.svg" />
                <ToolbarButton icon={assetSrc("Capa_1.svg")} name="Capa_1.svg" />

                <div
                  style={{
                    width: 1,
                    height: 18,
                    background: "rgba(0,0,0,0.12)",
                    margin: "0 2px",
                  }}
                />
              </>
            )}

            <button
              type="button"
              style={{
                width: 28,
                height: 28,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                border: "1px solid rgba(0,0,0,0.10)",
                background: "transparent",
                fontSize: 16,
                lineHeight: 1,
                color: "rgba(0,0,0,0.40)",
                cursor: "pointer",
              }}
            >
              +
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                height: 28,
                minWidth: 0,
                background: "rgba(0,0,0,0.05)",
                borderRadius: 6,
                padding: "0 8px",
              }}
            >
              <span
                style={{
                  fontFamily: '"Inter Tight", sans-serif',
                  fontSize: 12,
                  color: "rgba(13,27,75,0.65)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Onboarding
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(0,0,0,0.35)",
                  marginLeft: 2,
                  cursor: "pointer",
                }}
              >
                ×
              </span>
            </div>
          </div>

          <SendButton
            buttonRef={sendRef}
            demoActive={demoActive}
            demoPressed={demoPressed}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Conversation                                */
/* -------------------------------------------------------------------------- */

type Segment = { text: string; bold?: boolean };
type Block = { type: "p" | "li"; segs: Segment[] };

const ANSWER: Block[] = [
  {
    type: "p",
    segs: [{ text: "Hey — I'm Mira, your first AI Employee.", bold: true }],
  },
  {
    type: "p",
    segs: [
      {
        text: "I don't wait in a dashboard for instructions. I see your screen, move your mouse and type on your keyboard, so I work inside the tools your team already uses.",
      },
    ],
  },
  {
    type: "p",
    segs: [{ text: "Here is what I can take off your plate this week:" }],
  },
  {
    type: "li",
    segs: [
      { text: "Research & outreach", bold: true },
      { text: " — build the lead list, enrich it, draft the first message." },
    ],
  },
  {
    type: "li",
    segs: [
      { text: "Inbox & tickets", bold: true },
      { text: " — triage every morning, answer the routine ones, escalate the rest." },
    ],
  },
  {
    type: "li",
    segs: [
      { text: "Reporting", bold: true },
      { text: " — pull the numbers on Monday and send the summary before you wake up." },
    ],
  },
  {
    type: "p",
    segs: [
      {
        text: "Tell me what your week looks like and I'll start with the most repetitive part.",
      },
    ],
  },
];

const ANSWER_LENGTH = ANSWER.reduce(
  (total, block) =>
    total + block.segs.reduce((sum, seg) => sum + seg.text.length, 0),
  0,
);

function UserBubble({ text, phone }: { text: string; phone: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
    >
      <div
        style={{
          maxWidth: "76%",
          background: "#E8F1FF",
          border: "1px solid rgba(34,106,205,0.06)",
          borderRadius: 18,
          padding: phone ? "9px 14px" : "10px 16px",
          fontFamily: '"Inter Tight", sans-serif',
          fontSize: phone ? 14 : 15,
          lineHeight: "22px",
          color: "#0D1B4B",
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, height: 22 }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.16,
          }}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#70A8F2",
          }}
        />
      ))}
    </div>
  );
}

const ACTION_ICONS = [Copy, Share, Volume2, ThumbsUp, ThumbsDown, MoreHorizontal];

function AnswerActions() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}
    >
      {ACTION_ICONS.map((Icon, i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Icon
            size={16}
            strokeWidth={1.6}
            color={
              hovered === i ? "rgba(13,27,75,0.75)" : "rgba(13,27,75,0.38)"
            }
            style={{ transition: "color 0.2s" }}
          />
        </button>
      ))}
    </motion.div>
  );
}

/** The answer streams in character by character across its formatted blocks. */
function MiraAnswer({
  streaming,
  onDone,
  phone,
}: {
  streaming: boolean;
  onDone: () => void;
  phone: boolean;
}) {
  const [revealed, setRevealed] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!streaming) return;
    let count = 0;
    let timer = 0;

    const step = () => {
      count += 2 + Math.floor(Math.random() * 4);
      setRevealed(Math.min(count, ANSWER_LENGTH));
      if (count >= ANSWER_LENGTH) {
        doneRef.current();
        return;
      }
      timer = window.setTimeout(step, 16);
    };

    timer = window.setTimeout(step, 16);
    return () => window.clearTimeout(timer);
  }, [streaming]);

  const size = phone ? 14 : 15;
  let consumed = 0;

  return (
    <div
      style={{
        fontFamily: '"Inter Tight", sans-serif',
        fontSize: size,
        lineHeight: "24px",
        color: "rgba(13,27,75,0.78)",
      }}
    >
      {ANSWER.map((block, bi) => {
        const parts = block.segs.map((seg) => {
          const start = consumed;
          consumed += seg.text.length;
          const visible = Math.max(
            0,
            Math.min(seg.text.length, revealed - start),
          );
          return { seg, shown: seg.text.slice(0, visible) };
        });

        if (!parts.some((part) => part.shown.length > 0)) return null;

        const content = parts.map((part, si) => (
          <span
            key={si}
            style={
              part.seg.bold
                ? { fontWeight: 600, color: "#11315D" }
                : undefined
            }
          >
            {part.shown}
          </span>
        ));

        if (block.type === "li") {
          return (
            <div
              key={bi}
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 6,
                paddingLeft: 2,
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#70A8F2",
                  marginTop: 9,
                }}
              />
              <span>{content}</span>
            </div>
          );
        }

        return (
          <p key={bi} style={{ margin: bi === 0 ? "0 0 10px" : "10px 0" }}>
            {content}
          </p>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Mira cursor demo timeline                       */
/* -------------------------------------------------------------------------- */

const CURSOR_SIZE = 30;
// The arrow tip sits at ~20% / 8% of the sprite; rotating around it keeps the
// tip glued to whatever the cursor is pointing at.
const CURSOR_ORIGIN = "20% 8%";

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

type ClickMark = { id: number; x: number; y: number };
/** hero → leaving (hero animates out) → chat (bar docked at the bottom) */
type Scene = "hero" | "leaving" | "chat";

const Index = () => {
  const layout = useLayout();
  const lineRef = useRef<HTMLDivElement>(null);
  const sendRef = useRef<HTMLDivElement>(null);
  const [cursorScope, animateCursor] = useAnimate();

  const [mode, setMode] = useState<TypeMode>("cycle");
  const [demoActive, setDemoActive] = useState(false);
  const [demoPressed, setDemoPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [clicks, setClicks] = useState<ClickMark[]>([]);

  const [scene, setScene] = useState<Scene>("hero");
  const [bubbleIn, setBubbleIn] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [answered, setAnswered] = useState(false);
  const onAnswerDone = useCallback(() => setAnswered(true), []);

  const emitClick = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    setClicks((current) => [...current, { id, x, y }]);
    window.setTimeout(
      () => setClicks((current) => current.filter((c) => c.id !== id)),
      700,
    );
  }, []);

  const typedResolve = useRef<(() => void) | null>(null);
  const onDemoTyped = useCallback(() => {
    typedResolve.current?.();
    typedResolve.current = null;
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    const stopped = () => cancelled || !cursorScope.current;

    const run = async () => {
      // Let the hero land first, the placeholder keeps cycling meanwhile.
      await wait(2600);
      if (stopped()) return;

      const line = lineRef.current?.getBoundingClientRect();
      const send = sendRef.current?.getBoundingClientRect();
      if (!line || !send) return;

      const el = cursorScope.current as HTMLElement;
      const toLine = {
        x: line.left + Math.min(62, line.width * 0.2),
        y: line.top + 15,
      };

      // 1 · the cursor walks in from the bottom left corner
      await animateCursor(
        el,
        {
          opacity: [0, 1],
          x: [-90, toLine.x],
          y: [window.innerHeight + 90, toLine.y],
          rotate: 0,
        },
        { duration: 1.35, ease: [0.22, 1, 0.36, 1] },
      );
      if (stopped()) return;

      // 2 · it clicks into the prompt bar: press, release, ripple
      await animateCursor(el, { scale: 0.78 }, { duration: 0.11, ease: "easeOut" });
      if (stopped()) return;
      emitClick(toLine.x, toLine.y);
      setFocused(true);
      await animateCursor(el, { scale: 1 }, { duration: 0.19, ease: "easeOut" });
      if (stopped()) return;

      // 3 · it types the prompt
      const typed = new Promise<void>((resolve) => {
        typedResolve.current = resolve;
      });
      setMode("demo");
      animateCursor(
        el,
        { y: [toLine.y, toLine.y - 3, toLine.y] },
        { duration: 0.42, repeat: Infinity, ease: "easeInOut" },
      );
      await typed;
      if (stopped()) return;
      setMode("hold");
      await wait(320);
      if (stopped()) return;

      // 4 · it turns around and heads for the send button, facing the button
      //     again as it lands so the arrow stays readable underneath.
      //     The rect is re-read here in case the layout moved meanwhile.
      const sendNow = sendRef.current?.getBoundingClientRect() ?? send;
      const toSend = {
        x: sendNow.left + sendNow.width / 2,
        y: sendNow.top + sendNow.height / 2,
      };
      await animateCursor(
        el,
        { x: toSend.x, y: toSend.y, rotate: [0, 200, 360] },
        {
          duration: 1.05,
          ease: [0.45, 0, 0.2, 1],
          rotate: { duration: 1.05, times: [0, 0.55, 1], ease: "easeInOut" },
        },
      );
      if (stopped()) return;
      setDemoActive(true);
      await wait(240);
      if (stopped()) return;

      // 5 · and clicks send for real: press down, fire the click, release
      await animateCursor(el, { scale: 0.76 }, { duration: 0.11, ease: "easeOut" });
      if (stopped()) return;
      setDemoPressed(true);
      emitClick(toSend.x, toSend.y);
      sendRef.current?.click();
      await animateCursor(el, { scale: 1 }, { duration: 0.22, ease: "easeOut" });
      if (stopped()) return;
      await wait(380);
      if (stopped()) return;

      // 6 · the message is sent: the hero clears out, the bar docks at the
      //     bottom and the conversation takes over the screen
      setDemoPressed(false);
      setDemoActive(false);
      setFocused(false);
      setMode("cycle");
      void animateCursor(
        el,
        { opacity: 0, y: toSend.y + 26 },
        { duration: 0.5, ease: "easeIn" },
      );
      setScene("leaving");
      await wait(430);
      if (stopped()) return;

      setScene("chat");
      await wait(300);
      if (stopped()) return;
      setBubbleIn(true);
      await wait(560);
      if (stopped()) return;
      setThinking(true);
      await wait(950);
      if (stopped()) return;
      setThinking(false);
      setStreaming(true);
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chat = scene === "chat";
  // room kept under the docked bar for the fixed footer line
  const footerSpace = layout.phone ? 66 : 52;

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        overflowX: "hidden",
        overflowY: chat ? "hidden" : layout.compact ? "auto" : "hidden",
        background: "#EEF1F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* the grids step back once the conversation owns the screen */}
      <PixelGrid
        side="left"
        dim={chat ? layout.gridDim * 0.45 : layout.gridDim}
        shift={layout.gridShift}
      />
      <PixelGrid
        side="right"
        dim={chat ? layout.gridDim * 0.45 : layout.gridDim}
        shift={layout.gridShift}
      />

      <Navbar />
      <Sidebar hidden={layout.compact} />

      <main
        style={{
          position: "relative",
          zIndex: 5,
          width: "100%",
          maxWidth: chat ? 760 : 760,
          padding: layout.compact ? "84px 16px 96px" : "0 16px",
          paddingTop: chat ? (layout.phone ? 76 : 92) : layout.compact ? 84 : 60,
          paddingBottom: chat ? footerSpace : layout.compact ? 96 : 0,
          height: chat ? "100dvh" : undefined,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: chat ? "flex-start" : undefined,
        }}
      >
        {chat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              flex: 1,
              width: "100%",
              maxWidth: 702,
              minHeight: 0,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 22,
              paddingBottom: 24,
            }}
          >
            {bubbleIn && (
              <UserBubble text={DEMO_PROMPT} phone={layout.phone} />
            )}
            {thinking && <ThinkingDots />}
            {streaming && (
              <div style={{ width: "100%" }}>
                <MiraAnswer
                  streaming={streaming}
                  onDone={onAnswerDone}
                  phone={layout.phone}
                />
                {answered && <AnswerActions />}
              </div>
            )}
          </motion.div>
        )}

        {!chat && (
          <motion.div
            animate={
              scene === "leaving"
                ? { opacity: 0, y: -26, scale: 0.97 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <FolderStack scale={layout.heroScale} />

        <motion.h1
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          style={{
            fontFamily: '"Inter Tight", sans-serif',
            fontSize: layout.headingSize,
            fontWeight: 400,
            lineHeight: `${layout.headingSize + 2}px`,
            letterSpacing: "-0.02em",
            color: "#11315D",
            width: layout.phone ? 300 : layout.compact ? 440 : 520,
            maxWidth: "100%",
            margin: layout.phone ? "24px auto 8px" : "32px auto 8px",
            textAlign: "center",
          }}
        >
          Create and hire your first AI Employee in minutes.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
          style={{
            fontFamily: '"Inter Tight", sans-serif',
            fontSize: layout.subtitleSize,
            fontWeight: 400,
            lineHeight: "20px",
            color: "rgba(13,27,75,0.50)",
            textAlign: "center",
            width: 560,
            maxWidth: "100%",
            marginBottom: 20,
          }}
        >
          It sees your screen, moves your mouse, types your keyboard and gets the
          job done while you sleep.
        </motion.p>
          </motion.div>
        )}

        {/* the bar itself never unmounts: it slides from the hero to the dock */}
        <motion.div
          layout
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <PromptBox
            lineRef={lineRef}
            sendRef={sendRef}
            mode={mode}
            onDemoTyped={onDemoTyped}
            demoActive={demoActive}
            demoPressed={demoPressed}
            focused={focused}
            phone={layout.phone}
          />
        </motion.div>
      </main>

      {/* click marks left by the Mira cursor */}
      {clicks.map((mark) => (
        <motion.span
          key={mark.id}
          initial={{ opacity: 0.6, scale: 0.35 }}
          animate={{ opacity: 0, scale: 2.6 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: mark.y,
            left: mark.x,
            width: 26,
            height: 26,
            marginTop: -13,
            marginLeft: -13,
            borderRadius: "50%",
            border: "1.5px solid rgba(61,130,222,0.6)",
            zIndex: 59,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* the Mira cursor that runs the demo */}
      <motion.img
        ref={cursorScope}
        src="/mira-logo.svg"
        alt=""
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          x: -90,
          y: 2000,
          opacity: 0,
          transformOrigin: CURSOR_ORIGIN,
          zIndex: 60,
          pointerEvents: "none",
          filter: "drop-shadow(0 8px 16px rgba(61,130,222,0.35))",
        }}
      />

      <footer
        style={{
          position: "fixed",
          bottom: 20,
          left: 0,
          width: "100%",
          zIndex: 5,
          padding: "0 16px",
          textAlign: "center",
          fontFamily: '"Inter Tight", sans-serif',
          fontSize: layout.phone ? 11 : 13,
          lineHeight: layout.phone ? "15px" : "normal",
          fontWeight: 400,
          color: "rgba(13,27,75,0.45)",
        }}
      >
        By sending a message to ChatBot, you agree to our{" "}
        <span
          style={{
            color: "rgba(13,27,75,0.65)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
            cursor: "pointer",
          }}
        >
          Terms
        </span>{" "}
        and have read our{" "}
        <span
          style={{
            color: "rgba(13,27,75,0.65)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
            cursor: "pointer",
          }}
        >
          Privacy Policy.
        </span>
      </footer>
    </div>
  );
};

export default Index;
