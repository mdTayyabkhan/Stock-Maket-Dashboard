import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { name: "Mon", volume: 2.1 },
  { name: "Tue", volume: 2.6 },
  { name: "Wed", volume: 2.4 },
  { name: "Thu", volume: 2.8 },
  { name: "Fri", volume: 2.5 },
];

const VolumeChart = () => (
  <div className="bg-gray-800 p-5 rounded-2xl shadow-md">
    <h3 className="text-lg font-semibold mb-3 text-teal-400">Average Volume (Millions)</h3>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#555" />
        <XAxis dataKey="name" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip />
        <Line type="monotone" dataKey="volume" stroke="#14b8a6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default VolumeChart;
