const state = {
  score: 0,
  level: 1,
  streak: 0,
  areaDm2: 100,
  volumeDm3: 125,
  volumeMode: "cube",
  calcMode: "area",
  trainingMode: "mixed",
  currentTask: null,
  examActive: false,
  examCount: 0,
  examRight: 0,
  achievements: {}
};

const areaUnits = {
  cm2: { name: "cm²", factor: 0.0001 },
  dm2: { name: "dm²", factor: 0.01 },
  m2: { name: "m²", factor: 1 },
  a: { name: "a", factor: 100 },
  ha: { name: "ha", factor: 10000 },
  km2: { name: "km²", factor: 1000000 }
};

const volumeUnits = {
  cm3: { name: "cm³", factor: 0.001 },
  dm3: { name: "dm³", factor: 1 },
  l: { name: "Liter", factor: 1 },
  m3: { name: "m³", factor: 1000 }
};

const achievements = [
  { id: "first", title: "🌱 Erster Schritt", text: "Eine Aufgabe richtig gelöst.", test: () => state.score >= 10 },
  { id: "area100", title: "🟦 Flächenbauer", text: "Genau 1 m² gebaut.", test: () => state.areaDm2 === 100 },
  { id: "liter100", title: "💧 Liter Profi", text: "Mindestens 100 Liter gebaut.", test: () => state.volumeDm3 >= 100 },
  { id: "cube1000", title: "🧊 Kubikmeter Meister", text: "1 m³ gebaut oder überschritten.", test: () => state.volumeDm3 >= 1000 },
  { id: "streak5", title: "🔥 Serienmeister", text: "5 richtige Antworten in Folge.", test: () => state.streak >= 5 },
  { id: "score250", title: "🏆 Lernchampion", text: "250 Punkte erreicht.", test: () => state.score >= 250 }
];

function el(id) {
  return document.getElementById(id);
}

function nice(value) {
  const rounded = Math.round(value * 100000000) / 100000000;
  return String(rounded).replace(".", ",");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function saveState() {
  localStorage.setItem("flaechenmeisterV2", JSON.stringify({
    score: state.score,
    level: state.level,
    streak: state.streak,
    achievements: state.achievements
  }));
}

function loadState() {
  const raw = localStorage.getItem("flaechenmeisterV2");

  if (!raw) {
    return;
  }

  try {
    const data = JSON.parse(raw);
    state.score = Number(data.score || 0);
    state.level = Number(data.level || 1);
    state.streak = Number(data.streak || 0);
    state.achievements = data.achievements || {};
  } catch (error) {
    console.warn("Speicherstand konnte nicht geladen werden.", error);
  }
}

function resetProgress() {
  state.score = 0;
  state.level = 1;
  state.streak = 0;
  state.achievements = {};
  saveState();
  updateHud();
  renderAchievements();
}

function updateHud() {
  el("score").textContent = state.score;
  el("level").textContent = state.level;
  el("streak").textContent = state.streak;
  el("progress").style.width = Math.min(100, state.score % 100) + "%";
  updateAchievements();
}

function updateAchievements() {
  let newBadge = "";

  achievements.forEach(item => {
    if (!state.achievements[item.id] && item.test()) {
      state.achievements[item.id] = true;
      newBadge = item.title;
    }
  });

  if (newBadge) {
    el("badgeLine").textContent = "Neues Abzeichen freigeschaltet: " + newBadge;
    saveState();
  }

  renderAchievements();
}

function renderAchievements() {
  const box = el("achievements");
  box.innerHTML = "";

  achievements.forEach(item => {
    const div = document.createElement("div");
    div.className = state.achievements[item.id] ? "achievement done" : "achievement";
    div.innerHTML = "<strong>" + item.title + "</strong><span>" + item.text + "</span>";
    box.appendChild(div);
  });
}

function addScore(points) {
  state.score += points;
  saveState();
  updateHud();
}

function buildAreaGrid() {
  const grid = el("areaGrid3d");
  grid.innerHTML = "";

  for (let page = 0; page < 5; page++) {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const index = page * 100 + y * 10 + x;
        const tile = document.createElement("div");
        tile.className = "areaTile";
        tile.style.left = (x * 30 + page * 8) + "px";
        tile.style.top = (y * 30 - page * 8) + "px";
        tile.dataset.index = index;
        tile.innerHTML = "<div class='faceTop'></div><div class='faceRight'></div><div class='faceFront'></div>";
        grid.appendChild(tile);
      }
    }
  }
}

