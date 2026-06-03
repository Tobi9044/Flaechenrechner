const factors = {
  cm2: 0.0001,
  dm2: 0.01,
  m2: 1,
  a: 100,
  ha: 10000,
  km2: 1000000
};

const names = {
  cm2: "cm²",
  dm2: "dm²",
  m2: "m²",
  a: "a",
  ha: "ha",
  km2: "km²"
};

let score = 0;
let level = 1;
let streak = 0;
let current = null;
let exam = false;
let examCount = 0;
let examRight = 0;
let visualCurrent = 0;

function el(id) {
  return document.getElementById(id);
}

function roundNice(value) {
  return Math.round(value * 100000000) / 100000000;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateHud() {
  el("score").textContent = score;
  el("level").textContent = level;
  el("streak").textContent = streak;
  el("progress").style.width = Math.min(100, score % 100) + "%";
}

function build3d() {
  const grid = el("cubeGrid3d");
  grid.innerHTML = "";

  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.style.left = x * 30 + "px";
      tile.style.top = y * 30 + "px";
      tile.innerHTML = "<div class='faceTop'></div><div class='faceRight'></div><div class='faceFront'></div>";
      grid.appendChild(tile);
    }
  }
}

function fill3d(amount) {
  document.querySelectorAll(".tile").forEach((tile, index) => {
    tile.className = index < amount ? "tile filled" : "tile";
  });

  el("cubeText").textContent = amount + " von 100 dm² sind gefüllt. Das sind " + roundNice(amount / 100) + " m².";
}

function highlight3d(amount) {
  document.querySelectorAll(".tile").forEach((tile, index) => {
    tile.className = index < amount ? "tile highlight" : "tile";
  });

  el("cubeText").textContent = "Gelb markiert: " + amount + " dm².";
}

function setView(view) {
  const grid = el("cubeGrid3d");

  if (view === "flat") {
    grid.style.transform = "rotateX(0deg) rotateZ(0deg)";
  }

  if (view === "side") {
    grid.style.transform = "rotateX(58deg) rotateZ(-35deg)";
  }

  if (view === "turn") {
    grid.style.transform = "rotateX(64deg) rotateZ(35deg)";
  }
}

function convert() {
  const value = Number(el("convValue").value);
  const from = el("fromUnit").value;
  const to = el("toUnit").value;
  const result = (value * factors[from]) / factors[to];

  el("convResult").textContent = value + " " + names[from] + " = " + roundNice(result) + " " + names[to];
}

function allowedPairs() {
  if (level === 1) {
    return [["m2", "dm2"], ["dm2", "m2"], ["dm2", "cm2"], ["cm2", "dm2"]];
  }

  if (level === 2) {
    return [["m2", "cm2"], ["cm2", "m2"], ["a", "m2"], ["m2", "a"]];
  }

  if (level === 3) {
    return [["ha", "m2"], ["m2", "ha"], ["km2", "m2"], ["m2", "km2"]];
  }

  if (level === 4) {
    return [["ha", "a"], ["a", "ha"], ["km2", "ha"], ["ha", "km2"]];
  }

  return [["cm2", "m2"], ["m2", "km2"], ["km2", "dm2"], ["dm2", "ha"], ["a", "cm2"]];
}

function setLevel(newLevel) {
  level = Number(newLevel);
  el("feedback").textContent = "Level " + level + " gewählt.";
  updateHud();
  newTask();
}

function newTask() {
  const pairs = allowedPairs();
  const pair = pairs[randomInt(0, pairs.length - 1)];
  const value = level === 1 ? randomInt(1, 20) : level === 2 ? randomInt(1, 50) : level === 3 ? randomInt(1, 20) : level === 4 ? randomInt(1, 30) : randomInt(1, 10);
  const from = pair[0];
  const to = pair[1];
  const answer = (value * factors[from]) / factors[to];

  current = { value, from, to, answer };

  el("taskText").textContent = "Rechne um: " + value + " " + names[from] + " = ? " + names[to];
  el("answer").value = "";
  el("feedback").textContent = "";
  el("hint").textContent = "";
}

