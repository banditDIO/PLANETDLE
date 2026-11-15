# PLANETDLE profile and texture update

The desktop map remains 695 × 700 CSS pixels at the 1440 × 1000 test viewport. Eight planet radii were reduced by about 5–10%. The Sun's disk was enlarged, with the inner orbits spaced farther out. The selected-world profile now places the inline 3D viewer with its notes next to a more readable overview and fact cards, with a single column at narrow widths.

The old Enceladus Voyager mosaic showed broad blank regions. The new USGS Cassini mosaic provides much more coverage. Callisto uses the USGS Galileo/Voyager global mosaic and retains a smaller dark coverage gap near the pole. The lighting change makes the textured limb more readable. Neptune uses an approximate display color adjustment informed by Irwin et al. (2024), and Pluto retains the genuine New Horizons color mosaic and the source's unmapped far south.

NASA's repositories and the USGS map catalog fit the project best for provenance. Printables is primarily a print-mesh repository. 3D Solar System Online is a standalone viewer. Sketchfab returned HTTP 403, so the linked pack's files and license could not be verified. This update ships two replacement mission mosaics and uses the existing renderer and schematic display shapes.

Headless Chrome 157 on Windows with software WebGL. Visually inspected rendered Callisto, Enceladus, and Neptune captures. The Python/Flask suite passed all 11 tests. See the browser log for interaction and texture checks.

## Browser log

PASS Earth profile on startup
PASS WebGL initialized
PASS Orbit advances with pointer on planet {"before":{"x":293.31075548750687,"y":315.18351900977194,"r":23.82,"visualR":14.819999999999999},"after":{"x":301.4073138777579,"y":311.2245901891232,"r":23.82,"visualR":14.819999999999999}}
PASS Real Mercury canvas click loads profile and scrolls
PASS Partial search and Locate select Jupiter and scroll {"title":"Jupiter","visible":true}
PASS Locate centers Jupiter at its new zoom 4.136055796241165
PASS Europa moves relative to Jupiter {"moon1":[96.1959191407517,75.03562580978428],"moon2":[87.05340783387953,85.47341214967514]}
EUROPA { x: 1134.874975004961, y: 603.2546770619966 } <canvas id="solar-map" aria-label="Interactive map of the Solar System. Drag to pan, use the mouse wheel to zoom, and click object
PASS Real Europa canvas click loads profile and scrolls {"title":"Europa","visible":true}
PASS Interactive viewer is in profile below map
PASS Inline viewer renders rotating pixels
PASS Two-column map dimensions [695,700]
PASS Sun enlarged and planet display scale reduced
PASS World profile shows the model and the fact cards
PASS Updated texture loaded for Callisto
PASS Updated texture loaded for Enceladus
PASS Updated texture loaded for Neptune
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
TEXTURES [["Bennu",[1024,512]],["Callisto",[1024,512]],["Ceres",[1024,512]],["Earth",[2048,1024]],["Earth's Moon",[2048,1024]],["Enceladus",[1024,512]],["Europa",[1440,720]],["Ganymede",[1440,720]],["Halley's Comet",null],["Io",[1440,720]],["Jupiter",[2048,1024]],["Mars",[2048,1024]],["Mercury",[2048,1024]],["Neptune",[2048,1024]],["Phobos",[1440,720]],["Pluto",[2048,1024]],["Saturn",[2048,1024]],["Titan",[2048,1024]],["Uranus",[2048,1024]],["Venus",[2048,1024]],["Vesta",[1024,512]]]
CHROME Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36
PASS No uncaught browser JavaScript errors []
Final Sun size follow-up in Chrome (CSS-pixel diameters):
{"sun":75.24,"jupiter":63.839999999999996,"title":"Earth"}
