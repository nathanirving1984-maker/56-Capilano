# 56 Capilano Drive, Novato, CA 94949

Single-property listing site. Static HTML/CSS/vanilla JS — no build step, no
dependencies, no backend. Deploys to GitHub Pages as-is.

**$3,049,000 · 7 bd · 9 ba · 6,469 sq ft · 1.13 acres · MLS# 326044403**

---

## Structure

```
index.html               About      (landing tab)
location.html            Location
gallery.html             Gallery
contact.html             Contact

styles.css               Every design token and component. Shared by all pages.
js/site.js               Scroll reveal + contact-form mailto composer.
js/gallery-manifest.js   ← the file you edit to add photos
js/gallery.js            Renders the gallery grid and lightbox.
images/gallery/          ← drop MLS photography here
favicon.svg
.nojekyll                Serve files verbatim; skip Jekyll processing.
```

### Why the nav is duplicated

There is no templating engine on GitHub Pages. The nav and footer markup are
duplicated verbatim across the four pages rather than injected by JS, so the
header never flashes in late and the pages remain readable and crawlable with
JavaScript disabled.

**When editing the nav or footer, change all four pages.** Each block is marked
with `<!-- ===== NAV ... ===== -->` and `<!-- ===== FOOTER ... ===== -->`. Only
two things differ per page: the `is-active` class and the `aria-current="page"`
attribute on the current tab.

---

## Adding photography

1. Drop image files into `images/gallery/`.
2. Open `js/gallery-manifest.js` and fill in the matching `src` values.

```js
{
  label: "Bay view — principal room, facing east",
  src:   "principal-room-bay.jpg",   // resolves to images/gallery/
  size:  "tall",                     // "" | "wide" | "tall"
  alt:   "…"                         // optional; defaults to label
}
```

Any slot with an empty `src` renders as a dashed brass placeholder frame
carrying its label — so the page stays presentable while photography is
outstanding. Add, remove, and reorder slots freely; nothing else changes.
A filename typo degrades to a placeholder rather than a broken-image icon.

**Sizing:** aim for ~2000px on the long edge, JPEG, under ~400 KB each.
GitHub Pages has a soft 1 GB repository limit and no image processing.

**Social preview:** the pages reference `images/og-cover.jpg` for link previews.
Add that file (1200×630) once you have a hero shot.

---

## The map

`location.html` embeds OpenStreetMap, which needs no API key and no billing
account. The marker is placed on the Capilano Drive ridge for orientation and
is labelled as approximate.

To swap in Google Maps once you have an API key, replace the `<iframe src>` in
the `.map` block with either the
[Maps Embed API](https://developers.google.com/maps/documentation/embed/get-started)
or a Static Maps image. Keep the `.map__caption` bar — it carries the address
and the "open in maps" link.

---

## The contact form

No backend exists, so the form composes a message in the visitor's own mail
client. Nothing is transmitted or stored by the site.

Recipients are set as data attributes on the `<form>` in `contact.html`:

```html
<form id="inquiry"
      data-to="nathan.irving@cbrealty.com"
      data-cc="Amadeo@AmadeoArnal.com"
      data-subject="56 Capilano Drive - Private Showing Request">
```

If you later add a real form handler (Formspree, Netlify Forms, Basin), give
the `<form>` an `action` attribute and a `method="POST"`. `js/site.js` detects
the `action` and stands down automatically — no code change needed.

---

## Copy to review before launch

The property facts (price, beds, baths, square footage, lot, year, MLS number,
district) are exactly as supplied. Two categories of prose were written *around*
those facts and should be checked against the actual MLS sheet:

- **Feature grid and statement copy** (`index.html`) describe the residence in
  terms of the known figures. They deliberately avoid claiming finishes,
  appliances, or room counts that were not supplied — but confirm the framing
  matches the property before it goes live.
- **Compass bearings on Three Horizons** (bay east, valley south, fairways
  west) and **all distances on `location.html`** are approximate, derived from
  the general geography of Ignacio Valley. They are labelled as approximate on
  the page. Verify against the actual site orientation.
- **School assignment** is stated only at district level (Novato Unified), since
  individual school boundaries change. The page directs buyers to confirm with
  the district.

---

## Local preview

No server required — open `index.html` in a browser. (The gallery manifest is a
`.js` file rather than `.json` specifically so it works over `file://` without
a local server.)

To run one anyway:

```sh
python3 -m http.server 8000
```

---

## Deploying

Deployment is automatic via `.github/workflows/pages.yml`. Every push to
`main` or `claude/capilano-listing-site-2fc6um` publishes the repository root
to GitHub Pages. You can also trigger it by hand from the Actions tab
("Deploy to GitHub Pages" → Run workflow).

**Live at:** https://nathanirving1984-maker.github.io/56-Capilano/

The workflow exists because this repository was created empty and has no
default branch with content, so Pages offers only the "GitHub Actions" source
— "Deploy from a branch" has no branch to point at. The workflow passes
`enablement: true` to `actions/configure-pages`, so it switches Pages on
itself; nothing needs setting in Settings → Pages.

If you later create a `main` branch and prefer the simpler branch-based
deploy, you can delete this workflow and switch the source over.

All internal links are relative, so the site works at both a user-site root
and the `/56-Capilano/` project path it currently uses.

---

## Design system

| Token | Value | Use |
|---|---|---|
| `--ink` | `#122120` | Body text |
| `--teal` | `#1B4F4C` | Primary buttons, links |
| `--teal-deep` | `#0F2D2B` | Hero, footer, dark panels |
| `--sand` | `#EFE8D8` | Section panels, stat bar |
| `--paper` | `#FBF8F1` | Page ground |
| `--brass` | `#B08D57` | Eyebrows, active tab, sightlines, focus rings |
| `--brass-soft` | `#D9C09B` | Placeholder frames, dark-panel accents |
| `--mist` | `#A9C2C0` | Secondary labels on dark |

**Type:** Fraunces (display), Public Sans (body), IBM Plex Mono (eyebrows,
stats, spec sheets, nav labels) — all via Google Fonts.

**Signature element:** *Three Horizons* on the About page — San Pablo Bay,
Ignacio Valley, Marin Country Club, each with a brass sightline that draws from
a struck origin point out toward the horizon it names. The sightline animates
on scroll and holds its finished state under `prefers-reduced-motion`.

**Accessibility:** skip link, visible brass focus rings throughout, keyboard-
driven lightbox (Esc / ← / →, focus trapped and restored), `aria-current` on the
active tab, and full `prefers-reduced-motion` support.