function checkAnswer() {
  if (!current) {
    newTask();
  }

  const user = Number(String(el("answer").value).replace(",", "."));
  const correct = Math.abs(user - current.answer) < 0.000001;

  if (correct) {
    streak++;
    const bonus = streak >= 3 ? 5 : 0;
    score += 10 + bonus;
    el("feedback").innerHTML = "<span class='goodText'>Richtig! +" + (10 + bonus) + " Punkte</span>";

    if (exam) {
      examRight++;
      examCount++;
    }

    afterCheck();
  } else {
    streak = 0;
    el("feedback").innerHTML = "<span class='badText'>Noch nicht. Richtige Antwort: " + roundNice(current.answer) + " " + names[current.to] + "</span>";

    if (exam) {
      examCount++;
    }

    afterCheck();
  }

  updateHud();
}

function afterCheck() {
  if (exam) {
    el("examInfo").textContent = "Prüfung: " + examCount + "/10 Aufgaben, richtig: " + examRight;

    if (examCount >= 10) {
      exam = false;
      const grade = examRight >= 9 ? "Super!" : examRight >= 7 ? "Gut gemacht!" : examRight >= 5 ? "Weiter üben!" : "Noch einmal die Treppe anschauen.";
      el("examInfo").textContent = "Fertig: " + examRight + " von 10 richtig. " + grade;
      return;
    }
  }

  window.setTimeout(newTask, 700);
}

function showHint() {
  if (!current) {
    return;
  }

  const text = factors[current.from] < factors[current.to]
    ? "Du gehst zu einer größeren Einheit. Die Zahl wird kleiner."
    : "Du gehst zu einer kleineren Einheit. Die Zahl wird größer.";

  el("hint").textContent = text + " Rechenweg: " + current.value + " × " + factors[current.from] + " m² ÷ " + factors[current.to] + ".";
}

function newVisualTask() {
  const options = [5, 10, 12, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100];
  visualCurrent = options[randomInt(0, options.length - 1)];

  highlight3d(visualCurrent);

  el("visualTask").textContent = "Wie viele dm² sind gelb markiert?";
  el("visualAnswer").value = "";
  el("visualFeedback").textContent = "";
}

function checkVisual() {
  const user = Number(String(el("visualAnswer").value).replace(",", "."));

  if (user === visualCurrent) {
    score += 10;
    streak++;
    el("visualFeedback").innerHTML = "<span class='goodText'>Richtig! " + visualCurrent + " dm² = " + roundNice(visualCurrent / 100) + " m².</span>";
  } else {
    streak = 0;
    el("visualFeedback").innerHTML = "<span class='badText'>Nicht ganz. Es sind " + visualCurrent + " dm².</span>";
  }

  updateHud();
}

function startExam() {
  exam = true;
  examCount = 0;
  examRight = 0;
  streak = 0;

  el("examInfo").textContent = "Prüfung gestartet: 0/10 Aufgaben.";

  newTask();
  updateHud();
}

function route(action, value) {
  if (action === "fill") {
    fill3d(Number(value));
  }

  if (action === "view") {
    setView(value);
  }

  if (action === "convert") {
    convert();
  }

  if (action === "check") {
    checkAnswer();
  }

  if (action === "newTask") {
    newTask();
  }

  if (action === "hint") {
    showHint();
  }

  if (action === "level") {
    setLevel(value);
  }

  if (action === "checkVisual") {
    checkVisual();
  }

  if (action === "newVisual") {
    newVisualTask();
  }

  if (action === "exam") {
    startExam();
  }
}

document.addEventListener("click", function(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  route(button.dataset.action, button.dataset.value);
});

window.addEventListener("load", function() {
  build3d();
  fill3d(100);
  newTask();
  newVisualTask();
  updateHud();
});
