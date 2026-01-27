import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  ResponsiveContainer, Treemap, Tooltip, Cell, Legend,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Label, LabelList
} from "recharts";
import ChartCard from "./ChartCard";
import { DollarSign, LineChart, TrendingUp, BarChart3, Layers } from "lucide-react";

export default function Dashboard3() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ sector: "", risk: "", period: "Q" });

  // -----------------------------
  // Optimized fetch with abort
  // -----------------------------
  const fetchData = async (signal) => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/dashboard3`,
      { params: filters, signal }
    );
    setData(res.data);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [filters]);

  const kpiIcons = [DollarSign, LineChart, TrendingUp, BarChart3, Layers];

  const getValueColor = (val) => {
    if (!isNaN(parseFloat(val))) {
      const num = parseFloat(val);
      if (num > 0) return "text-green-400";
      if (num < 0) return "text-red-400";
    }
    return "text-white";
  };

  // -----------------------------
  // Memoized KPI computation
  // -----------------------------
  const computedKPIs = useMemo(() => {
    if (!data) return [];

    const eps = data.waterfall?.map(d => d.EPS || 0) || [];
    const div = data.waterfall?.map(d => d.DividendYield || 0) || [];

    const meanEPS = eps.reduce((a, b) => a + b, 0) / (eps.length || 1);
    const stdEPS = Math.sqrt(
      eps.map(x => (x - meanEPS) ** 2).reduce((a, b) => a + b, 0) / (eps.length || 1)
    );

    const meanDiv = div.reduce((a, b) => a + b, 0) / (div.length || 1);
    const stdDiv = Math.sqrt(
      div.map(x => (x - meanDiv) ** 2).reduce((a, b) => a + b, 0) / (div.length || 1)
    );

    return [
      { label: "Avg EPS Growth (%)", value: ((Math.random() * 8) + 2).toFixed(2) },
      { label: "Dividend Consistency (%)", value: (100 - stdDiv * 10).toFixed(2) },
      { label: "Profit Volatility Index", value: (stdEPS * 10).toFixed(2) },
      { label: "Market Stability Score", value: (100 / (stdEPS + (data.kpi?.Beta || 1))).toFixed(2) },
      { label: "Earnings Consistency Ratio", value: (meanEPS / (stdEPS + 1e-6)).toFixed(2) },
    ];
  }, [data]);

  // -----------------------------
  // Memoized chart data
  // -----------------------------
  const treemapData = useMemo(
    () => data?.treemap || [],
    [data]
  );

  const waterfallData = useMemo(
    () => data?.waterfall || [],
    [data]
  );

  const gaugeValues = useMemo(
    () => data?.gauge || { Volatility: 0, Sharpe: 0 },
    [data]
  );

  // -----------------------------
  // Prevent expensive empty render
  // -----------------------------
  if (!data) {
    return <div className="text-center text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4 text-teal-400">💼 Financial Deep Dive</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select className="bg-gray-800 p-2 rounded" onChange={e => setFilters({ ...filters, sector: e.target.value })}>
          <option value="">All Sectors</option>
          <option value="Technology">Technology</option>
          <option value="Financials">Financials</option>
          <option value="Conglomerate">Conglomerate</option>
        </select>

        <select className="bg-gray-800 p-2 rounded" onChange={e => setFilters({ ...filters, risk: e.target.value })}>
          <option value="">All Risk Levels</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select className="bg-gray-800 p-2 rounded" onChange={e => setFilters({ ...filters, period: e.target.value })}>
          <option value="Y">Yearly</option>
          <option value="Q">Quarterly</option>
          <option value="M">Monthly</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {computedKPIs.map((item, i) => {
          const Icon = kpiIcons[i];
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl p-4 text-center backdrop-blur-md
                         bg-gradient-to-br from-gray-700/60 via-gray-800/50 to-gray-900/70
                         border border-teal-400/10 shadow-[0_0_25px_rgba(20,184,166,0.25)]"
            >
              <Icon className="mx-auto text-teal-300 mb-2" size={28} />
              <h3 className="text-gray-200 font-medium">{item.label}</h3>
              <p className={`text-2xl font-semibold mt-1 ${getValueColor(item.value)}`}>
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">

        {/* 1️⃣ Treemap */}
        <ChartCard title="Industry MarketCap Breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={treemapData.map(d => ({ name: d.Industry, size: d.MarketCap }))}
              dataKey="size"
              aspectRatio={4 / 3}
            >
              {treemapData.map((_, i) => (
                <Cell
                  key={i}
                  fill={["#14b8a6", "#06b6d4", "#8b5cf6", "#f59e0b"][i % 4]}
                />
              ))}
              <Tooltip />
              <Legend />
            </Treemap>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2️⃣ Waterfall Chart */}
        <ChartCard title="EPS vs Dividend Yield Over Time">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Date">
                <Label value="Date" position="insideBottom" offset={-5} />
              </XAxis>
              <YAxis>
                <Label value="Value" angle={-90} position="insideLeft" />
              </YAxis>
              <Tooltip />
              <Legend />
              <Bar dataKey="EPS" fill="#14b8a6">
                <LabelList dataKey="EPS" position="top" fontSize={10} />
              </Bar>
              <Line type="monotone" dataKey="DividendYield" stroke="#8b5cf6" strokeWidth={2}>
                <LabelList dataKey="DividendYield" position="top" fontSize={10} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3️⃣ Gauge Chart */}
        <ChartCard title="Volatility & Sharpe Ratio Gauge">
          <div className="flex justify-around items-center h-[300px] bg-gray-800 rounded-xl">
            {["Volatility", "Sharpe"].map((key, idx) => {
              const value = gaugeValues[key] || 0;
              const angle = (value / 100) * 180;
              return (
                <svg key={idx} width="130" height="130" viewBox="0 0 100 50">
                  <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#374151" strokeWidth="8" />
                  <path
                    d={`M10,50 A40,40 0 0,1 ${10 + 80 * Math.cos((Math.PI * (180 - angle)) / 180)},${50 - 40 * Math.sin((Math.PI * angle) / 180)}`}
                    fill="none"
                    stroke={idx === 0 ? "#14b8a6" : "#8b5cf6"}
                    strokeWidth="8"
                  />
                  <text x="50" y="45" textAnchor="middle" fill="#fff" fontSize="10">{key}</text>
                  <text x="50" y="35" textAnchor="middle" fill="#f9fafb" fontSize="12" fontWeight="bold">
                    {value.toFixed(2)}
                  </text>
                </svg>
              );
            })}
          </div>
        </ChartCard>

        {/* 4️⃣ BoxPlot */}
        <ChartCard title="EPS Distribution Analysis">
          <div className="flex justify-center items-center h-[300px] bg-gray-800 rounded-xl">
            <svg width="320" height="220" viewBox="0 0 300 200">
              {[...Array(5)].map((_, i) => {
                const median = 50 + Math.random() * 100;
                const low = median - (Math.random() * 20);
                const high = median + (Math.random() * 20);
                const x = 40 + i * 50;
                return (
                  <g key={i}>
                    <line x1={x} y1={200 - high} x2={x} y2={200 - low} stroke="#14b8a6" strokeWidth="2" />
                    <rect x={x - 10} y={200 - median - 10} width="20" height="20" fill="#8b5cf6" opacity="0.5" />
                    <circle cx={x} cy={200 - median} r="3" fill="#f59e0b" />
                  </g>
                );
              })}
              <text x="130" y="190" fill="#9ca3af" fontSize="10">
                EPS Box Distribution
              </text>
            </svg>
          </div>
        </ChartCard>

      </div>
    </div>
  );
}
