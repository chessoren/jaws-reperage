# Mira landing page

Single-page React + Vite + TypeScript + Tailwind (shadcn-ui base) recreation of
the Mira / SixSense hero page.

## Run

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # typecheck + production build
npm run preview
```

## Where the code lives

Everything page-specific is in two files — the rest is the default Vite +
shadcn-ui boilerplate:

- `src/pages/Index.tsx` — the whole page (pixel-grid background, navbar,
  sidebar, folder/lights stack, floating cards, heading, prompt box with
  typewriter, send button, footer).
- `src/index.css` — Inter Tight on `html, body, #root`, the default shadcn HSL
  tokens and the `promptCaretBlink` keyframes.

## Assets

- Remote assets are loaded from `const A = "https://qclay.design/lovable/sixsense"`
  (logos, folders, lights, card images, toolbar icons, arrow, dots).
- Local tile sprites live in `public/tiles/`: `tile-empty.svg` plus
  `tile-1.svg` … `tile-5.svg`, used by the canvas pixel grid. They are
  rasterized once at `devicePixelRatio` (capped at 2) into offscreen canvases
  through a module-level promise cache.

## Pixel grid

12 × 16 cells, 32 px tiles with a 1 px gap, mirrored left and right behind the
content with a radial mask. On mount it reveals ~35 % of the cells in a
shuffled order (`ceil(total / 18)` tiles per animation frame), then flickers
ambiently. A window-level pointer listener drives an organic hover blob
(base radius of 4 cells, sine-modulated with deterministic edge noise) where
cells light up at a 0.7 fill ratio. `prefers-reduced-motion: reduce` skips the
reveal, flicker and hover entirely and paints the final base state.
