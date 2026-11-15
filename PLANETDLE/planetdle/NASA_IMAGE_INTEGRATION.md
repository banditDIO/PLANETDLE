# NASA Image and Video Library integration

Select any object on the Solar System map. The details panel now loads up to three archive images via `/api/nasa/<world>`. The Flask server calls the public NASA Image and Video Library `/search` endpoint, caches results for 24 hours, restricts searches to the 21 atlas objects, and only returns small images. No NASA API key is required. The app works when NASA is unavailable.

These are archive photographs with source links and are **not** seamless planetary surface maps. The animated map and spinning illustrated globes remain separate. NASA images may depict spacecraft, flybys or mosaics, not a direct full-disk view; click each image to read its official context. The app is not affiliated with NASA.

Reference: https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf
