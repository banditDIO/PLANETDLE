# PLANETDLE release candidate · functionality audit

## Start on Windows
1. Extract this ZIP and open the `planetdle` directory.
2. Double-click `START_PLANETDLE.bat` (or run `pip install -r requirements.txt` and `python app.py`).
3. Open http://127.0.0.1:5000/; do not open `index.html` directly.
4. **Recommended before the judges arrive:** while connected to the Internet, run `python CACHE_TEXTURES.py` once, then check the downloaded files in `static/planet_maps/`. This enables offline use of downloaded scientific maps. The rest of the game works offline.

## Confirmed code issues addressed
- Secret answer was previously stored in a browser-readable signed Flask session cookie. It now lives in server-side memory, with only an opaque identifier stored in the cookie.
- Form submissions could overlap while the prior guess was animating or waiting for a response. Now guesses are locked until the complete six-tile sequence ends. Practice resets cannot race an in-flight guess.
- The 2D orbital animation speed was too high; it now runs at a substantially reduced schematic rate and freezes while an object is hovered or dragged for easier selection.
- Map clicks did not always scroll to the selected object's information. Map clicks and Locate now share `showDetails(...,true)`, and stale NASA archive requests are aborted.
- The 3D viewer formerly used only procedural illustration textures. It now loads verified source maps, uses the illustration as a clearly labelled fallback, and lazily requests images only when needed.
- The 3D hotspot DOM was recreated every frame. It now updates at a lower rate and avoids excess DOM churn.
- The public server launched with debug enabled by default. Debug is now disabled unless `PLANETDLE_DEBUG=1` is set.

## What the actual game implements
21 celestial-object answers, 6 guesses per round, six **attribute** comparisons per guess, not word/letter tile matching. Wordle-style repeated-letter rules therefore do not apply; a sequential animation now reveals the six comparison tiles instead of creating an unrelated spelling game.

## Verified checks
- Python compilation: passed.
- `test_game.py`: five tests passed, including 21×21 (441) target/guess combinations.
- JavaScript syntax (`node --check`): passed.
- Headless Chromium with inline assets and simulated API: map image changed over time, search/Locate selected Jupiter and scrolled, initial guess accepted, six-tile animation rendered, win overlay and 170 confetti pieces appeared, new practice reset cleared the first row, no page exceptions.
- 3D modal opened and closed in the Chromium test, but **WebGL was unavailable** in that test environment; true 3D rendering, GPU performance, rings and 3D markers could not be validated there.
- Live Flask HTTP integration could not be tested in the build environment because Flask was not installed; the browser API responses were simulated. Source-server access to download texture files was also blocked in this build environment.

## Remaining limitations
- Server-side game state is in memory; restarting the server loses the current round. It is suitable for a single-process local presentation; production multi-process deployment would need shared storage.
- NASA image gallery requires Internet and occasionally returns unrelated results or none; it does not affect gameplay.
- Planetary texture maps are loaded from external verified sources only on demand or if previously cached with `CACHE_TEXTURES.py`. **No external maps were bundled in this ZIP**, because the build environment could not download them.
- Nine Solar System Scope maps and four NASA/JPL moon maps have verified URL references. The other eight objects use explicitly labelled artistic approximations until licensed global maps are curated.
- Orbital trajectories, apparent sizes and hotspot positions are educational schematics, not ephemeris-grade calculations.
