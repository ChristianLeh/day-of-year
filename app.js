const STORAGE_KEY = "dayConfirmations";

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

document.getElementById("date").textContent =
  today.toLocaleDateString("de-DE");

document.getElementById("confirmBtn").textContent =
  getDayOfYear(today);

/* ------------------ Status-Logik ------------------ */

function isTodayConfirmed() {
  const data = loadData();
  return Boolean(data[todayKey]);
}

function updateConfirmButtonState() {
  const btn = document.getElementById("confirmBtn");

  btn.textContent = getDayOfYear(today);

  if (isTodayConfirmed()) {
    btn.disabled = true;
    document.getElementById("status").textContent =
      "✅ Heute bereits bestätigt";
  } else {
    btn.disabled = false;
    document.getElementById("status").textContent = "";
  }
}

/* ------------------ Button ------------------ */

document.getElementById("confirmBtn").addEventListener("click", () => {
  if (isTodayConfirmed()) return;

  const data = loadData();
  data[todayKey] = true;
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
    renderYear();
  }
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    showView(btn.dataset.view);
  });
});


/* ------------------ Statistik ------------------ */

function renderYear() {
  const container = document.getElementById("yearGrid");
  container.innerHTML = "";

  const data = loadData();
  const now = new Date();
  const year = now.getFullYear();

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

      if (data[key]) {
        cell.textContent = "✔";
        cell.classList.add("ok");
      } else if (date < now) {
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

  // Nur horizontale Swipes berücksichtigen
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
    const activeTab = document.querySelector(".tab.active")?.dataset.view;

    if (diffX < 0 && activeTab === "main") {
      showView("stats"); // Swipe links
    }

    if (diffX > 0 && activeTab === "stats") {
      showView("main"); // Swipe rechts
    }
  }

  touchStartX = 0;
  touchStartY = 0;
});

/* ------------------ Start ------------------ */

updateConfirmButtonState();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Neue Version verfügbar
            document.getElementById("updateBanner").hidden = false;
          }
        });
      });
    });
}

// Reload-Button
document.getElementById("reloadBtn").addEventListener("click", () => {
  const banner = document.getElementById("updateBanner");
  banner.hidden = true;

  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
  }

  window.location.reload();
});
