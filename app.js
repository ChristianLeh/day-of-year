const STORAGE_KEY = "DayOfYearConfirmations";

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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getSelectedYear() {
  const select = document.getElementById("yearSelect");
  return select ? select.value : new Date().getFullYear().toString();
}

/* ------------------ Initialisierung ------------------ */

const today = new Date();
const todayKey = dateKey(today);
const currentYear = today.getFullYear().toString();

document.getElementById("date").textContent =
  today.toLocaleDateString("de-DE");

document.getElementById("confirmBtn").textContent =
  getDayOfYear(today);

/* ------------------ Status-Logik ------------------ */

function isTodayConfirmed() {
  const data = loadData();
  console.log(currentYear)
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
  const todayYear = today.getFullYear().toString();
  const data = loadData();

  // Jahr initialisieren, falls nicht vorhanden
  if (!data[todayYear]) {
    data[todayYear] = {
      startDate: todayKey,
      days: {}
    };
  }

  // Heute als bestätigt speichern
  data[todayYear].days[todayKey] = true;
  saveData(data);

  // Button-Status aktualisieren
  updateConfirmButtonState();

  // Statistik & Gesamt aktualisieren für **aktuell ausgewähltes Jahr**
  const selectedYear = getSelectedYear();
  renderYear(selectedYear);
  updateYearTotal(selectedYear);
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
    renderYear(getSelectedYear());
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
  const data = loadData();

  select.innerHTML = "";

  let years = Object.keys(data)
    .filter(y => /^\d{4}$/.test(y))
    .sort((a, b) => b - a);

  if (!years.includes(currentYear)) {
    years.unshift(currentYear);
  }

  years.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    select.appendChild(option);
  });

  if (!select.value) select.value = currentYear;
}

document.getElementById("yearSelect").addEventListener("change", () => {
  const year = getSelectedYear();
  renderYear(year);
  updateYearTotal(year);
});

/* ------------------ Gesamt-Statistik ------------------ */

function updateYearTotal(year) {
  const totalEl = document.getElementById("yearTotal");
  const data = loadData();

  if (!data[year] || !data[year].days) {
    totalEl.textContent = "0";
    return;
  }

  let sum = 0;

  Object.keys(data[year].days).forEach(dateStr => {
    const date = new Date(dateStr);
    sum += getDayOfYear(date);
  });

  totalEl.textContent = sum;
}

/* ------------------ Statistik ------------------ */

function renderYear(year) {
  updateYearTotal(year);

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

document.addEventListener("DOMContentLoaded", () => {
  migrateLegacyData();

  populateYearSelect();

  // WICHTIG: Button-Status erst nach vollständigem Laden setzen
  updateConfirmButtonState();

  const year = getSelectedYear();
  renderYear(year);
  updateYearTotal(year);
});

