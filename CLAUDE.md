# Ca La Kimberly days: day rental site (DAYS)

Read first: `../CLAUDE.md` (shared rules: publishing, privacy, writing, UX), `../PROJECTS.md`, `../CHANGES.md`.
This repo is PUBLIC (ybensadoun/Day-Rental).

## What it is
Renting the house and garden for the day (about 10:00 to 21:00) for a calçotada, a paella or a barbecue, no overnight stay (that stays on Airbnb). Groups from Barcelona and Tarragona, promoted on Instagram and TikTok. Brief: `brief.md`. Mockups: `mockups.html`. Status: site built, NOT launched.

## Site
- `site/`: static landing page and request form, Catalan, Spanish and English. No dependencies: `cd site && node build.mjs` writes `dist/` (git-ignored).
- Netlify project `ca-la-kimberly-days` builds from this repo (main, base `site`); its build clones the public guest-guides repo to read the guide.
- House facts, logo, favicon and photos are read at build time from `../Guest Guides/sites/ca-la-kimberly/` (override with `CLK_GUIDE=/path`). One master copy: never copy them into this repo. If a house fact is wrong, fix it in the guide and log it in CHANGES.md.
- Offer facts (hours, capacity 6 comfortable / 8 included / 10 max, prices, deposit, which photos): `site/offer.json`. Page text in 3 languages: `site/src/i18n.json`. Look: `site/src/style.css`, following the guide's `docs/DESIGN.md` ("Bauhaus summer").
- Requests go through Netlify Forms; UTM tags are saved into the form.

## Open decisions (ask Yohann, do not settle them yourself)
- Price: the brief proposes 250 weekday / 350 weekend and calçot season / 400 summer weekend with pool (+25 per extra person up to 10, deposit about 200); the mockup showed 500. Analysis in `docs/legal-and-pricing.md`. Extras have no prices on the page on purpose.
- Before the first paid booking (see `docs/legal-and-pricing.md`): town hall (is a paid day allowed under the tourist licence?), tax with the gestoría (VAT, autónomo), event insurance and pool rules, the Catalan fire ban 15 March to 15 October, neighbours (end time, music), Airbnb calendar stays the master.
- Whether prices show VAT; analytics or ad pixels only once tracking of cost per request is decided.

## Rules
- Same writing, UX and privacy rules as the guide (no em-dashes, never the exact address on public pages). How guests contact us for bookings is Yohann's decision: ask before adding any phone number or email.
- Cross-promotion only between our two sites, as links with tracking tags. Not part of the Guest Guide Maker product.
- `siteUrl` in `offer.json` changes if a custom domain is attached.
