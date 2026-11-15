# Texture and mesh verification

The records below come from Chrome through the production-style local server. Each JPEG was decoded and the atlas cache reported it ready. The per-world credit and processing details are in TEXTURE_SOURCES.md. Six indexed meshes were observed in the map, covering Bennu, Ceres, Phobos, Pluto, Vesta, and Halley. The Halley nucleus has an observational shape model and illustrated dust and ion tails. Its direct texture test intentionally expects 404. No JPEG is assigned to Halley. The Sun is a schematic map marker outside the 21 supported guess targets.

Decode and render checks cannot certify photographic coverage or the orientation of every longitude. Pluto’s official model has approximate southern detail. Some other source mosaics retain original coverage gaps or visible processing. Current Chrome screenshots cover the desktop and one narrow profile. The previous release includes single-angle renders for all 21 objects, with older captures for models that were later replaced.

| World | Image dimensions | Atlas status |
|---|---:|---|
| Bennu | 1024 × 1024 | PASS — loaded |
| Callisto | 1024 × 512 | PASS — loaded |
| Ceres | 4096 × 2048 | PASS — loaded |
| Earth | 2048 × 1024 | PASS — loaded |
| Earth's Moon | 2048 × 1024 | PASS — loaded |
| Enceladus | 1024 × 512 | PASS — loaded |
| Europa | 1440 × 720 | PASS — loaded |
| Ganymede | 1440 × 720 | PASS — loaded |
| Halley's Comet | — | NOT APPLICABLE — mesh and illustrated effects |
| Io | 1440 × 720 | PASS — loaded |
| Jupiter | 2048 × 1024 | PASS — loaded |
| Mars | 2048 × 1024 | PASS — loaded |
| Mercury | 2048 × 1024 | PASS — loaded |
| Neptune | 2048 × 1024 | PASS — loaded |
| Phobos | 2048 × 2048 | PASS — loaded |
| Pluto | 4096 × 2048 | PASS — loaded |
| Saturn | 2048 × 1024 | PASS — loaded |
| Titan | 2048 × 1024 | PASS — loaded |
| Uranus | 2048 × 1024 | PASS — loaded |
| Venus | 2048 × 1024 | PASS — loaded |
| Vesta | 2048 × 1024 | PASS — loaded |
