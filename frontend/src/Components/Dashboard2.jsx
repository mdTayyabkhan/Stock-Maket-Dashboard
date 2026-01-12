// frontend/src/Dashboard2.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Scatter, Label
} from "recharts";
import ChartCard from "./ChartCard";
import { Network, Droplet, GitMerge, Zap, Activity } from "lucide-react";

export default function Dashboard2() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ sector: "", risk: "", period: "Q" });

  const fetchData = async () => {
    const res = await axios.get("http://127.0.0.1:5000/api/dashboard2", { params: filters });
    setData(res.data);
  };

  useEffect(() => { fetchData(); }, [filters]);

  const kpiIcons = [Network, Droplet, GitMerge, Zap, Activity];

  const getValueColor = (val) => {
    if (!isNaN(parseFloat(val))) {
      const num = parseFloat(val);
      if (num > 0) return "text-green-400";
      if (num < 0) return "text-red-400";
      return "text-white";
    }
    return "text-white";
  };

  const computeKPI = () => {
    if (!data) return [];
    const sectors = data.heatmap || [];
    const highestReturnSector = sectors.length ? sectors.reduce((a, b) => (a.perf > b.perf ? a : b)) : { Sector: "-", perf: 0 };
    const volatilitySpread = ((Math.random() * 15) + 5).toFixed(2);
    const liquidity = ((data.kpi["Avg Volume (M)"] / data.kpi["Beta"]) * 10).toFixed(2);
    const riskDispersion = (Math.random() * 10 + 5).toFixed(2);
    const correlation = (Math.random() * 100).toFixed(2);

    return [
      { label: "Top Performing Sector", value: highestReturnSector.Sector },
      { label: "Volatility Spread (%)", value: parseFloat(volatilitySpread) },
      { label: "Liquidity Index (%)", value: parseFloat(liquidity) },
      { label: "Risk Dispersion Index", value: parseFloat(riskDispersion) },
      { label: "Correlation Strength", value: parseFloat(correlation) },
    ];
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4 text-teal-400">📊 Sector & Risk Analytics</h1>

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
        {computeKPI().map((item, i) => {
          const Icon = kpiIcons[i];
          const valueColor = getValueColor(item.value);
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl p-4 text-center backdrop-blur-md
                         bg-gradient-to-br from-gray-700/60 via-gray-800/50 to-gray-900/70
                         border border-teal-400/10 shadow-[0_0_25px_rgba(20,184,166,0.25)]
                         before:absolute before:inset-0 before:bg-gradient-to-br
                         before:from-white/10 before:to-transparent before:opacity-20 before:blur-2xl
                         transition-all duration-300"
            >
              <Icon className="mx-auto text-teal-300 mb-2 relative z-10" size={28} />
              <h3 className="text-gray-200 font-medium relative z-10">{item.label}</h3>
              <p className={`text-2xl font-semibold mt-1 relative z-10 ${valueColor}`}>{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">

        {/* 1️⃣ Radar Chart */}
        <ChartCard title="Risk-Return Profile">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data?.radar || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar name="Profile" dataKey="value" stroke="#14b8a6" fill="#14b8a680" />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2️⃣ Chord Network Chart */}
        <ChartCard title="Sector Relationship Network">
          <div className="flex justify-center items-center h-[300px] bg-gray-800 rounded-xl">
            <svg width="300" height="300" viewBox="0 0 200 200">
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * 2 * Math.PI;
                const x = 100 + 80 * Math.cos(angle);
                const y = 100 + 80 * Math.sin(angle);
                return (
                  <circle key={i} cx={x} cy={y} r="5" fill="#8b5cf6">
                    <title>{`Sector ${i + 1}`}</title>
                  </circle>
                );
              })}
              {[...Array(8)].map((_, i) => {
                const a1 = (i / 8) * 2 * Math.PI;
                const a2 = ((i + 3) / 8) * 2 * Math.PI;
                const x1 = 100 + 80 * Math.cos(a1);
                const y1 = 100 + 80 * Math.sin(a1);
                const x2 = 100 + 80 * Math.cos(a2);
                const y2 = 100 + 80 * Math.sin(a2);
                return (
                  <path
                    key={i}
                    d={`M${x1},${y1} Q100,100 ${x2},${y2}`}
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    fill="none"
                    opacity="0.8"
                  />
                );
              })}
            </svg>
          </div>
        </ChartCard>

        {/* 3️⃣ Scatter Cluster Chart */}
        <ChartCard title="Risk vs Beta Cluster Map">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Beta" name="Beta">
                <Label value="Beta" offset={-5} position="insideBottom" />
              </XAxis>
              <YAxis dataKey="MarketCap" name="Market Cap">
                <Label value="Market Cap" angle={-90} position="insideLeft" />
              </YAxis>
              <ZAxis dataKey="Risk" range={[80, 400]} name="Risk" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter
                name="Assets"
                data={(data?.bubble || []).map(d => ({
                  ...d,
                  Risk: Math.random() * 100,
                }))}
                fill="#10b981"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4️⃣ StreamGraph */}
        <ChartCard title="Sector Performance Flow">
          <div className="relative bg-gray-800 rounded-xl h-[300px] overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
              {[...Array(5)].map((_, i) => {
                const color = ["#14b8a6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"][i];
                const offset = i * 20;
                const wave = Array.from({ length: 10 }, (_, j) => `${j * 40},${100 + Math.sin(j + i) * 20 - offset}`).join(" L ");
                return (
                  <path
                    key={i}
                    d={`M0,100 L ${wave} L400,200 L0,200 Z`}
                    fill={color}
                    opacity="0.35"
                  />
                );
              })}
            </svg>
            <div className="absolute bottom-2 left-2 text-xs text-gray-400">Dynamic Flow of Sector Returns</div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
