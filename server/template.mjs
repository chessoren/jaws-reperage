// Jaws Group deck template — renders a client-safe location presentation that
// matches the Jaws charter (cover + one page per location), 1280×720 slides.

const JAWS_SVG = `<svg viewBox="0 0 1085 368" fill="none" xmlns="http://www.w3.org/2000/svg" class="jaws-svg">
<path d="M362.984 279.132V234.066C351.027 262.117 313.779 281.891 275.152 281.891C195.597 281.891 143.634 225.789 143.634 140.716C143.634 56.103 195.137 0.000976562 275.152 0.000976562C313.32 0.000976562 351.027 19.7747 362.984 48.2855V3.21994H420.465V279.132H362.984ZM201.115 140.716C201.115 191.3 234.225 224.409 282.509 224.409C330.334 224.409 363.444 190.84 362.984 141.176C362.984 91.9716 328.955 57.4826 282.05 57.4826C233.765 57.4826 201.115 90.592 201.115 140.716Z" class="p-jaw"/>
<path d="M117.722 3.2207L117.722 272.922C117.722 340.98 89.6713 367.652 23.9124 367.652H0V311.09H18.3941C47.3649 311.09 60.2407 298.214 60.2407 269.703L60.2399 3.2207H117.722Z" class="p-jaw"/>
<path d="M875.729 189H930.451C931.371 213.372 954.823 232.686 983.334 233.145C1009.55 233.145 1027.02 221.649 1027.02 202.335C1027.02 179.343 1006.79 169.686 969.998 159.569C928.612 147.613 884.466 133.357 884.466 79.0947C884.466 29.4306 927.232 0 982.414 0C1037.6 0 1075.76 34.0291 1078.98 85.5326H1027.48C1025.18 64.8393 1006.33 48.7444 981.955 48.7444C959.422 48.7444 941.947 60.7006 941.947 78.6348C941.487 101.628 969.998 108.525 990.232 113.584C1031.62 124.16 1084.5 137.036 1084.5 201.875C1084.5 248.321 1040.82 281.89 981.495 281.89C929.531 281.89 876.648 247.401 875.729 189Z" class="p-jaw"/>
<path d="M519.367 198.114C519.368 212.969 531.413 225.011 546.268 225.011C561.122 225.01 573.163 212.968 573.164 198.114V87.8213C573.164 41.691 610.559 4.29368 656.689 4.29297C702.82 4.29297 740.218 41.6906 740.218 87.8213V200.766C740.218 214.155 751.073 225.011 764.463 225.011C777.852 225.01 788.706 214.155 788.706 200.766V87.0811C788.706 86.3745 788.716 85.6701 788.733 84.9678V3.06738H846.027V109.753H846.077V200.766C846.077 245.84 809.537 282.381 764.463 282.382C719.388 282.382 682.847 245.84 682.847 200.766V87.8213C682.847 73.3757 671.135 61.6641 656.689 61.6641C642.244 61.6648 630.535 73.3761 630.535 87.8213V198.114C630.535 244.653 592.807 282.381 546.268 282.382C499.728 282.382 462 244.654 461.999 198.114V2.38184H519.367V198.114Z" fill="url(#jaws_grad)"/>
<defs><linearGradient id="jaws_grad" x1="475.57" y1="129.392" x2="832.506" y2="129.392" gradientUnits="userSpaceOnUse">
<stop stop-color="#5563F6"/><stop offset="0.46709" stop-color="#FF2158"/><stop offset="0.740385" stop-color="#FF592C"/><stop offset="1" stop-color="#F79D2F"/>
</linearGradient></defs></svg>`;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const monthsFr = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
function frDate(d = new Date()) {
  return `${String(d.getDate()).padStart(2, "0")} ${monthsFr[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

const pad2 = (n) => String(n).padStart(2, "0");

function locationLine(p) {
  const bits = [p.city, p.address?.replace(p.city, "").replace(/^[,\s]+/, "")].filter(Boolean);
  return (p.city ? p.city.toUpperCase() : p.title).toUpperCase();
}

function keywords(p) {
  return (p.ambiances || []).slice(0, 3).map((a) => a.toUpperCase()).join(" · ");
}

function statCard(label, value) {
  if (!value) return "";
  return `<div class="stat"><div class="stat-l">${esc(label)}</div><div class="stat-v">${esc(value)}</div></div>`;
}

function pills(items, max) {
  return (items || [])
    .slice(0, max)
    .map((i) => `<span class="pill">${esc(i)}</span>`)
    .join("");
}

function coverSlide(places) {
  const list = places
    .map(
      (p, i) => `<li><span class="num">${pad2(i + 1)}</span>
        <span class="li-txt">${esc(p.title)}${p.city ? ` <span class="li-city">— ${esc(p.city)}</span>` : ""}</span></li>`,
    )
    .join("");
  return `<section class="slide cover">
    <div class="cover-grad"></div>
    <div class="cover-vignette"></div>
    <div class="cover-top"><span class="logo white sm">${JAWS_SVG}</span></div>
    <div class="cover-body">
      <div class="eyebrow">Repérage &amp; production audiovisuelle</div>
      <h1 class="cover-title">Lieux de tournage<br/>&amp; shootings d'exception</h1>
      <p class="cover-sub">Une sélection de ${places.length} espace${places.length > 1 ? "s" : ""}, choisis pour leur caractère, leur lumière et leur polyvalence.</p>
      <ol class="cover-list">${list}</ol>
    </div>
    <div class="cover-foot">
      <span>Sélection de lieux · ${frDate()}</span>
      <span class="logo brand sm foot-logo">${JAWS_SVG}</span>
    </div>
  </section>`;
}

function placeSlide(p, index, total) {
  const hero = p.images?.[0];
  const thumbs = (p.images || []).slice(1, 5);
  const thumbHtml = thumbs
    .map((src) => `<div class="thumb" style="background-image:url('${esc(src)}')"></div>`)
    .join("");
  const paras = (p.description || "").split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  const lead = paras[0] || "";
  const rest = paras.slice(1, 3);

  return `<section class="slide place">
    <div class="left">
      <span class="logo white sm">${JAWS_SVG}</span>
      <div class="eyebrow">Lieu ${pad2(index + 1)} · Espace de tournage &amp; shooting</div>
      <h2 class="place-title">${esc(p.title)}</h2>
      <div class="place-loc">${esc(locationLine(p))}</div>
      ${lead ? `<p class="lead">${esc(lead)}</p>` : ""}
      <div class="stats">
        ${statCard("Surface", p.surface)}
        ${statCard("Capacité", p.capacity)}
        ${statCard("Étage", p.floor)}
        ${statCard(p.ceiling ? "Hauteur sous plafond" : "Pièces", p.ceiling || p.rooms)}
      </div>
      ${rest.map((r) => `<p class="body">${esc(r)}</p>`).join("")}
      ${
        p.ambiances?.length
          ? `<div class="section-h">Ambiances</div><div class="pills">${pills(p.ambiances, 7)}</div>`
          : ""
      }
      ${
        p.equipments?.length
          ? `<div class="section-h">Équipements &amp; caractéristiques</div><div class="pills">${pills(p.equipments, 8)}</div>`
          : ""
      }
      ${p.access ? `<div class="note"><span class="dot"></span>${esc(p.access)}</div>` : ""}
      <div class="left-foot">Sélection de lieux de tournage</div>
    </div>
    <div class="right">
      ${hero ? `<div class="hero" style="background-image:url('${esc(hero)}')"></div>` : ""}
      ${thumbHtml ? `<div class="mosaic">${thumbHtml}</div>` : ""}
      <div class="right-foot">
        <span class="kw">${esc(keywords(p))}</span>
        <span class="pageno">${pad2(index + 1)} / ${pad2(total)}</span>
      </div>
      <span class="logo brand sm corner-logo">${JAWS_SVG}</span>
    </div>
  </section>`;
}

function docWrap(bodyHtml) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>${CSS}</style></head><body>${bodyHtml}</body></html>`;
}

