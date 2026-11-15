# PLANETDLE — orbit and stability update

- Fixed HTTP 500 `KeyError: 'game'` in `/api/guess`: rejected guesses now return a normal JSON error, leaving the existing game session intact.
- Applied the same defensive session handling to `/api/hint`.
- Practice rounds now choose a random target, rather than repeating a fixed object.
- Pluto, Ceres, Bennu, Vesta, and Halley's Comet now move on their own visible schematic orbital tracks.
- The eight planets continue orbiting; clicking a planet reveals the moons included in this 21-object atlas, which animate around it.
- Wider orbit tracks and revised interface fonts and colors, inspired by space mission-control design. Not an official NASA or Space Apps product.
- No additional runtime dependencies beyond Flask.

## Start
Extract the ZIP and double-click `START_PLANETDLE.bat` on Windows, or run `pip install -r requirements.txt` and `python app.py`. Open `http://127.0.0.1:5000/` (do not open the HTML file directly). Refresh the browser with Ctrl+F5 after replacing an older version.

## Tests
`python test_game.py` runs 4 tests covering all 441 target/guess pairs, rejected and duplicate guesses, hints, and win/loss conditions. JavaScript syntax checked with `node --check static/game.js`. A Flask-route smoke test was performed with a mocked Flask interface because Flask could not be installed in the isolated test environment. **Full browser integration and live Flask tests have not been completed.**

Orbital paths, sizes and periods are stylized for visibility and are not astronomical simulations. Planetary textures are loaded from an external provider when available, with local procedural fallbacks.
