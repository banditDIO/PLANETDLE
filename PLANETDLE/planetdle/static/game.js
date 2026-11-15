const form = document.getElementById("guess-form");
const input = document.getElementById("guess-input");
const message = document.getElementById("message");
const guessButton = document.getElementById("guess-button");
const practiceButton = document.getElementById("practice-button");
const result = document.getElementById("result");
const resultTitle = document.getElementById("result-title");
const resultCopy = document.getElementById("result-copy");
const factPanel = document.getElementById("fact-panel");
const factText = document.getElementById("fact-text");
function showFact(fact, name, won=false) {
  window.PlanetAtlas3D?.preview(document.getElementById("guess-preview"),name);
  factText.textContent = fact;
  factPanel.classList.remove("hidden");
  factPanel.classList.toggle("fact-victory", won);
  factPanel.classList.remove("fact-enter");
  void factPanel.offsetWidth;
  factPanel.classList.add("fact-enter");
}

let attempts = 0;
let finished = false;
let submitting = false;
let roundGeneration = 0;
const restoredRound=JSON.parse(document.getElementById("round-history").textContent);
let roundId=restoredRound.id;

function serverError(error) {
  if (location.protocol === "file:") return "Open the game using START_PLANETDLE.bat, not index.html. The game needs Flask running.";
  return `Game request failed: ${error.message || "Cannot connect"}. Check the server terminal and open http://127.0.0.1:5000/`;
}
async function apiJSON(url, options) {
  const response = await fetch(url, options);
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error(`Server returned ${response.status} instead of game data`); }
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
const labels = {type:"TYPE", orbit:"ORBITS", size:"SIZE", air:"AIR", temp:"TEMP", diameter:"DIAMETER"};

