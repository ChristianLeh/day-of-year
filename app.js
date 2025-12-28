function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }
  
  const today = new Date();
  
  document.getElementById("date").textContent =
    today.toLocaleDateString("de-DE");
  
  document.getElementById("confirmBtn").textContent =
    getDayOfYear(today);
  
  document.getElementById("confirmBtn").addEventListener("click", () => {
    document.getElementById("status").textContent =
      "✅ Bestätigt um " + today.toLocaleTimeString("de-DE");
  });
  