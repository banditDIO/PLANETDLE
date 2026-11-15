# PLANETDLE final audit

This release started from PLANETDLE_Small_Body_Models.zip and preserves the six-attribute game, layout, hover-to-pause, inline inspector, model set, and comet effects. The pre-change checklist and test evidence are included separately. Status reflects tests actually run.

| Feature | Expected | Test performed and result | Bug and fix | Retest status |
|---|---|---|---|---|
| Fresh desktop launch | Board, Search, and Earth profile ready | Cold-cache Chrome opened app through Waitress and checked 21 names and health | Added concise six-trait instructions and favicon | PASS |
| Guess evaluation | Six clue tiles, valid directions and duplicate protection | Python suite checked all 441 guess/answer pairs and validation | Existing categorical rules retained | PASS |
| Refresh and session | Round and answer remain consistent | Wrong guess, page reload, duplicate rejection, then two-guess victory in Chrome | Baseline lost progress; server now sends accepted history and browser restores it | FIXED |
| Rapid and parallel requests | One accepted guess per move | Three synchronous submits in browser sent one request; parallel Flask clients sharing a cookie returned 200 and 409 | Added round ID and turn count so stale tabs cannot overwrite the active round | FIXED |
| Invalid input | Keep board usable and attempt count unchanged | Browser unknown name; Flask type tests on guess/restart | Baseline list input returned 500; typed validation returns JSON 400 | FIXED |
| Win, defeat, restart | Victory and confetti; loss after six wrong guesses; clean restart | Headless Chrome exercised both outcomes and restarted; API tests also check extra guess rejection | Fresh round ID prevents stale plays after restart | PASS |
| Answer visibility | No target in cookie or page before finish | Flask cookie test, Chrome inspected round JSON after reload | Page contains public guess feedback only. Daily puzzles are deterministic from server date | PASS |
| Notes and hints | Clear and distinct sourced learning facts, targeted tiles | Reviewed all 24 old notes and all 21 result facts. Chrome displays revised notes; Python verifies 15 distinct notes and hint cap | Replaced the weakest notes and made result facts easier to read | FIXED |
| Reveal and confetti | Ordered reveal and appropriate motion | Chrome observed partial tile reveal and victory confetti | Added reduced-motion paths. Full high-refresh/gameplay performance not benchmarked | PASS for normal motion and reduced orbit |
| Orbit and hover | Moving bodies, pause on hover, resume away | Browser sampled atlas draw positions and clock during hover and return; real wheel and drag passed | Offscreen redraws stopped while clock advances | PASS |
| Click and scroll | Correct profile for moving objects | All 21 real desktop Chrome canvas clicks after Locate, including eight moons and small bodies | No additional click bug confirmed | PASS |
| Search and rapid Locate | Exact, case-insensitive, partial, invalid, and fast changes | Chrome ran exact name loop, jUP, invalid term, and rapid profile sequence | No issue remained in covered cases | PASS |
| Inline profile and field notes | World appears below map, notes expandable | Chrome checked profile title and opened Mars field note | Preserves prior inline layout and no launch button | PASS |
| Gallery relevance | World photos, graceful service failure | Live baseline Earth response showed press-event photos; Flask fixture checks filtering and final live Earth response returned no photos | Narrowed Earth search, matched whole words, and filtered events and artist concept titles | FIXED filtering; live Earth photo availability NOT VERIFIED |
| Texture and models | 20 embedded textures and six imported geometries | Chrome decoded each and saw indexed draw counts for all six. Flask decoded asset headers and checked mesh byte lengths | Recovery now rejects mismatched substitute textures for imported meshes | PASS |
| Ring geometry and source fidelity | Ringed worlds visible and credible, textures assigned correctly | Source manifest compared with filenames, browser decode per world and previous-version render inspection. Full rotation and photometric calibration were not repeated | No claim of complete image coverage. Pluto south approximate; some other mission mosaics have gaps; Halley tails illustrative | NOT VERIFIED for full rotational and orientation audit |
| Narrow layout | Readable, no horizontal overflow | 390px Chrome emulation plus profile screenshot | Profile stacks; keyboard focus outline and reduced-motion behavior added | PASS for measured layout |
| Physical touch, screen reader, accessibility conformance | Full operation and announcement quality | No physical mobile, screen reader, or WCAG test suite | Keyboard Locate and semantic disclosures available. Simulated no-WebGL browser check covered 2D map and profile | NOT VERIFIED |
| Runtime performance | Smooth on judges' computers | Foreground Chrome software WebGL, responsiveness checks, logs | Offscreen redraw reduction. Long-duration memory, GPU profiling and hardware frame budget unmeasured | NOT VERIFIED for quantitative performance |
| Compatibility | Works in available browsers | Chrome automated. Firefox headless captured UI, with no textured worlds in the early capture. Edge desktop executable not found | Firefox full 3D interaction and Edge not verified | NOT VERIFIED outside Chrome |
| Production launch | Health, gameplay, routes and assets served from extracted ZIP | Waitress launched locally from candidate archive with no public exposure | Threaded single-process entry point and deployment instructions | PASS for local production simulation |
| Public link | Confirmed hosting destination and verified HTTPS | No destination/public authorization or connected hosting account in this task | Render Web Service instructions prepared | NOT VERIFIED |

## Remaining limits

External NASA photo searches depend on the provider and vary by world. Schematic map speeds and sizes are deliberate. Full rotations, scientific orientation of every texture, Firefox/Edge interactions, physical devices, accessibility conformance and GPU/memory benchmarks remain outstanding. Round state survives refreshing within one server process, and is lost when that process restarts or the session is evicted. The answer is absent from active responses and session cookies, but daily choices are reproducible from the public date algorithm.

