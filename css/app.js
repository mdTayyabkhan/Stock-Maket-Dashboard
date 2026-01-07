let rawData = [];
let filteredData = [];

fetch("data/stockData.json")
  .then(res => res.json())
  .then(data => {
    rawData = data;
    initFilters();
    applyFilters();
  });

function initFilters() {
  const tickers = [...new Set(rawData.map(d => d.Ticker))];
  const sectors = [...new Set(rawData.map(d => d.Sector))];

  ticker.innerHTML = `<option value="">All Stocks</option>` +
    tickers.map(t => `<option>${t}</option>`).join("");

  sector.innerHTML = `<option value="">All Sectors</option>` +
    sectors.map(s => `<option>${s}</option>`).join("");

  const dates = rawData.map(d => new Date(d.Date));
  startDate.valueAsDate = new Date(Math.min(...dates));
  endDate.valueAsDate = new Date(Math.max(...dates));

  document.querySelectorAll("select,input").forEach(el =>
    el.addEventListener("change", applyFilters)
  );
}

function applyFilters() {
  filteredData = rawData.filter(d => {
    if (ticker.value && d.Ticker !== ticker.value) return false;
    if (sector.value && d.Sector !== sector.value) return false;
    if (risk.value === "low" && d.Beta >= 1) return false;
    if (risk.value === "medium" && (d.Beta < 1 || d.Beta > 1.3)) return false;
    if (risk.value === "high" && d.Beta <= 1.3) return false;
    if (new Date(d.Date) < new Date(startDate.value)) return false;
    if (new Date(d.Date) > new Date(endDate.value)) return false;
    return true;
  });

  updateKPIs();
  renderCharts();
}

function updateKPIs() {
  marketCap.textContent = format(sum("MarketCap"));
  volume.textContent = format(sum("Volume"));
  pe.textContent = avg("PE_Ratio").toFixed(2);
  dividend.textContent = avg("DividendYield").toFixed(2) + "%";
  change.textContent = "—";
}

function sum(key) {
  return filteredData.reduce((a,b) => a + b[key], 0);
}

function avg(key) {
  return sum(key) / filteredData.length || 0;
}

function format(n) {
  return (n / 1e9).toFixed(2) + " B";
}

function renderCharts() {
  document.querySelectorAll(".apexcharts-canvas").forEach(c => c.remove());

  new ApexCharts(document.querySelector("#priceTrend"), {
    chart: { type: "line" },
    series: [{
      name: "Close",
      data: filteredData.map(d => d.Close)
    }],
    xaxis: { categories: filteredData.map(d => d.Date) }
  }).render();
}
