import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scrapeListing } from "./scrape.mjs";
import { renderDeckPdf } from "./pdf.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Scrape only (debug / preview of extracted data)
app.post("/api/scrape", async (req, res) => {
  try {
    const urls = normalizeUrls(req.body?.urls);
    if (!urls.length) return res.status(400).json({ error: "Aucune URL fournie." });
    const places = [];
    for (const url of urls) places.push(await scrapeListing(url));
    res.json({ places });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Scrape + generate the Jaws PDF
app.post("/api/generate", async (req, res) => {
  try {
    const urls = normalizeUrls(req.body?.urls);
    if (!urls.length) return res.status(400).json({ error: "Aucune URL fournie." });

    const places = [];
    const errors = [];
    const failed = [];
    for (const url of urls) {
      try {
        places.push(await scrapeListing(url));
      } catch (e) {
        errors.push(`${url} — ${e.message}`);
        failed.push(url);
      }
    }
    if (!places.length) {
      return res
        .status(422)
        .json({ error: `Aucun lieu extrait. ${errors.join(" | ")}`, failed });
    }

    const pdf = await renderDeckPdf(places);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="reperage-jaws.pdf"');
    if (failed.length) {
      res.setHeader("X-Scrape-Warnings", encodeURIComponent(errors.join(" | ")));
      res.setHeader("X-Failed-Urls", encodeURIComponent(JSON.stringify(failed)));
    }
    res.end(pdf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

function normalizeUrls(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .filter((s, i, a) => a.indexOf(s) === i);
}

// In production the same server also serves the built front-end, so the app
// and its API share one origin (no proxy, no CORS, single deploy). Inert in
// local dev where the front-end is served by Vite and dist/ doesn't exist.
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`));
