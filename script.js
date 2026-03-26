const ringButtons = Array.from(document.querySelectorAll(".ringNum"));
const center25Btn = document.getElementById("center25Btn");
const allTrialButtons = [...ringButtons, center25Btn];

const grid = document.getElementById("grid");
const cells = Array.from(document.querySelectorAll(".cell"));

const choosePrompt = document.getElementById("choosePrompt");
const ruleCard = document.getElementById("ruleCard");
const messageCard = document.getElementById("messageCard");
const messageText = document.getElementById("messageText");

const difficultySkipPanel = document.getElementById("difficultySkipPanel");
const difficultySkipBtn = document.getElementById("difficultySkipBtn");

const titleEl = document.getElementById("trialTitle");
const textEl = document.getElementById("trialText");

const startBtn = document.getElementById("startBtn");
const backBtn = document.getElementById("backBtn");
const resetAllBtn = document.getElementById("resetAllBtn");
const skipTrialBtn = document.getElementById("skipTrialBtn");

const bodyEl = document.body;

let selectedTrial = null;
let uiMode = "idle"; // idle | selecting | playing | message

let completedTrials = new Set();

const trialRules = {
  1: "Find the most unique tile. Tiles with the same color can be eliminated. You only win if the unique tile is revealed last.",
  2: "Find the slightly different tile. There are 6 rounds. The difference becomes harder to see each round.",
  3: "Rule placeholder for Trial 3.",
  4: "Rule placeholder for Trial 4.",
  5: "Rule placeholder for Trial 5.",
  6: "Rule placeholder for Trial 6.",
  7: "Rule placeholder for Trial 7.",
  8: "Rule placeholder for Trial 8.",
  9: "Rule placeholder for Trial 9.",
  10: "Rule placeholder for Trial 10.",
  11: "Rule placeholder for Trial 11.",
  12: "Rule placeholder for Trial 12.",
  13: "Rule placeholder for Trial 13.",
  14: "Rule placeholder for Trial 14.",
  15: "Rule placeholder for Trial 15.",
  16: "Rule placeholder for Trial 16.",
  17: "Rule placeholder for Trial 17.",
  18: "Rule placeholder for Trial 18.",
  19: "Rule placeholder for Trial 19.",
  20: "Rule placeholder for Trial 20.",
  21: "Rule placeholder for Trial 21.",
  22: "Rule placeholder for Trial 22.",
  23: "Rule placeholder for Trial 23.",
  24: "Rule placeholder for Trial 24.",
  25: "Final trial placeholder for Trial 25."
};

/* -----------------------
   Idle grid color animation
------------------------ */
const morandiPalette = [
  "#b7a89a", "#c9b8a8", "#b8b2a8", "#c7c0b4", "#a6ada3",
  "#b9c2b1", "#aeb9b2", "#98a8a7", "#b1bcc8", "#9faec2",
  "#c0b7c9", "#b9aeb6", "#cab9b0", "#d1c7bc", "#a8b6a1",
  "#b7c7bf", "#c4cbbd", "#c9d3d9", "#aab7c8", "#d7cec4",
  "#c6b2a6", "#bca59d", "#d1d6d0", "#bcc6cf", "#ada6b8"
];

let idleColorTimer = null;
let returnToIdleTimer = null;
let trialAutoCompleteTimer = null;
let finalOverlay = null;

/* -----------------------
   Shared game vars
------------------------ */
let mode = "idle"; // idle | playing | won
let skipTimer = null;

/* -----------------------
   Trial 1 vars
------------------------ */
let deck = [];
let faceDownColor = "rgba(168, 153, 140, 0.16)";
let opened = [];
let removedCount = 0;
let oddIndex = -1;

/* -----------------------
   Trial 2 vars
------------------------ */
let trial2Round = 0;
let trial2TargetIndex = -1;
let trial2Locked = false;

