import React, { useEffect, useState } from "react";
import KPICard from "./KPICard";
import axios from "axios";
import { motion } from "framer-motion";
import VolumeChart from "./Charts/VolumeChart";
import BetaDistribution from "./Charts/BetaDistribution";

const KPILayout = () => {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
  axios.get("http://localhost:5000/api/kpi1")
    .then(res => {
      console.log("✅ Data fetched from Flask:", res.data);
      setKpis(res.data);
    })
    .catch(err => console.error("❌ Error fetching KPI data:", err));
}, []);

  if (!kpis) return <p className="text-gray-400 text-center">Loading...</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="p-6 min-h-screen bg-gray-900 text-white"
    >
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-400">📊 Stock Market Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {Object.entries(kpis).map(([key, value]) => (
          <KPICard key={key} title={key} value={value} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <VolumeChart />
        <BetaDistribution />
      </div>
    </motion.div>
  );
};

export default KPILayout;
