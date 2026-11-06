# DR Swindle Construction LP – static copy of drswindleconstructionlp.com

Goal: **visually identical** to the live WordPress site (Betheme 16.3). The pages are the original theme markup, CSS and JS, self-hosted, with WordPress plumbing removed (feeds, wp-json, emoji, wp-embed, html5shiv, FontAwesome CDN, Google Maps JS, Google Fonts CDN). No build step is needed to deploy; serve `site/` as static files.

## Pages
| File | Original |
|---|---|
| `index.html` | Home – Revolution Slider hero (original config/timing) |
| `what-we-offer.html` | Services – 7 NextGen thumbnail galleries (240x160 thumbs, 24 per page, SimpleLightbox on click, ajax pagination) |
| `nggallery/page/{1,2,3}.html` | Static stand-ins for NextGen's `/nggallery/page/N` – fetched by the original pagination script (`ajax_pagination.js`, plain `$.get(href)`). Their pagination links and asset paths are root-relative (`/nggallery/page/N.html`, `/img/...`) because the fragments are injected into `what-we-offer.html` |
| `404.html` | Site header/footer + not-found message. Uses `<base href="/">` so it works at any URL depth |
| `CNAME` | `drswindleconstructionlp.com` (GitHub Pages custom domain) |
| `testimonials.html`, `contact-us.html` | as original; contact map is an embedded Google Maps iframe (450px tall, full width, same place) |
| `gallery-carousel-preview.html` | OPTIONAL swipeable carousel + lightbox of all 183 project photos, theme-styled. Not linked from the nav. Files: `css/gallery-carousel-preview.css`, `js/gallery-carousel-preview.js` (all classes `gcp-` prefixed) |

## Assets
- `wp-content/…`, `wp-includes/…` keep the original paths (theme CSS/JS, Revolution Slider, NextGen, jQuery). `?ver=` suffixes removed from file names.
- Icons: original `mfn-icons` font (woff/ttf/eot/svg from the mirror). Slider icons: `revicons`.
- Fonts: Roboto + Patua One as self-hosted **woff2** (latin + latin-ext) in `fonts/`, declared in `fonts/fonts.css`.
- Hero photos: the original uploads, resized to max 1920px wide and recompressed (Pillow q80, progressive, no metadata). Gallery lightbox photos: resized 1600px copies in `img/gallery/` (`home-N-NN.jpg`; `-t` = 640px, used only by the preview page); original 240x160 thumbs in `wp-content/gallery/home-N/thumbs/`.
- Logo = `assets/logo.png` (identical to the live file). Logo, favicon, icon PNGs, `wood-texture.png` and the 4 Revolution Slider extension scripts were fetched from the live site (not in the wget mirror; kept in `tools/live-assets/` where relevant).

## Regenerating
`python3 -I tools/build_orig.py` then `python3 -I tools/build_preview.py` (inputs: `mirror/`, `tools/photos/`, `tools/carousel-src/`, `/tmp/dl2` live-site assets). `tools/compare.sh` re-takes the live/new screenshots (1366 and 390 wide, run `python3 -I -m http.server 8099 -d site -b 127.0.0.1` first) into `compare/`.

## Verification
`compare/<page>-<width>-{live,new}.png` – index, what-we-offer and testimonials are pixel-identical to live at 1366 and 390 (diff = 0 px). contact-us differs only inside the map.

## Known differences / TODO
- Map: the iframe embed shows Google's default red pin and controls instead of the original custom blue pin, zoom buttons and map/satellite toggle position. Same size/position.
- Still loads from third parties: Google Maps iframe, and the footer "Lone Star PC Repair" link (original credit). Everything else is local.
- The theme is jQuery-era (jQuery 1.12, Revolution Slider 5.3, prettyPhoto etc.) – heavier than a modern rebuild; this was chosen to match the original exactly.
- Original has no contact form; none added. Phone/email/address unchanged.
- Dead demo-site background images (themes.muffingroup.com) were removed; they never rendered on the live site.
- Ajax pagination in galleries needs HTTP(S) (does not work from `file://`).

## Polish pass (2026-11)
- Images: all JPEGs recompressed (q80, progressive, metadata stripped); thumbs 6.6 -> 1.5 MB, hero uploads 5.2 -> 1.8 MB. Lightbox photos (`img/gallery`, already 1600px max) were already near-minimal JPEGs, so they barely shrink. Site is ~31.7 MB, **not** under the 20 MB target; going lower needs smaller lightbox photos (e.g. 1280px / q70, about -8 MB) or dropping the `-t` duplicates (7 MB, only used by the optional preview page) - a visible-quality/scope decision, left undone.
- Gallery works with no PHP: removed the dead `ajax.min.js` include and the absolute `https://drswindleconstructionlp.com` values in the inline `photocrati_ajax` / `galleries` config (never fetched). `photocrati_ajax` itself stays, `nextgen_basic_thumbnails.js` reads it. Fixed pagination links inside the fragments (were `2.html`, which 404'd as `/3.html` once injected).
- Fixed 404s: added `tp-leftarrow.png`, `tp-rightarrow.png` (theme) and `openhand.cur`, `closedhand.cur` (revslider; CSS pointed at `.cur.html`); search-icon `href` was `../index.html%3Fp=N.html#`, now `#`.
- Headless Chrome check (served with `http.server`): all 8 galleries' thumbs load; pagination next/prev on the 3 paged galleries (pages 1-3) works; lightbox opens and next works, also after paginating; no 4xx or JS errors on any page. Known quirk (also on live): two galleries share one NextGen id, so paging one replaces both.
- Screenshots retaken (`-new` only). vs. before the pass: testimonials and contact-us@390 identical; others differ only by JPEG noise (max pixel delta <100, <0.1% of pixels over 24).