function renderArea() {
  const amount = clamp(state.areaDm2, 0, 500);
  state.areaDm2 = amount;

  document.querySelectorAll(".areaTile").forEach(tile => {
    const index = Number(tile.dataset.index);
    tile.className = index < amount ? "areaTile filled" : "areaTile";
  });

  el("areaDm2").textContent = amount;
  el("areaM2").textContent = "= " + nice(amount / 100) + " m²";
  el("areaExplain").textContent = amount + " dm² sind " + nice(amount / 100) + " m². Eine volle Platte mit 100 dm² ist 1 m².";
  updateHud();
}

function setAreaView(mode) {
  const grid = el("areaGrid3d");

  if (mode === "flat") {
    grid.style.transform = "rotateX(0deg) rotateZ(0deg)";
  }

  if (mode === "3d") {
    grid.style.transform = "rotateX(58deg) rotateZ(-35deg)";
  }

  if (mode === "turn") {
    grid.style.transform = "rotateX(64deg) rotateZ(34deg)";
  }
}

function changeArea(delta) {
  state.areaDm2 = clamp(state.areaDm2 + delta, 0, 500);
  renderArea();
}

function buildVolumeGrid() {
  const grid = el("volumeGrid3d");
  grid.innerHTML = "";
}

function renderVolume() {
  const amount = clamp(state.volumeDm3, 0, 1000);
  state.volumeDm3 = amount;

  el("volumeDm3").textContent = amount;
  el("volumeM3").textContent = "= " + nice(amount / 1000) + " m³ = " + nice(amount) + " Liter";

  const grid = el("volumeGrid3d");
  grid.innerHTML = "";

  const coords = getVolumeCoords(amount);

  coords.forEach((c, index) => {
    const voxel = document.createElement("div");
    voxel.className = index >= amount - 10 ? "voxel gold" : "voxel";
    const xIso = (c.x - c.y) * 18 + 150;
    const yIso = (c.x + c.y) * 10 - c.z * 24 + 145;
    voxel.style.left = xIso + "px";
    voxel.style.top = yIso + "px";
    voxel.style.zIndex = c.x + c.y + c.z * 3;
    voxel.innerHTML = "<div class='vTop'></div><div class='vRight'></div><div class='vFront'></div>";
    grid.appendChild(voxel);
  });

  el("volumeExplain").textContent = amount + " dm³ sind " + nice(amount) + " Liter und " + nice(amount / 1000) + " m³.";
  updateHud();
}

function getVolumeCoords(amount) {
  const coords = [];

  if (state.volumeMode === "tower") {
    for (let i = 0; i < amount; i++) {
      coords.push({ x: i % 5, y: Math.floor(i / 5) % 5, z: Math.floor(i / 25) });
    }
    return coords;
  }

  if (state.volumeMode === "layer") {
    for (let i = 0; i < amount; i++) {
      coords.push({ x: i % 10, y: Math.floor(i / 10) % 10, z: Math.floor(i / 100) });
    }
    return coords;
  }

  const side = Math.ceil(Math.cbrt(Math.max(amount, 1)));

  for (let z = 0; z < side; z++) {
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        if (coords.length < amount) {
          coords.push({ x, y, z });
        }
      }
    }
  }

  return coords;
}

function changeVolume(delta) {
  state.volumeDm3 = clamp(state.volumeDm3 + delta, 0, 1000);
  renderVolume();
}

function setVolumeMode(mode) {
  state.volumeMode = mode;
  renderVolume();
}

function setupCalculator(mode) {
  state.calcMode = mode;

  document.querySelectorAll(".tab[data-action='setCalcMode']").forEach(button => {
    button.classList.toggle("active", button.dataset.value === mode);
  });

  const units = mode === "area" ? areaUnits : volumeUnits;
  const from = el("calcFrom");
  const to = el("calcTo");

  from.innerHTML = "";
  to.innerHTML = "";

  Object.keys(units).forEach(key => {
    const optionFrom = document.createElement("option");
    optionFrom.value = key;
    optionFrom.textContent = units[key].name;
    from.appendChild(optionFrom);

    const optionTo = document.createElement("option");
    optionTo.value = key;
    optionTo.textContent = units[key].name;
    to.appendChild(optionTo);
  });

  if (mode === "area") {
    from.value = "m2";
    to.value = "dm2";
  } else {
    from.value = "m3";
    to.value = "dm3";
  }

  calculate();
}

