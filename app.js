const STORAGE_KEY = "DayOfYearConfirmations";

let activeYear = new Date().getFullYear();

/* ------------------ Hilfsfunktionen ------------------ */

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function loadData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

/* ------------------ Initialisierung ------------------ */

const today = new Date();
const todayKey = dateKey(today);
const currentYear = today.getFullYear();

document.getElementById("date").textContent =
  today.toLocaleDateString("de-DE");

document.getElementById("confirmBtn").textContent =
  getDayOfYear(today);

/* ------------------ Status-Logik ------------------ */

function isTodayConfirmed() {
  const data = loadData();
  return Boolean(data[currentYear]?.days?.[todayKey]);
}

function updateConfirmButtonState() {
  const btn = document.getElementById("confirmBtn");
  const status = document.getElementById("status");

  if (isTodayConfirmed()) {
    btn.disabled = true;
    btn.classList.add("disabled-btn");
    status.textContent = "✅ Heute schon erledigt.";
  } else {
    btn.disabled = false;
    btn.classList.remove("disabled-btn");
    status.textContent = "";
  }
}

/* ------------------ Button ------------------ */

document.getElementById("confirmBtn").addEventListener("click", () => {
  if (isTodayConfirmed()) return;

  const data = loadData();

  // Jahr initialisieren, falls noch nicht vorhanden
  if (!data[currentYear]) {
    data[currentYear] = {
      startDate: todayKey,
      days: {}
    };
  }

  data[currentYear].days[todayKey] = true;

  saveData(data);
  updateConfirmButtonState();
});

/* ------------------ Views ------------------ */

function showView(view) {
  document.getElementById("mainView").hidden = view !== "main";
  document.getElementById("statsView").hidden = view !== "stats";

  document.querySelectorAll(".tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  if (view === "stats") {
    populateYearSelect();
    renderYear(currentYear);
  }
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    showView(btn.dataset.view);
  });
});

/* ------------------ Jahresdropdown ------------------ */

function populateYearSelect() {
  const select = document.getElementById("yearSelect");
  select.innerHTML = "";

  const data = loadData();
  let years = Object.keys(data).filter(y => /^\d{4}$/.test(y));

  // Falls noch keine Daten existieren
  if (years.length === 0) {
    years = [String(activeYear)];
  }

  years
    .sort((a, b) => b - a)
    .forEach(year => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      option.selected = Number(year) === activeYear;
      select.appendChild(option);
    });
}

/* ------------------ Statistik ------------------ */

function renderYear(year) {
  const container = document.getElementById("yearGrid");
  container.innerHTML = "";

  const data = loadData();
  const yearData = data[year];

  if (!yearData) {
    container.innerHTML = "<p>Noch keine Daten für dieses Jahr.</p>";
    return;
  }

  const startDate = new Date(yearData.startDate);
  const now = new Date();

  for (let month = 0; month < 12; month++) {
    const monthDiv = document.createElement("div");
    monthDiv.className = "month";

    const title = document.createElement("h3");
    title.textContent = new Date(year, month)
      .toLocaleString("de-DE", { month: "long" });

    const daysDiv = document.createElement("div");
    daysDiv.className = "days";

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = dateKey(date);

      const cell = document.createElement("div");
      cell.className = "day";

      if (yearData.days[key]) {
        cell.textContent = "✔";
        cell.classList.add("ok");
      } else if (date < now && date >= startDate) {
        cell.textContent = "✖";
        cell.classList.add("fail");
      }

      daysDiv.appendChild(cell);
    }

    monthDiv.appendChild(title);
    monthDiv.appendChild(daysDiv);
    container.appendChild(monthDiv);
  }
}

document.getElementById("yearSelect").addEventListener("change", (e) => {
  activeYear = Number(e.target.value);
  renderYear(activeYear);
});

/* ------------------ Swipe-Gesten ------------------ */

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.addEventListener("touchend", (e) => {
  if (!touchStartX || !touchStartY) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;

  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
    const activeTab = document.querySelector(".tab.active")?.dataset.view;

    if (diffX < 0 && activeTab === "main") showView("stats");
    if (diffX > 0 && activeTab === "stats") showView("main");
  }

  touchStartX = 0;
  touchStartY = 0;
});

/* ------------------ Service Worker Update ------------------ */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            document.getElementById("updateBanner").hidden = false;
          }
        });
      });
    });
}

document.getElementById("reloadBtn").addEventListener("click", () => {
  document.getElementById("updateBanner").hidden = true;

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
  }

  window.location.reload();
});

/* ------------------ Migration ------------------ */

function migrateLegacyData() {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!raw || typeof raw !== "object") return;

  let migrated = {};
  let didMigrate = false;

  Object.entries(raw).forEach(([key, value]) => {
    // Altes Format: ISO-Datum
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && value === true) {
      const year = key.slice(0, 4);

      if (!migrated[year]) {
        migrated[year] = {
          startDate: key,
          days: {}
        };
      }

      migrated[year].days[key] = true;

      if (key < migrated[year].startDate) {
        migrated[year].startDate = key;
      }

      didMigrate = true;
    }

    // Neues Format korrekt übernehmen
    else if (
      /^\d{4}$/.test(key) &&
      typeof value === "object" &&
      value.days
    ) {
      migrated[key] = value;
    }
  });

  if (didMigrate) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  }
}


/* ------------------ Start ------------------ */

migrateLegacyData();
updateConfirmButtonState();
