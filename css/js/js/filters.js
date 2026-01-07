let filters = {
  ticker: "",
  sector: "",
  risk: "",
  startDate: "",
  endDate: ""
};

function applyFilters(data) {
  return data.filter(d => {
    if (filters.ticker && d.Ticker !== filters.ticker) return false;
    if (filters.sector && d.Sector !== filters.sector) return false;

    if (filters.risk === "low" && d.Beta >= 1) return false;
    if (filters.risk === "medium" && (d.Beta < 1 || d.Beta > 1.3)) return false;
    if (filters.risk === "high" && d.Beta <= 1.3) return false;

    return true;
  });
}
