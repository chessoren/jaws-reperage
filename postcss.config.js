// Local (empty) PostCSS config so Vite does NOT walk up the directory tree and
// inherit the parent project's Tailwind v3 PostCSS pipeline. Tailwind v4 is
// handled by the @tailwindcss/vite plugin, not PostCSS.
export default { plugins: {} };
