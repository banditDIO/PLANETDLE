# Victory confetti repair

The old `launchConfetti()` stopped immediately whenever the browser reported `prefers-reduced-motion: reduce`. The website also applies aggressive animation-duration overrides, making the CSS-based shower unreliable.

This build replaces the CSS confetti shower with a fixed, pointer-transparent canvas animation that plays after all six Wordle-style parameter flips and the server confirms `won: true`. Reduced-motion environments receive a shorter, gentler celebration. The animation is cleaned up on restart, when the result is closed, and when it finishes. The last faster tile animation timings are unchanged.

Modified files: `static/game.js`, `templates/index.html`; this note added.

## Verification
- Chromium browser with the real frontend scripts and simulated game API: confirmed win displays the victory screen and visible drawn confetti (4,894 nontransparent pixels sampled in normal motion; 834 in reduced motion).
- Starting a new round removes the confetti canvas in both modes.
- No JavaScript page exceptions observed in these two tests.
- `node --check` of `static/game.js` passed, ZIP CRC integrity passed.
- Flask live-server integration was not run in this environment.
