# PLANETDLE browser and texture test report

## Baseline reproduction

Source archive was `PLANETDLE_3D_Atlas_Upgrade_TESTED_CODE.zip`, the newest PLANETDLE archive located in Downloads. The original ZIP was extracted separately and served unchanged by Flask. In Chrome 157, the 2D map and WebGL layer initialized, but the first call to `showDetails("Earth")` threw `ReferenceError: nasaAbort is not defined` at line 422 in `static/game.js`. The exception occurred before the first orbit animation request. After waiting and making an actual pointer click on Mercury, the recorded orbital clock remained at zero and Mercury remained at (260.66, 314.97) CSS pixels. The click threw the same exception and no profile appeared. Source inspection also found that the click handler passed navigation as false and the animation clock froze while hovering.

## File changes

- `static/game.js` initializes the photo-gallery abort controller, keeps the existing orbit clock advancing, and queues the next frame before hover and portrait updates. Pointer-down captures the selected world, so motion during the click cannot change which world opens. Single clicks open the profile and in-map inspector and scroll to the profile. Locate closes stale inspectors and applies zoom before calculating the centering offset. Removed a cosmetic color spot drawn over Io.
- `static/atlas3d.js` draws the WebGL globes at the same cadence as their orbit and hit targets, expands the ringed globe viewport, registers the seven new maps and switches to 2D fallback when an atlas WebGL context is lost.
- `app.py` and `CACHE_TEXTURES.py` register the new mission mosaic URLs. `static/discovery.js` credits those mission mosaics in Discovery Lab. `static/planet_maps/` bundles 20 JPEGs locally.
- `test_routes.py` points its missing-texture assertion at Halley’s Comet because Phobos now has a real map. `LAUNCH.md` and `TEXTURE_SOURCES.md` cover setup and provenance. This report supersedes the earlier validation status.
- The game rules, project layout, object catalogue, existing teaching notes and victory UI came from the source archive.

## Verification scope

Windows headless Chrome 157, 1440 × 1000, SwiftShader WebGL, running against the local Flask server. The automation observed the existing draw inputs to locate moving canvas targets and used Chrome pointer events for world clicks, inspector drag and wheel. Search and guess fields were populated through the DOM and submitted through their normal form submit handlers using requestSubmit. The test computed the daily target locally from the same game function to exercise victory, without sending it to the page separately from the guess. Discovery Lab and practice actions used DOM button activation.

The orbit checks measured position changes across frames. Inspector checks compared rendered screenshot pixels before and after running the globe and issuing drag/wheel events. Auto-rotation remained active during the drag/wheel check, so its screenshot comparison does not independently quantify either gesture. Texture checks required the atlas image loader to report ready and the browser to decode the same local texture endpoint. The per-world log gives dimensions. This run did not independently capture or compare pixels for every globe or exercise hardware GPU drivers, mobile touch, other browsers, WebGL context loss or live NASA gallery results. The 13 inherited cache files were matched to the original release source manifest and decoded. They were not independently re-downloaded and hash-compared. The seven new maps were retrieved from the official source servers during the repair.

Python/Flask suite passed all 11 tests, including the existing 441 target/guess combinations. Halley’s Comet keeps a neutral shaded sphere, and the Sun remains the schematic central marker. See `TEXTURE_SOURCES.md` for all credits and coverage.

## Chrome run log

```text
PASS Earth profile on startup
PASS WebGL initialized
PASS Orbit advances with pointer on planet {"before":{"x":274.28856162886797,"y":304.5277989397103,"r":17,"visualR":4.787999999999999},"after":{"x":277.4593376864521,"y":302.62533398194114,"r":17,"visualR":4.787999999999999}}
PASS Real Mercury canvas click loads profile and scrolls
PASS Partial search and Locate select Jupiter and scroll {"title":"Jupiter","visible":true}
PASS Locate centers Jupiter at its new zoom 9.493133729609426
PASS Europa moves relative to Jupiter {"moon1":[91.63715721394681,47.027985474038815],"moon2":[89.46694276231597,51.03593001763045]}
EUROPA { x: 1138.9456661010774, y: 573.7595858099597 } <canvas id="solar-map" aria-label="Interactive map of the Solar System. Drag to pan, use the mouse wheel to zoom, and click object
PASS Real Europa canvas click loads profile and scrolls {"title":"Europa","visible":true}
PASS Canvas click also opens map inspector
PASS WebGL inspector pixels change during rotation
PASS Inspector responds to pointer drag and wheel
PASS Locate finds profile and orbit position for Bennu
PASS Locate finds profile and orbit position for Callisto
PASS Locate finds profile and orbit position for Ceres
PASS Locate finds profile and orbit position for Earth
PASS Locate finds profile and orbit position for Earth's Moon
PASS Locate finds profile and orbit position for Enceladus
PASS Locate finds profile and orbit position for Europa
PASS Locate finds profile and orbit position for Ganymede
PASS Locate finds profile and orbit position for Halley's Comet
PASS Locate finds profile and orbit position for Io
PASS Locate finds profile and orbit position for Jupiter
PASS Locate finds profile and orbit position for Mars
PASS Locate finds profile and orbit position for Mercury
PASS Locate finds profile and orbit position for Neptune
PASS Locate finds profile and orbit position for Phobos
PASS Locate finds profile and orbit position for Pluto
PASS Locate finds profile and orbit position for Saturn
PASS Locate finds profile and orbit position for Titan
PASS Locate finds profile and orbit position for Uranus
PASS Locate finds profile and orbit position for Venus
PASS Locate finds profile and orbit position for Vesta
PASS Unknown object shows search feedback
PASS Wrong guess displays astronomy note
PASS Correct daily guess opens victory overlay "✦ World discovered!"
PASS Victory button starts playable practice round
PASS Mars Discovery Lab opens with scientific hotspot controls
PASS Scientific hotspot updates field notes
PASS 20 JPEG globe textures decoded in Chrome, including all planets and moons
TEXTURES [["Bennu",[1024,512]],["Callisto",[1440,720]],["Ceres",[1024,512]],["Earth",[2048,1024]],["Earth's Moon",[2048,1024]],["Enceladus",[1440,720]],["Europa",[1440,720]],["Ganymede",[1440,720]],["Halley's Comet",null],["Io",[1440,720]],["Jupiter",[2048,1024]],["Mars",[2048,1024]],["Mercury",[2048,1024]],["Neptune",[2048,1024]],["Phobos",[1440,720]],["Pluto",[1024,512]],["Saturn",[2048,1024]],["Titan",[2048,1024]],["Uranus",[2048,1024]],["Venus",[2048,1024]],["Vesta",[1024,512]]]
CHROME Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36
PASS No uncaught browser JavaScript errors []
```

