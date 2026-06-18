import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

/** "3.6m" / "3.6 m" -> "3,6 m" (French formatting, matches the Jaws deck). */
function formatCeiling(v) {
  if (!v) return "";
  const num = v.match(/[\d.,]+/);
  if (!num) return v;
  return `${num[0].replace(".", ",")} m`;
}

/** Words that signal sensitive/commercial content we must never surface. */
const SENSITIVE_RX =
  /(prix|tarif|€|caution|acompte|remboursement|frais de service|politique d.?annulation|annulez|hôte vous propose|petit.?déjeuner|ménage|deposit|booking)/i;

/**
 * Fetch + parse a wearescene "/fr/lieu/..." page into a clean, client-safe
 * record. Deterministic DOM parsing — no AI, no guessing.
 */
export async function scrapeListing(url) {
  const u = new URL(url);
  if (!/wearescene\.com$/i.test(u.hostname.replace(/^www\./, "")) || !/\/lieu\//.test(u.pathname)) {
    throw new Error(`URL non reconnue (attendu wearescene.com/.../lieu/...): ${url}`);
  }

  const res = await fetch(u.toString(), { headers: { "User-Agent": UA, "Accept-Language": "fr" } });
  if (!res.ok) throw new Error(`Fiche inaccessible (${res.status}) : ${url}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  // --- Title ---
  const title = clean($('h1[itemprop="name"]').first().text()) || clean($("h1").first().text());

  // --- Address (schema.org microdata) ---
  const addr = $('[itemprop="address"]').first();
  const street = clean(addr.find('[itemprop="streetAddress"]').text());
  const postal = clean(addr.find('[itemprop="postalCode"]').text());
  const locality = clean(addr.find('[itemprop="addressLocality"]').text()).replace(/,\s*France.*$/i, "");
  const city = (locality.split(",")[0] || "").trim();
  const address = [street, [postal, locality].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  // --- Stats (label .text-purple-4/80 -> value in parent) ---
  const stats = {};
  $('span[class*="text-purple-4/80"]').each((_, el) => {
    const label = clean($(el).text());
    if (!label) return;
    const value = clean(clean($(el).parent().text()).replace(label, ""));
    if (value) stats[label.toLowerCase()] = value;
  });
  const pick = (...keys) => {
    for (const k of keys) {
      const hit = Object.keys(stats).find((s) => s.includes(k));
      if (hit) return stats[hit];
    }
    return "";
  };
  const surface = pick("surface");
  const rawCapacity = pick("équipe", "capacit", "personne");
  const capacity = rawCapacity
    ? `Jusqu'à ${rawCapacity.replace(/\s*pers\.?/i, "").trim()} personnes`
    : "";
  const rooms = pick("pièce");
  const floor = pick("étage");
  const ceiling = formatCeiling(pick("hauteur"));

  // --- Description (schema.org, already excludes price/caution/services) ---
  // Block-aware: collect each paragraph separately (DOM .text() drops the
  // whitespace between block elements, so we walk paragraphs explicitly).
  const descRoot = $('[itemprop="description"]').filter((_, el) => $(el).children().length > 0).first();
  let paragraphs = [];
  if (descRoot.length) {
    descRoot.find("p").each((_, el) => {
      const t = clean($(el).text());
      if (t) paragraphs.push(t);
    });
    if (paragraphs.length === 0) {
      // no <p> wrappers — fall back to inserting breaks at sentence joins
      paragraphs = clean(descRoot.text())
        .split(/(?<=[.!?)])(?=[A-ZÀ-Ý])/)
        .map(clean)
        .filter(Boolean);
    }
  }
  if (paragraphs.length === 0) {
    const meta = clean($('meta[name="description"]').attr("content"));
    if (meta) paragraphs = [meta];
  }
  // Defensive: drop any paragraph carrying sensitive/commercial wording.
  paragraphs = paragraphs.filter((p) => !SENSITIVE_RX.test(p));
  const description = paragraphs.join("\n\n");

  // --- Ambiances (chips in <section> following the "Ambiances" label) ---
  const ambiances = [];
  const ambLabel = $("p, h2, h3, span")
    .filter((_, el) => /^Ambiances?$/i.test(clean($(el).text())))
    .first();
  if (ambLabel.length) {
    const section = ambLabel.nextAll("section").first().length
      ? ambLabel.nextAll("section").first()
      : ambLabel.parent().find("section").first();
    section.find("*").addBack().each((_, el) => {
      if ($(el).children().length === 0) {
        const t = clean($(el).text());
        if (t && t.length < 40 && !/^Ambiance/i.test(t) && !ambiances.includes(t)) ambiances.push(t);
      }
    });
  }

  // --- Equipments (chips in the grid under the heading) ---
  const equipments = [];
  const equipH = $("h2, h3")
    .filter((_, el) => /Équipements?\s*&|Équipements?\s*et/i.test(clean($(el).text())))
    .first();
  if (equipH.length) {
    const grid = equipH.parent().find('[class*="grid"]').first();
    const scope = grid.length ? grid : equipH.parent();
    scope.find("*").each((_, el) => {
      if ($(el).children().length === 0) {
        const t = clean($(el).text());
        if (
          t &&
          t.length < 40 &&
          !/^\d+$/.test(t) &&
          !/voir|équipement|caractéristique/i.test(t) &&
          !equipments.includes(t)
        )
          equipments.push(t);
      }
    });
  }

  // --- Transport / access line (derived from the description paragraphs) ---
  const accessSentence = paragraphs
    .flatMap((p) => p.split(/(?<=[.!?])\s+/))
    .find((s) => /(métro|metro|bus|tram|rer|ligne|station|gare|parking|aéroport)/i.test(s));
  let access = accessSentence ? clean(accessSentence).replace(/\.$/, "") : "";
  // Only trim when actually too long — and then cut on a word boundary + ellipsis
  // (a standard, short access line is left exactly as-is).
  if (access.length > 130) {
    access = access.slice(0, 130).replace(/\s+\S*$/, "").trimEnd() + "…";
  }

  // --- Images: ONLY the listing's own gallery (hero + photos) ---
  // wearescene tags every gallery photo with alt="Espace <title>" and renders
  // them inside the page's <article>, while similar-listing cards live inside
  // <a> links and review/comment avatars carry a person's name as alt. So we
  // keep an <img> only when its alt matches this listing's title AND it is not
  // inside a link — which excludes other listings, avatars and logos.
  const tokenRe = /url=(https%3A%2F%2Fi\.wearescene\.com%2F[^"&\\]+)/i;
  const titleKey = title.toLowerCase();
  const seen = new Set();
  const images = [];
  const pushTok = (raw) => {
    const m = tokenRe.exec(raw || "");
    if (!m || seen.has(m[1])) return;
    seen.add(m[1]);
    images.push(`https://www.wearescene.com/_next/image?url=${m[1]}&w=1080&q=70`);
  };
  $("img").each((_, el) => {
    const $img = $(el);
    const alt = clean($img.attr("alt")).toLowerCase();
    if (!titleKey || !alt.includes(titleKey)) return; // not this listing's photo
    if ($img.closest("a").length) return; // inside a card link → another listing
    // srcset holds the same image at several widths; the token is identical, so
    // src alone is enough (we rebuild the width ourselves).
    pushTok($img.attr("src") || $img.attr("srcset") || "");
  });

  // Fallback: if the alt convention ever changes, take images before the
  // "espaces similaires" block so the deck still has the listing's photos.
  if (images.length === 0) {
    const galleryHtml = html.split(/espaces?\s+similaires/i)[0];
    const re = /url=(https%3A%2F%2Fi\.wearescene\.com%2F[^"&\\]+)/gi;
    let m;
    while ((m = re.exec(galleryHtml)) !== null) pushTok(m[0]);
  }

  if (!title) throw new Error(`Impossible d'extraire les données : ${url}`);

  return {
    url: u.toString(),
    title,
    city,
    address,
    surface,
    capacity,
    rooms,
    floor,
    ceiling,
    access,
    description,
    ambiances,
    equipments,
    images,
  };
}
