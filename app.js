const BUTTON_COUNT = 60;
const DEFAULT_MINUTES = 40;
const MIN_DURATION = 1;
const MAX_DURATION = 1440;
const URGENT_MINUTES = 10;
const STORAGE_KEY = "forty-minute-timer-records";
const DURATION_STORAGE_KEY = "timer-duration-minutes";

const buttonGrid = document.querySelector("#button-grid");
const recordCount = document.querySelector("#record-count");
const currentTime = document.querySelector("#current-time");
const currentDate = document.querySelector("#current-date");
const durationInput = document.querySelector("#duration-input");
const selectedMinutes = document.querySelector("#selected-minutes");
const resetButton = document.querySelector("#reset-button");
const resetDialog = document.querySelector("#reset-dialog");
const proximityList = document.querySelector("#proximity-list");
const proximityCount = document.querySelector("#proximity-count");
const proximityEmpty = document.querySelector("#proximity-empty");

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

let records = loadRecords();
let durationMinutes = loadDuration();

function parseDuration(value) {
  const duration = Number(value);
  return Number.isInteger(duration) &&
    duration >= MIN_DURATION &&
    duration <= MAX_DURATION
    ? duration
    : null;
}

function loadDuration() {
  const storedDuration = localStorage.getItem(DURATION_STORAGE_KEY);
  return parseDuration(storedDuration) ?? DEFAULT_MINUTES;
}

function updateDuration() {
  const duration = parseDuration(durationInput.value);

  if (duration === null) {
    durationInput.value = String(durationMinutes);
    return;
  }

  durationMinutes = duration;
  localStorage.setItem(DURATION_STORAGE_KEY, String(durationMinutes));
  selectedMinutes.textContent = String(durationMinutes);
  renderRecords();
}

function loadRecords() {
  const storedRecords = localStorage.getItem(STORAGE_KEY);
  if (!storedRecords) {
    return {};
  }

  try {
    const parsedRecords = JSON.parse(storedRecords);
    return parsedRecords && typeof parsedRecords === "object" ? parsedRecords : {};
  } catch (error) {
    console.error("Unable to load saved timer records:", error);
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function createButtons() {
  const fragment = document.createDocumentFragment();

  for (let number = 1; number <= BUTTON_COUNT; number += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "timer-button";
    button.dataset.number = String(number);
    button.innerHTML = `
      <span class="timer-number">${number}</span>
      <span class="timer-label">Click to start</span>
      <span class="timer-time"></span>
    `;
    button.addEventListener("click", () => recordTime(number));
    button.addEventListener("contextmenu", (event) => cancelTimer(event, number));
    fragment.append(button);
  }

  buttonGrid.append(fragment);
}

function recordTime(number) {
  const targetTime = Date.now() + durationMinutes * 60 * 1000;
  records[number] = targetTime;
  saveRecords();
  renderRecords();
}

function cancelTimer(event, number) {
  if (!records[number]) {
    return;
  }

  event.preventDefault();
  delete records[number];
  saveRecords();
  renderRecords();
}

function formatDistance(targetTime, now) {
  const difference = targetTime - now;
  const totalSeconds = Math.max(0, Math.floor(Math.abs(difference) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${seconds}s`);

  return `${difference <= 0 ? "Overdue" : "In"} ${parts.join(" ")}`;
}

function renderProximityList(now) {
  const sortedRecords = Object.entries(records)
    .filter(([, targetTime]) => Number.isFinite(targetTime))
    .sort(([, firstTime], [, secondTime]) => {
      const distanceDifference =
        Math.abs(firstTime - now) - Math.abs(secondTime - now);
      return distanceDifference || firstTime - secondTime;
    });

  proximityList.replaceChildren();
  proximityCount.textContent = String(sortedRecords.length);
  proximityEmpty.hidden = sortedRecords.length > 0;

  const fragment = document.createDocumentFragment();

  sortedRecords.forEach(([number, targetTime], index) => {
    const item = document.createElement("li");
    const isExpired = targetTime <= now;
    item.className = `proximity-item${isExpired ? " expired" : ""}`;
    item.innerHTML = `
      <span class="proximity-rank">${index + 1}</span>
      <span class="proximity-number">${number}</span>
      <span class="proximity-distance">${formatDistance(targetTime, now)}</span>
      <time datetime="${new Date(targetTime).toISOString()}">${timeFormatter.format(new Date(targetTime))}</time>
    `;
    fragment.append(item);
  });

  proximityList.append(fragment);
}

function renderRecords() {
  const now = Date.now();
  let count = 0;

  document.querySelectorAll(".timer-button").forEach((button) => {
    const targetTime = records[button.dataset.number];
    const label = button.querySelector(".timer-label");
    const time = button.querySelector(".timer-time");

    button.classList.remove("recorded", "urgent", "expired");

    if (!targetTime) {
      label.textContent = "Click to start";
      time.textContent = `+${durationMinutes} minutes`;
      button.setAttribute("aria-label", `Button ${button.dataset.number}, not recorded`);
      return;
    }

    count += 1;
    const expired = targetTime <= now;
    const urgent =
      !expired && targetTime - now <= URGENT_MINUTES * 60 * 1000;
    const formattedTime = timeFormatter.format(new Date(targetTime));
    button.classList.add(expired ? "expired" : urgent ? "urgent" : "recorded");
    label.textContent = expired
      ? "Time expired"
      : urgent
        ? "Less than 10 minutes"
        : "Target time";
    time.textContent = formattedTime;
    button.setAttribute(
      "aria-label",
      `Button ${button.dataset.number}, ${
        expired ? "time expired" : urgent ? "less than 10 minutes remaining" : "target time"
      } ${formattedTime}`,
    );
  });

  recordCount.textContent = String(count);
  renderProximityList(now);
}

function updateClock() {
  const now = new Date();
  currentTime.textContent = timeFormatter.format(now);
  currentDate.textContent = dateFormatter.format(now);
  renderRecords();
}

resetButton.addEventListener("click", () => {
  if (Object.keys(records).length === 0) {
    return;
  }
  resetDialog.showModal();
});

durationInput.value = String(durationMinutes);
selectedMinutes.textContent = String(durationMinutes);
durationInput.addEventListener("change", updateDuration);

resetDialog.addEventListener("close", () => {
  if (resetDialog.returnValue !== "confirm") {
    return;
  }

  records = {};
  localStorage.removeItem(STORAGE_KEY);
  renderRecords();
});

createButtons();
updateClock();
setInterval(updateClock, 1000);