function shuffle(arr){
  const copy = arr.slice();
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function paintIdleGrid(){
  const colors = shuffle(morandiPalette);
  cells.forEach((cell, i) => {
    cell.className = "cell";
    cell.style.background = colors[i];
    cell.dataset.state = "idle";
  });
}

function startIdleColorLoop(){
  stopIdleColorLoop();
  paintIdleGrid();

  idleColorTimer = window.setInterval(() => {
    if(uiMode === "idle"){
      paintIdleGrid();
    }
  }, 2600);
}

function stopIdleColorLoop(){
  if(idleColorTimer){
    clearInterval(idleColorTimer);
    idleColorTimer = null;
  }
}

/* -----------------------
   Shared timer cleanup
------------------------ */
function clearUiTimers(){
  clearTimeout(skipTimer);
  clearTimeout(returnToIdleTimer);
  clearTimeout(trialAutoCompleteTimer);

  skipTimer = null;
  returnToIdleTimer = null;
  trialAutoCompleteTimer = null;
}

function startSkipCountdown(){
  if(skipTrialBtn){
    skipTrialBtn.classList.add("hidden");
  }

  clearTimeout(skipTimer);
  skipTimer = setTimeout(() => {
    if(uiMode === "playing" && mode === "playing" && selectedTrial != null && skipTrialBtn){
      skipTrialBtn.classList.remove("hidden");
    }
  }, 60000);
}

/* -----------------------
   Final overlay
------------------------ */
function ensureFinalOverlay(){
  if(finalOverlay) return finalOverlay;

  finalOverlay = document.createElement("div");
  finalOverlay.id = "finalOverlay";
  finalOverlay.className = "finalOverlay hidden";
  finalOverlay.innerHTML = `
    <div class="finalMessage">
      <h2>Thank you for playing.</h2>
      <p>All 25 trials have been completed.</p>
    </div>
  `;

  document.body.appendChild(finalOverlay);
  return finalOverlay;
}

function launchConfetti(count = 140){
  const overlay = ensureFinalOverlay();
  overlay.classList.remove("hidden");

  overlay.querySelectorAll(".confetti").forEach(el => el.remove());

  const confettiColors = [
    "#b7a89a", "#c9b8a8", "#a6ada3", "#98a8a7", "#b1bcc8",
    "#c0b7c9", "#cab9b0", "#d1c7bc", "#aab7c8", "#c6b2a6"
  ];

  for(let i = 0; i < count; i++){
    const piece = document.createElement("span");
    piece.className = "confetti";

    const left = Math.random() * 100;
    const delay = Math.random() * 0.8;
    const duration = 2.8 + Math.random() * 2.4;
    const width = 8 + Math.random() * 8;
    const height = 18 + Math.random() * 22;
    const rotate = Math.random() * 360;
    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];

    piece.style.left = `${left}vw`;
    piece.style.width = `${width}px`;
    piece.style.height = `${height}px`;
    piece.style.background = color;
    piece.style.transform = `rotate(${rotate}deg)`;
    piece.style.animationDelay = `${delay}s`;
    piece.style.animationDuration = `${duration}s`;

    overlay.appendChild(piece);
  }
}

function showFinalCelebration(){
  clearUiTimers();
  setUiMode("message");

  choosePrompt.classList.add("hidden");
  ruleCard.classList.add("hidden");
  messageCard.classList.add("hidden");

  if(difficultySkipPanel){
    difficultySkipPanel.classList.add("hidden");
  }

  clearGridVisual();

  allTrialButtons.forEach(btn => {
    if(btn) btn.classList.add("hidden");
  });

  launchConfetti();
}

/* -----------------------
   UI mode
------------------------ */
function setUiMode(modeName){
  uiMode = modeName;

  bodyEl.classList.remove("idle", "selecting", "playing", "message-mode");

  if(modeName === "message"){
    bodyEl.classList.add("message-mode");
  }else{
    bodyEl.classList.add(modeName);
  }

  if(modeName === "idle"){
    startIdleColorLoop();
  }else{
    stopIdleColorLoop();
  }
}

function clearGridVisual(){
  cells.forEach(cell => {
    cell.className = "cell empty";
    cell.style.background = "transparent";
    cell.dataset.state = "empty";
  });
}

function restoreIdleGridVisual(){
  cells.forEach(cell => {
    cell.className = "cell";
    cell.dataset.state = "idle";
  });
  paintIdleGrid();
}

/* -----------------------
   Unlock logic
------------------------ */
function areTrialsComplete(start, end){
  for(let i = start; i <= end; i++){
    if(!completedTrials.has(i)) return false;
  }
  return true;
}

function isTrialUnlocked(trialNum){
  if(trialNum >= 1 && trialNum <= 20) return true;
  if(trialNum >= 21 && trialNum <= 24) return areTrialsComplete(1, 20);
  if(trialNum === 25) return areTrialsComplete(21, 24) && !completedTrials.has(25);
  return false;
}

