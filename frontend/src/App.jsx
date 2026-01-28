import { useEffect, useState } from "react";
import axios from "axios";
import Dashboard1 from "./Components/Dashboard1";
import Dashboard2 from "./Components/Dashboard2";
import Dashboard3 from "./Components/Dashboard3";

export default function App() {
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState({
    sector: "",
    risk: "",
    period: "Y",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAll() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/dashboard-all`,
          {
            params: filters,
            signal: controller.signal,
          }
        );
        setData(res.data);
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error(err);
      }
    }

    fetchAll();
    return () => controller.abort();
  }, [filters]);

  if (!data) {
    return <div className="text-center text-gray-400">Loading dashboard...</div>;
  }

  return (
    <>
      <Dashboard1 data={data.dashboard1} />
      <Dashboard2 data={data.dashboard2} />
      <Dashboard3 data={data.dashboard3} />
    </>
  );
}
