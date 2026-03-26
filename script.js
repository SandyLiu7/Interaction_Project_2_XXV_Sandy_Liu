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

const playRuleBar = document.getElementById("playRuleBar");
const playRuleText = document.getElementById("playRuleText");

const auxStartBtn = document.getElementById("auxStartBtn");
const auxAgainBtn = document.getElementById("auxAgainBtn");
const auxSubmitBtn = document.getElementById("auxSubmitBtn");
const auxResetTrialBtn = document.getElementById("auxResetTrialBtn");
const skipTrialBtn = document.getElementById("skipTrialBtn");

const bodyEl = document.body;

let selectedTrial = null;
let uiMode = "idle";
let mode = "idle";
let completedTrials = new Set();
let finalOverlay = null;

let idleColorTimer = null;
let returnToIdleTimer = null;
let skipTimer = null;
let demoTimer = null;
let miscTimers = [];

let trialState = null;

const morandiPalette = [
  "#cdb9aa", "#d1c1ac", "#b4bea2", "#9faea3", "#a8b7c7",
  "#c7b9ca", "#d1c6b8", "#b89f93", "#cfc5bc", "#a9b3ac",
  "#d7beb3", "#b0b79f", "#c5d1d5", "#bdaeb5", "#cab49e"
];

const vividMorandi = [
  "#d6a18f", "#d7b17c", "#b7be74", "#86b08f", "#7caab0",
  "#839ed1", "#a58fd1", "#cf95b9", "#d89f8e", "#b4af86",
  "#a9c0cb", "#c6a9d1"
];

const trialMeta = {
  1: {
    card: "Find the different color.",
    play: "Find the different color."
  },
  2: {
    card: "Find the slightly smaller grid.",
    play: "Find the slightly smaller grid."
  },
  3: {
    card: "Light up any 3 tiles.",
    play: "Light up any 3 tiles."
  },
  4: {
    card: "Light up the 4 corner tiles.",
    play: "Light up the 4 corner tiles."
  },
  5: {
    card: "Light up the center tile.",
    play: "Light up the center tile."
  },
  6: {
    card: "Memorize the flashing tile. There are 3 rounds. Use Again if you need another replay.",
    play: "Memorize the flashing tile, then click it."
  },
  7: {
    card: "Click every colored tile. Do not click any gray tile.",
    play: "Click all colored tiles. Gray tiles reset the trial."
  },
  8: {
    card: "Find the unpaired letter. Most tiles form uppercase / lowercase pairs. One tile has no match.",
    play: "Find the unpaired letter."
  },
  9: {
    card: "Find the unpaired color. Most colors appear twice. One color appears only once.",
    play: "Find the unpaired color."
  },
  10: {
    card: "Follow the route from S to E in the correct order.",
    play: "Follow the route from S to E."
  },
  11: {
    card: "Use the third column as the axis. Mirror the pattern on the right side.",
    play: "Complete the right side as a mirror."
  },
  12: {
    card: "A geometric shape appears, then disappears. Rebuild it. There are 2 rounds. Use Submit to check.",
    play: "Rebuild the shown shape, then press Submit."
  },
  13: {
    card: "A symmetrical figure is missing tiles on one side. Fill in the missing tiles.",
    play: "Fill the missing tiles to complete the symmetry."
  },
  14: {
    card: "Columns flash one by one. One column has a different rhythm. Find it.",
    play: "Find the column with the different rhythm."
  },
  15: {
  card: "A wave expands outward. The final step lights up a whole line. Click any tile in that final line.",
  play: "Click any tile in the final line that lights up last."
},
  16: {
    card: "Find the slightly different tile. There are 6 rounds. The difference becomes harder to see each round.",
    play: "Find the slightly different tile."
  },
  17: {
  card: "Danger sweeps across the grid. When it ends, click the only safe tile. In the last round, the danger moves diagonally.",
  play: "Click the only safe tile."
},
  18: {
    card: "A hidden target exists. Each click tells you if you are getting closer or farther.",
    play: "Search for the hidden target."
  },
  19: {
    card: "Find the most unique tile. Tiles with the same color can be eliminated. You only win if the unique tile is revealed last.",
    play: "Reveal matching pairs. The unique tile must be last."
  },
  20: {
    card: "Hidden mines are placed in the grid. Left-click to mark the mines. Safe tiles do nothing. There are 2 rounds.",
    play: "Left-click the hidden mines only. Safe tiles do nothing."
  },
  21: {
    card: "Start from the marked edge tile. Cover every available tile without breaking the chain, then connect to the end. Later rounds add blocked tiles and direction tiles.",
    play: "Cover every available tile and finish on E."
  },
  22: {
    card: "Watch the flashing sequence, then repeat it. There are 5 rounds. Use Again to replay. Use Start to enter your answer.",
    play: "Repeat the flashing sequence in order."
  },
  23: {
    card: "Track the unique shape through swaps. Later rounds add more hidden movement and distractions.",
    play: "Track the unique shape after the swaps."
  },
  24: {
    card: "Each click toggles a cross pattern: itself plus up / down / left / right. Turn on all tiles.",
    play: "Turn on every tile."
  },
  25: {
  card: "Two rows can each be sorted in different valid ways. In phase 1, find one valid sorting method for each row. In phase 2, find one different valid sorting method for each row.",
  play: "Sort each row by one valid system."
}
};

