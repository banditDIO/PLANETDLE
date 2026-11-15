# PLANETDLE map and planet rendering update

The desktop layout restores the two-column map beside the game. At the 1440 × 1000 test viewport the map was 695 × 700 CSS pixels. At default zoom, Jupiter’s globe was about 71 pixels across. Planet, moon and small-body radii were increased in the renderer itself.

Clicking a world scrolls to the interactive profile viewer. Scientific notes are expandable text beneath the model. The previous static portrait and 3D launch controls are absent from the profile. Saturn and Uranus use tilted, depth-tested ring planes with distinct bands. The Pluto globe uses NASA New Horizons color mosaic PIA11707. The black far-southern area is an imagery coverage gap. Credit and source URL are in TEXTURE_SOURCES.md.

Headless Chrome used software WebGL. Saturn and Pluto renders were visually inspected. Browser log follows. Eleven Python tests also passed.
PASS Earth profile on startup
PASS WebGL initialized
PASS Orbit advances with pointer on planet {"before":{"x":306.8854058585,"y":327.41122218524237,"r":24.96,"visualR":15.959999999999999},"after":{"x":312.61571028595404,"y":324.5871103181356,"r":24.96,"visualR":15.959999999999999}}
PASS Real Mercury canvas click loads profile and scrolls
PASS Partial search and Locate select Jupiter and scroll {"title":"Jupiter","visible":true}
PASS Locate centers Jupiter at its new zoom 3.697124678813871
PASS Europa moves relative to Jupiter {"moon1":[97.6016587450087,73.1977882877813],"moon2":[89.71128455833536,82.6794135374301]}
EUROPA { x: 1138.1026178509042, y: 599.4976443869562 } <canvas id="solar-map" aria-label="Interactive map of the Solar System. Drag to pan, use the mouse wheel to zoom, and click object
PASS Real Europa canvas click loads profile and scrolls {"title":"Europa","visible":true}
PASS Interactive viewer is in profile below map
PASS Inline viewer renders rotating pixels
PASS Restored map dimensions [695,700]
PASS Jupiter drawn at least 70 CSS pixels in diameter
PASS Europa has inline 3D and no launch button or static portrait
PASS Pluto color mosaic loaded
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
TEXTURES [["Bennu",[1024,512]],["Callisto",[1440,720]],["Ceres",[1024,512]],["Earth",[2048,1024]],["Earth's Moon",[2048,1024]],["Enceladus",[1440,720]],["Europa",[1440,720]],["Ganymede",[1440,720]],["Halley's Comet",null],["Io",[1440,720]],["Jupiter",[2048,1024]],["Mars",[2048,1024]],["Mercury",[2048,1024]],["Neptune",[2048,1024]],["Phobos",[1440,720]],["Pluto",[2048,1024]],["Saturn",[2048,1024]],["Titan",[2048,1024]],["Uranus",[2048,1024]],["Venus",[2048,1024]],["Vesta",[1024,512]]]
CHROME Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36
PASS No uncaught browser JavaScript errors []