function calculate() {
  const units = state.calcMode === "area" ? areaUnits : volumeUnits;
  const value = Number(el("calcValue").value);
  const from = el("calcFrom").value;
  const to = el("calcTo").value;
  const result = (value * units[from].factor) / units[to].factor;

  el("calcResult").textContent = value + " " + units[from].name + " = " + nice(result) + " " + units[to].name;

  if (state.calcMode === "area") {
    el("calcExplanation").textContent = "Bei Flächen zählt jede Stufe doppelt. m² zu dm² bedeutet mal 100.";
  } else {
    el("calcExplanation").textContent = "Bei Volumen zählt jede Stufe dreifach. m³ zu dm³ bedeutet mal 1000. 1 dm³ ist 1 Liter.";
  }
}

function setTrainingMode(mode) {
  state.trainingMode = mode;

  document.querySelectorAll(".tab[data-action='setTrainingMode']").forEach(button => {
    button.classList.toggle("active", button.dataset.value === mode);
  });

  newTask();
}

function setLevel(level) {
  state.level = Number(level);
  saveState();
  updateHud();
  newTask();
}

function createTask() {
  const mode = state.trainingMode === "mixed"
    ? ["area", "volume", "visual"][rand(0, 2)]
    : state.trainingMode;

  if (mode === "visual") {
    return createVisualTask();
  }

  if (mode === "volume") {
    return createVolumeTask();
  }

  return createAreaTask();
}

function createAreaTask() {
  const tasksByLevel = {
    1: [["m2", "dm2"], ["dm2", "m2"]],
    2: [["dm2", "cm2"], ["cm2", "dm2"], ["a", "m2"], ["m2", "a"]],
    3: [["ha", "m2"], ["m2", "ha"], ["km2", "m2"]],
    4: [["ha", "a"], ["a", "ha"], ["km2", "ha"]],
    5: [["cm2", "m2"], ["dm2", "ha"], ["a", "cm2"], ["km2", "dm2"]]
  };

  const pair = tasksByLevel[state.level][rand(0, tasksByLevel[state.level].length - 1)];
  const value = state.level <= 2 ? rand(1, 30) : rand(1, 10);
  const answer = (value * areaUnits[pair[0]].factor) / areaUnits[pair[1]].factor;

  return {
    text: "Fläche: " + value + " " + areaUnits[pair[0]].name + " = ? " + areaUnits[pair[1]].name,
    answer,
    unit: areaUnits[pair[1]].name,
    hint: "Flächen haben zwei Richtungen. Pro Stufe rechnest du mal 100 oder geteilt durch 100."
  };
}

function createVolumeTask() {
  const tasksByLevel = {
    1: [["m3", "dm3"], ["dm3", "l"], ["l", "dm3"]],
    2: [["dm3", "m3"], ["m3", "l"], ["l", "m3"]],
    3: [["cm3", "dm3"], ["dm3", "cm3"], ["cm3", "l"]],
    4: [["m3", "cm3"], ["cm3", "m3"]],
    5: [["m3", "l"], ["l", "cm3"], ["cm3", "m3"]]
  };

  const pair = tasksByLevel[state.level][rand(0, tasksByLevel[state.level].length - 1)];
  const value = state.level <= 2 ? rand(1, 20) : rand(1, 10);
  const answer = (value * volumeUnits[pair[0]].factor) / volumeUnits[pair[1]].factor;

  return {
    text: "Volumen: " + value + " " + volumeUnits[pair[0]].name + " = ? " + volumeUnits[pair[1]].name,
    answer,
    unit: volumeUnits[pair[1]].name,
    hint: "Volumen hat drei Richtungen. m³ zu dm³ ist mal 1000. 1 dm³ = 1 Liter."
  };
}

function createVisualTask() {
  const visualType = rand(0, 1) === 0 ? "area" : "volume";

  if (visualType === "area") {
    const amount = [10, 25, 50, 75, 100, 150, 200][rand(0, 6)];
    state.areaDm2 = amount;
    renderArea();

    return {
      text: "3D Fläche: Wie viele m² sind " + amount + " dm²?",
      answer: amount / 100,
      unit: "m²",
      hint: "100 dm² sind 1 m². Teile die dm² durch 100."
    };
  }

  const amount = [1, 10, 100, 125, 250, 500, 1000][rand(0, 6)];
  state.volumeDm3 = amount;
  renderVolume();

  return {
    text: "3D Volumen: Wie viele Liter sind " + amount + " dm³?",
    answer: amount,
    unit: "Liter",
    hint: "1 dm³ ist genau 1 Liter."
  };
}

