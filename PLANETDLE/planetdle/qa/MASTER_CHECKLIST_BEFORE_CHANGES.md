# PLANETDLE master QA checklist (pre-change, 5093 baseline)

| Feature | Expected behavior | Planned test |
|---|---|---|
| Startup and dependencies | Fresh session starts with board and Earth profile | Cold Chrome context, health and restart from final ZIP |
| Round and session | Accepted guesses and target agree across refresh; answer stays server-side | Wrong guess, reload, inspect board, complete deterministic daily round, cookie and route tests |
| Six clue tiles | All categories, proximity, directions and diameter match game rules | Exhaustive 441 combinations, ordered reveal in Chrome |
| Validation and repeated submission | Reject empty, unknown, duplicate and malformed input without consuming tries | Browser requests and Flask route tests |
| End states | Victory, defeat, restart and confetti | Real daily and practice journeys and reduced-motion mode |
| Notes and hints | One clear sourced concept per note, no secret answer before round ends | Review 24 general notes and 21 facts, six-turn and hint checks |
| Map and moon clearance | Motion, hover pause and resume, zoom, drag, moon spacing, reset | Browser pointer input and renderer instrumentation |
| Click and scroll | Each world opens correct inline profile | Find each object via Locate and click its current canvas coordinates |
| Search and accessibility | Exact, partial, case-insensitive and invalid search, keyboard navigation, no stale profiles | Browser input, focus, rapid changes |
| Rendering and assets | Correct bundled textures and mesh draws, preserved rings, distinct Halley tail, no invented scientific provenance | Decode each texture from local server, inspect browser renders, check resource requests |
| Scientific field notes and NASA gallery | Notes expand and gallery handles missing external service | Browser expand and forced service failure, inspect live requests separately |
| Layout | Board, profile and narrow screens readable, settings respected | Desktop/mobile widths, screenshot and overflow checks, reduced-motion run |
| Runtime | Reasonable frame cadence, idle work minimized, no uncaught errors | Chrome frame samples, logs, WebGL disabled fallback |
| Deployment | Production WSGI serves gameplay, assets and health | Run Waitress from extracted ZIP, repeat smoke tests, require destination authorization before publishing |
| Browsers | Check Chrome and available alternatives | Chrome CDP plus Edge/Firefox where installed and controllable |
