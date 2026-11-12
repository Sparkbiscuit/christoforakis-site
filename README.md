# Christoforakis.com

The family's website: a chart of six islands, one for each of us (Foxy included), with a page for each.

It's a static site. No framework, no package manager, no build step and no server code: HTML, CSS, browser JavaScript and image files. Nothing on the public site can write to the repository; every change goes through Git.

## Routes

| Route | What it is | Main files |
| --- | --- | --- |
| `/` | The chart: the islands on one reef, a legend, day and night, and a seaplane you can fly | `index.html`, `assets/js/home.js` |
| `/nicholas/` | His desk, modelled in Blender; each thing on it is something he made | `nicholas/index.html`, `assets/js/nicholas.js`, `assets/nicholas/` |
| `/andreas/` | An island under fog of war, run by a token | `andreas/index.html`, `assets/js/andreas.js` |
| `/lukas/` | A descent through the clouds: airliners, jets and Formula 1 | `lukas/index.html`, `assets/js/lukas.js` |
| `/oksana/` | Oksana's notes, including every update on Lukas, beside a cyanotype print | `oksana/index.html`, `assets/js/oksana.js` |
| `/kiriakos/` | Mr. Pizza House: the counter, the box, the letterboard and the press | `kiriakos/index.html`, `assets/js/kiriakos.js` |
| `/foxy/` | Foxy's photographs, each with its own weather | `foxy/index.html`, `assets/js/foxy.js`, `assets/photos/` |
| `/contact/` | A postcard with the ways to reach Nicholas | `contact/index.html` |
| `/aloft/` | Aloft, the flying game | `aloft/index.html` |
| `/projects/filuma/`, `/projects/meds-ahead/` | The stories behind the two apps (older page style) | `projects/`, `assets/css/site.css`, `assets/js/site.js` |
| `/updates/` | Forwards old links to the matching note on Oksana's page | `updates/index.html` |

Every page except the project stories shares the header, family menu and footer from `assets/js/islands.js` and `assets/css/islands.css`.

## Adding a note to Oksana's page

Notes are written straight into `oksana/index.html`, newest first. `CONTENT-GUIDE.md` has the template, plus the privacy and medical checklists to run before publishing.

## The WebGL pages

The home chart, Andreas, Lukas and Oksana's print are full-screen fragment shaders driven by `assets/js/gl.js`. Its `loop()` is what keeps them easy on the machine:

- 30 frames a second while nobody's interacting, 60 while they are, never more (so a 120 Hz screen doesn't double the work);
- a cap on drawing-buffer pixels, however large or dense the screen;
- where the browser reports GPU time (`EXT_disjoint_timer_query_webgl2`), the resolution settles where a frame costs a few milliseconds; elsewhere it drops when frames arrive late;
- nothing renders while the canvas is off screen or the tab is hidden.

The desk on `/nicholas/` uses three.js (loaded from jsDelivr) with the same rules, and its shadow maps only re-render when the light or something in it moves. The model is built by `tools/desk/build.py` in Blender; see `tools/desk/README.md`.

`?time=day`, `?time=night` and `?time=dusk` fix the light on the chart and the desk. Without them, the light follows the visitor's clock, or their choice in the legend (stored as `isl-light`), or their system's dark mode.

## Local preview

```bash
python3 scripts/preview.py
```

Then open `http://127.0.0.1:4173/`. The server sends no-cache headers and serves `404.html` for missing pages.

## Publishing

The repository is `Sparkbiscuit/christoforakis-site`; the hosting is configured outside these files, so check it before changing branches, DNS or the custom domain.

Before pushing:

- `git status` shows only intended files (the `.fig` design source and `.fig-preview/` stay out).
- No secrets in the diff.
- Each changed page loads without console errors at phone and desktop widths.

After pushing, open the live site in a private window and check the chart, a family page, the menu and Oksana's page.

## Photographs and privacy

Photographs are resized, converted to sRGB and stripped of all metadata (location included) before they're committed; originals stay off Git. Credits are in `IMAGE-CREDITS.md`, sources for facts in `CONTENT-SOURCES.md`.
