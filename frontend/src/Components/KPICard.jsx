import React from "react";

const KPICard = ({ title, value }) => (
  <div className="bg-gray-800 p-4 rounded-2xl shadow-md text-center hover:scale-105 transition-transform">
    <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
    <p className="text-2xl font-semibold text-white">{value}</p>
  </div>
);

export default KPICard;