function rand(arr){
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr){
  const copy = arr.slice();
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function wait(ms){
  return new Promise(resolve => {
    const t = setTimeout(resolve, ms);
    miscTimers.push(t);
  });
}

function idxToRC(i){
  return {
    r: Math.floor(i / 5),
    c: i % 5
  };
}

function rcToIdx(r, c){
  return r * 5 + c;
}

function inBounds(r, c){
  return r >= 0 && r < 5 && c >= 0 && c < 5;
}

function manhattan(a, b){
  const A = idxToRC(a);
  const B = idxToRC(b);
  return Math.abs(A.r - B.r) + Math.abs(A.c - B.c);
}

function chebyshev(a, b){
  const A = idxToRC(a);
  const B = idxToRC(b);
  return Math.max(Math.abs(A.r - B.r), Math.abs(A.c - B.c));
}

function isAdjacent4(a, b){
  return manhattan(a, b) === 1;
}

function clearMiscTimers(){
  clearTimeout(demoTimer);
  miscTimers.forEach(t => clearTimeout(t));
  miscTimers = [];
  demoTimer = null;
}

function clearUiTimers(){
  clearTimeout(skipTimer);
  clearTimeout(returnToIdleTimer);
  skipTimer = null;
  returnToIdleTimer = null;
  clearMiscTimers();
}

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

function ensureFinalOverlay(){
  if(finalOverlay) return finalOverlay;

  finalOverlay = document.createElement("div");
  finalOverlay.id = "finalOverlay";
  finalOverlay.className = "finalOverlay hidden";
  finalOverlay.innerHTML = `
  <div class="finalMessage">
    <h2>Thank you for playing.</h2>
    <p>All 25 trials have been completed.</p>
    <button id="finalBackHomeBtn" class="finalBackHomeBtn">Back to Home</button>
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
  playRuleBar.classList.add("hidden");
  hideControlButtons();

  if(difficultySkipPanel){
    difficultySkipPanel.classList.add("hidden");
  }

  clearGridVisual();
  allTrialButtons.forEach(btn => {
    if(btn) btn.classList.add("hidden");
  });

  launchConfetti();
}

function hideControlButtons(){
  auxStartBtn.classList.add("hidden");
  auxAgainBtn.classList.add("hidden");
  auxSubmitBtn.classList.add("hidden");
  auxResetTrialBtn.classList.add("hidden");
  skipTrialBtn.classList.add("hidden");
}

function setControlButtons({
  start = false,
  again = false,
  submit = false,
  reset = false,
  skip = false
} = {}){
  auxStartBtn.classList.toggle("hidden", !start);
  auxAgainBtn.classList.toggle("hidden", !again);
  auxSubmitBtn.classList.toggle("hidden", !submit);
  auxResetTrialBtn.classList.toggle("hidden", !reset);
  skipTrialBtn.classList.toggle("hidden", !skip);
}

function setPlayRule(text){
  playRuleText.textContent = text || "";
  if(text){
    playRuleBar.classList.remove("hidden");
  }else{
    playRuleBar.classList.add("hidden");
  }
}

function startSkipCountdown(){
  skipTrialBtn.classList.add("hidden");
  clearTimeout(skipTimer);
  skipTimer = setTimeout(() => {
    if(uiMode === "playing" && mode === "playing" && selectedTrial != null){
      skipTrialBtn.classList.remove("hidden");
    }
  }, 60000);
}

function clearGridVisual(){
  grid.classList.remove("is-rect-mode");
  cells.forEach((cell, i) => {
    cell.className = "cell empty";
    cell.style.background = "transparent";
    cell.style.color = "";
    cell.style.transform = "";
    cell.innerHTML = "";
    cell.dataset.state = "empty";
    cell.dataset.index = String(i);
  });
}

function resetCell(cell){
  cell.className = "cell";
  cell.style.background = "#d9d2c8";
  cell.style.color = "";
  cell.style.transform = "";
  cell.innerHTML = "";
  cell.dataset.state = "ready";
}

function applyIdleCell(cell, color){
  resetCell(cell);
  cell.style.background = color;
  cell.dataset.state = "idle";
}

function paintIdleGrid(){
  const colors = shuffle(morandiPalette.concat(morandiPalette.slice(0, 10)));
  cells.forEach((cell, i) => {
    applyIdleCell(cell, colors[i]);
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

  if(done25 || !done21to24 || uiMode === "message"){
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

  if(uiMode !== "idle" || done25){
    difficultySkipPanel.classList.add("hidden");
    return;
  }

  if(!done1to20 || (done1to20 && !done21to24)){
    difficultySkipPanel.classList.remove("hidden");
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
    first20Buttons.forEach(btn => btn && btn.classList.remove("hidden"));
    extra21to24.forEach(btn => btn && btn.classList.add("hidden"));
    center25Btn.classList.add("hidden");
    choosePrompt.classList.remove("hidden");
  }

  if(done1to20 && !done21to24){
    first20Buttons.forEach(btn => btn && btn.classList.add("hidden"));
    extra21to24.forEach(btn => btn && btn.classList.remove("hidden"));
    center25Btn.classList.add("hidden");
    choosePrompt.classList.remove("hidden");
  }

  if(done21to24 && !done25){
    first20Buttons.forEach(btn => btn && btn.classList.add("hidden"));
    extra21to24.forEach(btn => btn && btn.classList.add("hidden"));
    choosePrompt.classList.add("hidden");
  }

  if(done25){
    first20Buttons.forEach(btn => btn && btn.classList.add("hidden"));
    extra21to24.forEach(btn => btn && btn.classList.add("hidden"));
    center25Btn.classList.add("hidden");
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

function showIdleState(){
  clearUiTimers();
  hideControlButtons();
  setUiMode("idle");
  selectedTrial = null;
  trialState = null;
  mode = "idle";

  const done21to24 = areTrialsComplete(21, 24);
  const done25 = completedTrials.has(25);
  const center25WasHidden = center25Btn.classList.contains("hidden");

  if(done21to24 && !done25){
    choosePrompt.classList.add("hidden");
  }else if(!done25){
    choosePrompt.classList.remove("hidden");
  }

  ruleCard.classList.add("hidden");
  messageCard.classList.add("hidden");
  playRuleBar.classList.add("hidden");

  clearGridVisual();
  paintIdleGrid();
  updateUnlockedButtons();
  syncCenter25Visibility();
  syncDifficultySkipVisibility();

  const center25NowVisible = !center25Btn.classList.contains("hidden");
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
  textEl.textContent = trialMeta[trialNum]?.card || `Rule placeholder for Trial ${trialNum}.`;

  choosePrompt.classList.add("hidden");
  messageCard.classList.add("hidden");
  playRuleBar.classList.add("hidden");
  ruleCard.classList.remove("hidden");
  hideControlButtons();

  clearGridVisual();
  syncCenter25Visibility();
  syncDifficultySkipVisibility();

  allTrialButtons.forEach(btn => btn && btn.blur());
}

function showCompleteMessage(trialNum){
  setUiMode("message");
  ruleCard.classList.add("hidden");
  choosePrompt.classList.add("hidden");
  messageCard.classList.remove("hidden");
  playRuleBar.classList.add("hidden");
  hideControlButtons();
  messageText.textContent = `Congratulations! Trial ${trialNum} completed.`;

  if(center25Btn){
    center25Btn.classList.add("hidden");
  }

  syncDifficultySkipVisibility();
}

function completeTrial(trialNum){
  clearUiTimers();
  hideControlButtons();
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
    showIdleState();
    return;
  }

  if(done1to20 && !done21to24){
    for(let i = 21; i <= 24; i++){
      completedTrials.add(i);
    }
    clearUiTimers();
    showIdleState();
  }
}

function renderBlankBoard(){
  grid.classList.remove("is-rect-mode");
  cells.forEach(cell => {
    resetCell(cell);
    cell.style.background = "#d8d1c7";
  });
}

function renderSoftBoard(){
  grid.classList.remove("is-rect-mode");
  cells.forEach(cell => {
    resetCell(cell);
    cell.classList.add("soft");
    cell.style.background = "rgba(183,171,156,0.18)";
  });
}

function markCellText(i, html){
  const cell = cells[i];
  if(!cell) return;
  cell.innerHTML = html;
}

function setCellBg(i, color){
  const cell = cells[i];
  if(!cell) return;
  cell.style.background = color;
}

function setCellClass(i, name, on = true){
  const cell = cells[i];
  if(!cell) return;
  cell.classList.toggle(name, on);
}

function revealMessageInRuleBar(text){
  setPlayRule(text);
}

function resetTrialStateBase(){
  trialState = {
    id: selectedTrial
  };
  mode = "playing";
  setUiMode("playing");
  choosePrompt.classList.add("hidden");
  ruleCard.classList.add("hidden");
  messageCard.classList.add("hidden");
  setPlayRule(trialMeta[selectedTrial]?.play || "");
  hideControlButtons();
  startSkipCountdown();
}

/* ---------- Trial 1 ---------- */

function startTrial1(){
  resetTrialStateBase();
  renderBlankBoard();

  const base = rand(morandiPalette);
  let odd = rand(vividMorandi);
  while(odd === base) odd = rand(vividMorandi);

  const target = Math.floor(Math.random() * 25);
  trialState.target = target;

  cells.forEach((cell, i) => {
    resetCell(cell);
    cell.style.background = i === target ? odd : base;
  });
}

function handleTrial1(i){
  if(i === trialState.target){
    cells[i].classList.add("good");
    mode = "won";
    setTimeout(() => completeTrial(1), 220);
  }
}

/* ---------- Trial 2 ---------- */

function startTrial2(){
  resetTrialStateBase();
  renderBlankBoard();

  const colors = shuffle(vividMorandi.concat(morandiPalette)).slice(0, 25);
  const target = Math.floor(Math.random() * 25);
  trialState.target = target;

  cells.forEach((cell, i) => {
    resetCell(cell);
    cell.style.background = colors[i];
    if(i === target){
      cell.classList.add("small-target");
    }
  });
}

function handleTrial2(i){
  if(i === trialState.target){
    cells[i].classList.add("good");
    mode = "won";
    setTimeout(() => completeTrial(2), 220);
  }
}

/* ---------- Trial 3 ---------- */

function startTrial3(){
  resetTrialStateBase();
  renderSoftBoard();
  trialState.clicked = new Set();
}

function handleTrial3(i){
  if(trialState.clicked.has(i)) return;
  trialState.clicked.add(i);
  cells[i].classList.add("good");
  cells[i].style.background = "rgba(153,183,160,0.85)";

  if(trialState.clicked.size >= 3){
    mode = "won";
    setTimeout(() => completeTrial(3), 220);
  }
}

/* ---------- Trial 4 ---------- */

function startTrial4(){
  resetTrialStateBase();
  renderSoftBoard();
  trialState.targets = new Set([0, 4, 20, 24]);
  trialState.hit = new Set();
}

function handleTrial4(i){
  if(!trialState.targets.has(i)) return;
  if(trialState.hit.has(i)) return;
  trialState.hit.add(i);
  cells[i].classList.add("good");
  cells[i].style.background = "rgba(153,183,160,0.85)";

  if(trialState.hit.size === 4){
    mode = "won";
    setTimeout(() => completeTrial(4), 220);
  }
}

/* ---------- Trial 5 ---------- */

function startTrial5(){
  resetTrialStateBase();
  renderSoftBoard();
  trialState.target = 12;
}

function handleTrial5(i){
  if(i !== 12) return;
  cells[i].classList.add("good");
  cells[i].style.background = "rgba(153,183,160,0.85)";
  mode = "won";
  setTimeout(() => completeTrial(5), 220);
}

/* ---------- Trial 6 ---------- */

const trial6Durations = [2000, 1400, 900];

async function trial6Demo(){
  if(selectedTrial !== 6 || !trialState) return;
  trialState.acceptInput = false;
  hideControlButtons();
  renderSoftBoard();

  const target = trialState.targets[trialState.round];
  const duration = trial6Durations[trialState.round];

  await wait(260);

  cells[target].style.background = rand(vividMorandi);
  cells[target].classList.add("flash-highlight");
  await wait(duration);

  if(selectedTrial !== 6 || !trialState) return;
  renderSoftBoard();
  trialState.acceptInput = true;
  setControlButtons({ again: true });
  setPlayRule(`Round ${trialState.round + 1}/3 · Memorize the flashing tile, then click it.`);
}

function startTrial6(){
  resetTrialStateBase();
  trialState.round = 0;
  trialState.targets = shuffle([...Array(25).keys()]).slice(0, 3);
  trial6Demo();
}

function handleTrial6(i){
  if(!trialState.acceptInput) return;
  if(i !== trialState.targets[trialState.round]) return;

  cells[i].classList.add("good");
  cells[i].style.background = "rgba(153,183,160,0.85)";
  trialState.round += 1;
  trialState.acceptInput = false;

  if(trialState.round >= 3){
    mode = "won";
    setTimeout(() => completeTrial(6), 260);
    return;
  }

  setTimeout(() => {
    trial6Demo();
  }, 400);
}

/* ---------- Trial 7 ---------- */

function buildTrial7Data(){
  const count = 10 + Math.floor(Math.random() * 5);
  const chosen = shuffle([...Array(25).keys()]).slice(0, count);
  return new Set(chosen);
}

function startTrial7(){
  resetTrialStateBase();
  trialState.targets = buildTrial7Data();
  trialState.hit = new Set();

  cells.forEach((cell, i) => {
    resetCell(cell);
    if(trialState.targets.has(i)){
      cell.style.background = rand(vividMorandi);
    }else{
      cell.style.background = "rgba(183,171,156,0.28)";
    }
  });
}

function handleTrial7(i){
  if(trialState.targets.has(i)){
    if(trialState.hit.has(i)) return;
    trialState.hit.add(i);
    cells[i].classList.add("good");
    cells[i].style.background = "rgba(153,183,160,0.85)";
    if(trialState.hit.size === trialState.targets.size){
      mode = "won";
      setTimeout(() => completeTrial(7), 260);
    }
    return;
  }

  cells[i].classList.add("bad");
  cells[i].style.background = "rgba(215,124,120,0.85)";
  setTimeout(() => {
    startTrial7();
  }, 460);
}

/* ---------- Trial 8 ---------- */

function startTrial8(){
  resetTrialStateBase();
  renderBlankBoard();

  const pool = shuffle("ABCDEFGHJKLMNPQRSTUVXYZ".split(""));
  const bases = pool.slice(0, 12);
  const oddLetter = pool[12];
  const oddUpper = Math.random() > 0.5;
  const items = [];

  bases.forEach(ch => {
    items.push(ch.toUpperCase());
    items.push(ch.toLowerCase());
  });

  const odd = oddUpper ? oddLetter.toUpperCase() : oddLetter.toLowerCase();
  items.push(odd);

  const shuffled = shuffle(items);
  trialState.items = shuffled;

  const lowerCounts = {};
  shuffled.forEach(v => {
    const key = v.toLowerCase();
    lowerCounts[key] = (lowerCounts[key] || 0) + 1;
  });

  trialState.target = shuffled.findIndex(v => lowerCounts[v.toLowerCase()] === 1);

  cells.forEach((cell, i) => {
    resetCell(cell);
    cell.classList.add("letter");
    cell.style.background = "rgba(183,171,156,0.14)";
    cell.textContent = shuffled[i];
  });
}

function handleTrial8(i){
  if(i === trialState.target){
    cells[i].classList.add("good");
    cells[i].style.background = "rgba(153,183,160,0.85)";
    mode = "won";
    setTimeout(() => completeTrial(8), 220);
  }
}

/* ---------- Trial 9 ---------- */

function startTrial9(){
  resetTrialStateBase();
  renderBlankBoard();

  const pool = shuffle(vividMorandi.concat(morandiPalette)).slice(0, 13);
  const pairColors = pool.slice(0, 12);
  const oddColor = pool[12];
  const items = [];

  pairColors.forEach(color => {
    items.push(color);
    items.push(color);
  });
  items.push(oddColor);

  const shuffled = shuffle(items);
  trialState.items = shuffled;

  const counts = {};
  shuffled.forEach(v => {
    counts[v] = (counts[v] || 0) + 1;
  });
  trialState.target = shuffled.findIndex(v => counts[v] === 1);

  cells.forEach((cell, i) => {
    resetCell(cell);
    cell.style.background = shuffled[i];
  });
}

function handleTrial9(i){
  if(i === trialState.target){
    cells[i].classList.add("good");
    mode = "won";
    setTimeout(() => completeTrial(9), 220);
  }
}

/* ---------- Trial 10 ---------- */

const trial10Paths = [
  [0, 1, 2, 7, 12, 13, 14, 19, 24],
  [20, 15, 10, 11, 12, 17, 18, 13, 8, 9]
];

function renderTrial10Round(){
  renderSoftBoard();
  const path = trial10Paths[trialState.round];
  trialState.path = path;
  trialState.step = 0;

  path.forEach((idx, order) => {
    cells[idx].style.background = "rgba(167,182,200,0.25)";
    markCellText(idx, `<span class="route-number">${order + 1}</span>`);
  });

  const s = path[0];
  const e = path[path.length - 1];
  markCellText(s, `<span class="center-label">S</span>`);
  markCellText(e, `<span class="center-label">E</span>`);
  cells[s].classList.add("path-start");
  cells[e].classList.add("path-end");
  setPlayRule(`Round ${trialState.round + 1}/2 · Follow the route from S to E.`);
}

function startTrial10(){
  resetTrialStateBase();
  trialState.round = 0;
  renderTrial10Round();
}

function handleTrial10(i){
  const path = trialState.path;
  if(i !== path[trialState.step]) return;

  cells[i].classList.add("path-hit");
  trialState.step += 1;

  if(trialState.step >= path.length){
    trialState.round += 1;
    if(trialState.round >= 2){
      mode = "won";
      setTimeout(() => completeTrial(10), 260);
      return;
    }
    setTimeout(() => renderTrial10Round(), 320);
  }
}

/* ---------- Trial 11 ---------- */

const trial11Patterns = [
  [0, 5, 10, 11, 16],
  [1, 6, 7, 10, 15]
];

function renderTrial11Round(){
  renderSoftBoard();
  trialState.required = new Set();
  trialState.hit = new Set();

  for(let r = 0; r < 5; r++){
    cells[rcToIdx(r, 2)].classList.add("axis");
  }

  const source = trial11Patterns[trialState.round];
  source.forEach(idx => {
    cells[idx].style.background = "rgba(167,182,200,0.86)";
    const { r, c } = idxToRC(idx);
    const mirrored = rcToIdx(r, 4 - c);
    if(c < 2){
      trialState.required.add(mirrored);
    }
  });

  setPlayRule(`Round ${trialState.round + 1}/2 · Mirror the left side on the right side.`);
}

function startTrial11(){
  resetTrialStateBase();
  trialState.round = 0;
  renderTrial11Round();
}

function handleTrial11(i){
  const { c } = idxToRC(i);
  if(c <= 2) return;
  if(!trialState.required.has(i)) return;
  if(trialState.hit.has(i)) return;

  trialState.hit.add(i);
  cells[i].classList.add("good");
  cells[i].style.background = "rgba(153,183,160,0.85)";

  if(trialState.hit.size === trialState.required.size){
    trialState.round += 1;
    if(trialState.round >= 2){
      mode = "won";
      setTimeout(() => completeTrial(11), 260);
      return;
    }
    setTimeout(() => renderTrial11Round(), 320);
  }
}

/* ---------- Trial 12 ---------- */

const trial12Shapes = [
  [10, 11, 12, 6, 7, 8],
  [6, 7, 8, 11, 13, 16, 17, 18]
];

async function trial12Demo(){
  trialState.canToggle = false;
  hideControlButtons();
  renderSoftBoard();

  trial12Shapes[trialState.round].forEach(idx => {
    cells[idx].style.background = "rgba(167,182,200,0.92)";
  });

  await wait(1800);
  if(selectedTrial !== 12 || !trialState) return;

  renderSoftBoard();
  trialState.canToggle = true;
  setControlButtons({ again: true, submit: true });
  setPlayRule(`Round ${trialState.round + 1}/2 · Rebuild the shape, then press Submit.`);
}

function startTrial12(){
  resetTrialStateBase();
  trialState.round = 0;
  trialState.selected = new Set();
  trial12Demo();
}

function handleTrial12(i){
  if(!trialState.canToggle) return;
  if(trialState.selected.has(i)){
    trialState.selected.delete(i);
    cells[i].style.background = "rgba(183,171,156,0.18)";
  }else{
    trialState.selected.add(i);
    cells[i].style.background = "rgba(167,182,200,0.92)";
  }
}

function submitTrial12(){
  const target = new Set(trial12Shapes[trialState.round]);
  const ok = trialState.selected.size === target.size &&
    [...trialState.selected].every(v => target.has(v));

  if(!ok) return;

  trialState.round += 1;
  trialState.selected = new Set();

  if(trialState.round >= 2){
    mode = "won";
    setTimeout(() => completeTrial(12), 220);
    return;
  }

  trial12Demo();
}

/* ---------- Trial 13 ---------- */

const trial13Rounds = [
  {
    lit: [0, 1, 5, 6, 10, 11, 12, 13],
    missing: [14]
  },
  {
    lit: [0, 2, 5, 7, 10, 12, 15, 17],
    missing: [19, 22]
  }
];

function renderTrial13Round(){
  renderSoftBoard();
  const round = trial13Rounds[trialState.round];
  trialState.required = new Set(round.missing);
  trialState.hit = new Set();

  round.lit.forEach(idx => {
    cells[idx].style.background = "rgba(167,182,200,0.92)";
  });

  round.missing.forEach(idx => {
    cells[idx].style.background = "rgba(183,171,156,0.26)";
    cells[idx].classList.add("glow");
  });

  setPlayRule(`Round ${trialState.round + 1}/2 · Fill the missing tiles to complete the symmetry.`);
}

function startTrial13(){
  resetTrialStateBase();
  trialState.round = 0;
  renderTrial13Round();
}

function handleTrial13(i){
  if(!trialState.required.has(i)) return;
  if(trialState.hit.has(i)) return;
  trialState.hit.add(i);
  cells[i].style.background = "rgba(153,183,160,0.85)";

  if(trialState.hit.size === trialState.required.size){
    trialState.round += 1;
    if(trialState.round >= 2){
      mode = "won";
      completeTrial(13);
      return;
    }
    setTimeout(() => renderTrial13Round(), 320);
  }
}

/* ---------- Trial 14 ---------- */

const trial14OddColumns = [1, 3];

async function trial14Demo(){
  trialState.acceptInput = false;
  hideControlButtons();
  renderSoftBoard();

  const oddCol = trial14OddColumns[trialState.round];
  trialState.targetCol = oddCol;

  for(let pass = 0; pass < 2; pass++){
    for(let c = 0; c < 5; c++){
      const dur = c === oddCol ? 560 : 300;
      for(let r = 0; r < 5; r++){
        const idx = rcToIdx(r, c);
        cells[idx].style.background = c === oddCol ? "rgba(215,124,120,0.75)" : "rgba(167,182,200,0.75)";
      }
      await wait(dur);
      for(let r = 0; r < 5; r++){
        const idx = rcToIdx(r, c);
        cells[idx].style.background = "rgba(183,171,156,0.18)";
      }
      await wait(130);
    }
  }

  if(selectedTrial !== 14 || !trialState) return;
  trialState.acceptInput = true;
  setControlButtons({ again: true });
  setPlayRule(`Round ${trialState.round + 1}/2 · Click any tile in the odd column.`);
}

function startTrial14(){
  resetTrialStateBase();
  trialState.round = 0;
  trial14Demo();
}

function handleTrial14(i){
  if(!trialState.acceptInput) return;
  const { c } = idxToRC(i);
  if(c !== trialState.targetCol) return;

  for(let r = 0; r < 5; r++){
    cells[rcToIdx(r, c)].style.background = "rgba(153,183,160,0.85)";
  }

  trialState.round += 1;
  if(trialState.round >= 2){
    mode = "won";
    setTimeout(() => completeTrial(14), 260);
    return;
  }

  setTimeout(() => trial14Demo(), 320);
}

/* ---------- Trial 15 ---------- */

const trial15Sources = [
  { source: 12, type: "row", index: 4 },
  { source: 12, type: "col", index: 0 }
];

async function trial15Demo(){
  trialState.acceptInput = false;
  hideControlButtons();
  renderSoftBoard();

  const cfg = trial15Sources[trialState.round];
  const source = cfg.source;

  trialState.targetType = cfg.type;
  trialState.targetIndex = cfg.index;

  if(cfg.type === "row"){
    for(let r = 0; r <= cfg.index; r++){
      for(let c = 0; c < 5; c++){
        const idx = rcToIdx(r, c);
        cells[idx].style.background = "rgba(167,182,200,0.92)";
      }
      await wait(420);
    }
  }else{
    for(let c = 4; c >= cfg.index; c--){
      for(let r = 0; r < 5; r++){
        const idx = rcToIdx(r, c);
        cells[idx].style.background = "rgba(167,182,200,0.92)";
      }
      await wait(420);
    }
  }

  await wait(280);
  trialState.acceptInput = true;
  setPlayRule(`Round ${trialState.round + 1}/2 · Click any tile in the final line.`);
}

function startTrial15(){
  resetTrialStateBase();
  trialState.round = 0;
  trial15Demo();
}

function handleTrial15(i){
  if(!trialState.acceptInput) return;

  const { r, c } = idxToRC(i);
  const hit =
    (trialState.targetType === "row" && r === trialState.targetIndex) ||
    (trialState.targetType === "col" && c === trialState.targetIndex);

  if(!hit) return;

  if(trialState.targetType === "row"){
    for(let col = 0; col < 5; col++){
      cells[rcToIdx(trialState.targetIndex, col)].style.background = "rgba(153,183,160,0.85)";
    }
  }else{
    for(let row = 0; row < 5; row++){
      cells[rcToIdx(row, trialState.targetIndex)].style.background = "rgba(153,183,160,0.85)";
    }
  }

  trialState.round += 1;

  if(trialState.round >= 2){
    mode = "won";
    setTimeout(() => completeTrial(15), 260);
    return;
  }

  setTimeout(() => trial15Demo(), 320);
}

/* ---------- Trial 16 ---------- */

function startTrial16(){
  resetTrialStateBase();
  trialState.round = 0;
  startTrial16Round();
}

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
  const toHex = n => Math.round(n).toString(16).padStart(2, "0");
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
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
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

function buildTrial16RoundData(round){
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
  const settings = difficultyMap[round] || difficultyMap[5];
  const useLightness = Math.random() > 0.5;
  const oddColor = useLightness
    ? applyDelta(baseColor, settings.lightnessDelta, 0)
    : applyDelta(baseColor, 0, settings.saturationDelta);

  const targetIndex = Math.floor(Math.random() * 25);
  return { baseColor, oddColor, targetIndex };
}

function startTrial16Round(){
  const roundData = buildTrial16RoundData(trialState.round);
  trialState.target = roundData.targetIndex;
  renderBlankBoard();

  cells.forEach((cell, i) => {
    resetCell(cell);
    cell.style.background = i === trialState.target ? roundData.oddColor : roundData.baseColor;
  });

  setPlayRule(`Round ${trialState.round + 1}/6 · Find the slightly different tile.`);
}

function handleTrial16(i){
  if(i !== trialState.target) return;

  cells[i].classList.add("good");
  trialState.round += 1;

  if(trialState.round >= 6){
    mode = "won";
    setTimeout(() => completeTrial(16), 260);
    return;
  }

  setTimeout(() => {
    startTrial16Round();
  }, 260);
}

/* ---------- Trial 17 ---------- */

async function trial17Demo(){
  const demoToken = Symbol("trial17");
  trialState.demoToken = demoToken;
  trialState.acceptInput = false;
  hideControlButtons();
  renderSoftBoard();

  const safe = trialState.safeTiles[trialState.round];
  trialState.target = safe;

  const waves = trialState.waves[trialState.round];

  for(const wave of waves){
    if(selectedTrial !== 17 || !trialState || trialState.demoToken !== demoToken) return;

    wave.forEach(idx => {
      if(idx !== safe){
        cells[idx].style.background = "rgba(215,124,120,0.82)";
      }
    });

    await wait(420);

    if(selectedTrial !== 17 || !trialState || trialState.demoToken !== demoToken) return;

    wave.forEach(idx => {
      if(idx !== safe){
        cells[idx].style.background = "rgba(183,171,156,0.18)";
      }
    });

    await wait(120);
  }

  if(selectedTrial !== 17 || !trialState || trialState.demoToken !== demoToken) return;

  cells[safe].classList.add("glow");
  trialState.acceptInput = true;
  setPlayRule(`Round ${trialState.round + 1}/3 · Click the only safe tile.`);
}

function startTrial17(){
  resetTrialStateBase();
  trialState.round = 0;
  trialState.safeTiles = [12, 8, 18];
  trialState.waves = [
    [
      [0,1,2,3,4],
      [5,6,7,8,9],
      [10,11,13,14],
      [15,16,17,18,19],
      [20,21,22,23,24]
    ],
    [
      [0,5,10,15,20],
      [1,6,11,16,21],
      [2,7,12,17,22],
      [3,8,13,18,23],
      [4,9,14,19,24]
    ],
    [
      [0,1,5],
      [2,6,10],
      [3,7,11,15],
      [4,8,12,16,20],
      [9,13,17,21],
      [14,18,22],
      [19,23],
      [24]
    ]
  ];
  trial17Demo();
}

function handleTrial17(i){
  if(!trialState.acceptInput) return;
  if(i !== trialState.target) return;

  cells[i].style.background = "rgba(153,183,160,0.85)";
  trialState.round += 1;

  if(trialState.round >= 3){
    mode = "won";
    completeTrial(17);
    return;
  }

  setTimeout(() => trial17Demo(), 340);
}

/* ---------- Trial 18 ---------- */

function startTrial18(){
  resetTrialStateBase();
  renderSoftBoard();
  trialState.round = 0;
  trialState.targets = shuffle([...Array(25).keys()]).filter(i => i !== 12).slice(0, 2);
  trialState.prevClick = null;
  setPlayRule(`Round 1/2 · Start searching.`);
}

function handleTrial18(i){
  const target = trialState.targets[trialState.round];

  if(i === target){
    cells[i].style.background = "rgba(153,183,160,0.85)";
    trialState.round += 1;
    trialState.prevClick = null;

    if(trialState.round >= 2){
      mode = "won";
      completeTrial(18);
      return;
    }

    renderSoftBoard();
    setPlayRule(`Round ${trialState.round + 1}/2 · Start searching.`);
    return;
  }

  if(trialState.prevClick == null){
    trialState.prevClick = i;
    cells[i].style.background = "rgba(167,182,200,0.45)";
    setPlayRule(`Round ${trialState.round + 1}/2 · Start searching.`);
    return;
  }

  const prevDist = manhattan(trialState.prevClick, target);
  const nextDist = manhattan(i, target);
  trialState.prevClick = i;

  renderSoftBoard();
  cells[i].style.background = "rgba(167,182,200,0.45)";

  if(nextDist < prevDist){
    setPlayRule(`Round ${trialState.round + 1}/2 · Closer.`);
  }else if(nextDist > prevDist){
    setPlayRule(`Round ${trialState.round + 1}/2 · Farther.`);
  }else{
    setPlayRule(`Round ${trialState.round + 1}/2 · Same distance.`);
  }
}

/* ---------- Trial 19 ---------- */

function buildTrial19Deck(){
  const palette = [
    "#D97C5C", "#E0A458", "#C9B458", "#6FA57A", "#5FA3A3",
    "#5C8FD9", "#7A6FD1", "#A16FD1", "#C86B98", "#B86A6A",
    "#8E9D5A", "#4F7C7C", "#5358f1", "#A06A4A", "#7DAA91"
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

  return shuffle(items);
}

function startTrial19(){
  resetTrialStateBase();
  trialState.deck = buildTrial19Deck();
  trialState.opened = [];
  trialState.removedCount = 0;

  cells.forEach((cell) => {
    resetCell(cell);
    cell.classList.add("is-faceDown");
    cell.style.background = "rgba(168,153,140,0.16)";
    cell.dataset.state = "down";
  });
}

function trial19FlipUp(i){
  const cell = cells[i];
  if(!cell || cell.dataset.state !== "down") return;
  cell.dataset.state = "up";
  cell.style.background = trialState.deck[i].color;
  cell.classList.remove("is-faceDown");
}

function trial19FlipDown(i){
  const cell = cells[i];
  if(!cell || cell.dataset.state !== "up") return;
  cell.dataset.state = "down";
  cell.style.background = "rgba(168,153,140,0.16)";
  cell.classList.add("is-faceDown");
}

function trial19Remove(i){
  const cell = cells[i];
  if(!cell) return;
  cell.dataset.state = "removed";
  cell.classList.add("is-hidden");
  trialState.removedCount += 1;
}

function handleTrial19(i){
  if(mode !== "playing") return;
  const cell = cells[i];
  if(!cell || cell.dataset.state !== "down") return;

  trial19FlipUp(i);
  trialState.opened.push(i);

  if(trialState.removedCount === 24){
    if(trialState.deck[i]?.type === "odd"){
      mode = "won";
      completeTrial(19);
    }
    return;
  }

  if(trialState.opened.length < 2) return;

  cells.forEach(c => c.classList.add("is-locked"));

  const [a, b] = trialState.opened;
  const A = trialState.deck[a];
  const B = trialState.deck[b];

  const isPairMatch =
    A.type === "pair" &&
    B.type === "pair" &&
    A.color === B.color;

  setTimeout(() => {
    if(isPairMatch){
      trial19Remove(a);
      trial19Remove(b);
    }else{
      trial19FlipDown(a);
      trial19FlipDown(b);
    }

    trialState.opened = [];
    cells.forEach(c => c.classList.remove("is-locked"));
  }, 900);
}

/* ---------- Trial 20 ---------- */

const trial20MineRounds = [
  { mines: [1, 8, 18] },
  { mines: [2, 6, 12, 17, 23] }
];

function renderTrial20Round(){
  renderSoftBoard();
  trialState.found = new Set();
  trialState.mines = new Set(trial20MineRounds[trialState.round].mines);
  setPlayRule(`Round ${trialState.round + 1}/2 · Find every mine. Remaining: ${trialState.mines.size - trialState.found.size}`);
}

function startTrial20(){
  resetTrialStateBase();
  trialState.round = 0;
  renderTrial20Round();
}

function handleTrial20(i){
  if(trialState.found.has(i)) return;

  if(!trialState.mines.has(i)){
    setPlayRule(`Round ${trialState.round + 1}/2 · Safe tile. Remaining: ${trialState.mines.size - trialState.found.size}`);
    return;
  }

  trialState.found.add(i);
  cells[i].classList.add("mine-mark");
  cells[i].style.background = "rgba(215,124,120,0.85)";

  const remaining = trialState.mines.size - trialState.found.size;
  setPlayRule(`Round ${trialState.round + 1}/2 · Remaining: ${remaining}`);

  if(trialState.found.size === trialState.mines.size){
    trialState.round += 1;
    if(trialState.round >= 2){
      mode = "won";
      completeTrial(20);
      return;
    }
    setTimeout(() => renderTrial20Round(), 420);
  }
}

/* ---------- Trial 21 ---------- */

function getNeighborsFor21(idx, cfg){
  const { r, c } = idxToRC(idx);
  const out = [];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  dirs.forEach(([dr, dc]) => {
    const nr = r + dr;
    const nc = c + dc;
    if(!inBounds(nr, nc)) return;
    const ni = rcToIdx(nr, nc);
    if(cfg.blocked.has(ni)) return;

    const moveHorizontal = dc !== 0;
    const fromDir = cfg.directions[idx];
    const toDir = cfg.directions[ni];

    if(fromDir === "h" && !moveHorizontal) return;
    if(fromDir === "v" && moveHorizontal) return;
    if(toDir === "h" && !moveHorizontal) return;
    if(toDir === "v" && moveHorizontal) return;

    out.push(ni);
  });
  return out;
}

function findHamiltonianPath21(cfg){
  const allowed = [];
  for(let i = 0; i < 25; i++){
    if(!cfg.blocked.has(i)) allowed.push(i);
  }
  const allowedSet = new Set(allowed);

  function dfs(current, end, visited, path){
    if(path.length === allowed.length){
      return current === end ? path.slice() : null;
    }

    let nexts = getNeighborsFor21(current, cfg)
      .filter(n => allowedSet.has(n) && !visited.has(n));

    nexts.sort((a, b) => {
      const da = getNeighborsFor21(a, cfg).filter(n => !visited.has(n)).length;
      const db = getNeighborsFor21(b, cfg).filter(n => !visited.has(n)).length;
      return da - db;
    });

    for(const n of nexts){
      visited.add(n);
      path.push(n);
      const res = dfs(n, end, visited, path);
      if(res) return res;
      path.pop();
      visited.delete(n);
    }
    return null;
  }

  const edgeStartCandidates = [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24]
    .filter(i => !cfg.blocked.has(i));
  const interiorEndCandidates = [6,7,8,11,12,13,16,17,18]
    .filter(i => !cfg.blocked.has(i));

  for(const start of edgeStartCandidates){
    for(const end of interiorEndCandidates){
      if(start === end) continue;
      const visited = new Set([start]);
      const result = dfs(start, end, visited, [start]);
      if(result){
        return {
          start,
          end,
          path: result
        };
      }
    }
  }
  return null;
}

function buildTrial21Configs(){
  return [
    {
      blocked: new Set(),
      directions: {}
    },
    {
      blocked: new Set([20, 21, 22]),
      directions: {}
    },
    {
      blocked: new Set(),
      directions: {
        1: "h",
        3: "h",
        6: "v",
        16: "v"
      }
    },
    {
      blocked: new Set([20, 21, 22]),
      directions: {
        1: "h",
        3: "h",
        6: "v",
        16: "v"
      }
    }
  ];
}

function renderTrial21Round(){
  renderSoftBoard();
  const raw = buildTrial21Configs()[trialState.round];
  let solved = findHamiltonianPath21(raw);

  if(!solved){
    const fallback = {
      blocked: new Set(),
      directions: {}
    };
    solved = findHamiltonianPath21(fallback);

    trialState.cfg = {
      blocked: fallback.blocked,
      directions: fallback.directions,
      start: solved.start,
      end: solved.end,
      solution: solved.path
    };
  }else{
    trialState.cfg = {
      blocked: raw.blocked,
      directions: raw.directions,
      start: solved.start,
      end: solved.end,
      solution: solved.path
    };
  }

  trialState.path = [];
  trialState.visited = new Set();
  trialState.started = false;

  cells.forEach((cell, i) => {
    resetCell(cell);

    if(trialState.cfg.blocked.has(i)){
      cell.classList.add("blocked");
      return;
    }

    cell.style.background = "rgba(183,171,156,0.18)";

    if(trialState.cfg.directions[i] === "h"){
      cell.classList.add("direction-h");
    }
    if(trialState.cfg.directions[i] === "v"){
      cell.classList.add("direction-v");
    }
  });

  const start = trialState.cfg.start;
const end = trialState.cfg.end;

cells[start].classList.remove("direction-h", "direction-v");
cells[end].classList.remove("direction-h", "direction-v");

cells[start].classList.add("path-start");
markCellText(start, `<span class="center-label">S</span>`);

cells[end].classList.add("path-end");
markCellText(end, `<span class="center-label">E</span>`);

  let note = `Round ${trialState.round + 1}/4 · Cover every available tile and finish on E.`;
  if(trialState.round === 1){
    note += ` This round includes blocked tiles.`;
  }
  if(trialState.round === 2){
    note += ` This round includes direction tiles.`;
  }
  if(trialState.round === 3){
    note += ` This round includes blocked tiles and direction tiles.`;
  }
  setPlayRule(note);
}

function startTrial21(){
  resetTrialStateBase();
  trialState.round = 0;
  renderTrial21Round();
}

function handleTrial21(i){
  const cfg = trialState.cfg;
  if(cfg.blocked.has(i)) return;

  if(!trialState.started){
    if(i !== cfg.start) return;
    trialState.started = true;
    trialState.path = [i];
    trialState.visited.add(i);
    cells[i].classList.add("path-hit");
    return;
  }

  const last = trialState.path[trialState.path.length - 1];
  if(!isAdjacent4(last, i)) return;
  if(trialState.visited.has(i)) return;

  const neighbors = getNeighborsFor21(last, cfg);
  if(!neighbors.includes(i)) return;

  trialState.path.push(i);
  trialState.visited.add(i);
  cells[i].classList.add("path-hit");

  const totalWalkable = 25 - cfg.blocked.size;
  if(trialState.path.length === totalWalkable && i === cfg.end){
    trialState.round += 1;
    if(trialState.round >= 4){
      mode = "won";
      completeTrial(21);
      return;
    }
    setTimeout(() => renderTrial21Round(), 420);
  }
}

/* ---------- Trial 22 ---------- */

function buildTrial22Rounds(){
  const lengths = [3, 4, 5, 6, 7];
  return lengths.map(len => shuffle([...Array(25).keys()]).slice(0, len));
}

async function playTrial22Sequence(){
  trialState.phase = "demo";
  trialState.input = [];
  hideControlButtons();
  renderSoftBoard();

  const seq = trialState.rounds[trialState.round];
  for(const idx of seq){
    cells[idx].style.background = "rgba(167,182,200,0.92)";
    await wait(420);
    cells[idx].style.background = "rgba(183,171,156,0.18)";
    await wait(180);
  }

  if(selectedTrial !== 22 || !trialState) return;
  trialState.phase = "ready";
  setControlButtons({ start: true, again: true });
  setPlayRule(`Round ${trialState.round + 1}/5 · Press Start to repeat the sequence.`);
}

function startTrial22(){
  resetTrialStateBase();
  trialState.round = 0;
  trialState.rounds = buildTrial22Rounds();
  trialState.phase = "demo";
  playTrial22Sequence();
}

function trial22EnterInputMode(){
  trialState.phase = "input";
  trialState.input = [];
  renderSoftBoard();
  setControlButtons({ start: true, again: true });
  setPlayRule(`Round ${trialState.round + 1}/5 · Repeat the sequence now.`);
}

function handleTrial22(i){
  if(trialState.phase !== "input") return;

  trialState.input.push(i);
  cells[i].style.background = "rgba(167,182,200,0.92)";

  const seq = trialState.rounds[trialState.round];
  const pos = trialState.input.length - 1;

  if(seq[pos] !== i){
    trial22EnterInputMode();
    return;
  }

  if(trialState.input.length === seq.length){
    trialState.round += 1;
    if(trialState.round >= 5){
      mode = "won";
      completeTrial(22);
      return;
    }
    setTimeout(() => playTrial22Sequence(), 340);
  }
}

/* ---------- Trial 23 ---------- */

const shapeSymbols = ["●", "▲", "■", "◆", "⬢"];

function buildTrial23Board(uniqueSymbol){
  const filler = [];
  for(let i = 0; i < 24; i++){
    filler.push(shapeSymbols[(i % 4) + 1]);
  }
  filler.push(uniqueSymbol);
  return shuffle(filler);
}

function renderTrial23Front(board){
  renderSoftBoard();
  board.forEach((sym, i) => {
    markCellText(i, `<span class="shape-symbol">${sym}</span>`);
    cells[i].style.background = "rgba(183,171,156,0.18)";
  });
}

function renderTrial23Back(){
  cells.forEach(cell => {
    cell.innerHTML = "";
    cell.style.background = "rgba(183,171,156,0.35)";
  });
}

async function trial23RunDemo(){
  trialState.phase = "demo";
  hideControlButtons();

  const round = trialState.round;
  const unique = "●";
  let board = buildTrial23Board(unique);
  let uniqueIndex = board.indexOf(unique);

  renderTrial23Front(board);

  cells[uniqueIndex].classList.add("flash-highlight");
  await wait(2000);
  cells[uniqueIndex].classList.remove("flash-highlight");

  const swaps = [];
  const firstTarget = shuffle([...Array(25).keys()].filter(i => i !== uniqueIndex))[0];
  swaps.push([uniqueIndex, firstTarget]);

  if(round === 2){
    const remaining = [...Array(25).keys()].filter(i => i !== uniqueIndex && i !== firstTarget);
    const a = remaining[0];
    const b = remaining[1];
    const c = remaining[2];
    const d = remaining[3];
    swaps.push([a, b], [c, d]);
  }

  const [a, b] = swaps[0];
  cells[a].classList.add("swap-emphasis");
  cells[b].classList.add("swap-emphasis");
  await wait(2000);
  cells[a].classList.remove("swap-emphasis");
  cells[b].classList.remove("swap-emphasis");

  swaps.forEach(([sa, sb]) => {
    [board[sa], board[sb]] = [board[sb], board[sa]];
  });

  trialState.answerIndex = board.indexOf(unique);
  trialState.phase = "ready";
  renderTrial23Back();
  setControlButtons({ start: true, again: true });

  if(round === 0){
    setPlayRule(`Round 1/3 · Track the unique shape after one swap.`);
  }else if(round === 1){
    setPlayRule(`Round 2/3 · Remember the flashing target before the swap.`);
  }else{
    setPlayRule(`Round 3/3 · Ignore the distracting swaps and track the target.`);
  }
}

function startTrial23(){
  resetTrialStateBase();
  trialState.round = 0;
  trialState.phase = "demo";
  trial23RunDemo();
}

function trial23EnterAnswerMode(){
  trialState.phase = "answer";
  renderTrial23Back();
  setControlButtons({ again: true, start: true });
  setPlayRule(`Round ${trialState.round + 1}/3 · Click the target's new position.`);
}

function handleTrial23(i){
  if(trialState.phase !== "answer") return;
  if(i !== trialState.answerIndex) return;

  cells[i].style.background = "rgba(153,183,160,0.85)";
  markCellText(i, `<span class="shape-symbol">●</span>`);

  trialState.round += 1;
  if(trialState.round >= 3){
    mode = "won";
    completeTrial(23);
    return;
  }

  setTimeout(() => {
    trial23RunDemo();
  }, 380);
}

/* ---------- Trial 24 ---------- */

const trial24Boards = [
  {
    initialOn: [6, 7, 11, 13, 17],
    limit: null
  },
  {
    initialOn: [0, 4, 12, 20, 24, 6, 18],
    limit: 8
  }
];

function toggle24(idx){
  const arr = [idx];
  const { r, c } = idxToRC(idx);
  [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => {
    const nr = r + dr;
    const nc = c + dc;
    if(inBounds(nr, nc)){
      arr.push(rcToIdx(nr, nc));
    }
  });

  arr.forEach(i => {
    if(trialState.on.has(i)){
      trialState.on.delete(i);
    }else{
      trialState.on.add(i);
    }
  });
}

function renderTrial24Round(){
  renderSoftBoard();
  trialState.on = new Set(trial24Boards[trialState.round].initialOn);
  trialState.moves = 0;
  trialState.limit = trial24Boards[trialState.round].limit;
  drawTrial24Board();
}

function drawTrial24Board(){
  cells.forEach((cell, i) => {
    cell.style.background = trialState.on.has(i)
      ? "rgba(167,182,200,0.92)"
      : "rgba(183,171,156,0.18)";
  });

  setControlButtons({ reset: true });

  if(trialState.limit == null){
    setPlayRule(`Round ${trialState.round + 1}/2 · Turn on every tile.`);
  }else{
    setPlayRule(`Round ${trialState.round + 1}/2 · Turn on every tile within ${trialState.limit - trialState.moves} moves.`);
  }
}

function startTrial24(){
  resetTrialStateBase();
  trialState.round = 0;
  renderTrial24Round();
  setControlButtons({ reset: true });
}

function handleTrial24(i){
  toggle24(i);
  trialState.moves += 1;
  drawTrial24Board();

  if(trialState.limit != null && trialState.moves > trialState.limit){
    renderTrial24Round();
    return;
  }

  if(trialState.on.size === 25){
    trialState.round += 1;
    if(trialState.round >= 2){
      mode = "won";
      completeTrial(24);
      return;
    }
    setTimeout(() => renderTrial24Round(), 340);
  }
}

/* ---------- Trial 25 ---------- */

const trial25Data = {
  row1: [
    { id: "r1a", size: 18, wave: 1, tone: 1 },
    { id: "r1b", size: 26, wave: 4, tone: 4 },
    { id: "r1c", size: 22, wave: 2, tone: 5 },
    { id: "r1d", size: 30, wave: 5, tone: 2 },
    { id: "r1e", size: 34, wave: 3, tone: 3 }
  ],
  row2: [
    { id: "r2a", sides: 3, notch: 5, tone: 2 },
    { id: "r2b", sides: 4, notch: 1, tone: 5 },
    { id: "r2c", sides: 5, notch: 4, tone: 1 },
    { id: "r2d", sides: 6, notch: 2, tone: 4 },
    { id: "r2e", sides: 7, notch: 3, tone: 3 }
  ]
};

function renderTrial25Card(cell, item, rowIndex){
  resetCell(cell);
  cell.classList.add("sort-card");

  if(rowIndex === 0){
    const toneColors = ["#d7b9ad", "#ceb89d", "#b2b99b", "#a4b4c0", "#c6b4ca"];
    cell.style.background = toneColors[item.tone - 1];
    cell.innerHTML = `
      <div class="sort-wrap">
        <div class="circleDot" style="width:${item.size}px;height:${item.size}px;"></div>
        <div class="waveBar" style="height:${8 + item.wave * 4}px;background:rgba(255,255,255,0.45);"></div>
      </div>
    `;
  }else{
    const toneColors = ["#c6b4ca", "#d7b9ad", "#b2b99b", "#a4b4c0", "#ceb89d"];
    cell.style.background = toneColors[item.tone - 1];
    cell.innerHTML = `
      <div class="sort-wrap">
        <div class="center-label">${item.sides}</div>
        <div class="waveBar" style="height:14px;background:rgba(255,255,255,0.45);width:${48 + item.notch * 6}px;"></div>
      </div>
    `;
  }
}

function getTrial25Criteria(){
  return {
    row1: [
      ["r1a","r1c","r1b","r1d","r1e"],
      ["r1a","r1c","r1e","r1b","r1d"],
      ["r1a","r1d","r1e","r1b","r1c"]
    ],
    row2: [
      ["r2a","r2b","r2c","r2d","r2e"],
      ["r2b","r2d","r2e","r2c","r2a"],
      ["r2c","r2a","r2e","r2d","r2b"]
    ]
  };
}

function startTrial25(){
  resetTrialStateBase();
  grid.classList.add("is-rect-mode");

  trialState.phase = 1;
  trialState.rows = [
    shuffle(trial25Data.row1.slice()),
    shuffle(trial25Data.row2.slice())
  ];
  trialState.criteria = getTrial25Criteria();
  trialState.rowSolved = {
    row1: [],
    row2: []
  };
  trialState.selectedSwap = null;

  renderTrial25Board();
}

function renderTrial25Board(){
  grid.classList.add("is-rect-mode");

  cells.forEach((cell, idx) => {
    if(idx < 10){
      resetCell(cell);
      const row = idx < 5 ? 0 : 1;
      const col = idx % 5;
      renderTrial25Card(cell, trialState.rows[row][col], row);
    }else{
      cell.className = "cell empty";
      cell.innerHTML = "";
      cell.style.background = "transparent";
    }
  });

  const row1DoneCount = trialState.rowSolved.row1.length;
  const row2DoneCount = trialState.rowSolved.row2.length;

  const row1BadgeCell = cells[4];
  const row2BadgeCell = cells[9];

  if(row1DoneCount >= trialState.phase){
    row1BadgeCell.innerHTML += `<span class="mini-badge">✓</span>`;
  }
  if(row2DoneCount >= trialState.phase){
    row2BadgeCell.innerHTML += `<span class="mini-badge">✓</span>`;
  }

  if(trialState.phase === 1){
    setPlayRule(`Phase 1 · Find 1 valid sorting method for each row.`);
  }else{
    setPlayRule(`Phase 2 · Find 1 different valid sorting method for each row.`);
  }
}

function trial25GetRowName(rowIndex){
  return rowIndex === 0 ? "row1" : "row2";
}

function trial25CheckRow(rowIndex){
  const rowName = trial25GetRowName(rowIndex);
  const current = trialState.rows[rowIndex].map(item => item.id);
  const options = trialState.criteria[rowName];

  for(let idx = 0; idx < options.length; idx++){
    if(trialState.rowSolved[rowName].includes(idx)) continue;
    const criterion = options[idx];
    const ok = criterion.every((id, i) => current[i] === id);
    if(ok){
      trialState.rowSolved[rowName].push(idx);
      return true;
    }
  }

  return false;
}

function trial25ShuffleRow(rowIndex){
  trialState.rows[rowIndex] = shuffle(trialState.rows[rowIndex].slice());
}

function trial25AdvancePhaseIfNeeded(){
  const row1Done = trialState.rowSolved.row1.length >= trialState.phase;
  const row2Done = trialState.rowSolved.row2.length >= trialState.phase;

  if(trialState.phase === 1 && row1Done && row2Done){
    trialState.phase = 2;
    trial25ShuffleRow(0);
    trial25ShuffleRow(1);
    renderTrial25Board();
    return;
  }

  if(trialState.phase === 2 && row1Done && row2Done){
    mode = "won";
    completeTrial(25);
  }
}

function handleTrial25(i){
  if(i >= 10) return;

  const row = i < 5 ? 0 : 1;
  const col = i % 5;

  if(trialState.selectedSwap == null){
    trialState.selectedSwap = { row, col, i };
    cells[i].classList.add("selected-swap");
    return;
  }

  const first = trialState.selectedSwap;
  cells[first.i].classList.remove("selected-swap");

  if(first.row !== row){
    trialState.selectedSwap = null;
    return;
  }

  if(first.col === col){
    trialState.selectedSwap = null;
    return;
  }

  const arr = trialState.rows[row];
  [arr[first.col], arr[col]] = [arr[col], arr[first.col]];
  trialState.selectedSwap = null;

  renderTrial25Board();

  const solvedNow = trial25CheckRow(row);
  if(solvedNow){
    renderTrial25Board();
  }

  trial25AdvancePhaseIfNeeded();
}

/* ---------- start dispatch ---------- */

function startTrialGame(trialNum){
  clearUiTimers();
  selectedTrial = trialNum;

  switch(trialNum){
    case 1: startTrial1(); break;
    case 2: startTrial2(); break;
    case 3: startTrial3(); break;
    case 4: startTrial4(); break;
    case 5: startTrial5(); break;
    case 6: startTrial6(); break;
    case 7: startTrial7(); break;
    case 8: startTrial8(); break;
    case 9: startTrial9(); break;
    case 10: startTrial10(); break;
    case 11: startTrial11(); break;
    case 12: startTrial12(); break;
    case 13: startTrial13(); break;
    case 14: startTrial14(); break;
    case 15: startTrial15(); break;
    case 16: startTrial16(); break;
    case 17: startTrial17(); break;
    case 18: startTrial18(); break;
    case 19: startTrial19(); break;
    case 20: startTrial20(); break;
    case 21: startTrial21(); break;
    case 22: startTrial22(); break;
    case 23: startTrial23(); break;
    case 24: startTrial24(); break;
    case 25: startTrial25(); break;
    default:
      resetTrialStateBase();
      break;
  }

  syncCenter25Visibility();
  syncDifficultySkipVisibility();
}

/* ---------- events ---------- */

function routeCellInteraction(i){
  if(uiMode !== "playing" || mode !== "playing") return;

  switch(selectedTrial){
    case 1: handleTrial1(i); break;
    case 2: handleTrial2(i); break;
    case 3: handleTrial3(i); break;
    case 4: handleTrial4(i); break;
    case 5: handleTrial5(i); break;
    case 6: handleTrial6(i); break;
    case 7: handleTrial7(i); break;
    case 8: handleTrial8(i); break;
    case 9: handleTrial9(i); break;
    case 10: handleTrial10(i); break;
    case 11: handleTrial11(i); break;
    case 12: handleTrial12(i); break;
    case 13: handleTrial13(i); break;
    case 14: handleTrial14(i); break;
    case 15: handleTrial15(i); break;
    case 16: handleTrial16(i); break;
    case 17: handleTrial17(i); break;
    case 18: handleTrial18(i); break;
    case 19: handleTrial19(i); break;
    case 20: handleTrial20(i); break;
    case 21: handleTrial21(i); break;
    case 22: handleTrial22(i); break;
    case 23: handleTrial23(i); break;
    case 24: handleTrial24(i); break;
    case 25: handleTrial25(i); break;
    default: break;
  }
}

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
  hideControlButtons();
  showIdleState();
});

