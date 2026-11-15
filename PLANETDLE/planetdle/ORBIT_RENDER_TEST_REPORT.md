# PLANETDLE orbit and rendering audit

The map stage matches the initial Wordle board height on desktop. The map and board both measured 616 CSS pixels in Chrome. On narrow screens the map uses its own compact height.

Planet and moon magnification is capped independently of map panning and orbit zoom. Jupiter's moons keep a fixed angular separation on schematic tracks. At high zoom, the minimum distance between the visible edges of Jupiter and its four moons was 16 CSS pixels. The atlas now uses a separate display spin clock. Chrome observed successive WebGL rotation values changing while orbital motion continued. Rotation and orbits use display speeds.

The Halley illustration uses an elongated, dark, lumpy nucleus, coma, a curved dust tail and a narrow ion tail. It is based on ESA's [Giotto observations](https://www.esa.int/media/giotto-approaching-comet-halley).

Headless Chrome generated 21 profile captures. All were reviewed in the contact sheet, along with the raw map contact sheet. Those captures cover one viewing angle per world. Pluto's southern darkness and Callisto's small dark patch are source coverage gaps. Some ice giant cloud features are faint and the irregular bodies use illustrative silhouettes. This release keeps those scientific texture limitations visible. All 11 Python tests passed.
PASS Earth profile on startup
PASS WebGL initialized
PASS Orbit advances with pointer on planet {"before":{"x":282.4291477822497,"y":279.80448700995913,"r":23.82,"visualR":14.819999999999999},"after":{"x":287.2035506631569,"y":276.1587565766982,"r":23.82,"visualR":14.819999999999999}}
PASS Real Mercury canvas click loads profile and scrolls
PASS Partial search and Locate select Jupiter and scroll {"title":"Jupiter","visible":true}
PASS Locate centers Jupiter at its new zoom 3.6612298807230417
PASS Europa moves relative to Jupiter {"moon1":[98.97451390514988,25.87152096880436],"moon2":[96.68643161516178,33.421908107207855]}
PASS Real Europa canvas click loads profile and scrolls {"title":"Europa","visible":true}
PASS Interactive viewer is in profile below map
PASS Inline viewer renders rotating pixels
PASS Map stage matches Wordle board [616,616]
PASS Jupiter and four moons keep clear separation at high zoom 15.999999999999996
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
{"initial":{"yaw":0.8206100000000002,"time":2.1595000000000004},"later":{"yaw":1.3905339999999982,"time":3.659299999999995},"errors":[]}
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
