# 56 Capilano Drive, Novato, CA 94949

Single-property listing site. Photography-led: images are the subject of every
section and type is a caption on them. Static HTML/CSS/vanilla JS — no build
step, no dependencies, no backend.

**$3,049,000 · 7 bd · 9 ba · 6,469 sq ft · 1.13 acres · MLS# 326044403**

**Live:** https://nathanirving1984-maker.github.io/56-Capilano/

---

## Structure

```
index.html            About / home — full-bleed aerial hero
about.html            redirect stub → index.html
location.html         Location
gallery.html          Gallery
contact.html          Contact

styles.css            Every token and component. Shared by all pages.
js/site.js            Nav-over-hero, scroll reveal, photo fallbacks, contact form
js/gallery.js         Builds the gallery grid + lightbox from the manifest

images/manifest.json  ← the file you edit to add gallery photos
images/               ← your .jpg files land here, flat

favicon.svg
.nojekyll             Serve files verbatim; skip Jekyll processing
.github/workflows/pages.yml   Deploys the site on every push
```

### Why About lives at `index.html`

GitHub Pages serves `index.html` at the site root. Since the aerial is the
entire first impression, it must not sit behind a redirect hop — so the real
About page is `index.html`, and `about.html` is a small stub that forwards to
it for anyone who types the URL directly.

### Why the nav is duplicated

No templating engine on GitHub Pages. The nav and footer markup are duplicated
across the pages rather than injected by JS, so the header never flashes in
late and the pages stay readable and crawlable with JavaScript disabled.

**When editing the nav or footer, change all four pages.** Each block is
marked with `<!-- ===== NAV ... ===== -->` and `<!-- ===== FOOTER ... ===== -->`.
Only two things differ per page: the `is-active` class and `aria-current="page"`.

### The "Listed by" footer slot — placeholder

The fourth footer column is a **placeholder awaiting the listing brokerage's
details**. Amadeo Arnal and Nathan Irving are shown as *showing agents*; this
slot is where the actual listing agent and brokerage go.

It carries a `foot__tbd` class that dims it and adds a dashed brass rule, so it
reads as deliberately unfilled rather than broken. To fill it in:

1. Replace the four lines (agent name/title, brokerage/office, phone, email).
2. Wrap the phone and email in links to match the blocks beside it — the exact
   pattern is in an HTML comment directly above the block.
3. Delete `class="foot__tbd"` from the `<div>` so the dashed treatment comes off.
4. Repeat on all four pages.

**Do not ship publicly with this slot as-is** — placeholder text where the
listing brokerage belongs is worse than no column at all.

---

## Adding photography

There are two separate mechanisms, on purpose.

### 1. Named slots — About and Location

These are fixed paths written directly into the markup, so the hero paints
immediately with no JavaScript and no manifest round-trip. **Just save the
file at the right path** and it appears. No code to touch.

| Path | Where it appears |
|---|---|
| `images/hero-aerial.jpg` | **The anchor image.** Full-bleed hero, About |
| `images/exterior-01.jpg` | "The offering" statement pair, About |
| `images/view-bay.jpg` | Three Horizons — panel I |
| `images/view-valley.jpg` | Three Horizons — panel II, and the Location lead photo |
| `images/view-fairway.jpg` | Three Horizons — panel III |
| `images/interior-great-room.jpg` | Residence sequence — 01 |
| `images/interior-kitchen.jpg` | Residence sequence — 02 |
| `images/interior-primary-bath.jpg` | Residence sequence — 03 |
| `images/interior-living.jpg` | Residence sequence — 04 |
| `images/grounds-01.jpg` | Residence sequence — 05 |
| `images/exterior-02.jpg` | Residence sequence — 06 |
| `images/grounds-02.jpg` | Closing image, Contact |

Any of these that is missing renders as a dashed brass placeholder frame
stating which shot belongs there — so an incomplete site still looks
deliberate rather than broken.

**All twelve slots are filled.** Replacing any photograph is a matter of
saving a new file over the old one at the same path; no code or manifest edit
is needed. `images/interior-window-room.jpg` is a thirteenth photograph that
has no fixed slot in the markup — it appears in the Gallery only, via the
manifest.

### 2. The gallery — `images/manifest.json`

The Gallery tab is built entirely from the manifest, so you can add, remove,
and reorder photographs without touching markup or JS.

```json
{
  "basePath": "images/",
  "images": [
    {
      "file": "view-bay.jpg",
      "caption": "San Pablo Bay — east, open water",
      "tab": ["about", "gallery"],
      "size": "tall",
      "alt": "optional; falls back to caption"
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `file` | Filename, resolved against `basePath`. A path or full URL also works. |
| `caption` | Mono caption under the photo and in the lightbox. Say what the shot **is**. |
| `tab` | String or array. The Gallery renders every entry whose `tab` includes `"gallery"`. |
| `size` | `""` standard · `"wide"` full-width · `"tall"` portrait |
| `alt` | Optional alt text; defaults to `caption`. |

A manifest entry whose file is missing becomes a labelled placeholder and is
skipped by the lightbox, so arrow-nav never lands on an empty frame.

### ⚠️ Local preview needs a server

The manifest is JSON, and browsers block `fetch()` on `file://` URLs. Opening
`gallery.html` by double-clicking will show a note instead of the grid. To
preview properly:

```sh
python3 -m http.server 8000
# then http://localhost:8000/
```

The other three pages work fine opened directly.

### Pre-optimize before committing

There is no image processing on GitHub Pages — files are served exactly as
committed, and the repo has a soft 1 GB limit.

- **Resize** to ~2400px on the long edge (~3000px for `hero-aerial.jpg`).
- **Compress** to JPEG quality ~80. Target under 400 KB each; the hero can go
  to ~600 KB.
- **Strip EXIF**, which can carry GPS coordinates from the shoot.

```sh
# ImageMagick, in place
mogrify -resize 2400x2400\> -quality 80 -strip images/*.jpg
```

Everything below the first screen is already `loading="lazy"`; the hero is
marked `fetchpriority="high"` so it wins the race for the first paint.

---

## The map

`location.html` embeds Google Maps, queried **by address string**, not by
latitude/longitude:

```
https://maps.google.com/maps?q=56%20Capilano%20Dr%2C%20Novato%2C%20CA%2094949&z=16&output=embed
```

This needs no API key and no billing account, and Google geocodes the pin
itself — so the marker cannot drift from the real address.

**Do not swap this for hardcoded coordinates.** An earlier version used an
OpenStreetMap embed with a lat/long that had been estimated rather than
geocoded, and it pointed at the wrong place. Letting the map service resolve
the address removes that failure mode entirely.

If you later get a Google Maps API key, the supported upgrade is the
[Maps Embed API](https://developers.google.com/maps/documentation/embed/get-started)
in `place` mode — still address-based. If you would rather ship a static map
image, save one as `images/location-map.jpg` and replace the
`<iframe class="map__embed">` with an `<img>`.

---

## The contact form

No backend, so the form composes a message in the visitor's own mail client.
Nothing is transmitted or stored by the site. Recipients are data attributes
on the `<form>` in `contact.html`:

```html
<form id="inquiry"
      data-to="Amadeo@AmadeoArnal.com"
      data-cc="nathan.irving@cbrealty.com"
      data-subject="56 Capilano Drive - Private Showing Request">
```

Amadeo Arnal is the primary recipient; Nathan Irving is cc'd. Swap the two
attributes to reverse that.

If you later add a real handler (Formspree, Netlify Forms, Basin), give the
`<form>` an `action` and `method="POST"`. `js/site.js` detects the `action`
and stands down automatically — no code change.

---

## Deploying

Automatic via `.github/workflows/pages.yml`. Every push to `main` publishes
the repository root. You can also run it by hand from the Actions tab.

The workflow exists because this repository was created empty, so Pages offers
only the "GitHub Actions" source. It passes `enablement: true` to
`actions/configure-pages`, so it switches Pages on itself — nothing to set in
Settings → Pages.

All internal links are relative, so the site works at both a user-site root and
the `/56-Capilano/` project path it currently uses.

---

## Copy to review before launch

Facts (price, beds, baths, sq ft, lot, year, MLS#, district) are exactly as
supplied. Two things were written *around* those facts and should be checked:

- **Compass bearings** on Three Horizons (bay east, valley south, fairways
  west) and **all distances on Location** are approximate, derived from the
  general geography of Ignacio Valley. Both are labelled approximate on the
  page. Verify against the actual site orientation.
- **Captions and one-line copy** deliberately avoid claiming finishes,
  appliances, or room counts that were not supplied. Once real photography
  lands, the captions should be checked against what the images actually show
  — a caption that contradicts its photo is worse than no caption.

School assignment is stated at district level only; individual boundaries move.

---

## Design system

| Token | Value | Use |
|---|---|---|
| `--ink` | `#122120` | Body text |
| `--teal` | `#1B4F4C` | Links, the one solid button |
| `--teal-deep` | `#0F2D2B` | Hero scrim, dark sections, footer |
| `--sand` | `#EFE8D8` | Image ground before load |
| `--paper` | `#FBF8F1` | Page ground |
| `--brass` | `#B08D57` | Eyebrows, active tab, sightlines, focus rings |
| `--brass-soft` | `#D9C09B` | Placeholder frames, accents on dark |
| `--mist` | `#A9C2C0` | Secondary labels on dark |

**Type:** Fraunces (display, used sparingly and large), Public Sans (the little
body copy there is), IBM Plex Mono (eyebrows, nav labels, captions).

**Chrome:** hairline dividers only — no cards, no filled panels behind photos,
no boxed data tables. The spec sheet is a single slim inline strip. Form inputs
are underlines, not boxes.

**Motion:** slow crossfade and rise on scroll, nothing busy. Photos fade in as
they decode; the Three Horizons sightlines draw once. All of it collapses to
finished-state under `prefers-reduced-motion`.

**Accessibility:** skip link, brass focus rings throughout, `aria-current` on
the active tab, keyboard lightbox (Esc / ← / →) with focus trapped and
restored, and descriptive alt text on every named slot.
