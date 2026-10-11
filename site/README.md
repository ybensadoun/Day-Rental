# Ca La Kimberly days: site

Static landing page and request form for the day rental (calçotadas, paellas, barbecues). Catalan, Spanish and English.

## Build
    node build.mjs

No dependencies. Output goes to `dist/` (gitignored). Netlify builds it from GitHub (repo ybensadoun/Day-Rental, base directory `site`): commit, then Push origin in GitHub Desktop. Live at https://ca-la-kimberly-days.netlify.app. The request form uses Netlify Forms.

## Where things come from
- House facts, logo, favicon and photos: read at build time from the guide, `Guest Guides/sites/ca-la-kimberly/` in the same Ca La Kimberly folder (found relative to this folder; override with `CLK_GUIDE=/path`). Copied into `dist/img/` only. Never committed here.
- Offer facts (hours, capacity, prices, which photos): `offer.json`.
- All page text in three languages: `src/i18n.json`.
- Look: `src/style.css`. Colours and font follow the guide's DESIGN.md ("Bauhaus summer").

## Before going live
- `siteUrl` in `offer.json` is the Netlify address; change it if a custom domain is attached.
- Settle the open legal and tax questions in `docs/legal-and-pricing.md`, including whether prices display with VAT.
- Add analytics or ad pixels only after deciding how to track cost per request. UTM tags are already saved into the form.
- Extras have no prices on the page on purpose.
