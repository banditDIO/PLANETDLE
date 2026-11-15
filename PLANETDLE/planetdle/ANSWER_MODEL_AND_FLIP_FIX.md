# Winning-model and parameter-reveal repair (2026-11-15)

## Reported defects and targeted repairs

1. The previous victory screen selected the preview from `data.row.name` instead of explicitly selecting the server-confirmed `data.answer`. The result screen now requests the model for the confirmed object, labels the object, and sets an explicit accessibility name. For Halley's Comet, the atlas uses the existing irregular-nucleus mesh and animated tail; it does **not** use the Earth's Moon map.
2. The preview canvas could keep an older frame visible until the next animation frame. The atlas now clears and redraws the chosen model immediately on selection and overwrites its prior model identity. When WebGL is unavailable, the result explicitly names the object instead of leaving an ambiguous blank preview.
3. Parameter scoring previously appeared before/while the row animated. Each of six attribute tiles now starts blank; then it flips away, changes content and color only at its midpoint, flips back, and pauses briefly before the next tile. Submission remains locked until all six reveal. Victory UI and confetti start after the final tile.
4. Cache-busting versions were changed for the updated JS/CSS in the page so Render users do not keep the old behavior in browser cache.

## Changed files

- `static/game.js`
- `static/atlas3d.js`
- `static/style.css`
- `templates/index.html`
- `ANSWER_MODEL_AND_FLIP_FIX.md` (this report)

## Checks performed here

- Browser: Chromium loaded the actual page's HTML/CSS/JS with a simulated HTTP game API and actual `game_logic` feedback (Flask unavailable).
- Test sequence: guess Earth's Moon, then correctly guess Halley's Comet.
- At 140 ms after submitting the first guess, **0/6** parameter results had appeared. At ~1.19 s, **2/6** had appeared. Eventually, **6/6** appeared in sequence.
- Victory overlay not visible during the first flip; after all six completed, victory label explicitly named **Halley's Comet**, six green tiles rendered, and 156 confetti elements existed.
- Preview identity selection was tested across all **21** playable objects and switched back to Halley's Comet.
- Browser JavaScript exceptions: **0** in the above test.
- `node --check` passed for `game.js` and `atlas3d.js`.
- Five pure-Python gameplay tests passed, including 441 target/guess combinations.

## Unverified

- In this environment Chromium did not expose WebGL. Therefore actual **GPU visual appearance of models**, including the detailed animated comet tail, **was not visually verified**. The correct model was selected and its required asset files were present in the project, but that does not prove it rendered on a user's GPU.
- Flask was not installed and package installation was unavailable. Real Flask route integration tests were not run here; the browser tested a simulated API using the real `game_logic` functions.

## Local launch

Extract the ZIP; open the `planetdle` directory and run `START_PLANETDLE.bat`, or `python -m pip install -r requirements.txt` followed by `python app.py`.

## Online deployment

Replace the changed files at their same GitHub paths and commit; Render will redeploy the repository. After deployment refresh with Ctrl+Shift+R.