function playCenter25EnterAnimation(){
  if(!center25Btn) return;

  center25Btn.classList.remove("is-entering");
  void center25Btn.offsetWidth;
  center25Btn.classList.add("is-entering");

  setTimeout(() => {
    center25Btn.classList.remove("is-entering");
  }, 700);
}

function syncCenter25Visibility(){
  if(!center25Btn) return;

  const done21to24 = areTrialsComplete(21, 24);
  const done25 = completedTrials.has(25);

  if(done25){
    center25Btn.classList.add("hidden");
    return;
  }

  if(!done21to24){
    center25Btn.classList.add("hidden");
    return;
  }

  if(uiMode === "message"){
    center25Btn.classList.add("hidden");
    return;
  }

  if(selectedTrial === 25 && (uiMode === "selecting" || uiMode === "playing")){
    center25Btn.classList.add("hidden");
    return;
  }

  center25Btn.classList.remove("hidden");
}

function syncDifficultySkipVisibility(){
  if(!difficultySkipPanel) return;

  const done1to20 = areTrialsComplete(1, 20);
  const done21to24 = areTrialsComplete(21, 24);
  const done25 = completedTrials.has(25);

  if(uiMode !== "idle"){
    difficultySkipPanel.classList.add("hidden");
    return;
  }

  if(done25){
    difficultySkipPanel.classList.add("hidden");
    return;
  }

  if(!done1to20){
    difficultySkipPanel.classList.remove("hidden");
    return;
  }

  if(done1to20 && !done21to24){
    difficultySkipPanel.classList.remove("hidden");
    return;
  }

  if(done21to24 && !done25){
    difficultySkipPanel.classList.add("hidden");
    return;
  }

  difficultySkipPanel.classList.add("hidden");
}

function updateUnlockedButtons(){
  const first20Buttons = Array.from(document.querySelectorAll(".ringNum[data-trial]"))
    .filter(btn => {
      const n = Number(btn.dataset.trial);
      return n >= 1 && n <= 20;
    });

  const extra21to24 = [21, 22, 23, 24].map(n =>
    document.querySelector(`.ringNum[data-trial="${n}"]`)
  );

  const done1to20 = areTrialsComplete(1, 20);
  const done21to24 = areTrialsComplete(21, 24);
  const done25 = completedTrials.has(25);

  if(!done1to20){
    first20Buttons.forEach(btn => {
      if(btn) btn.classList.remove("hidden");
    });

    extra21to24.forEach(btn => {
      if(btn) btn.classList.add("hidden");
    });

    if(center25Btn) center25Btn.classList.add("hidden");
    choosePrompt.classList.remove("hidden");
  }

  if(done1to20 && !done21to24){
    first20Buttons.forEach(btn => {
      if(btn) btn.classList.add("hidden");
    });

    extra21to24.forEach(btn => {
      if(btn) btn.classList.remove("hidden");
    });

    if(center25Btn) center25Btn.classList.add("hidden");
    choosePrompt.classList.remove("hidden");
  }

  if(done21to24 && !done25){
    first20Buttons.forEach(btn => {
      if(btn) btn.classList.add("hidden");
    });

    extra21to24.forEach(btn => {
      if(btn) btn.classList.add("hidden");
    });

    choosePrompt.classList.add("hidden");
  }

  if(done25){
    first20Buttons.forEach(btn => {
      if(btn) btn.classList.add("hidden");
    });

    extra21to24.forEach(btn => {
      if(btn) btn.classList.add("hidden");
    });

    if(center25Btn) center25Btn.classList.add("hidden");
    choosePrompt.classList.add("hidden");
  }

  allTrialButtons.forEach(btn => {
    if(!btn) return;

    const n = Number(btn.dataset.trial);
    btn.classList.toggle("locked", !isTrialUnlocked(n));

    if(n === 25){
      btn.classList.remove("done");
    }else{
      btn.classList.toggle("done", completedTrials.has(n));
    }
  });

  syncCenter25Visibility();
}

/* -----------------------
   UI screens
------------------------ */
function showIdleState(){
  clearUiTimers();
  setUiMode("idle");
  selectedTrial = null;
  mode = "idle";

  const done21to24 = areTrialsComplete(21, 24);
  const done25 = completedTrials.has(25);
  const center25WasHidden = center25Btn ? center25Btn.classList.contains("hidden") : true;

  if(done21to24 && !done25){
    choosePrompt.classList.add("hidden");
  }else if(!done25){
    choosePrompt.classList.remove("hidden");
  }

  ruleCard.classList.add("hidden");
  messageCard.classList.add("hidden");

  if(skipTrialBtn){
    skipTrialBtn.classList.add("hidden");
  }

  grid.classList.remove("is-faded");

  paintIdleGrid();
  updateUnlockedButtons();
  syncCenter25Visibility();
  syncDifficultySkipVisibility();

  const center25NowVisible = center25Btn ? !center25Btn.classList.contains("hidden") : false;

  if(center25WasHidden && center25NowVisible){
    playCenter25EnterAnimation();
  }
}

