const trials = document.querySelectorAll(".trial");
const titleEl = document.getElementById("trialTitle");
const textEl = document.getElementById("trialText");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");
const cells = Array.from(document.querySelectorAll(".cell"));

let selectedTrial = 1;

// game state for Trial 1
let mode = "idle"; // idle | playing | won
let deck = [];     // length 25, each item: { type: "pair"|"odd", color: "#..." }
let faceDownColor = "rgba(255,255,255,0.10)";
let opened = [];   // store indices currently flipped (max 2)
let removedCount = 0;
let oddIndex = -1;

function setStatus(msg){
  statusEl.textContent = msg;
}

function setTrial(trialNum){
  selectedTrial = trialNum;

  trials.forEach(btn => {
    btn.classList.toggle("is-selected", Number(btn.dataset.trial) === trialNum);
  });

  if(trialNum === 1){
    titleEl.textContent = "Trial 1";
    textEl.textContent =
      "Find the most unique tile. Hint: tiles with the same color can be eliminated. " +
      "You only win if the unique tile is revealed last.";
    startBtn.disabled = false;
    setStatus("Ready.");
  }else{
    titleEl.textContent = `Trial ${trialNum}`;
    textEl.textContent = "Coming soon. (Draft: only Trial 1 is playable today.)";
    startBtn.disabled = true;
    setStatus("Select Trial 1 to play.");
  }
  // always unhide panel UI when switching trials
  textEl.style.display = "block";
  startBtn.style.display = "inline-block";
  resetBtn.style.display = "inline-block";
}

function randomColor(){
  const palette = [
    "#ff4d4d","#ffb84d","#fff04d","#7dff4d","#4dffb5",
    "#4ddcff","#4d7dff","#9b4dff","#ff4df2","#ff4d9b"
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

function paintDefaultGrid(){
  // initial state: 25 tiles, all different colors (no repeats)
  const palette25 = [
    "#ff4d4d","#ff7a4d","#ffb84d","#ffe14d","#fff04d",
    "#cfff4d","#7dff4d","#4dff6a","#4dffb5","#4ddcff",
    "#4db5ff","#4d7dff","#5a4dff","#7a4dff","#9b4dff",
    "#c74dff","#ff4df2","#ff4dc7","#ff4d9b","#ff4d7a",
    "#ffffff","#d9d9d9","#b3b3b3","#8c8c8c","#666666"
  ];

  // shuffle to avoid always the same layout
  const pool = palette25.slice();
  for(let i = pool.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  cells.forEach((cell, i) => {
    cell.className = "cell";
    cell.style.background = pool[i]; // unique
    cell.dataset.state = "default";
  });

  mode = "idle";
  deck = [];
  opened = [];
  removedCount = 0;
  oddIndex = -1;
}

function buildTrial1Deck(){
  // Must have at least 13 distinct colors (12 pairs + 1 odd)
  const palette = [
    "#ff4d4d","#ffb84d","#fff04d","#7dff4d","#4dffb5",
    "#4ddcff","#4d7dff","#9b4dff","#ff4df2","#ff4d9b",
    "#ffffff","#bfbfbf","#ff7ad9","#7affc7","#7a9bff"
  ];

  // shuffle a copy of palette
  const pool = palette.slice();
  for(let i = pool.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // pick 12 unique colors for pairs
  const pairColors = pool.slice(0, 12);
  // pick 1 unique color for odd (not in pairColors)
  const oddColor = pool[12];

  const items = [];
  pairColors.forEach(c => {
    items.push({ type:"pair", color:c });
    items.push({ type:"pair", color:c });
  });
  items.push({ type:"odd", color: oddColor });

  // shuffle final 25 items
  for(let i = items.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  oddIndex = items.findIndex(it => it.type === "odd");
  return items;
}

function startTrial1(){
  mode = "playing";
  deck = buildTrial1Deck();
  opened = [];
  removedCount = 0;

  // set all to face-down same color
  cells.forEach((cell) => {
    cell.className = "cell is-faceDown";
    cell.style.background = faceDownColor;
    cell.dataset.state = "down"; // down | up | removed
  });

  setStatus("Trial 1 started. Flip two tiles.");
}

function flipUp(i){
  const cell = cells[i];
  if(!cell || cell.dataset.state !== "down") return;
  cell.dataset.state = "up";
  cell.style.background = deck[i].color;
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

function markTrialDone(trialNum){
  const btn = document.querySelector(`.trial[data-trial="${trialNum}"]`);
  if(btn) btn.classList.add("is-done");
}

function checkWinCondition(lastFlippedIndex){
  // Win only if all 24 pair tiles removed AND last flip is odd tile
  const allPairsRemoved = (removedCount === 24);
  const isOdd = (deck[lastFlippedIndex]?.type === "odd");

  if(allPairsRemoved && isOdd){
    mode = "won";

    // mark Trial 1 button as completed
    markTrialDone(1);

    // hide the Trial 1 prompt text + buttons
    textEl.style.display = "none";
    startBtn.style.display = "none";
    resetBtn.style.display = "none";

    // clear status line
    setStatus("");

    // restore grid to initial colorful state
    paintDefaultGrid();
  }
}

function onCellActivate(i){
  if(selectedTrial !== 1) return;
  if(mode !== "playing") return;

  const cell = cells[i];
  if(!cell) return;
  if(cell.dataset.state !== "down") return; // prevent clicking removed/up

  // If pairs already cleared, player must flip odd last to win
  flipUp(i);
  opened.push(i);

  if(removedCount === 24){
    // Only odd remains, this flip decides win
    checkWinCondition(i);
    return;
  }

  if(opened.length < 2) return;

  // lock input briefly
  cells.forEach(c => c.classList.add("is-locked"));

  const [a, b] = opened;
  const A = deck[a], B = deck[b];

  // Only pair+pair with same color counts as a match
  const isPairMatch = (A.type === "pair" && B.type === "pair" && A.color === B.color);

  window.setTimeout(() => {
    if(isPairMatch){
      removeTile(a);
      removeTile(b);
      setStatus(`Matched. ${removedCount}/24 pair tiles eliminated.`);
    }else{
      // flip back (including odd flipped too early)
      flipDown(a);
      flipDown(b);
      setStatus("Not a match. Try again.");
    }

    opened = [];
    cells.forEach(c => c.classList.remove("is-locked"));
  }, 520);
}

/* -----------------------
   Events
------------------------ */
trials.forEach(btn => {
  btn.addEventListener("click", () => setTrial(Number(btn.dataset.trial)));
});

startBtn.addEventListener("click", () => {
  if(selectedTrial === 1) startTrial1();
});

resetBtn.addEventListener("click", () => {
  paintDefaultGrid();
  setStatus("Reset to default grid.");
});

// IMPORTANT: bind using data-i="1..25"
cells.forEach((cell) => {
  const num = Number(cell.dataset.i); // 1..25
  const idx = num - 1;               // 0..24 (internal)

  cell.addEventListener("click", () => onCellActivate(idx));
  cell.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){
      e.preventDefault();
      onCellActivate(idx);
    }
  });
});

// init
paintDefaultGrid();
setTrial(1);