resetAllBtn.addEventListener("click", () => {
  clearUiTimers();

  completedTrials.clear();
  selectedTrial = null;
  trialState = null;
  mode = "idle";

  hideControlButtons();

  if(difficultySkipPanel){
    difficultySkipPanel.classList.remove("hidden");
  }

  const overlay = ensureFinalOverlay();
  overlay.classList.add("hidden");
  overlay.querySelectorAll(".confetti").forEach(el => el.remove());

  updateUnlockedButtons();
  showIdleState();
});

if(difficultySkipBtn){
  difficultySkipBtn.addEventListener("click", () => {
    if(uiMode !== "idle") return;
    skipToNextDifficulty();
  });
}

skipTrialBtn.addEventListener("click", () => {
  if(selectedTrial == null) return;
  if(mode !== "playing") return;

  clearUiTimers();
  hideControlButtons();
  mode = "won";
  completeTrial(selectedTrial);
});

auxAgainBtn.addEventListener("click", () => {
  if(mode !== "playing") return;

  switch(selectedTrial){
    case 6:
      trial6Demo();
      break;
    case 12:
      trialState.selected = new Set();
      trial12Demo();
      break;
    case 14:
      trial14Demo();
      break;
    case 22:
      playTrial22Sequence();
      break;
    case 23:
      trial23RunDemo();
      break;
    default:
      break;
  }
});