function showRuleCard(trialNum){
  if(!isTrialUnlocked(trialNum)) return;

  clearUiTimers();
  selectedTrial = trialNum;
  setUiMode("selecting");

  titleEl.textContent = `Trial ${trialNum}`;
  textEl.textContent = trialRules[trialNum] || `Rule placeholder for Trial ${trialNum}.`;

  choosePrompt.classList.add("hidden");
  messageCard.classList.add("hidden");
  ruleCard.classList.remove("hidden");

  if(skipTrialBtn){
    skipTrialBtn.classList.add("hidden");
  }

  clearGridVisual();
  syncCenter25Visibility();
  syncDifficultySkipVisibility();

  allTrialButtons.forEach(btn => {
    if(btn) btn.blur();
  });
}

function showCompleteMessage(trialNum){
  setUiMode("message");
  ruleCard.classList.add("hidden");
  choosePrompt.classList.add("hidden");
  messageCard.classList.remove("hidden");
  messageText.textContent = `Congratulations! Trial ${trialNum} completed.`;

  if(center25Btn){
    center25Btn.classList.add("hidden");
  }

  syncDifficultySkipVisibility();
}

/* -----------------------
   Complete flow
------------------------ */
function completeTrial(trialNum){
  clearUiTimers();

  if(skipTrialBtn){
    skipTrialBtn.classList.add("hidden");
  }

  completedTrials.add(trialNum);

  if(trialNum === 25){
    updateUnlockedButtons();
    showFinalCelebration();
    return;
  }

  clearGridVisual();
  showCompleteMessage(trialNum);

  updateUnlockedButtons();
  syncCenter25Visibility();
  syncDifficultySkipVisibility();

  returnToIdleTimer = setTimeout(() => {
    showIdleState();
  }, 1800);
}

/* -----------------------
   Difficulty skip
------------------------ */
function skipToNextDifficulty(){
  const done1to20 = areTrialsComplete(1, 20);
  const done21to24 = areTrialsComplete(21, 24);
  const done25 = completedTrials.has(25);

  if(done25) return;

  if(!done1to20){
    for(let i = 1; i <= 20; i++){
      completedTrials.add(i);
    }

    clearUiTimers();
    selectedTrial = null;
    mode = "idle";
    showIdleState();
    return;
  }

  if(done1to20 && !done21to24){
    for(let i = 21; i <= 24; i++){
      completedTrials.add(i);
    }

    clearUiTimers();
    selectedTrial = null;
    mode = "idle";
    showIdleState();
    return;
  }
}

/* -----------------------
   Trial 1
------------------------ */
function buildTrial1Deck(){
  const palette = [
    "#D97C5C",
    "#E0A458",
    "#C9B458",
    "#6FA57A",
    "#5FA3A3",
    "#5C8FD9",
    "#7A6FD1",
    "#A16FD1",
    "#C86B98",
    "#B86A6A",
    "#8E9D5A",
    "#4F7C7C",
    "#5358f1",
    "#A06A4A",
    "#7DAA91"
  ];

  const pool = shuffle(palette);
  const pairColors = pool.slice(0, 12);
  const oddColor = pool[12];

  const items = [];

  pairColors.forEach(color => {
    items.push({ type: "pair", color });
    items.push({ type: "pair", color });
  });

  items.push({ type: "odd", color: oddColor });

  const shuffledItems = shuffle(items);
  oddIndex = shuffledItems.findIndex(item => item.type === "odd");

  return shuffledItems;
}

function startTrial1(){
  mode = "playing";
  deck = buildTrial1Deck();
  opened = [];
  removedCount = 0;

  cells.forEach((cell) => {
    cell.className = "cell is-faceDown";
    cell.style.background = faceDownColor;
    cell.dataset.state = "down";
  });

  startSkipCountdown();
}

