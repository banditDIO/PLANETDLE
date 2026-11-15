# PLANETDLE hover, map size, and rendering verification

The desktop map card including its toolbar, search, canvas and legend matches the six guess rows. Chrome measured both at 419 CSS pixels. Narrow screens retain a compact separate map. Hovering a world holds map motion and spin. Moving off resumes both. Jupiter's four moons retain their high-zoom separation.

Pluto uses the New Horizons imagery. The renderer distinguishes unavailable southern pixels with a neutral hatch. Halley uses an illustrative nucleus, moving dust particles and a pulsing double tail. The Chrome screenshot change check measures the whole comet render across two frames.

Captured each of the 21 profiles on Windows in headless Chrome with software WebGL and visually reviewed the contact sheet. Captures show one view per object. This does not establish full-rotation image coverage. Callisto still has a small source image gap. All 11 Python tests passed.

## Chrome log

PASS Earth profile on startup
PASS WebGL initialized
PASS Orbit pauses while pointer hovers on Mercury
PASS Orbit resumes when pointer leaves Mercury
PASS Real Mercury canvas click loads profile and scrolls
PASS Partial search and Locate select Jupiter and scroll {"title":"Jupiter","visible":true}
PASS Locate centers Jupiter at its new zoom 3.8199474803356046
PASS Europa moves relative to Jupiter {"moon1":[86.0199322254374,55.3702199736569],"moon2":[77.82263272460341,66.39975779934358]}
EUROPA { x: 1127.0993498875614, y: 580.1192667609226 } <canvas id="solar-map" aria-label="Interactive map of the Solar System. Drag to pan, use the mouse wheel to zoom, and click object
PASS Real Europa canvas click loads profile and scrolls {"title":"Europa","visible":true}
PASS Interactive viewer is in profile below map
PASS Inline viewer renders rotating pixels
PASS Full map card matches six-row guess grid [419,419]
PASS Jupiter and four moons keep clear separation at high zoom 15.999999999999911
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
PASS Wrong guess has a rotating WebGL preview
PASS Correct daily guess opens victory overlay "✦ World discovered!"
PASS Victory has a rotating WebGL preview
PASS Victory button starts playable practice round
PASS Halley profile labels illustrative tail
PASS Halley animated render changes over time
TEXTURES [["Bennu",[1024,512]],["Callisto",[1024,512]],["Ceres",[1024,512]],["Earth",[2048,1024]],["Earth's Moon",[2048,1024]],["Enceladus",[1024,512]],["Europa",[1440,720]],["Ganymede",[1440,720]],["Halley's Comet",null],["Io",[1440,720]],["Jupiter",[2048,1024]],["Mars",[2048,1024]],["Mercury",[2048,1024]],["Neptune",[2048,1024]],["Phobos",[1440,720]],["Pluto",[2048,1024]],["Saturn",[2048,1024]],["Titan",[2048,1024]],["Uranus",[2048,1024]],["Venus",[2048,1024]],["Vesta",[1024,512]]]
CHROME Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36
PASS No uncaught browser JavaScript errors []
