# Second verification

First pass used Waitress on the working source. The release candidate then ran from a clean ZIP extraction. The all-world interaction run on port 5097 used a fresh Chrome tab, cleared cookies and disabled the browser cache. It repeated the gameplay journey and completed all 21 canvas clicks, 20 texture decodes and six indexed mesh categories. It recorded no uncaught JavaScript exceptions.

A final backend-only change tightened filtering of Earth gallery photos. The shipping archive was re-extracted and served on port 5098. It repeated desktop gameplay, five representative world clicks, exact and rapid Locate, all texture decodes and mesh-category checks, the narrow layout check, and reduced-motion checks. Separate browser runs exercised wheel zoom, a real drag, high-clearance moon placement, offline gallery behavior, recovery from a failed guess request, and the no-WebGL fallback. The Python suite passed 18 tests from the shipping extraction. The Earth gallery's live upstream query returned an empty result on the final run, so success obtaining usable photos there is not verified. The app kept its profile available.

The final distribution adds the verification files to the tested build. The executable files and bundled assets are the ones served from the shipping extraction.
