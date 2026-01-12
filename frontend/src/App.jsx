import { useState } from "react";
import NavBar from "./Components/NavBar";
import Dashboard1 from "./Components/Dashboard1";
import Dashboard2 from "./Components/Dashboard2";
import Dashboard3 from "./Components/Dashboard3";

export default function App() {
  const [current, setCurrent] = useState(0);
  const dashboards = [<Dashboard1 />, <Dashboard2 />, <Dashboard3 />];

  return (
    <div className="bg-gray-950 min-h-screen text-white">
      <NavBar current={current} setCurrent={setCurrent} />
      <div className="p-6">{dashboards[current]}</div>
    </div>
  );
}
