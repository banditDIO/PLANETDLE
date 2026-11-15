# Parameter tile animation polish

Changes:
- Preserved server-authoritative scoring and six-parameter sequential reveal.
- Replaced flat fold with perspective rotation, anticipation lift, controlled overshoot, and landing.
- Added an understated tile highlight and value entrance.
- Preserved reduced-motion accessibility and the no-flash hidden-tile state.
- Updated browser asset version to invalidate old CSS/JS.

Validation:
- Node JavaScript syntax check: passed.
- Chromium browser (simulated API) observed first tile animate with `pd-turn-away` at ~110ms and `pd-turn-in` at ~450ms; 2 revealed during sequence and all 6 after completion.
- No page JavaScript exceptions in this test.
- Flask API integration and WebGL visuals were not retested.