auxStartBtn.addEventListener("click", () => {
  if(mode !== "playing") return;

  switch(selectedTrial){
    case 22:
      trial22EnterInputMode();
      break;
    case 23:
      trial23EnterAnswerMode();
      break;
    default:
      break;
  }
});

auxSubmitBtn.addEventListener("click", () => {
  if(mode !== "playing") return;
  if(selectedTrial === 12){
    submitTrial12();
  }
});

auxResetTrialBtn.addEventListener("click", () => {
  if(mode !== "playing") return;
  if(selectedTrial === 24){
    trialState.on = new Set(trial24Boards[trialState.round].initialOn);
    trialState.moves = 0;
    trialState.limit = trial24Boards[trialState.round].limit;
    drawTrial24Board();
  }
});

cells.forEach((cell) => {
  const idx = Number(cell.dataset.i) - 1;

  cell.addEventListener("click", () => {
    routeCellInteraction(idx);
  });

  cell.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      routeCellInteraction(idx);
    }
  });
});

/* ---------- init ---------- */

ensureFinalOverlay();

const finalBackHomeBtn = document.getElementById("finalBackHomeBtn");
if(finalBackHomeBtn){
  finalBackHomeBtn.addEventListener("click", () => {
    clearUiTimers();

    completedTrials.clear();
    selectedTrial = null;
    trialState = null;
    mode = "idle";

    hideControlButtons();

    const overlay = ensureFinalOverlay();
    overlay.classList.add("hidden");
    overlay.querySelectorAll(".confetti").forEach(el => el.remove());

    if(difficultySkipPanel){
      difficultySkipPanel.classList.remove("hidden");
    }

    updateUnlockedButtons();
    showIdleState();
  });
}

updateUnlockedButtons();
showIdleState();
syncDifficultySkipVisibility();