# Inline 3D update

The existing atlas viewer now sits inside the selected world's profile. Single-click and Locate scroll to that section. The viewer retains rotation, drag, zoom and access to scientific hotspots. The orbit map spans the page, and the rendered planet, moon and minor-body sizes have increased. Bennu, Phobos, Vesta and Ceres have schematic body silhouettes. Halley has an illustrative irregular nucleus, coma and tail oriented away from the Sun in the map. The 20 mission-derived or mission-informed textures are still bundled. A valid wrong guess previews the object guessed without showing the answer. The winning box shows the correct object rotating.

Headless Chrome 157 on Windows, SwiftShader WebGL, viewport 1440 × 1000. The profile rotation check compared screenshot pixels. The guess preview tests checked the live WebGL context and model label. The comet screenshot was visually inspected. Python unit and Flask route suite passed 11 tests. The previous repair report records the original bug reproduction and source provenance. This update does not establish mobile or hardware GPU performance.

```text
PASS Earth profile on startup
PASS WebGL initialized
PASS Orbit advances with pointer on planet {"before":{"x":616.3999492561129,"y":377.19021220291575,"r":20.4,"visualR":11.399999999999999},"after":{"x":621.4751663341021,"y":373.7363028115007,"r":20.4,"visualR":11.399999999999999}}
PASS Real Mercury canvas click loads profile and scrolls
PASS Partial search and Locate select Jupiter and scroll {"title":"Jupiter","visible":true}
PASS Locate centers Jupiter at its new zoom 4.411936036976442
PASS Europa moves relative to Jupiter {"moon1":[102.88629459623724,38.91542604490252],"moon2":[99.64091463440218,46.60137477392459]}
EUROPA { x: 807.0444973246986, y: 564.8625783656037 } <canvas id="solar-map" aria-label="Interactive map of the Solar System. Drag to pan, use the mouse wheel to zoom, and click object
PASS Real Europa canvas click loads profile and scrolls {"title":"Europa","visible":true}
PASS Interactive viewer is in profile below map
PASS Inline viewer renders rotating pixels
PASS Full-width large orbit map [1383,820]
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
TEXTURES [["Bennu",[1024,512]],["Callisto",[1440,720]],["Ceres",[1024,512]],["Earth",[2048,1024]],["Earth's Moon",[2048,1024]],["Enceladus",[1440,720]],["Europa",[1440,720]],["Ganymede",[1440,720]],["Halley's Comet",null],["Io",[1440,720]],["Jupiter",[2048,1024]],["Mars",[2048,1024]],["Mercury",[2048,1024]],["Neptune",[2048,1024]],["Phobos",[1440,720]],["Pluto",[1024,512]],["Saturn",[2048,1024]],["Titan",[2048,1024]],["Uranus",[2048,1024]],["Venus",[2048,1024]],["Vesta",[1024,512]]]
CHROME Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36
PASS No uncaught browser JavaScript errors []
```
