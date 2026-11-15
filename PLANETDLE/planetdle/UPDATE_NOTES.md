# Planetdle: first-guess and rotating surfaces update

## Fixed
- A browser refresh now starts a clean daily game on both the server and client, preventing the server from rejecting a visually empty first guess as a duplicate from an earlier session.
- Starting a practice round resets the visible board in place without reloading the page (which would otherwise reset the game to daily mode).
- All 21 map bodies and the selection portraits use unique cached, illustrated cylindrical surface maps. Their visible features shift as the bodies rotate, including when zoomed in. The effect is accelerated and schematic, not a scientific rotation simulator.
- Jupiter's banded cloud structure and Great Red Spot are preserved as a distinctive illustrated appearance. Other worlds now receive their own crater, ice, storm, cloud, or terrain patterns.

## NASA API assessment
- NASA Image and Video Library is relevant for browsing original mission imagery, but search results are not reliable seamless planet textures. No live API was added: it would add network dependence and would not directly improve animated surface rendering.
- NASA Trek imagery is scientifically valuable but requires specialized map tiling and licensing/attribution review before incorporating in a texture engine.
- Current surfaces are **original schematic illustrations**, not NASA photographs, geographic maps, or measured rotation/orbit geometry. Existing astronomy fact notes and caveats remain applicable.

## Verification
- JavaScript syntax checked with Node.
- Four Python unit tests passed, including all 441 target/guess combinations.
- A full graphical browser test has not been performed here.