function flipUp(i){
  const cell = cells[i];
  if(!cell || cell.dataset.state !== "down") return;
  cell.dataset.state = "up";
  cell.style.background = deck[i].color;
  cell.classList.remove("is-faceDown");
}

function flipDown(i){
  const cell = cells[i];
  if(!cell || cell.dataset.state !== "up") return;
  cell.dataset.state = "down";
  cell.style.background = faceDownColor;
  cell.classList.add("is-faceDown");
}

function removeTile(i){
  const cell = cells[i];
  if(!cell) return;
  cell.dataset.state = "removed";
  cell.classList.add("is-hidden");
  removedCount += 1;
}

function checkWinCondition(lastFlippedIndex){
  const allPairsRemoved = (removedCount === 24);
  const isOdd = (deck[lastFlippedIndex]?.type === "odd");

  if(allPairsRemoved && isOdd){
    mode = "won";
    completeTrial(1);
  }
}

function onCellActivate(i){
  if(uiMode !== "playing") return;
  if(selectedTrial !== 1) return;
  if(mode !== "playing") return;

  const cell = cells[i];
  if(!cell) return;
  if(cell.dataset.state !== "down") return;

  flipUp(i);
  opened.push(i);

  if(removedCount === 24){
    checkWinCondition(i);
    return;
  }

  if(opened.length < 2) return;

  cells.forEach(c => c.classList.add("is-locked"));

  const [a, b] = opened;
  const A = deck[a];
  const B = deck[b];

  const isPairMatch = (
    A.type === "pair" &&
    B.type === "pair" &&
    A.color === B.color
  );

  window.setTimeout(() => {
    if(isPairMatch){
      removeTile(a);
      removeTile(b);
    }else{
      flipDown(a);
      flipDown(b);
    }

    opened = [];
    cells.forEach(c => c.classList.remove("is-locked"));
  }, 2520);
}

/* -----------------------
   Trial 2 helpers
------------------------ */
function clamp01(v){
  return Math.max(0, Math.min(1, v));
}

function hexToRgb(hex){
  const clean = hex.replace("#", "");
  if(clean.length !== 6) return null;

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b){
  const toHex = (n) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b){
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if(max !== min){
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch(max){
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb(h, s, l){
  let r, g, b;

  if(s === 0){
    r = g = b = l;
  }else{
    const hue2rgb = (p, q, t) => {
      if(t < 0) t += 1;
      if(t > 1) t -= 1;
      if(t < 1 / 6) return p + (q - p) * 6 * t;
      if(t < 1 / 2) return q;
      if(t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function applyDelta(hex, lightnessDelta = 0, saturationDelta = 0){
  const rgb = hexToRgb(hex);
  if(!rgb) return hex;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const nextS = clamp01(hsl.s + saturationDelta);
  const nextL = clamp01(hsl.l + lightnessDelta);

  const nextRgb = hslToRgb(hsl.h, nextS, nextL);
  return rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
}

function buildTrial2RoundData(round){
  const basePalette = [
    "#a88f82", "#8c9b87", "#879da2", "#9d8eb1", "#b09384",
    "#8f8b7b", "#7f9b92", "#9aa5bb", "#b1a39a", "#9eaa90",
    "#a78b98", "#87908f"
  ];

  const difficultyMap = [
    { lightnessDelta: 0.18, saturationDelta: 0.08 },
    { lightnessDelta: 0.13, saturationDelta: 0.06 },
    { lightnessDelta: 0.10, saturationDelta: 0.045 },
    { lightnessDelta: 0.075, saturationDelta: 0.035 },
    { lightnessDelta: 0.055, saturationDelta: 0.025 },
    { lightnessDelta: 0.04, saturationDelta: 0.018 }
  ];

  const baseColor = shuffle(basePalette)[0];
  const settings = difficultyMap[round - 1] || difficultyMap[5];

  const useLightness = Math.random() > 0.5;
  const oddColor = useLightness
    ? applyDelta(baseColor, settings.lightnessDelta, 0)
    : applyDelta(baseColor, 0, settings.saturationDelta);

  const targetIndex = Math.floor(Math.random() * 25);

  return {
    baseColor,
    oddColor,
    targetIndex
  };
}

function renderTrial2Round(){
  const roundData = buildTrial2RoundData(trial2Round);
  trial2TargetIndex = roundData.targetIndex;
  trial2Locked = false;

  cells.forEach((cell, i) => {
    cell.className = "cell";
    cell.dataset.state = "trial2";
    cell.style.background = (i === trial2TargetIndex)
      ? roundData.oddColor
      : roundData.baseColor;
  });
}

function startTrial2(){
  mode = "playing";
  trial2Round = 1;
  trial2TargetIndex = -1;
  trial2Locked = false;

  renderTrial2Round();
  startSkipCountdown();
}

function handleTrial2Click(i){
  if(uiMode !== "playing") return;
  if(selectedTrial !== 2) return;
  if(mode !== "playing") return;
  if(trial2Locked) return;
  if(i !== trial2TargetIndex) return;

  trial2Locked = true;

  const cell = cells[i];
  if(cell){
    cell.classList.add("is-locked");
  }

  if(trial2Round >= 6){
    mode = "won";
    setTimeout(() => {
      completeTrial(2);
    }, 260);
    return;
  }

  trial2Round += 1;

  setTimeout(() => {
    renderTrial2Round();
  }, 260);
}

/* -----------------------
   Start each trial
------------------------ */
function startTrialGame(trialNum){
  clearUiTimers();
  setUiMode("playing");
  mode = "playing";

  ruleCard.classList.add("hidden");
  choosePrompt.classList.add("hidden");
  messageCard.classList.add("hidden");

  if(skipTrialBtn){
    skipTrialBtn.classList.add("hidden");
  }

  syncCenter25Visibility();
  syncDifficultySkipVisibility();

  if(trialNum === 1){
    startTrial1();
    return;
  }

  if(trialNum === 2){
    startTrial2();
    return;
  }

  clearGridVisual();
  startSkipCountdown();

  trialAutoCompleteTimer = setTimeout(() => {
    completeTrial(trialNum);
  }, 1200);
}

/* -----------------------
   Reset all
------------------------ */
function resetAllProgress(){
  clearUiTimers();

  completedTrials.clear();
  selectedTrial = null;
  mode = "idle";

  deck = [];
  opened = [];
  removedCount = 0;
  oddIndex = -1;

  trial2Round = 0;
  trial2TargetIndex = -1;
  trial2Locked = false;

  if(skipTrialBtn){
    skipTrialBtn.classList.add("hidden");
  }

  if(difficultySkipPanel){
    difficultySkipPanel.classList.remove("hidden");
  }

  const overlay = ensureFinalOverlay();
  overlay.classList.add("hidden");
  overlay.querySelectorAll(".confetti").forEach(el => el.remove());

  updateUnlockedButtons();
  showIdleState();
}

/* -----------------------
   Events
------------------------ */
allTrialButtons.forEach(btn => {
  if(!btn) return;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const n = Number(btn.dataset.trial);
    if(!isTrialUnlocked(n)) return;
    if(completedTrials.has(n)) return;

    btn.blur();
    showRuleCard(n);
  });
});

startBtn.addEventListener("click", () => {
  if(selectedTrial == null) return;
  startTrialGame(selectedTrial);
});

backBtn.addEventListener("click", () => {
  clearUiTimers();

  deck = [];
  opened = [];
  removedCount = 0;
  oddIndex = -1;

  trial2Round = 0;
  trial2TargetIndex = -1;
  trial2Locked = false;

  if(skipTrialBtn){
    skipTrialBtn.classList.add("hidden");
  }

  showIdleState();
});

resetAllBtn.addEventListener("click", () => {
  resetAllProgress();
});

if(difficultySkipBtn){
  difficultySkipBtn.addEventListener("click", () => {
    if(uiMode !== "idle") return;
    skipToNextDifficulty();
  });
}

if(skipTrialBtn){
  skipTrialBtn.addEventListener("click", () => {
    if(selectedTrial == null) return;
    if(mode !== "playing") return;

    clearUiTimers();
    skipTrialBtn.classList.add("hidden");
    mode = "won";
    completeTrial(selectedTrial);
  });
}

cells.forEach((cell) => {
  const idx = Number(cell.dataset.i) - 1;

  cell.addEventListener("click", () => {
    if(selectedTrial === 1){
      onCellActivate(idx);
      return;
    }

    if(selectedTrial === 2){
      handleTrial2Click(idx);
      return;
    }
  });

  cell.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();

      if(selectedTrial === 1){
        onCellActivate(idx);
        return;
      }

      if(selectedTrial === 2){
        handleTrial2Click(idx);
        return;
      }
    }
  });
});

/* -----------------------
   Init
------------------------ */
ensureFinalOverlay();
updateUnlockedButtons();
showIdleState();
syncDifficultySkipVisibility();