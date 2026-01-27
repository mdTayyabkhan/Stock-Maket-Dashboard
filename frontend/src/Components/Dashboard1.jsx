// frontend/src/Dashboard1.jsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, Activity, BarChart2, Layers, Zap } from "lucide-react";
import ChartCard from "./ChartCard";

export default function Dashboard1() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({ sector: "", risk: "", period: "Y" });

  const fetchData = async (signal) => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/api/dashboard1`,
      { params: filters, signal }
    );
    setData(res.data);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [filters]);

  const kpiIcons = [TrendingUp, Activity, BarChart2, Layers, Zap];
  const COLORS = ["#14b8a6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"];

  const formatNumber = (num) => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    return num.toFixed(0);
  };

  const getValueColor = (value) => {
    if (typeof value === "number") {
      if (value > 0) return "text-green-400";
      if (value < 0) return "text-red-400";
    }
    return "text-teal-300";
  };

  const pieData = useMemo(() => {
    if (!data?.bar) return [];
    return Object.entries(
      data.bar.reduce((acc, d) => {
        const sector = d.Date?.split("-")[0] || "Unknown";
        acc[sector] = (acc[sector] || 0) + d.value;
        return acc;
      }, {})
    ).map(([sector, value]) => ({ sector, value }));
  }, [data]);

  if (!data) {
    return <div className="text-center text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4 text-teal-400">📈 Market Overview</h1>

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
        {Object.entries(data.kpi).map(([k, v], i) => {
          const Icon = kpiIcons[i];
          const valueColor = getValueColor(v);
          return (
            <div
              key={k}
              className="relative overflow-hidden rounded-xl p-4 text-center backdrop-blur-md
                         bg-gradient-to-br from-gray-700/60 via-gray-800/50 to-gray-900/70
                         border border-teal-400/10 shadow-[0_0_25px_rgba(20,184,166,0.25)]"
            >
              <Icon className="mx-auto text-teal-300 mb-2" size={28} />
              <h3 className="text-gray-200 font-medium">{k}</h3>
              <p className={`text-2xl font-semibold mt-1 ${valueColor}`}>{v}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard title="Average Returns Over Time">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.area}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="Date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#14b8a6" fill="#14b8a680" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Return Distribution by Sector">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="sector"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                label={({ sector, value }) => `${sector}: ${formatNumber(value)}`}
              >
                {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Legend />
              <Tooltip formatter={formatNumber} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
