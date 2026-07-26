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

Everything the page renders is served from `public/`, so no image depends on a
third party host:

- `public/mira-logo.svg` — the Mira cursor logo (navbar + the animated cursor).
- `public/assets/` — folders, lights, reference cards, toolbar icons, arrow and
  dot texture.
- `public/tiles/` — `tile-empty.svg` plus `tile-1.svg` … `tile-5.svg`, used by
  the canvas pixel grid. They are rasterized once at `devicePixelRatio` (capped
  at 2) into offscreen canvases through a module-level promise cache.

`Index.tsx` still knows the original remote artwork host
(`const A = "https://qclay.design/lovable/sixsense"`). Set `USE_REMOTE_ASSETS`
to `true` to load from it instead; every `<img>` keeps an `onError` handler that
falls back to its local twin, so a failed remote request can never leave a
broken image on screen.

The Google Fonts stylesheet is loaded with `rel="preload"` + `onload` rather
than as a blocking stylesheet: a slow font request would otherwise hold back the
first paint and freeze every rAF-driven animation until it resolves.

## Cursor demo

2.6 s after load the Mira cursor walks in from the bottom left corner, clicks
into the prompt bar, types *"Hey, what can Mira do for me?"*, turns around on
its way to the send button and clicks it (ripple, shine sweep and the eased
conic spin all fire). It then fades out and the placeholder resumes cycling.
The whole sequence is skipped under `prefers-reduced-motion: reduce`.

## Pixel grid

12 × 16 cells, 32 px tiles with a 1 px gap, mirrored left and right behind the
content with a radial mask. On mount it reveals ~35 % of the cells in a
shuffled order (`ceil(total / 18)` tiles per animation frame), then flickers
ambiently. A window-level pointer listener drives an organic hover blob
(base radius of 4 cells, sine-modulated with deterministic edge noise) where
cells light up at a 0.7 fill ratio. `prefers-reduced-motion: reduce` skips the
reveal, flicker and hover entirely and paints the final base state.
