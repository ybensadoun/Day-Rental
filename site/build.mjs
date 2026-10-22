// Day rental site build. No dependencies. Run: node build.mjs
// House facts, brand and photos are read from the guide folder (the single master copy)
// and copied into dist/ at build time. dist/ is gitignored, so there is never a second copy in source.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const GUIDE = process.env.CLK_GUIDE || path.resolve(here, "..", "..", "Guest Guides", "sites", "ca-la-kimberly");
const OUT = path.join(here, "dist");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const offer = readJson(path.join(here, "offer.json"));
const i18n = readJson(path.join(here, "src", "i18n.json"));
const site = readJson(path.join(GUIDE, "site.json"));
const housePage = readJson(path.join(GUIDE, "content", "house-page.json"));

// Typography (Guest Guides/docs/TYPOGRAPHY.md). typo() is the language-independent part of the engine's
// typo() (engine/src/i18n.js): no-break space between a number and its unit or symbol (24 h, 25 €).
const NB = "\u00A0";
const typo = (s) => String(s)
  .replace(/(\d)[ \u00A0](km|m|cm|mm|min|h|kg|g|%|€|°C|°)(?=$|[\s.,;:!?)\]»”“])/g, "$1" + NB + "$2")
  .replace(/€ (?=\d)/g, "€" + NB);
