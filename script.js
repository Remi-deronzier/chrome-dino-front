import { getCactusRects, setupCactus, updateCactus } from "./cactus.js";
import { getDinoRect, setDinoLose, setupDino, updateDino } from "./dino.js";
import { setupGround, updateGround } from "./ground.js";

const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 30;
const SPEED_SCALE_INCREASE = 0.00001;
// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://vodkasgard-jimy-phoenix-game.herokuapp.com";

const worldElem = document.querySelector("[data-world]");
const scoreElem = document.querySelector("[data-score]");
const startScreenElem = document.querySelector("[data-start-screen]");

(function main() {
  setPixelToWorldScale();
  window.addEventListener("resize", setPixelToWorldScale);
  document.addEventListener("keydown", (event) => handleStart(event), {
    once: true,
  });
  document.addEventListener("visibilitychange", (event) => {
    if (document.visibilityState != "visible") {
      location.reload(true);
    }
  });
})();

let lastTime;
let speedScale;
let score;
let username;
let results;
let rank;
function update(time) {
  if (lastTime == null) {
    lastTime = time;
    window.requestAnimationFrame(update);
    return;
  }
  const delta = time - lastTime;

  updateGround(delta, speedScale);
  updateDino(delta, speedScale);
  updateCactus(delta, speedScale);
  updateSpeedScale(delta);
  updateScore(delta);
  if (checkLose()) return handleLose();

  lastTime = time;
  window.requestAnimationFrame(update);
}

function checkLose() {
  const dinoRect = getDinoRect();
  return getCactusRects().some((rect) => isCollision(rect, dinoRect));
}

function displayPromptBox() {
  let currentUsername = prompt(
    "Please enter your B00 to save your score in the 10 best scores (if you click on 'Cancel', your score won't be saved):",
    "B00"
  );
  if (currentUsername == null || currentUsername == "") {
    return false;
  } else {
    username = currentUsername;
    return true;
  }
}

async function isInTop10() {
  const response = await axios.get(
    `${BASE_URL}/scores/is-in-top-10?score=${score}`
  );
  return response.data.isInTop10;
}

async function getSortedResults() {
  const data = { username, score: Math.round(score) };
  const response = await axios.post(`${BASE_URL}/scores/sort`, data);
  results = response.data.results;
  rank = response.data.rank;
}

function removeOldResults() {
  const divResults = document.getElementById("results");
  while (divResults.hasChildNodes()) {
    divResults.removeChild(divResults.firstChild);
  }
}

function displayResults() {
  results.forEach((result, index) => {
    const divResults = document.getElementById("results");
    const resultLine = document.createElement("p");
    resultLine.innerText = `${index + 1} - ${result.username}: ${result.score}`;
    divResults.appendChild(resultLine);
  });
}

function isCollision(rect1, rect2) {
  return (
    rect1.left < rect2.right &&
    rect1.top < rect2.bottom &&
    rect1.right > rect2.left &&
    rect1.bottom > rect2.top
  );
}

function updateSpeedScale(delta) {
  speedScale += delta * SPEED_SCALE_INCREASE;
}

function updateScore(delta) {
  score += delta * 0.01;
  scoreElem.textContent = Math.floor(score);
}

function handleStart(event) {
  if (event.code === "Space") {
    lastTime = null;
    speedScale = 1;
    score = 0;
    setupGround();
    setupDino();
    setupCactus();
    startScreenElem.classList.add("hide");
    window.requestAnimationFrame(update);
  } else {
    handleRestart();
  }
}

function showRankDialog() {
  alert(
    `Congratulations!!! You made the ${rank}(st/nd/rd/th) best score of all time`
  );
}

async function handleLose() {
  setDinoLose();
  if (await isInTop10()) {
    const shouldSaveInDB = displayPromptBox();
    if (shouldSaveInDB) {
      await getSortedResults();
      removeOldResults();
      displayResults();
      showRankDialog();
    }
  }
  handleRestart();
}

function handleRestart() {
  setTimeout(() => {
    document.addEventListener("keydown", (event) => handleStart(event), {
      once: true,
    });
    startScreenElem.classList.remove("hide");
  }, 100);
}

function setPixelToWorldScale() {
  let worldToPixelScale;
  if (window.innerWidth / window.innerHeight < WORLD_WIDTH / WORLD_HEIGHT) {
    worldToPixelScale = window.innerWidth / WORLD_WIDTH;
  } else {
    worldToPixelScale = window.innerHeight / WORLD_HEIGHT;
  }

  worldElem.style.width = `${WORLD_WIDTH * worldToPixelScale}px`;
  worldElem.style.height = `${WORLD_HEIGHT * worldToPixelScale}px`;
}
