import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
import { buildSlideDocs } from "./template.mjs";

let browserPromise = null;
async function getBrowser() {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    if (b && b.connected) return b;
    browserPromise = null; // stale/crashed — relaunch below
  }
  browserPromise = puppeteer.launch({
    headless: true,
    // In Docker/production we point at the system Chromium via this env var;
    // locally it's undefined and puppeteer uses its own bundled download.
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const b = await browserPromise;
  b.on("disconnected", () => {
    browserPromise = null;
  });
  return b;
}

/**
 * Runs IN THE PAGE after fonts load. Adaptive, no-op on standard content:
 * it only acts when a slide actually overflows its 1280×720 box. For a place
 * slide it drops trailing secondary paragraphs, then shrinks text uniformly
 * until the left column fits; for the cover it shrinks the listing rows until
 * they stop colliding with the footer. Slides that already fit are untouched,
 * so the standard output is byte-for-byte identical to before.
 */
function fitSlideToBox() {
  const TOL = 2;
  const fits = (el) => el.scrollHeight <= el.clientHeight + TOL;

  // --- Place slide: left text column ---
  const left = document.querySelector(".left");
  if (left && !fits(left)) {
    // (1) Drop the least essential blocks first: trailing body paragraphs.
    const bodies = [...left.querySelectorAll("p.body")];
    for (let i = bodies.length - 1; i >= 0 && !fits(left); i--) bodies[i].remove();

    // (2) Still too tall → shrink every text block uniformly until it fits.
    if (!fits(left)) {
      const els = [
        ...left.querySelectorAll(
          ".place-title,.place-loc,.lead,.body,.section-h,.pill,.stat-v,.stat-l,.note,.left-foot",
        ),
      ];
      const base = els.map((e) => parseFloat(getComputedStyle(e).fontSize));
      for (let s = 0.96; s >= 0.72 && !fits(left); s -= 0.04) {
        els.forEach((e, i) => {
          e.style.fontSize = (base[i] * s).toFixed(2) + "px";
        });
      }
    }
  }

  // --- Cover slide: numbered list must not collide with the footer ---
  const list = document.querySelector(".cover-list");
  const foot = document.querySelector(".cover-foot");
  if (list && foot) {
    const overlaps = () => list.getBoundingClientRect().bottom > foot.getBoundingClientRect().top - 8;
    if (overlaps()) {
      const items = [...list.querySelectorAll("li")];
      // Keep each entry on a single line (ellipsis) so long titles can't wrap
      // and balloon the list height — the main driver of collisions.
      items.forEach((li) => {
        const txt = li.querySelector(".li-txt");
        if (txt) {
          txt.style.whiteSpace = "nowrap";
          txt.style.overflow = "hidden";
          txt.style.textOverflow = "ellipsis";
          txt.style.minWidth = "0";
          txt.style.flex = "1";
        }
        li.style.overflow = "hidden";
        li.style.lineHeight = "1.15";
      });
      // Reclaim the list's top margin first (cheap, invisible), then shrink rows.
      if (overlaps()) list.style.marginTop = "16px";
      const baseFs = items.map((e) => parseFloat(getComputedStyle(e).fontSize));
      const basePad = items.map((e) => parseFloat(getComputedStyle(e).paddingTop));
      for (let s = 0.94; s >= 0.38 && overlaps(); s -= 0.03) {
        items.forEach((e, i) => {
          e.style.fontSize = (baseFs[i] * s).toFixed(2) + "px";
          const pad = (basePad[i] * s).toFixed(2) + "px";
          e.style.paddingTop = pad;
          e.style.paddingBottom = pad;
        });
      }
    }
  }
}

/** Render one slide HTML document to a single-page PDF buffer. */
async function renderSlide(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });
    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });
    await page.evaluate(fitSlideToBox);
    return await page.pdf({
      width: "1280px",
      height: "720px",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await page.close();
  }
}

/**
 * Render the deck (cover + one page per location) to a single PDF Buffer.
 * Slides are rendered one at a time and merged, keeping memory bounded so the
 * tool works reliably regardless of how many locations are requested.
 */
export async function renderDeckPdf(places) {
  const docs = buildSlideDocs(places);
  const merged = await PDFDocument.create();

  for (const html of docs) {
    const buf = await renderSlideResilient(html);
    const part = await PDFDocument.load(buf);
    const [pg] = await merged.copyPages(part, [0]);
    merged.addPage(pg);
  }

  const bytes = await merged.save();
  return Buffer.from(bytes);
}

async function renderSlideResilient(html) {
  try {
    return await renderSlide(html);
  } catch (e) {
    if (/closed|disconnected|Target|crash/i.test(e.message || "")) {
      browserPromise = null; // force a fresh browser and retry once
      return await renderSlide(html);
    }
    throw e;
  }
}

export async function closeBrowser() {
  if (browserPromise) {
    const b = await browserPromise.catch(() => null);
    if (b) await b.close();
    browserPromise = null;
  }
}
