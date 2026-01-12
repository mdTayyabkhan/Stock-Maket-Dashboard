export default function ChartCard({ title, children }) {
  return (
    <div className="bg-gray-800 p-4 rounded-2xl shadow-lg">
      <h3 className="text-lg font-semibold mb-2 text-teal-300">{title}</h3>
      {children}
    </div>
  );
}
