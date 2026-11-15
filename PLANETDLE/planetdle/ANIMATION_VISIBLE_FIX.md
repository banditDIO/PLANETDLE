# PLANETDLE — visible parameter flips fix (2026-11-15)

## Root cause
The stylesheet contained a global `@media(prefers-reduced-motion:reduce)` rule that set animation durations within `.workspace` to 0.01 milliseconds, as well as several conflicting rounds of CSS-only tile animation overrides. The JavaScript still waited between each tile, so the game looked like a delayed one-by-one reveal without motion.

## Fix
- Removed the competing tile-only CSS flip overrides at the end of `static/style.css`.
- Updated `static/game.js` to animate each real tile through Web Animations API `Element.animate`: blank face flips away, actual result is painted edge-on, scored face flips into view with a small settle.
- Retained sequential visibility, game submission lock, victory/confetti timing and restoring previous round history.
- Changed the CSS/JS version query in `templates/index.html` to force browser cache refresh after deployment.

## Tests performed
- JavaScript syntax: `node --check static/game.js`: passed.
- Chromium browser with the real HTML/CSS/JS and a simulated guess API response, reduced-motion `reduce`: at 200ms first tile has a changing `matrix3d` transform and running animation; only the first result exists around 500ms; eventually all six appear. Passed.
- Chromium browser with same frontend and reduced-motion `no-preference`: passed same checks.
- No JavaScript page errors in the two test runs.
- These were **frontend browser tests with simulated backend responses**; live Flask server and Render deployment were not retested.

## Usage
Extract ZIP, run `START_PLANETDLE.bat` or `python app.py`. Start a fresh round and submit a NEW guess (history rows correctly appear already filled). For the hosted site, commit updated files to GitHub; Render must redeploy. Existing Render link does not update when downloading the ZIP.
