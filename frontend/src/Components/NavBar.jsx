export default function NavBar({ current, setCurrent }) {
  const tabs = ["Dashboard 1", "Dashboard 2", "Dashboard 3"];
  return (
    <div className="flex justify-center gap-4 py-4 bg-gray-900 text-teal-400">
      {tabs.map((tab, i) => (
        <button
          key={i}
          onClick={() => setCurrent(i)}
          className={`px-4 py-2 rounded-xl transition ${
            current === i ? "bg-teal-500 text-white" : "hover:bg-teal-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