function setMessage(text, error=false) {
  message.textContent = text;
  message.style.color = error ? "#f0a39b" : "#8f9bb0";
}
// A tile is not scored in the DOM until its own flip reaches the midpoint.
// This also prevents the next parameter from flashing its answer prematurely.
const SCORE_FIELDS = ["type","orbit","size","air","temp","diameter"];
function paintScoreTile(tile, row, key) {
  const value = document.createElement("strong");
  value.textContent = row.values[key];
  const info = row.directions?.[key] || {direction:"none",hint:row.feedback[key]};
  const guide = document.createElement("small");
  guide.textContent = (info.direction === "up" ? "↑ " : info.direction === "down" ? "↓ " : info.direction === "equal" ? "✓ " : "· ") + info.hint;
  tile.replaceChildren(value, guide);
  tile.classList.remove("tile-pending", "tile-flipping", "correct", "close", "wrong");
  tile.classList.add(row.feedback[key]);
  tile.setAttribute("aria-label", `${labels[key]} ${row.values[key]}. ${info.hint}`);
  tile.title = `${labels[key]}: ${row.values[key]} — ${info.hint} (toward the answer)`;
}
function renderRow(row, staged=false) {
  const element = document.querySelector(`[data-row="${attempts}"]`);
  if (!element) throw Error("The next guess row could not be found.");
  element.querySelector(".object-name").textContent = row.name;
  const tiles = [...element.querySelectorAll(".tile")];
  SCORE_FIELDS.forEach((key, i) => {
    if (staged) {
      tiles[i].replaceChildren();
      tiles[i].className = "tile tile-pending";
      tiles[i].removeAttribute("title");
      tiles[i].setAttribute("aria-label", `${labels[key]} not revealed yet`);
    } else paintScoreTile(tiles[i], row, key);
  });
  element.classList.add("revealed");
  attempts++;
  return tiles;
}
function endRound(data, celebrate=true) {
  finished = true;
  input.disabled = true;
  guessButton.disabled = true;

  result.classList.remove("hidden");
  // The victory model must represent the server-confirmed ANSWER, never the
  // last guessed object, a stale map selection, or a previously previewed moon.
  const discoveredWorld = data.answer || (data.won ? data.row.name : null);
  const previewCanvas = document.getElementById("result-preview");
  const modelLabel = document.getElementById("result-model-label");
  if (modelLabel) modelLabel.textContent = discoveredWorld ? `DISCOVERED OBJECT · ${discoveredWorld}` : "";
  if (previewCanvas && discoveredWorld) {
    previewCanvas.setAttribute("aria-label", `3D visualization of ${discoveredWorld}`);
    window.PlanetAtlas3D?.preview(previewCanvas, discoveredWorld);
  }
  result.classList.toggle("victory", !!data.won);
  result.classList.toggle("defeat", !data.won);
  resultTitle.textContent = data.won ? "✦ World discovered!" : `The answer was ${data.answer}.`;
  if(data.won) {
    if(celebrate)launchConfetti();
    document.querySelector(".game")?.classList.add("game-won");

  }
  document.getElementById("result-fact").textContent = data.fun_fact ? `Did you know? ${data.fun_fact}` : "";
  resultCopy.textContent = data.won
    ? `Solved in ${attempts} ${attempts === 1 ? "guess" : "guesses"}. Explore the science behind this world in its profile.`
    : "Review what you learned, then explore another world.";
  setMessage(data.won ? "Mystery object identified." : "All six attempts used.");
  document.body.classList.add("round-finished");
  if(celebrate)result.focus();
}
// Every NEW guess reveals six parameters in order. The server-restored history
// intentionally remains fully visible, because replaying old guesses on refresh
// would block interaction and make users think the browser had submitted twice.
const pauseFor = ms => new Promise(resolve => setTimeout(resolve, ms));
// Animate the real tile with the Web Animations API rather than competing CSS
// classes. In particular, the page-wide reduced-motion CSS used to override
// every CSS flip's duration to 0.01ms, leaving only the staggered delays.
async function playTileMotion(tile, frames, duration, easing) {
  if (typeof tile.animate === "function") {
    const motion = tile.animate(frames, {duration, easing, fill:"forwards"});
    try { await motion.finished; } catch (_) { /* Cancelling a round is safe. */ }
    motion.cancel();
    return;
  }
  // Small fallback for very old browsers lacking Element.animate.
  tile.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ease`;
  tile.style.transform = frames[0].transform;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  tile.style.transform = frames[frames.length-1].transform;
  await pauseFor(duration);
  tile.style.transition = "";
}
async function revealTilesSequentially(row) {
  const tiles = renderRow(row, true);
  if (!tiles.length) return;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const key = SCORE_FIELDS[i];
    tile.classList.remove("tile-pending");
    tile.classList.add("tile-turning");
    // First half: rotate the hidden face away. The answer stays absent.
    await playTileMotion(tile, [
      {transform:"perspective(800px) rotateX(0deg) translateY(0px) scale(1)", opacity:1, offset:0},
      {transform:"perspective(800px) rotateX(-15deg) translateY(-6px) scale(1.04)", opacity:1, offset:.26},
      {transform:"perspective(800px) rotateX(-90deg) translateY(0px) scale(.96)", opacity:.5, offset:1}
    ], 220, "cubic-bezier(.42,0,.85,.58)");
    // Replace the blank face ONLY when the tile is edge-on.
    tile.style.transform = "perspective(800px) rotateX(90deg) scale(.96)";
    paintScoreTile(tile, row, key);
    await playTileMotion(tile, [
      {transform:"perspective(800px) rotateX(90deg) translateY(0px) scale(.96)", opacity:.5, offset:0},
      {transform:"perspective(800px) rotateX(-12deg) translateY(-6px) scale(1.045)", opacity:1, offset:.68},
      {transform:"perspective(800px) rotateX(5deg) translateY(1px) scale(.995)", opacity:1, offset:.83},
      {transform:"perspective(800px) rotateX(0deg) translateY(0px) scale(1)", opacity:1, offset:1}
    ], 300, "cubic-bezier(.16,.76,.22,1)");
    tile.style.transform = "";
    tile.classList.remove("tile-turning");
    tile.classList.add("tile-reveal-settled");
    if (i < tiles.length - 1) await pauseFor(45);
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (finished || submitting) return;
  const guess = input.value.trim();
  if (!guess) return setMessage("Enter an object to make your guess.", true);
  submitting = true;
  guessButton.disabled = true;
  input.disabled = true;
  practiceButton.disabled = true;
  const generation = roundGeneration;
  try {
    const data = await apiJSON('/api/guess', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({guess,attempts,round_id:roundId})
    });
    if (generation !== roundGeneration) return;
    if (!data.ok) { setMessage(data.error || 'Guess rejected by the server.', true); return; }
    await revealTilesSequentially(data.row);
    if (generation !== roundGeneration) return;
    showFact(data.fun_fact, data.row.name, data.won);
    input.value = '';
    setMessage(data.won ? 'Perfect identification.' : `${6-attempts} ${6-attempts === 1 ? 'guess' : 'guesses'} remaining.`);
    if (data.over) endRound(data);
  } catch(error) { setMessage(error.message || serverError(error),true); }
  finally {
    submitting = false;
    practiceButton.disabled = false;
    if (!finished) {guessButton.disabled=false;input.disabled=false;input.focus({preventScroll:true});window.PlanetdleWorldSelect?.closeAll();}
  }
});
async function startPractice() {
  if(submitting || practiceButton.disabled) return;
  practiceButton.disabled = true;
  try {
    const data = await apiJSON("/api/new", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({practice:true})});
    if (!data.ok) throw new Error("Round could not be started");
    roundId=data.round_id;
    roundGeneration++;
    stopConfetti();
    attempts = 0; finished = false;
    input.disabled = false; guessButton.disabled = false;
    input.value = "";
    result.classList.add("hidden"); result.classList.remove("victory", "defeat");
    const modelLabel = document.getElementById("result-model-label");
    if (modelLabel) modelLabel.textContent = "";
    document.body.classList.remove("round-finished");
    factPanel.classList.add("hidden"); factPanel.classList.remove("fact-victory"); factText.textContent = "";
    document.querySelector(".game")?.classList.remove("game-won");
    document.querySelectorAll(".guess-row").forEach(row => {
      row.classList.remove("revealed"); row.querySelector(".object-name").textContent = "";
      row.querySelectorAll(".tile").forEach(tile => {tile.replaceChildren();tile.className = "tile";tile.removeAttribute("title");});
    });
    setMessage("New practice round ready. Make your first guess!"); input.focus();window.PlanetdleWorldSelect?.closeAll();
  } catch (error) {
    setMessage(serverError(error), true);
  } finally {practiceButton.disabled=false;}
}
// Canvas celebration is independent of page-wide CSS animation overrides.
// In particular, Windows reduced-motion preferences used to disable the old
// CSS confetti entirely, despite a winning round.
let confettiFrame = 0;
let confettiCanvas = null;
function stopConfetti() {
  if (confettiFrame) cancelAnimationFrame(confettiFrame);
  confettiFrame = 0;
  if (confettiCanvas) confettiCanvas.remove();
  confettiCanvas = null;
  document.querySelectorAll(".confetti-layer").forEach(layer => layer.remove());
}
function launchConfetti() {
  stopConfetti();
  const canvas = document.createElement("canvas");
  canvas.className = "planetdle-victory-confetti";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed", inset: "0", width: "100vw", height: "100vh",
    zIndex: "2147483647", pointerEvents: "none", display: "block"
  });
  document.body.append(canvas);
  confettiCanvas = canvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); confettiCanvas = null; return; }
  const colors = ["#a8f0d0", "#ffd47a", "#81b9ff", "#ff96b0", "#ffffff", "#baacff"];
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  // Reduced motion gets a shorter, gentler shower, never an empty celebration.
  const duration = reduced ? 2200 : 5200;
  const start = performance.now();
  let width = 0, height = 0;
  const particles = Array.from({ length: reduced ? 72 : 190 }, (_, i) => {
    const side = i < 100;
    return {
      x: side ? (i % 2 ? .07 : .93) : Math.random(),
      y: -Math.random() * .6 - .05,
      speed: .20 + Math.random() * .30,
      vx: (Math.random() - .5) * (side ? .22 : .10),
      w: 4 + Math.random() * 6,
      h: 6 + Math.random() * 9,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - .5) * 9,
      phase: Math.random() * Math.PI * 2,
      color: colors[i % colors.length],
      circle: i % 5 === 0
    };
  });
  function frame(now) {
    if (confettiCanvas !== canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const newWidth = window.innerWidth, newHeight = window.innerHeight;
    if (newWidth !== width || newHeight !== height) {
      width = newWidth; height = newHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const seconds = (now - start) / 1000;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      const y = (p.y + p.speed * seconds) * height;
      if (y < -30 || y > height + 30) continue;
      const x = (p.x + p.vx * seconds) * width + Math.sin(seconds * 3 + p.phase) * 14;
      const angle = p.angle + p.spin * seconds;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = p.color;
      if (p.circle) {
        ctx.beginPath(); ctx.arc(0, 0, p.w * .5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillRect(-p.w * .5, -p.h * .5, p.w, p.h);
      }
      ctx.restore();
    }
    if (now - start < duration) confettiFrame = requestAnimationFrame(frame);
    else stopConfetti();
  }
  confettiFrame = requestAnimationFrame(frame);
}

document.getElementById("close-result").addEventListener("click", () => { stopConfetti(); result.classList.add("hidden"); document.body.classList.remove("round-finished"); practiceButton.focus(); });
practiceButton.addEventListener("click", startPractice);
document.getElementById("again-button").addEventListener("click", startPractice);
input.addEventListener("keydown", (event) => {
  if (event.key === "Escape") input.value = "";
});



// Interactive map explorer: canvas-based orbital map with pan, zoom and selectable objects.
(() => {
  const explorerData = [
    { name:"Mercury", type:"PLANET", parent:"Sun", color:"#aeb7c4", description:"Mercury is the closest planet to the Sun and completes an orbit in just 88 Earth days. It has only a wispy exosphere, so almost no air redistributes heat from its sunlit side to its night side. Bright hollows and enormous cliffs in MESSENGER images show that its old, cratered surface has changed over time.", facts:[["ORBIT","88 Earth days"],["DAY","59 Earth days"],["MOONS","0"],["SURFACE","Rocky"]] },
    { name:"Venus", type:"PLANET", parent:"Sun", color:"#e8bd83", description:"Venus is only slightly smaller than Earth, but its dense carbon dioxide atmosphere traps enough heat to make it the hottest planet. Sulfuric acid clouds hide the rocky ground in visible light. NASA’s Magellan spacecraft used radar to look through those clouds and map broad lava plains and volcanoes.", facts:[["ORBIT","225 Earth days"],["DAY","243 Earth days"],["MOONS","0"],["SURFACE","Volcanic plains"]] },
    { name:"Earth", type:"PLANET", parent:"Sun", color:"#5d9fce", description:"Earth is a rocky planet with liquid oceans covering about 71% of its surface. The oceans store heat and move it around the globe, while moving tectonic plates reshape continents and recycle rock. Earth’s tilted axis changes how directly sunlight reaches each hemisphere during the year, producing the seasons.", facts:[["ORBIT","365.25 days"],["DAY","24 hours"],["MOONS","1"],["SURFACE","Oceans & land"]] },
    { name:"Mars", type:"PLANET", parent:"Sun", color:"#d77b61", description:"Mars owes its reddish color to iron oxides in the dust that coats much of its surface. Its carbon dioxide atmosphere is thin today, but dry channels and layered rocks preserve evidence of ancient rivers and lakes. NASA’s Perseverance rover explores an ancient river delta in Jezero Crater to study that wetter past.", facts:[["ORBIT","687 Earth days"],["DAY","24.6 hours"],["MOONS","2"],["SURFACE","Rocky desert"]] },
    { name:"Jupiter", type:"PLANET", parent:"Sun", color:"#d6ad83", description:"Jupiter is the largest planet, and one rotation takes just under ten hours. Fast rotation and jet streams organize its clouds into alternating bands. The Great Red Spot is a huge storm embedded in those bands, and NASA’s Juno spacecraft measures Jupiter’s gravity and magnetic field to investigate what lies beneath the clouds.", facts:[["ORBIT","11.86 years"],["DAY","9.9 hours"],["MOONS","115 confirmed · Aug 2026"],["TYPE","Gas giant"]] },
    { name:"Saturn", type:"PLANET", parent:"Sun", color:"#d9c18e", description:"Saturn’s rings are made mainly of water ice, with particles ranging from tiny grains to large chunks. Orbiting moons shape parts of the ring system with gravity. Cassini watched the small moon Pan clear a path through the A ring and saw Enceladus supply fresh ice to the outer E ring.", facts:[["ORBIT","29.4 years"],["DAY","10.7 hours"],["MOONS","293 confirmed · Jun 2026"],["TYPE","Gas giant"]] },
    { name:"Uranus", type:"PLANET", parent:"Sun", color:"#8bcbd0", description:"Uranus spins almost on its side, with an axial tilt of about 98 degrees. Its 84-year orbit gives each pole decades of sunlight followed by decades of darkness. Methane in the atmosphere absorbs red light and gives Uranus much of its blue-green color. Voyager 2 flew past in 1986.", facts:[["ORBIT","84 years"],["DAY","17.2 hours"],["MOONS","29 confirmed · Jun 2026"],["TYPE","Ice giant"]] },
    { name:"Neptune", type:"PLANET", parent:"Sun", color:"#557bd5", description:"Neptune is the outermost planet and takes about 165 Earth years to orbit the Sun. Its atmosphere produces some of the fastest winds in the Solar System despite receiving little sunlight. Voyager 2 photographed the Great Dark Spot in 1989. Later observations showed that dark storms can disappear and new ones can form.", facts:[["ORBIT","165 years"],["DAY","16 hours"],["MOONS","16 known"],["TYPE","Ice giant"]] },
    { name:"Pluto", type:"DWARF PLANET", parent:"Sun", color:"#c9a58c", description:"Pluto is a dwarf planet in the Kuiper Belt, a region of icy bodies beyond Neptune. New Horizons photographed its bright, heart-shaped region in 2015. The western half contains Sputnik Planitia, a basin filled with nitrogen ice that can move and reshape the landscape, while rugged mountains nearby are built from water ice.", facts:[["ORBIT","248 years"],["DAY","6.4 Earth days"],["MOONS","5"],["REGION","Kuiper Belt"]] },
    { name:"Ceres", type:"DWARF PLANET", parent:"Sun", color:"#a7a9ad", description:"Ceres is the largest body in the asteroid belt and the only recognized dwarf planet in the inner Solar System. NASA’s Dawn spacecraft found bright salt deposits inside Occator Crater. Those deposits point to salty liquid that rose from below the surface and left minerals behind when the water escaped into space.", facts:[["ORBIT","4.6 years"],["DAY","9 hours"],["MOONS","0"],["REGION","Asteroid Belt"]] },
    { name:"Earth's Moon", type:"MOON", parent:"Earth", color:"#b8bdc7", description:"The Moon keeps nearly the same face toward Earth because it rotates once per orbit. Its dark patches are ancient impact basins filled by lava, while the lighter highlands preserve many older craters. Apollo astronauts brought back rocks that help researchers date these events and reconstruct the early history of the Earth–Moon system.", facts:[["ORBITAL PARENT","Earth"],["ORBIT","27.3 days"],["AIR","Almost none"],["SURFACE","Rocky & cratered"]] },
    { name:"Phobos", type:"MOON", parent:"Mars", color:"#9d9187", description:"Phobos is the larger and closer of Mars’s two moons. Its lumpy shape and the enormous Stickney crater dominate images of it. It circles Mars faster than Mars spins, so it would rise in the west from the Martian surface. Tidal forces gradually bring it closer to the planet.", facts:[["ORBITAL PARENT","Mars"],["ORBIT","7.7 hours"],["SHAPE","Irregular"],["MOONS OF","Mars"]] },
    { name:"Europa", type:"MOON", parent:"Jupiter", color:"#d7c7a4", description:"Europa’s icy surface is crossed by long ridges and fractures, and its relatively few craters suggest that parts of it have been renewed. Galileo measured a magnetic signature consistent with a salty ocean beneath the ice. NASA’s Europa Clipper will investigate the ice, ocean, and chemistry to see whether that environment could support life.", facts:[["ORBITAL PARENT","Jupiter"],["ORBIT","3.55 days"],["SURFACE","Water ice"],["SPECIAL","Hidden ocean"]] },
    { name:"Ganymede", type:"MOON", parent:"Jupiter", color:"#aaa39a", description:"Ganymede is the largest moon in the Solar System and is wider than Mercury. It is the only moon known to generate its own magnetic field. Its surface combines old, dark cratered terrain with younger, brighter grooves, and magnetic observations point to a salty ocean beneath its outer ice.", facts:[["ORBITAL PARENT","Jupiter"],["ORBIT","7.15 days"],["SIZE","Largest moon"],["SPECIAL","Magnetic field"]] },
    { name:"Io", type:"MOON", parent:"Jupiter", color:"#d8b76a", description:"Io is the most volcanically active world known. Gravitational interactions with Jupiter, Europa, and Ganymede keep its orbit slightly stretched. Jupiter’s changing pull flexes Io as it orbits, heating the interior. Eruptions spread lava and sulfur compounds across the surface and can send plumes high above it.", facts:[["ORBITAL PARENT","Jupiter"],["ORBIT","1.77 days"],["SURFACE","Volcanic"],["SPECIAL","Active volcanoes"]] },
    { name:"Callisto", type:"MOON", parent:"Jupiter", color:"#8c8279", description:"Callisto’s heavily cratered surface preserves evidence of billions of years of impacts. Valhalla, one of its most striking features, has a bright center surrounded by rings of fractured terrain. Galileo measurements also suggest a possible salty ocean beneath the surface, even though the outside looks old and geologically quiet.", facts:[["ORBITAL PARENT","Jupiter"],["ORBIT","16.7 days"],["SURFACE","Ancient craters"],["SPECIAL","Possible ocean"]] },
    { name:"Titan", type:"MOON", parent:"Saturn", color:"#d49b55", description:"Titan has a thick nitrogen atmosphere that hides its surface behind orange haze. Cassini radar mapped lakes and seas of liquid methane and ethane, and the Huygens lander photographed channels and rounded material on the ground. Methane can evaporate, make clouds, fall as rain, and flow across Titan’s surface.", facts:[["ORBITAL PARENT","Saturn"],["ORBIT","15.9 days"],["AIR","Thick nitrogen"],["LAKES","Liquid methane"]] },
    { name:"Enceladus", type:"MOON", parent:"Saturn", color:"#d8e0e5", description:"Enceladus sprays water vapor and ice grains through fractures near its south pole. Cassini flew through these plumes and found salts and organic compounds. This gave scientists a way to study material from a hidden ocean without drilling through the ice. Some expelled grains help replenish Saturn’s E ring.", facts:[["ORBITAL PARENT","Saturn"],["ORBIT","1.37 days"],["SURFACE","Bright ice"],["SPECIAL","Water plumes"]] },
    { name:"Halley's Comet", type:"COMET", parent:"Sun", color:"#9db6c2", description:"Halley’s comet follows a long, tilted orbit that brings it near the Sun about every 76 years. Sunlight warms its icy nucleus and releases gas and dust, creating a bright coma and tails. ESA’s Giotto spacecraft photographed its dark nucleus during the 1986 return. Its next close approach to the Sun is expected in 2061.", facts:[["ORBIT","About 76 years"],["LAST VISIT","1986"],["NEXT VISIT","2061"],["COMPOSITION","Ice & dust"]] },
    { name:"Bennu", type:"ASTEROID", parent:"Sun", color:"#a68d79", description:"Bennu is a near-Earth asteroid shaped like a spinning top and built from loosely bound rocks. NASA’s OSIRIS-REx mission returned a sample to Earth in 2023. The material contains carbon-rich compounds and minerals altered by water, clues to the chemistry of the larger body Bennu’s rocks originally came from.", facts:[["ORBIT","About 1.2 years"],["WIDTH","About 500 m"],["CLASS","Near-Earth"],["SAMPLE","Returned in 2023"]] },
    { name:"Vesta", type:"ASTEROID", parent:"Sun", color:"#aaa29a", description:"Vesta is a rocky asteroid large enough to have separated into layers early in its history. NASA’s Dawn mission mapped the enormous Rheasilvia impact basin around its south pole. Fragments knocked off Vesta can reach Earth as meteorites, giving laboratories samples to compare with Dawn’s observations.", facts:[["ORBIT","3.6 years"],["WIDTH","About 525 km"],["REGION","Asteroid Belt"],["CLASS","Protoplanet"]] }
  ];
  // The solar map and Discovery Lab share the server's verified scientific
  // global-map endpoint. Unavailable maps are neutral, NOT invented terrain.
  const photos={};
  const canvas = document.getElementById("solar-map");
  const stage = document.getElementById("map-stage");
  const details = document.getElementById("explorer-details");
  if (!canvas || !stage || !details) return;
  const ctx = canvas.getContext("2d");
  const byName = Object.fromEntries(explorerData.map(item => [item.name, item]));
  const planets = ["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune"];
  const dwarfAndSmall = ["Ceres","Pluto","Bennu","Vesta","Halley's Comet"];

  const diametersKm = {"Mercury":4879,"Venus":12104,"Earth":12756,"Mars":6792,"Jupiter":142984,"Saturn":120536,"Uranus":51118,"Neptune":49528,"Pluto":2376,"Ceres":940,"Europa":3122,"Titan":5150,"Ganymede":5268,"Io":3643,"Enceladus":504,"Earth's Moon":3475,"Phobos":22,"Callisto":4821,"Halley's Comet":11,"Bennu":0.49,"Vesta":525};
  function bodyRadius(name){
    return (7+24*Math.pow(diametersKm[name]/142984,.45))*Math.min(zoom,1.65);
  }
  const positions = {};
  let width=0, height=0, dpr=1, zoom=1.14, panX=0, panY=0, selected=null, hovered=null, dragging=false, moved=false, lastX=0, lastY=0;
  let focusedPlanet="Earth";
  let nasaAbort=null;
  let pressedWorld=null, cameraFlight=null, motionEnabled=true;
  // Animation time is intentionally accelerated; orbital distances and speeds are schematic.
  let orbitTime=0, spinTime=0, previousFrame=null, pointer=null;
  const orbitSpeeds=[1.6,1.18,1,.81,.44,.32,.23,.18];
  const initialAngles=[-2.5,-1.85,-1.15,-.52,.08,.7,1.34,2.05];
  // Small bodies also orbit; positions and periods are deliberately schematic.
  const smallOrbits={
    "Ceres":{radius:.82,phase:2.6,speed:.57,ecc:.76},
    "Vesta":{radius:.87,phase:3.6,speed:.64,ecc:.76},
    "Bennu":{radius:.43,phase:1.9,speed:1.31,ecc:.76},
    "Pluto":{radius:2.12,phase:5.1,speed:.105,ecc:.67},
    "Halley's Comet":{radius:2.42,phase:3.7,speed:.39,ecc:.37}
  };

  function resize() {
    const rect=stage.getBoundingClientRect();
    if(width===rect.width && height===rect.height)return;
    width=rect.width; height=rect.height;
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    canvas.style.width=width+"px"; canvas.style.height=height+"px";
    draw();
  }
  function draw() {
    if(!ctx || !width) return;
    Object.keys(positions).forEach(key=>delete positions[key]);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);

    const bg=ctx.createLinearGradient(0,0,width,height);
    bg.addColorStop(0,"#0b1423"); bg.addColorStop(1,"#080e19");
    ctx.fillStyle=bg; ctx.fillRect(0,0,width,height);
    // Starfield
    for(let i=0;i<175;i++){
      const x=(i*97+31)%width, y=(i*173+17)%height;
      ctx.globalAlpha=.2+(i%5)*.12; ctx.fillStyle="#c9d9ef";
      ctx.beginPath(); ctx.arc(x,y,(i%3)*.35+.45,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
    const cx=width*.49+panX, cy=height*.51+panY;
    ctx.save(); ctx.translate(cx,cy); ctx.scale(zoom,zoom);
    const base=Math.min(width/2.62,height/1.97)*.75;
    // Orbit tracks
    const orbitR=[.31,.49,.65,.83,1.12,1.44,1.80,2.20];
    orbitR.forEach((r,i)=>{
      ctx.beginPath(); ctx.ellipse(0,0,base*r*1.08,base*r*.76,0,0,Math.PI*2);
      ctx.strokeStyle=i<4?"rgba(118,172,222,.42)":"rgba(118,172,222,.30)";
      ctx.lineWidth=1.35/zoom; ctx.setLineDash([5/zoom,5/zoom]); ctx.stroke(); ctx.setLineDash([]);
    });
    // Schematic trajectories for dwarf planets, asteroids and the comet.
    Object.entries(smallOrbits).forEach(([name,o])=>{
      ctx.beginPath();ctx.ellipse(0,0,base*o.radius*1.08,base*o.radius*o.ecc,0,0,Math.PI*2);
      ctx.strokeStyle=name==="Halley's Comet"?"rgba(162,205,237,.22)":"rgba(201,177,137,.19)";
      ctx.lineWidth=.8/zoom;ctx.setLineDash([2/zoom,8/zoom]);ctx.stroke();ctx.setLineDash([]);
    });
    // Asteroid belt
    ctx.beginPath(); ctx.ellipse(0,0,base*.96*1.08,base*.96*.76,0,0,Math.PI*2);
    ctx.strokeStyle="rgba(195,167,125,.30)"; ctx.setLineDash([1/zoom,4/zoom]); ctx.lineWidth=5/zoom; ctx.stroke(); ctx.setLineDash([]);
    // Sun glow
    const glow=ctx.createRadialGradient(0,0,12,0,0,76*Math.min(zoom,1.65)/zoom);
    glow.addColorStop(0,"rgba(255,218,137,.95)"); glow.addColorStop(.22,"rgba(255,174,75,.34)"); glow.addColorStop(1,"rgba(255,174,75,0)");
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(0,0,76*Math.min(zoom,1.65)/zoom,0,Math.PI*2); ctx.fill();
    const sunRadius=48*Math.min(zoom,1.65)/zoom;
    const sunCore=ctx.createRadialGradient(-7,-8,2,0,0,sunRadius);
    sunCore.addColorStop(0,"#fffce4");sunCore.addColorStop(.5,"#ffdf80");sunCore.addColorStop(1,"#ed712e");
    ctx.fillStyle=sunCore;ctx.beginPath();ctx.arc(0,0,sunRadius,0,Math.PI*2);ctx.fill();
    positions.Sun={x:cx,y:cy,r:sunRadius*zoom};
    // Planets are intentionally spaced for legibility, not to scale.

    planets.forEach((name,i)=>{
      const r=base*orbitR[i], x=Math.cos(initialAngles[i]+orbitTime*orbitSpeeds[i])*r*1.08, y=Math.sin(initialAngles[i]+orbitTime*orbitSpeeds[i])*r*.76;
      const item=byName[name], radius=bodyRadius(name)/zoom;
      positions[name]={x:cx+x*zoom,y:cy+y*zoom,r:Math.max(17,radius*zoom+9),visualR:radius*zoom};
      ctx.save(); ctx.translate(x,y);
      if(selected===name){ctx.strokeStyle="#a8f0d0";ctx.lineWidth=1.5/zoom;ctx.beginPath();ctx.arc(0,0,radius+7/zoom,0,Math.PI*2);ctx.stroke();}
      ctx.shadowColor=item.color;ctx.shadowBlur=12/zoom;
      paintBody(name,0,0,radius,item.color);
      if(name==="Saturn" && !window.PlanetAtlas3D?.available) drawRings(0,0,radius);
      if(name==="Uranus" && !window.PlanetAtlas3D?.available) drawRings(0,0,radius*.9,true);
      if(name==="Earth") {ctx.strokeStyle="rgba(105,195,255,.55)";ctx.lineWidth=1.6/zoom;ctx.beginPath();ctx.arc(0,0,radius+1/zoom,0,Math.PI*2);ctx.stroke();}
      ctx.restore();

    });
    // Moons are shown as satellites near their parent planet, with clear individual hit targets.
    const satellites={"Earth":["Earth's Moon"],"Mars":["Phobos"],"Jupiter":["Io","Europa","Ganymede","Callisto"],"Saturn":["Enceladus","Titan"]};
    Object.entries(satellites).forEach(([parent,names])=>{
      const p=positions[parent]; if(!p)return;
      const localX=(p.x-cx)/zoom, localY=(p.y-cy)/zoom;
      names.forEach((name,j)=>{
        if(focusedPlanet!==parent){delete positions[name];return;}
        const a=-Math.PI/2+j*Math.PI*(names.length===2?1:.5)+orbitTime*1.9;
        const moonRadius=bodyRadius(name);
        const clearance=p.visualR*(parent==="Saturn"?2.22:1)+moonRadius+16;
        const distance=(Math.max(80,clearance)+j*17)/zoom;
        const x=localX+Math.cos(a)*distance, y=localY+Math.sin(a)*distance;
        const item=byName[name], r=moonRadius/zoom;
        positions[name]={x:cx+x*zoom,y:cy+y*zoom,r:Math.max(15,r*zoom+9),visualR:r*zoom};
        ctx.strokeStyle="rgba(164,191,215,.34)";ctx.lineWidth=.7/zoom;
        ctx.beginPath();ctx.arc(localX,localY,distance,0,Math.PI*2);ctx.stroke();
        paintBody(name,x,y,r,item.color);
        if(selected===name){ctx.strokeStyle="#a8f0d0";ctx.lineWidth=1.3/zoom;ctx.beginPath();ctx.arc(x,y,7/zoom,0,Math.PI*2);ctx.stroke();}

      });
    });
    // Animate all minor bodies along their own orbit tracks.
    dwarfAndSmall.forEach(name=>{
      const o=smallOrbits[name],angle=o.phase+orbitTime*o.speed;
      const x=base*o.radius*1.08*Math.cos(angle),y=base*o.radius*o.ecc*Math.sin(angle);
      const item=byName[name],r=bodyRadius(name)/zoom;
      positions[name]={x:cx+x*zoom,y:cy+y*zoom,r:Math.max(15,r*zoom+9),visualR:r*zoom};
      paintBody(name,x,y,r,item.color);
      if(selected===name){ctx.strokeStyle="#a8f0d0";ctx.lineWidth=1.4/zoom;ctx.beginPath();ctx.arc(x,y,8/zoom,0,Math.PI*2);ctx.stroke();}

    });
    ctx.restore();
    window.PlanetAtlas3D?.draw(positions,spinTime,selected);
    // Only the currently hovered object has a label, drawn last above all bodies.
    if(hovered && positions[hovered]) drawHoverLabel(hovered);
    // Compass-like centre marker and subtle scale disclaimer
    ctx.fillStyle="rgba(147,164,188,.62)";ctx.font="10px Inter, sans-serif";
    ctx.fillText("SIZES COMPRESSED FOR VISIBILITY · ORBITS SCHEMATIC",12,height-13);
  }
  function paintBody(name,x,y,r,color){
    // GPU mode paints real mapped globes on the transparent WebGL layer.
    const atlas=window.PlanetAtlas3D;
    if(atlas?.available)return;
    const point=positions[name];
    if(point && (point.x+point.r<0 || point.x-point.r>width || point.y+point.r<0 || point.y-point.r>height))return;
    const image=atlas?.surfaceMap(name);
    if(image){
      // Wrap the real surface map around the visible half of the globe.
      ctx.save();
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();
      const strips=24, stripWidth=2*r/strips;
      const turns=spinTime*atlas.spinRate(name)/(2*Math.PI);
      for(let i=0;i<strips;i++){
        const longitude=Math.asin((i+.5)*2/strips-1)/(2*Math.PI)+turns+.5;
        const sourceX=(longitude-Math.floor(longitude))*image.naturalWidth;
        ctx.drawImage(image,Math.floor(sourceX),0,1,image.naturalHeight,x-r+i*stripWidth,y-r,stripWidth+.1,2*r);
      }
      const shadow=ctx.createRadialGradient(x-r*.38,y-r*.5,r*.15,x,y,r);
      shadow.addColorStop(0,'#0000');shadow.addColorStop(1,'#080e19aa');
      ctx.fillStyle=shadow;ctx.fillRect(x-r,y-r,2*r,2*r);
      ctx.restore();
      return;
    }
    const shade=ctx.createRadialGradient(x-r*.38,y-r*.5,r*.08,x,y,r*1.1);
    shade.addColorStop(0,'#ffffffa0');shade.addColorStop(.35,color);shade.addColorStop(1,'#152035');
    ctx.fillStyle=shade;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function drawRings(x,y,r,faint=false){
    ctx.save();ctx.translate(x,y);ctx.rotate(-.32);ctx.scale(1,.35);
    [1.45,1.72,2.03].forEach((factor,i)=>{
      ctx.beginPath();ctx.ellipse(0,0,r*factor,r*factor,0,0,Math.PI*2);
      ctx.strokeStyle=faint?"#b7dfdf88":["#d5c7a9b0","#f1e2b7d0","#ad9c80a0"][i];
      ctx.lineWidth=(faint?.65:1.8)/zoom;ctx.stroke();
    });
    // Keep the near and far arcs centered on their moving planet. Small icy
    // particles circle the ring plane at different speeds; the whole ring
    // system follows its parent along the Sun-centered orbit.
    const lanes=faint?[1.45,1.72]:[1.45,1.72,2.03];
    for(let lane=0;lane<lanes.length;lane++){
      for(let bead=0;bead<(faint?5:10);bead++){
        const angle=bead*Math.PI*2/(faint?5:10)+spinTime*(faint?.40:.62)/Math.pow(lanes[lane],1.5);
        const laneR=r*lanes[lane];
        ctx.beginPath();ctx.arc(Math.cos(angle)*laneR,Math.sin(angle)*laneR,Math.max(.4,(faint?.55:.85)/zoom),0,Math.PI*2);
        ctx.fillStyle=faint?"rgba(196,229,234,.55)":"rgba(255,236,198,.62)";ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawHoverLabel(name){
    const p=positions[name];
    if(!p) return;
    ctx.save();
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.font="600 13px Inter, sans-serif";
    const w=ctx.measureText(name).width+22, h=27;
    // Keep the single tooltip within the map, even at its edges.
    const x=Math.max(w/2+5,Math.min(width-w/2-5,p.x));
    const above=p.y-p.r-13-h;
    const y=above>=5?above:Math.min(height-h-5,p.y+p.r+12);
    ctx.fillStyle="rgba(8,16,30,.96)";
    ctx.strokeStyle="rgba(168,240,208,.5)";
    ctx.lineWidth=1;
    ctx.beginPath();
    if(ctx.roundRect)ctx.roundRect(x-w/2,y,w,h,7);
    else ctx.rect(x-w/2,y,w,h);
    ctx.fill();ctx.stroke();
    ctx.fillStyle="#e4edf9";ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(name,x,y+h/2);
    ctx.restore();
  }
  let mapVisible=true;
  new IntersectionObserver(([entry])=>{mapVisible=entry.isIntersecting;}).observe(stage);
  const motionButton=document.getElementById("map-motion");
  motionButton.addEventListener("click",()=>{
    motionEnabled=!motionEnabled;
    motionButton.textContent=motionEnabled?"Pause motion":"Play motion";
    window.PlanetAtlas3D?.setMotionEnabled(motionEnabled);
  });
  function centerWorld(name){
    const p=positions[name];
    if(!p)return;
    panX+=width*.5-p.x;
    panY+=height*.5-p.y;
  }
  function flyToWorld(name){
    showDetails(name);
    const targetZoom=Math.max(zoom,1.65);
    if(!motionEnabled){
      cameraFlight=null;
      zoom=targetZoom;
      draw();
      centerWorld(name);
      draw();
      return;
    }
    cameraFlight={name,targetZoom,startZoom:zoom,startPanX:panX,startPanY:panY,start:performance.now()};
  }
  function updateCamera(timestamp){
    const flight=cameraFlight, p=positions[flight.name];
    if(!p)return false;
    const progress=motionEnabled?Math.min(1,Math.max(0,(timestamp-flight.start)/850)):1;
    const eased=progress*progress*(3-2*progress);
    const nextZoom=flight.startZoom+(flight.targetZoom-flight.startZoom)*eased;
    const scale=nextZoom/zoom;
    const targetX=width*.01-(p.x-width*.49-panX)*scale;
    const targetY=-height*.01-(p.y-height*.51-panY)*scale;
    zoom=nextZoom;
    panX=flight.startPanX+(targetX-flight.startPanX)*eased;
    panY=flight.startPanY+(targetY-flight.startPanY)*eased;
    return progress===1;
  }
  function animate(timestamp){
    if(previousFrame!==null){
      const delta=Math.min((timestamp-previousFrame)/1000,.05);
      if(mapVisible && motionEnabled){
        if(!dragging)orbitTime+=delta*.058;
        spinTime+=delta;
      }
    }
    previousFrame=timestamp;
    requestAnimationFrame(animate);
    if(!mapVisible)return;
    // Update the hover target as objects move underneath a stationary pointer.
    try {
      const arrived=cameraFlight && updateCamera(timestamp);
      draw();
      if(arrived){
        centerWorld(cameraFlight.name);
        cameraFlight=null;
        draw();
      }
    } catch(error) { if(!window.__planetdleMapErrorShown){console.error("Solar map rendering failed:",error);window.__planetdleMapErrorShown=true;} }
    if(pointer && !dragging){
      const next=hit(pointer.x,pointer.y);
      if(next!==hovered){hovered=next;canvas.style.cursor=next?"pointer":"grab";draw();}
    }
  }
  function navigateToDetails(){
    details.scrollIntoView({behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",block:"start"});
  }
  function showDetails(name, navigate=false){
    const item=byName[name]; if(!item)return;
    selected=name;
    if(item.type==="PLANET") focusedPlanet=name;
    else if(item.type==="MOON") focusedPlanet=item.parent;
    if(nasaAbort)nasaAbort.abort();
    nasaAbort=new AbortController();
    details.replaceChildren();
    const head=document.createElement("div");head.className="detail-topline";
    const category=document.createElement("span");category.className="detail-category";category.textContent=item.type;
    const parent=document.createElement("span");parent.className="detail-parent";parent.textContent=item.parent==="Sun"?"ORBITS THE SUN":`ORBITS ${item.parent.toUpperCase()}`;
    head.append(category,parent);
    const title=document.createElement("h3");title.className="detail-title";title.textContent=item.name;
    const description=document.createElement("p");description.className="detail-description";description.textContent=item.description;
    const facts=document.createElement("div");facts.className="detail-facts";
    item.facts.forEach(([k,v])=>{
      const cell=document.createElement("div");cell.className="detail-fact";
      const lab=document.createElement("span");lab.textContent=k;
      const val=document.createElement("strong");val.textContent=v;
      cell.append(lab,val);facts.append(cell);
    });
    const viewer=window.PlanetAtlas3D?.inspect(name);
    const profile=document.createElement("div");profile.className="world-profile";
    const overview=document.createElement("div");overview.className="world-overview";
    overview.append(description,facts);
    const scaleNote=document.createElement("p");
    scaleNote.className="detail-description";
    scaleNote.textContent="Approximate diameter "+diametersKm[name].toLocaleString()+" km · "+(diametersKm[name]/12756).toFixed(3)+" Earth diameters. Close-up enlarged for inspection.";
    overview.append(scaleNote);
    details.style.setProperty("--world-accent",item.color);
    details.append(head,title,profile);
    if(viewer)profile.append(viewer);
    profile.append(overview);
    details.classList.add("profile-open");
    document.getElementById("explore-guide")?.classList.add("used");
    const moons=explorerData.filter(object=>object.type==="MOON" && object.parent===name);
    if(item.type==="PLANET") {
      const moonSection=document.createElement("section");moonSection.className="moon-section";
      const moonHeading=document.createElement("h4");moonHeading.textContent=`Moons in this atlas (${moons.length})`;
      const moonList=document.createElement("div");moonList.className="moon-list";
      if(!moons.length){const empty=document.createElement("p");empty.textContent="No moons are included for this planet.";moonList.append(empty);}
      moons.forEach(moon=>{const button=document.createElement("button");button.type="button";button.textContent=`☾ ${moon.name}`;button.addEventListener("click",()=>showDetails(moon.name,true));moonList.append(button);});
      moonSection.append(moonHeading,moonList);details.append(moonSection);
    }
    // NASA images supplement the animated illustration; they are not used as
    // equirectangular textures because archive photographs are not globe maps.
    const nasaSection=document.createElement("section");nasaSection.className="nasa-gallery";
    const nasaHeading=document.createElement("h4");nasaHeading.textContent="NASA PHOTOGRAPHS";
    const nasaStatus=document.createElement("p");nasaStatus.className="nasa-status";
    nasaStatus.textContent="Loading authentic NASA imagery…";
    const nasaGrid=document.createElement("div");nasaGrid.className="nasa-grid";
    nasaSection.append(nasaHeading,nasaStatus,nasaGrid);details.append(nasaSection);
    const requestedName=name;
    fetch(`/api/nasa/${encodeURIComponent(name)}`,{signal:nasaAbort.signal}).then(async response=>{
      if(!response.ok)throw new Error("Archive unavailable");return response.json();
    }).then(data=>{
      if(selected!==requestedName||!nasaSection.isConnected)return;
      nasaStatus.textContent=data.items?.length ? "Select a photo to see the original NASA caption." : "No clearly relevant NASA photos found. The scientific profile above is still available.";
      (data.items||[]).forEach(item=>{
        const link=document.createElement("a");link.className="nasa-item";
        link.href=item.url;link.target="_blank";link.rel="noopener noreferrer";
        const photo=document.createElement("img");photo.src=item.image;photo.alt=item.title;
        photo.loading="lazy";photo.referrerPolicy="no-referrer";
        const label=document.createElement("span");label.textContent=item.title;
        const credit=document.createElement("small");credit.textContent=item.credit||"NASA archive";
        link.append(photo,label,credit);nasaGrid.append(link);
      });
    }).catch(()=>{if(selected===requestedName&&nasaSection.isConnected)nasaStatus.textContent="NASA archive unavailable right now. The interactive atlas still works offline.";});
    draw();
    if(navigate) navigateToDetails();
  }
  const mapSearch=document.getElementById("map-search");
  const mapSearchStatus=document.getElementById("map-search-status");
  function locateWorld(raw){
    const q=String(raw||"").trim().toLowerCase();
    const name=explorerData.find(o=>o.name.toLowerCase()===q)?.name ||
      explorerData.find(o=>o.name.toLowerCase().includes(q))?.name;
    if(!q||!name){mapSearchStatus.textContent=q?"No matching object in this 21-world atlas.":"Type an object name.";return;}
    flyToWorld(name);
    mapSearchStatus.textContent=`Located ${name} · profile below the map`;
  }
  document.getElementById("map-search-form")?.addEventListener("submit",event=>{
    event.preventDefault();locateWorld(mapSearch.value);
  });
  function hit(x,y){
    let best=null,dist=Infinity;
    Object.entries(positions).forEach(([name,p])=>{
      const d=Math.hypot(x-p.x,y-p.y);
      if(byName[name] && d<Math.max(p.r+9,14) && d<dist){best=name;dist=d;}
    });
    return best;
  }
  canvas.addEventListener("pointerdown",e=>{
    if(e.button!==0 || !e.isPrimary)return;
    cameraFlight=null;
    pressedWorld=hit(e.offsetX,e.offsetY);
    dragging=true;moved=false;hovered=null;pointer={x:e.offsetX,y:e.offsetY};lastX=e.clientX;lastY=e.clientY;
    canvas.setPointerCapture(e.pointerId);canvas.classList.add("dragging");
  });
  canvas.addEventListener("pointermove",e=>{
    pointer={x:e.offsetX,y:e.offsetY};
    if(!dragging){const name=hit(e.offsetX,e.offsetY);if(name!==hovered){hovered=name;canvas.style.cursor=name?"pointer":"grab";draw();}return;}
    const dx=e.clientX-lastX,dy=e.clientY-lastY;
    if(Math.abs(dx)+Math.abs(dy)>2)moved=true;
    if(moved){panX+=dx;panY+=dy;lastX=e.clientX;lastY=e.clientY;draw();}
  });
  canvas.addEventListener("pointerup",e=>{
    if(!dragging || !e.isPrimary)return;
    dragging=false;canvas.classList.remove("dragging");
    const name=pressedWorld;
    pressedWorld=null;
    if(!moved && name)flyToWorld(name);
  });
  canvas.addEventListener("pointerleave",()=>{pointer=null;hovered=null;draw();});
  canvas.addEventListener("pointercancel",()=>{dragging=false;pressedWorld=null;canvas.classList.remove("dragging");});
  canvas.addEventListener("wheel",e=>{
    e.preventDefault();cameraFlight=null;const old=zoom;zoom=Math.max(.55,Math.min(20,zoom*(e.deltaY<0?1.12:.89)));
    const rect=canvas.getBoundingClientRect(), mx=e.clientX-rect.left-width*.49-panX, my=e.clientY-rect.top-height*.51-panY;
    panX-=mx*(zoom/old-1);panY-=my*(zoom/old-1);draw();
  },{passive:false});
  document.getElementById("zoom-in").addEventListener("click",()=>{cameraFlight=null;zoom=Math.min(20,zoom*1.18);draw();});
  document.getElementById("zoom-out").addEventListener("click",()=>{cameraFlight=null;zoom=Math.max(.55,zoom/1.18);draw();});
  document.getElementById("map-reset").addEventListener("click",()=>{cameraFlight=null;zoom=1.14;panX=0;panY=0;draw();});
  const gamePanel=document.querySelector(".game-column .game");
  const observer=new ResizeObserver(()=>{
    // Match the base board, independent of the feedback panel appearing after a guess.
    if(!stage.style.getPropertyValue("--board-height")){
      const initial=gamePanel.getBoundingClientRect().height;
      if(initial>0)stage.style.setProperty("--board-height",Math.round(initial)+"px");
    }
    resize();
  });
  function fitBoard(){
    const feedback=document.getElementById("fact-panel");
    const baseHeight=gamePanel.getBoundingClientRect().height;
    const feedbackHeight=feedback.getClientRects().length
      ? feedback.offsetHeight+parseFloat(getComputedStyle(feedback).marginTop)+parseFloat(getComputedStyle(feedback).marginBottom)
      : 0;
    stage.style.setProperty("--board-height",Math.round(baseHeight-feedbackHeight)+"px");
    resize();
  }
  observer.observe(stage);
  window.addEventListener("resize",fitBoard);
  document.fonts?.ready.then(fitBoard);
  resize();
  showDetails("Earth");
  requestAnimationFrame(animate);
})();

// Restore the server's public round history, without replaying its animations.
const historyRows=restoredRound.guesses;
for(const entry of historyRows)renderRow(entry.row);
const savedGuess=historyRows.at(-1);
if(savedGuess){
  showFact(savedGuess.fun_fact,savedGuess.row.name,savedGuess.won);
  if(savedGuess.over)endRound(savedGuess,false);
  else setMessage(`Round restored · ${6-attempts} guesses remaining.`);
}

// Guide new visitors to the atlas.
document.getElementById("explore-guide")?.addEventListener("click",()=>{document.getElementById("map-search")?.focus();document.getElementById("map-search-status").textContent="Type a world name and press LOCATE, or click any world. Its profile appears below the map.";});

