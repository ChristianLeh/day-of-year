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

/* ------------------ Status ------------------ */

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
  const data = loadData();

  if (!data[currentYear]) {
    data[currentYear] = { days: {} };
  }

  data[currentYear].days[todayKey] = true;
  saveData(data);

  updateConfirmButtonState();

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

/* ------------------ Gesamt ------------------ */

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

  // Jahr automatisch erzeugen (wichtig!)
  if (!data[year]) {
    data[year] = { days: {} };
    saveData(data);
  }

  const yearData = data[year];
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
      }

      else if (date < now) {
        cell.textContent = "✖";
        cell.classList.add("fail");
        cell.style.cursor = "pointer";

        cell.addEventListener("click", () => {
          const data = loadData();

          if (!data[year]) {
            data[year] = { days: {} };
          }

          data[year].days[key] = true;
          saveData(data);

          renderYear(year);
          updateYearTotal(year);
        });
      }

      else {
        cell.textContent = day;
      }

      daysDiv.appendChild(cell);
    }

    monthDiv.appendChild(title);
    monthDiv.appendChild(daysDiv);
    container.appendChild(monthDiv);
  }
}

/* ------------------ Start ------------------ */

function initAppState() {
  populateYearSelect();
  updateConfirmButtonState();

  const year = getSelectedYear();
  renderYear(year);
  updateYearTotal(year);
}

document.addEventListener("DOMContentLoaded", initAppState);

window.addEventListener("pageshow", () => {
  initAppState();
});
