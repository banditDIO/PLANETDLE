# PLANETDLE parameter reveal repair — 2026-11-15

## What was wrong

The previous code bypassed all sequential animations when the browser's `prefers-reduced-motion` preference was enabled or the Web Animations API was unavailable. In that case, all six scored tiles were painted immediately, producing the exact behavior reported. Previously submitted guesses were also intentionally restored in full after a page refresh; those are not new guesses and do not replay.

## Changes

- `static/game.js`: Always reveal new-guess results one parameter at a time. Keep all future values and feedback colors out of the DOM until their individual turn. Use clearly visible 275 ms fold-away + 380 ms fold-open phases with a 115 ms interval, with a simpler staggered presentation if reduced-motion is enabled. Prevent further submissions during the sequence (the existing submission guard remains active).
- `static/style.css`: Add explicit Wordle-style tile folding keyframes and progressive reveal states.
- `templates/index.html`: Cache-bust both the changed CSS and JS to stop Render/browser caches from continuing to serve an old animation implementation.

## Browser verification (available Chromium with simulated API)

Real DOM interaction: typed `Mars`, clicked the actual Guess button, sampled tile visibility after submitting. The normal-motion run showed revealed counts [0, 1, 1, 2, 3, 5, 6] at 100, 490, 980, 1600, 2320, 3500 and 4800 ms respectively. No JavaScript page exceptions were raised. Also repeated with Chromium's reduced-motion setting enabled: progressive reveal continued and completed. JS syntax and Python compilation passed.

Flask/backend integration was **not tested** here because Flask is not installed in this runtime; browser API responses were simulated. Prior guesses restored on refresh intentionally show completed scores immediately. These are not a new guess animation.

## Running

Extract the ZIP to a fresh folder, open `planetdle`, launch `START_PLANETDLE.bat`, and begin a **new practice round** to watch the reveal on newly submitted guesses. For Render, replace/commit the modified files on GitHub, allow a completed redeploy, then hard refresh with Ctrl+Shift+R. The downloaded ZIP does not automatically modify an existing GitHub repository or Render deployment.
