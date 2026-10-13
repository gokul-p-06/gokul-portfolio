# Gokul P — Portfolio (v4)

A static single-page portfolio in plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run locally
Open `index.html`, or serve the folder:

    npx serve .          # or: python3 -m http.server 8000

## Production build
None needed. Upload the folder as-is to GitHub Pages, Netlify or Vercel (framework preset "Other", no build command, output directory `.`).

## Structure
- `index.html` content and metadata
- `style.css` design tokens, layout, motion, reduced-motion rules
- `script.js` mobile menu, nav state, section reveal, canvas network background, desktop pointer light
- `assets/GokulResume.pdf` your resume (unchanged)

## External service
Fonts load from Google Fonts. If blocked, system fonts are used.

## Content notes
Content comes from your original page and `GokulResume.pdf`. Edit text directly in `index.html`.

## Design system (v4)
Colors are CSS variables at the top of `style.css`: midnight `#070a1a`, surface `#0d1230`, violet `#8b7bff`, cyan `#4fd8ff`, text `#eef0ff`, muted `#a4abd0`.

Motion: CSS transitions for hover and press states; Intersection Observer for scroll reveals (up, left, right, clip-path, with per-group stagger); one canvas for the node background. Pointer effects (card spotlight and tilt, background light, pointer-linked nodes) run only on `(hover: hover) and (pointer: fine)` devices and are off under `prefers-reduced-motion`. Content stays visible if JavaScript fails.
