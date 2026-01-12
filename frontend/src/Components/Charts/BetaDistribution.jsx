import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { name: "Stock A", beta: 0.8 },
  { name: "Stock B", beta: 1.1 },
  { name: "Stock C", beta: 1.3 },
  { name: "Stock D", beta: 0.9 },
  { name: "Stock E", beta: 1.5 },
];

const BetaDistribution = () => (
  <div className="bg-gray-800 p-5 rounded-2xl shadow-md">
    <h3 className="text-lg font-semibold mb-3 text-teal-400">Beta Distribution</h3>
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#555" />
        <XAxis dataKey="name" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip />
        <Bar dataKey="beta" fill="#14b8a6" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default BetaDistribution;