function newTask() {
  state.currentTask = createTask();
  el("taskText").textContent = state.currentTask.text;
  el("answer").value = "";
  el("taskFeedback").textContent = "";
  el("taskHint").textContent = "";
}

function checkTask() {
  if (!state.currentTask) {
    newTask();
  }

  const user = Number(String(el("answer").value).replace(",", "."));
  const correct = Math.abs(user - state.currentTask.answer) < 0.000001;

  if (correct) {
    state.streak += 1;
    const bonus = state.streak >= 3 ? 5 : 0;
    addScore(10 + bonus);
    el("taskFeedback").innerHTML = "<span class='goodText'>Richtig! +" + (10 + bonus) + " Punkte</span>";

    if (state.examActive) {
      state.examRight += 1;
      state.examCount += 1;
    }

    afterTask();
  } else {
    state.streak = 0;
    updateHud();
    el("taskFeedback").innerHTML = "<span class='badText'>Noch nicht. Richtig ist " + nice(state.currentTask.answer) + " " + state.currentTask.unit + ".</span>";

    if (state.examActive) {
      state.examCount += 1;
    }

    afterTask();
  }

  saveState();
}

function afterTask() {
  if (state.examActive) {
    el("examInfo").textContent = "Prüfung: " + state.examCount + "/10 richtig: " + state.examRight;

    if (state.examCount >= 10) {
      state.examActive = false;
      const msg = state.examRight >= 9 ? "Sehr stark!" : state.examRight >= 7 ? "Gut gemacht!" : state.examRight >= 5 ? "Schon ordentlich. Weiter üben!" : "Noch einmal Erklärung und 3D Ansicht anschauen.";
      el("examInfo").textContent = "Fertig: " + state.examRight + " von 10 richtig. " + msg;
      return;
    }
  }

  window.setTimeout(newTask, 800);
}

function showHint() {
  if (!state.currentTask) {
    return;
  }

  el("taskHint").textContent = state.currentTask.hint;
}

function startExam() {
  state.examActive = true;
  state.examCount = 0;
  state.examRight = 0;
  state.trainingMode = "mixed";
  el("examInfo").textContent = "Prüfung gestartet: 0/10";
  newTask();
}

function route(action, value) {
  if (action === "resetProgress") resetProgress();

  if (action === "areaMinusDm2") changeArea(-1);
  if (action === "areaPlusDm2") changeArea(1);
  if (action === "areaMinusM2") changeArea(-100);
  if (action === "areaPlusM2") changeArea(100);
  if (action === "areaSet25") { state.areaDm2 = 25; renderArea(); }
  if (action === "areaSet50") { state.areaDm2 = 50; renderArea(); }
  if (action === "areaSet100") { state.areaDm2 = 100; renderArea(); }
  if (action === "areaSet500") { state.areaDm2 = 500; renderArea(); }
  if (action === "areaFlat") setAreaView("flat");
  if (action === "area3d") setAreaView("3d");
  if (action === "areaTurn") setAreaView("turn");

  if (action === "volumeMinusDm3") changeVolume(-1);
  if (action === "volumePlusDm3") changeVolume(1);
  if (action === "volumeMinusM3") changeVolume(-1000);
  if (action === "volumePlusM3") changeVolume(1000);
  if (action === "volumeSet1") { state.volumeDm3 = 1; renderVolume(); }
  if (action === "volumeSet10") { state.volumeDm3 = 10; renderVolume(); }
  if (action === "volumeSet125") { state.volumeDm3 = 125; renderVolume(); }
  if (action === "volumeSet1000") { state.volumeDm3 = 1000; renderVolume(); }
  if (action === "volumeLayer") setVolumeMode("layer");
  if (action === "volumeCube") setVolumeMode("cube");
  if (action === "volumeTower") setVolumeMode("tower");

  if (action === "setCalcMode") setupCalculator(value);
  if (action === "calculate") calculate();

  if (action === "setTrainingMode") setTrainingMode(value);
  if (action === "level") setLevel(value);
  if (action === "newTask") newTask();
  if (action === "checkTask") checkTask();
  if (action === "showHint") showHint();
  if (action === "startExam") startExam();
}

document.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  route(button.dataset.action, button.dataset.value);
});

window.addEventListener("load", () => {
  loadState();
  buildAreaGrid();
  buildVolumeGrid();
  setupCalculator("area");
  renderArea();
  renderVolume();
  renderAchievements();
  newTask();
  updateHud();
});
