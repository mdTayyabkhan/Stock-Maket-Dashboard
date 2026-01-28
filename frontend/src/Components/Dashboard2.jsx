import { useMemo } from "react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  ScatterChart, CartesianGrid, XAxis, YAxis, ZAxis, Tooltip, Scatter, Label
} from "recharts";
import ChartCard from "./ChartCard";
import { Network, Droplet, GitMerge, Zap, Activity } from "lucide-react";

export default function Dashboard2({ data }) {
  // -----------------------------
  // EARLY EXIT (no refetch)
  // -----------------------------
  if (!data) {
    return <div className="text-center text-gray-400">Loading dashboard...</div>;
  }

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

  // -----------------------------
  // Memoized KPI computation (UNCHANGED)
  // -----------------------------
  const computedKPIs = useMemo(() => {
    if (!data) return [];

    const sectors = data.heatmap || [];
    const highestReturnSector =
      sectors.length
        ? sectors.reduce((a, b) => (a.perf > b.perf ? a : b))
        : { Sector: "-", perf: 0 };

    return [
      { label: "Top Performing Sector", value: highestReturnSector.Sector },
      { label: "Volatility Spread (%)", value: parseFloat(((Math.random() * 15) + 5).toFixed(2)) },
      { label: "Liquidity Index (%)", value: parseFloat(((data.kpi["Avg Volume (M)"] / data.kpi["Beta"]) * 10).toFixed(2)) },
      { label: "Risk Dispersion Index", value: parseFloat((Math.random() * 10 + 5).toFixed(2)) },
      { label: "Correlation Strength", value: parseFloat((Math.random() * 100).toFixed(2)) },
    ];
  }, [data]);

  // -----------------------------
  // Memoized scatter data (UNCHANGED)
  // -----------------------------
  const scatterData = useMemo(() => {
    return (data?.bubble || []).map(d => ({
      ...d,
      Risk: Math.random() * 100,
    }));
  }, [data]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4 text-teal-400">📊 Sector & Risk Analytics</h1>

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
              <p className={`text-2xl font-semibold mt-1 ${getValueColor(item.value)}`}>{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">

        <ChartCard title="Risk-Return Profile">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data.radar || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar name="Profile" dataKey="value" stroke="#14b8a6" fill="#14b8a680" />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sector Relationship Network">
          <div className="flex justify-center items-center h-[300px] bg-gray-800 rounded-xl">
            <svg width="300" height="300" viewBox="0 0 200 200">
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * 2 * Math.PI;
                const x = 100 + 80 * Math.cos(angle);
                const y = 100 + 80 * Math.sin(angle);
                return <circle key={i} cx={x} cy={y} r="5" fill="#8b5cf6" />;
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

        <ChartCard title="Risk vs Beta Cluster Map">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Beta">
                <Label value="Beta" offset={-5} position="insideBottom" />
              </XAxis>
              <YAxis dataKey="MarketCap">
                <Label value="Market Cap" angle={-90} position="insideLeft" />
              </YAxis>
              <ZAxis dataKey="Risk" range={[80, 400]} />
              <Tooltip />
              <Legend />
              <Scatter name="Assets" data={scatterData} fill="#10b981" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sector Performance Flow">
          <div className="relative bg-gray-800 rounded-xl h-[300px] overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
              {[...Array(5)].map((_, i) => {
                const color = ["#14b8a6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"][i];
                const offset = i * 20;
                const wave = Array.from(
                  { length: 10 },
                  (_, j) => `${j * 40},${100 + Math.sin(j + i) * 20 - offset}`
                ).join(" L ");
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
            <div className="absolute bottom-2 left-2 text-xs text-gray-400">
              Dynamic Flow of Sector Returns
            </div>
          </div>
        </ChartCard>

      </div>
    </div>
  );
}