const esc = (s) => typo(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const LOCALES = { ca: "ca-ES", es: "es-ES", en: "en-GB" };
const eur = (n, l) => new Intl.NumberFormat(LOCALES[l], { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

// ---- copy assets from the guide (read only) ----
try { fs.rmSync(OUT, { recursive: true, force: true }); } catch (e) { console.warn("Could not clear dist/ (" + e.code + "), overwriting files instead."); }
fs.mkdirSync(path.join(OUT, "img"), { recursive: true });
const copy = (rel, dest) => {
  const from = path.join(GUIDE, "public", rel);
  if (!fs.existsSync(from)) throw new Error(`Missing in guide: public/${rel}`);
  fs.copyFileSync(from, path.join(OUT, "img", dest));
  return `/img/${dest}`;
};
const img = {
  logo: copy(site.logo, "logo.png"),
  favicon: copy("favicon.png", "favicon.png"),
  touch: copy("apple-touch-icon.png", "apple-touch-icon.png"),
  hero: copy(offer.images.hero, "hero.jpg"),
  share: copy(offer.images.share, "share.jpg"),
  gallery: offer.images.gallery.map((g, i) => ({ src: copy(g.file, `g${i + 1}.jpg`), alt: g.alt })),
};
fs.copyFileSync(path.join(here, "src", "style.css"), path.join(OUT, "style.css"));

const LANGS = ["ca", "es", "en"];

// Same checks as the engine's check-content.js: the build fails on a typography error.
const errors = [];
const walk = (v, l, w) => {
  if (Array.isArray(v)) return v.forEach((x, i) => walk(x, l, `${w}[${i}]`));
  if (v && typeof v === "object") return Object.entries(v).forEach(([k, x]) => walk(x, l, `${w}.${k}`));
  if (typeof v !== "string") return;
  if (/[\u2014\u2013]/.test(v)) errors.push(`${w} (${l}) em or en dash, use a comma or a period`);
  if (l === "es") for (const x of v.split(/(?<=[.?!])\s+/)) {
    if (x.includes("?") && !x.includes("¿")) errors.push(`${w} (es) question without ¿: ${x.slice(0, 60)}`);
    if (x.includes("!") && !x.includes("¡")) errors.push(`${w} (es) exclamation without ¡: ${x.slice(0, 60)}`);
  }
  if (l === "ca" && /l[.•∙ŀ⋅]l/i.test(v)) errors.push(`${w} (ca) use the punt volat l·l`);
};
for (const l of LANGS) walk(i18n[l], l, l);
if (errors.length) { console.error("Typography errors (docs/TYPOGRAPHY.md):\n" + errors.join("\n")); process.exit(1); }
const base = (l) => (l === "ca" ? "/" : `/${l}/`);
const thanks = (l) => `${base(l)}thanks/`;
const airbnb = `${housePage.url}?${offer.airbnbUtm}`;
const minPrice = Math.min(...offer.prices.map((p) => p.eur));
const { included, max, comfortable } = offer.capacity;

function head(l, t, { thanksPage = false } = {}) {
  const alts = offer.siteUrl
    ? LANGS.map((x) => `<link rel="alternate" hreflang="${x}" href="${offer.siteUrl}${base(x)}">`).join("\n") +
      `\n<link rel="canonical" href="${offer.siteUrl}${thanksPage ? thanks(l) : base(l)}">\n<meta property="og:url" content="${offer.siteUrl}${base(l)}">\n<meta property="og:image" content="${offer.siteUrl}${img.share}">`
    : "";
  return `<!doctype html>
<html lang="${t.htmlLang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(thanksPage ? t.thanksTitle : t.title)}</title>
<meta name="description" content="${esc(t.metaDesc)}">
${thanksPage ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:title" content="${esc(t.title)}"><meta property="og:description" content="${esc(t.metaDesc)}"><meta property="og:type" content="website">
${alts}
<meta name="theme-color" content="#F3EEE3">
<link rel="icon" href="${img.favicon}"><link rel="apple-touch-icon" href="${img.touch}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>`;
}

function topbar(l, t, here_) {
  const sw = LANGS.map((x) => `<a href="${here_ === "thanks" ? thanks(x) : base(x)}" hreflang="${x}" lang="${x}"${x === l ? ' aria-current="true"' : ""}>${x.toUpperCase()}</a>`).join("");
  return `<header class="bar"><a class="brand" href="${base(l)}"><img src="${img.logo}" alt="" width="34" height="34"><b>CA LA KIMBERLY</b></a><nav class="lang" aria-label="${esc(t.langLabel)}">${sw}</nav></header>`;
}

function page(l) {
  const t = i18n[l];
  const inc = t.inc.map((x) => `<li class="tile c-${x.c}"><span class="dot" aria-hidden="true"></span><b>${esc(x.t)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ""}</li>`).join("");
  const good = t.good.map((x) => `<li>${esc(x)}</li>`).join("");
  const gallery = img.gallery.map((g, i) => `<img src="${g.src}" alt="${esc(t.alt[g.alt])}" loading="lazy" width="320" height="240">`).join("");
  const size = t.size.map((s) => `<div><b>${s.n}</b><span>${esc(s.t)}</span></div>`).join("");
  const packs = t.packs.map((p) => `<article class="pack"><em>${esc(p.tag)}</em><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p></article>`).join("");
  const extras = t.extras.map((x) => `<li>${esc(x)}</li>`).join("");
  const prices = offer.prices.map((p) => `<div class="prow"><div><b>${esc(t.prices[p.key].t)}</b><small>${esc(t.prices[p.key].d)}</small></div><strong>${eur(p.eur, l)}</strong></div>`).join("");
  const how = t.how.map((h, i) => `<li><span class="n">${i + 1}</span><div><b>${esc(h.t)}</b><p>${esc(h.d)}</p></div></li>`).join("");
  const rules = t.rules.map((r) => `<li>${esc(r)}</li>`).join("");
  const occ = t.occasions.map((o) => `<option>${esc(o)}</option>`).join("");
  const xchk = t.extras.map((x) => `<label class="chk"><input type="checkbox" name="extras" value="${esc(x)}"> ${esc(x)}</label>`).join("");
  const rating = housePage.rating ? `<p class="rate">★ ${housePage.rating.stars} · ${housePage.rating.count} ${esc(t.rating)}</p>` : "";

  return `${head(l, t)}
<body>
${topbar(l, t, "home")}
<main>
<section class="hero">
  <div class="hero-img"><img src="${img.hero}" alt="${esc(t.alt.hero)}" fetchpriority="high" width="632" height="474"><div class="disc"><small>${esc(t.from)}</small><b>${eur(minPrice, l)}</b><small>${esc(t.perDay)}</small></div></div>
  <div class="hero-txt"><p class="kicker">${esc(t.kicker)}</p><h1>${esc(t.h1)}</h1><p class="lead">${esc(t.lead)}</p>
    <div class="ctas"><a class="btn" href="#request">${esc(t.ctaRequest)}</a><a class="btn alt" href="${airbnb}" rel="noopener">${esc(t.ctaAirbnb)}</a></div>${rating}</div>
</section>

<section class="wrap"><h2>${esc(t.includedTitle)}</h2><ul class="tiles">${inc}</ul>
  <div class="note"><b>${esc(t.goodTitle)}</b><ul>${good}</ul></div></section>

<section class="wrap"><h2>${esc(t.placeTitle)}</h2><div class="strip">${gallery}</div></section>

<section class="wrap two"><div><h2>${esc(t.sizeTitle)}</h2><p>${esc(t.sizeText)}</p><div class="size">${size}</div></div>
  <div><h2>${esc(t.priceTitle)}</h2><div class="prices">${prices}</div><p class="fine">${esc(t.priceNote)}</p></div></section>

<section class="wrap"><h2>${esc(t.cookTitle)}</h2><p>${esc(t.cookText)}</p><div class="packs">${packs}</div>
  <h3 class="sub">${esc(t.extrasTitle)}</h3><ul class="chips">${extras}</ul></section>

<section class="wrap two"><div><h2>${esc(t.howTitle)}</h2><ol class="how">${how}</ol></div>
  <div><h2>${esc(t.rulesTitle)}</h2><ul class="rules">${rules}</ul></div></section>

<section class="wrap" id="request"><div class="formcard"><h2>${esc(t.formTitle)}</h2><p>${esc(t.formLead)}</p>
<form name="day-rental" method="POST" action="${thanks(l)}" data-netlify="true" netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="day-rental"><input type="hidden" name="lang" value="${l}">
  <p class="hp" aria-hidden="true"><label>Do not fill <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
  <input type="hidden" name="utm_source"><input type="hidden" name="utm_medium"><input type="hidden" name="utm_campaign"><input type="hidden" name="utm_content"><input type="hidden" name="referrer">
  <div class="grid2">
    <label>${esc(t.f.name)}<input name="name" required autocomplete="name"></label>
    <label>${esc(t.f.phone)}<input name="phone" type="tel" required autocomplete="tel"></label>
    <label>${esc(t.f.email)}<input name="email" type="email" required autocomplete="email"></label>
    <label>${esc(t.f.people)}<input name="people" type="number" min="2" max="${max}" value="8" required></label>
    <label>${esc(t.f.date)}<input name="date" type="date" required></label>
    <label>${esc(t.f.date2)}<input name="date_backup" type="date"></label>
    <label class="full">${esc(t.f.occasion)}<select name="occasion">${occ}</select></label>
  </div>
  <fieldset><legend>${esc(t.f.extras)}</legend><div class="chks">${xchk}</div></fieldset>
  <label class="full">${esc(t.f.msg)}<textarea name="message" rows="3"></textarea></label>
  <label class="chk consent"><input type="checkbox" name="consent" required> ${esc(t.f.consent)}</label>
  <button class="btn" type="submit">${esc(t.f.submit)}</button>
  <p class="fine">${esc(t.formFine)}</p>
</form></div></section>
</main>
<footer class="foot"><p>${esc(t.footer)}</p><p><a href="${airbnb}" rel="noopener">${esc(t.ctaAirbnb)}</a></p></footer>
<script>
(function(){try{var q=new URLSearchParams(location.search);["utm_source","utm_medium","utm_campaign","utm_content"].forEach(function(k){var v=q.get(k);if(v){sessionStorage.setItem(k,v)}});
var f=document.forms["day-rental"];if(!f)return;["utm_source","utm_medium","utm_campaign","utm_content"].forEach(function(k){f.elements[k].value=sessionStorage.getItem(k)||""});
f.elements["referrer"].value=document.referrer||"";var d=new Date();d.setDate(d.getDate()+1);var iso=d.toISOString().slice(0,10);f.elements["date"].min=iso;f.elements["date_backup"].min=iso;}catch(e){}})();
</script>
</body></html>`;
}

function thanksPage(l) {
  const t = i18n[l];
  return `${head(l, t, { thanksPage: true })}
<body>${topbar(l, t, "thanks")}<main class="wrap thanks"><h1>${esc(t.thanksTitle)}</h1><p class="lead">${esc(t.thanksText)}</p><p><a class="btn" href="${base(l)}">${esc(t.back)}</a></p></main></body></html>`;
}

for (const l of LANGS) {
  const dir = path.join(OUT, l === "ca" ? "" : l);
  fs.mkdirSync(path.join(dir, "thanks"), { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(l));
  fs.writeFileSync(path.join(dir, "thanks", "index.html"), thanksPage(l));
}
fs.writeFileSync(path.join(OUT, "robots.txt"), "User-agent: *\nAllow: /\n");
console.log(`Built ${LANGS.length} languages into ${OUT} (guide: ${GUIDE})`);
