# TPA community website

Responsive local implementation of the seventh Paper artboard: cream surfaces, deep teal type and serif display headings. The hero now uses a faded Kolkata watercolor with books, notes and a fountain pen, replacing the earlier taped portraits.

## Run locally

```sh
cd tpa-site
npm run dev
```

Open http://localhost:5174. No dependency installation is required. Set `PORT` to change the port.

```sh
npm run check
npm run build
```

`dist/` contains the standalone static website. Deploy that folder with a static host; nothing has been published by this task.

## Browser verification

`scripts/verify.mjs` checks desktop, tablet and mobile widths, font and image loading, horizontal overflow, the mobile menu, event dialog focus return and membership form validation/review/edit. It saves desktop and mobile screenshots under `review/`.

Run it with Playwright installed for development, or set `TPA_PLAYWRIGHT_PATH` to an available Playwright module, while the local server is running:

```sh
node scripts/verify.mjs
```

The production website does not depend on Playwright.

## Behaviour

- Responsive desktop, tablet and mobile layouts; accessible mobile navigation.
- Event detail dialogs with Escape, backdrop close and focus return.
- Membership form validation and a review screen linking to the existing TPA registration portal. No personal details are transmitted or stored by this frontend.
- Login, membership plans, renewal, governance, resources and contact link to verified routes on the existing association site.
- Self-hosted fonts and an optimized transparent WebP watercolor illustration. Reduced motion respected; no continuous animation.
- An atlas that starts as a closed teal-and-gold book. Click or press Enter on the cover to open it; click the right page or use the arrows to turn its three chapters. Close it with the close control or Escape. The map has a selectable Tollygunge marker. Opening and page turns are user-triggered and respect reduced motion.
- The cover reads “Welcome to TPA” above the site's TPA monogram. Each book chapter has a distinct image: the interactive Tollygunge map on the first page, a faint watercolor group portrait of professionals on the second, and a watercolor of books, notes, glasses and a fountain pen on the third. The group illustration depicts fictional people. The map controls and attribution appear only on its page.
- Once-only scroll reveals on selected groups. Content remains visible without JavaScript and in reduced-motion mode.

## Map provenance

The offline vector is projected from the [OpenStreetMap Kolkata boundary](https://www.openstreetmap.org/relation/9381363), retrieved via Nominatim. The Tollygunge marker uses the [OpenStreetMap locality node](https://www.openstreetmap.org/node/1350661689) at 22.498636, 88.3453908. This marks the locality, not an association office. Map credit appears beside the atlas. Data is licensed under the [Open Database License](https://www.openstreetmap.org/copyright).

`public/assets/kolkata-boundary.json` preserves the source geometry, `kolkata-map.json` records provenance and projected marker position, and `scripts/prepare-map.mjs` generates the SVG offline. There are no runtime map API calls or API keys.

## Content and integration

The watercolor is an AI-generated editorial illustration blending Kolkata city elements with a scholarly still life. Programme topics are previews; dates and venues have not been supplied. Live event registration and member applications remain on https://tpassociation.org. Replace programme previews with confirmed association content before public launch.

The local membership form does not register an account or submit an application. It validates the introduction and hands off to the current portal, which collects its own required details. A new account/registration backend is a separate integration decision.

## Design source

[Paper artboard 7](https://app.paper.design/file/01M4SZ738FAAX7XEWPK2RTKD7S/p-1-0). Layout, colour and type values were exported directly through Paper JSX and computed styles.