/** Full single-document deck (used for fast on-screen preview / debugging). */
export function buildDeckHtml(places) {
  const slides = [coverSlide(places), ...places.map((p, i) => placeSlide(p, i, places.length))].join("\n");
  return docWrap(slides);
}

/**
 * One self-contained HTML document per slide. Rendering slides individually
 * keeps only a single slide's images in memory at a time, so generation stays
 * lean and never OOMs on large selections.
 */
export function buildSlideDocs(places) {
  return [
    docWrap(coverSlide(places)),
    ...places.map((p, i) => docWrap(placeSlide(p, i, places.length))),
  ];
}

const CSS = `
* { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
:root{
  --ink:#0b0b0c; --orange:#ff592c; --amber:#f79d2f;
  --muted:rgba(255,255,255,0.55); --muted2:rgba(255,255,255,0.42);
  --line:rgba(255,255,255,0.13);
}
html,body{ background:var(--ink); color:#fff; font-family:"Inter",system-ui,sans-serif; }
.slide{
  position:relative; width:1280px; height:720px; overflow:hidden;
  background:var(--ink); page-break-after:always; break-after:page;
}
.slide:last-child{ page-break-after:auto; break-after:auto; }

/* JAWS logo */
.jaws-svg{ display:block; height:100%; width:auto; }
.logo{ display:inline-block; line-height:0; }
.logo.sm .jaws-svg{ height:20px; }
.logo.white .p-jaw{ fill:#fff; } .logo.white .jaws-svg path{ fill:#fff !important; }
.logo.brand .p-jaw{ fill:#fff; }

.eyebrow{ color:var(--orange); font-weight:600; font-size:11px; letter-spacing:.22em; text-transform:uppercase; }

/* ---------- COVER ---------- */
.cover{ background:var(--ink); }
.cover-grad{ position:absolute; inset:0;
  background:
    radial-gradient(62% 80% at 16% 20%, #5563f6 0%, rgba(85,99,246,0) 55%),
    radial-gradient(70% 95% at 82% 40%, #ff2158 0%, rgba(255,33,88,0) 55%),
    radial-gradient(60% 80% at 95% 92%, #f79d2f 0%, rgba(247,157,47,0) 52%),
    radial-gradient(58% 70% at 62% 74%, #ff592c 0%, rgba(255,89,44,0) 55%),
    #0b0b0c;
}
.cover-vignette{ position:absolute; inset:0;
  background:linear-gradient(90deg, rgba(11,11,12,0.92) 0%, rgba(11,11,12,0.55) 38%, rgba(11,11,12,0.1) 65%, rgba(11,11,12,0.35) 100%);
}
.cover-top{ position:absolute; top:46px; left:56px; z-index:2; }
.cover-body{ position:absolute; left:56px; top:150px; right:56px; z-index:2; max-width:760px; }
.cover-title{ font-size:62px; font-weight:700; line-height:1.04; letter-spacing:-0.02em; margin:18px 0 0; }
.cover-sub{ color:rgba(255,255,255,0.7); font-size:15px; line-height:1.5; margin-top:18px; max-width:560px; }
.cover-list{ list-style:none; margin-top:40px; max-width:560px; }
.cover-list li{ display:flex; align-items:center; gap:18px; padding:13px 0; border-top:1px solid var(--line); font-size:15px; }
.cover-list li:last-child{ border-bottom:1px solid var(--line); }
.cover-list .num{ color:var(--orange); font-weight:600; font-variant-numeric:tabular-nums; width:24px; }
.li-city{ color:var(--muted); }
.cover-foot{ position:absolute; left:56px; right:56px; bottom:40px; display:flex; align-items:flex-end; justify-content:space-between; z-index:2; color:var(--muted); font-size:11px; letter-spacing:.08em; text-transform:uppercase; }
.foot-logo .jaws-svg{ height:30px; }

/* ---------- PLACE ---------- */
.place{ display:flex; }
.left{ width:512px; flex:0 0 512px; padding:46px 40px 40px 56px; position:relative; display:flex; flex-direction:column; }
.right{ flex:1; position:relative; padding:18px 18px 18px 0; display:flex; flex-direction:column; gap:10px; }

.left .logo{ margin-bottom:26px; }
.place-title{ font-size:29px; font-weight:700; line-height:1.1; letter-spacing:-0.015em; margin:14px 0 8px; }
.place-loc{ color:var(--muted); font-size:11px; letter-spacing:.18em; text-transform:uppercase; }
.lead{ color:rgba(255,255,255,0.78); font-size:12.5px; line-height:1.5; margin-top:14px; }

.stats{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:20px 0; }
.stat{ border:1px solid var(--line); border-radius:11px; padding:12px 14px; background:rgba(255,255,255,0.02); }
.stat-l{ color:var(--muted2); font-size:9px; letter-spacing:.16em; text-transform:uppercase; margin-bottom:5px; }
.stat-v{ font-size:15px; font-weight:600; }

.body{ color:var(--muted); font-size:11px; line-height:1.5; margin-bottom:8px; }
.section-h{ color:var(--orange); font-weight:600; font-size:10px; letter-spacing:.18em; text-transform:uppercase; margin:12px 0 9px; }
.pills{ display:flex; flex-wrap:wrap; gap:7px; }
.pill{ border:1px solid var(--line); border-radius:999px; padding:5px 12px; font-size:10.5px; color:rgba(255,255,255,0.82); white-space:nowrap; }
.note{ display:flex; align-items:center; gap:8px; margin-top:14px; color:var(--muted); font-size:10px; }
.note .dot{ width:6px; height:6px; border-radius:50%; background:var(--orange); flex:0 0 6px; }
.left-foot{ margin-top:auto; color:var(--muted2); font-size:9px; letter-spacing:.14em; text-transform:uppercase; padding-top:18px; }

.hero{ width:100%; height:362px; border-radius:10px; background-size:cover; background-position:center; background-color:#1a1a1c; }
.mosaic{ flex:1; display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
.thumb{ border-radius:10px; background-size:cover; background-position:center; background-color:#1a1a1c; }
.right-foot{ position:absolute; right:84px; bottom:24px; display:flex; align-items:center; gap:18px; color:var(--muted2); font-size:9px; letter-spacing:.16em; text-transform:uppercase; }
.right-foot .pageno{ color:var(--muted); }
.corner-logo{ position:absolute; right:18px; bottom:18px; }
.corner-logo .jaws-svg{ height:26px; }
`;
