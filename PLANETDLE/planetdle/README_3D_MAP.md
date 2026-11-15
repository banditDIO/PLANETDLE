# PLANETDLE — Scientific 3D Map update

Run `START_PLANETDLE.bat` on Windows, or install Flask (`pip install -r requirements.txt`) and run `python app.py`.

- The **solar system stays on the right**, and the Wordle-style astronomy guessing game stays intact.
- Planet and moon sizes are **exaggerated on purpose** to improve clicking and visibility.
- The WebGL layer renders **actual spherical geometry via a sphere-projection fragment shader** in each moving body's map position; the user can click a world to rotate and zoom it in the in-map inspection panel. The scientific hotspot viewer remains accessible through its button.
- The /api/texture route serves cached or live scientific base maps. The verified map sources are listed in TEXTURE_SOURCES.md.
- Run `python CACHE_TEXTURES.py` **once with internet access** to cache supported maps for offline demonstrations. Planet images are not generated or illustrated when a verified source is unavailable; those worlds display **neutral untextured shaded globes**.
- The previously illustrated surface generation was removed from the map and from the 3D viewer fallback. The 2D-only fallback is neutral too.
- Guess tiles now reveal one at a time, approximately 245 ms apart, using a 650 ms drop/flip transition.
- Educational notes were rewritten in plain language and remain unrelated to the hidden answer.

## Important verification status

- **Passed**: `python test_game.py`, 5 game tests including 21×21 combinations; JavaScript syntax checks; Python compilation.
- **Not verified here**: full Flask route integration (Flask unavailable), live planetary texture downloading (internet unavailable), GPU browser interactions (browser automation could not complete), Windows startup.
- **Scientific integrity**: Solar System Scope maps are adaptations with some reconstructed/filled areas (CC BY 4.0), not pure NASA raw photographs. Some NASA/JPL moon products may not be accessible from old URL paths. An empty/no-map object is deliberately not presented as a photographic texture.

Before showing judges, open Earth, Jupiter, Saturn, Europa and one mapless object on your intended computer, check the actual maps are downloaded, then try rotating each globe, keyboard gameplay, Locate, and victory.
