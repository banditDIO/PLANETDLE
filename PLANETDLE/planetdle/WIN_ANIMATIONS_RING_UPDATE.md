# PLANETDLE — Win effects, Wordle-style clue flips, and ring motion

## Files changed
- `static/game.js`: staggered six-parameter tile flip with score colors appearing only as each tile turns over; confetti burst at victory; moving bright particles in the 2D fallback rings.
- `static/style.css`: pre-reveal tile state and confetti fall animation refinements.
- `static/atlas3d.js`: subtle time-dependent differential particle motion in Saturn and Uranus ring material. The rings remain centered on the same drawing coordinates as their orbiting parent planet, rather than moving as separate scene objects.

## Verification (November 15, 2026)
- `node --check static/game.js` — PASS.
- `node --check static/atlas3d.js` — PASS.
- `python test_game.py` — PASS: 5 tests, including all target/guess combinations.
- `python -m compileall -q .` — PASS.
- Headless Chromium browser with the real frontend scripts and **mocked game API** — PASS: six clue tiles revealed sequentially; all pending states cleared; centered victory overlay appeared only after the reveal; 156 confetti pieces appeared; no uncaught JS exceptions.
- Live Flask integration — NOT TESTED: Flask was unavailable and package downloads were blocked in this environment.
- WebGL ring rendering on GPU — NOT TESTED: browser did not provide a working WebGL context. Ring shader source updated, but testing on a WebGL-enabled computer is still necessary.

## Use locally
1. Extract the ZIP.
2. Enter the `planetdle` folder.
3. Run `python -m pip install -r requirements.txt` if required.
4. Run `python app.py`, or use the included Windows launch script.
5. Open `http://127.0.0.1:5000` and refresh with Ctrl+Shift+R if an older JavaScript file is cached.

## Update Render
GitHub is Render's source. Commit the changed files in the same project paths and allow the web service to redeploy. Merely downloading this ZIP does not update the live website.
