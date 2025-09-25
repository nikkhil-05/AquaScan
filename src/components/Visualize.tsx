import React, { useState } from "react";
import { Bar, Line, Pie, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { ChevronDown, ChevronUp } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

// ✅ Static 10-sample dataset
const samples = Array.from({ length: 10 }, (_, i) => ({
  Sample_ID: `S${String(i + 1).padStart(3, "0")}`,
  Pb: parseFloat((Math.random() * 0.1).toFixed(3)),
  Cd: parseFloat((Math.random() * 0.005).toFixed(3)),
  As: parseFloat((Math.random() * 0.02).toFixed(3)),
  Hg: parseFloat((Math.random() * 0.01).toFixed(3)),
  Cr: parseFloat((Math.random() * 0.07).toFixed(3)),
  Cu: parseFloat((Math.random() * 2).toFixed(2)),
  Zn: parseFloat((Math.random() * 3).toFixed(2)),
  Ni: parseFloat((Math.random() * 0.03).toFixed(3)),
}));

const whoLimits: Record<string, number> = {
  Pb: 0.05,
  Cd: 0.003,
  As: 0.01,
  Hg: 0.006,
  Cr: 0.05,
  Cu: 2,
  Zn: 3,
  Ni: 0.02,
};

const VisualizePage: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const metals = Object.keys(whoLimits);

  const handleRowClick = (index: number) =>
    setExpandedIndex(expandedIndex === index ? null : index);

  return (
    <div className="p-6 bg-water-pattern min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-foreground">Dataset Samples</h2>

      <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
        <thead className="bg-card/60 backdrop-blur-md">
          <tr>
            <th className="p-3 w-12"></th>
            <th className="p-3 text-left">Sample ID</th>
            {metals.map((metal) => (
              <th key={metal} className="p-3 text-left">
                {metal} (mg/L)
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {samples.map((sample, idx) => (
            <React.Fragment key={sample.Sample_ID}>
              <tr
                onClick={() => handleRowClick(idx)}
                className="cursor-pointer hover:bg-card/30 transition-colors"
              >
                <td className="p-2 text-center">
                  {expandedIndex === idx ? (
                    <ChevronUp className="inline w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="inline w-5 h-5 text-muted-foreground" />
                  )}
                </td>
                <td className="p-2 font-semibold">{sample.Sample_ID}</td>
                {metals.map((metal) => (
                  <td
                    key={metal}
                    className={`p-2 font-mono ${
                      sample[metal] > whoLimits[metal]
                        ? "bg-destructive/20 text-destructive font-semibold"
                        : "text-green-400"
                    }`}
                  >
                    {sample[metal]}
                  </td>
                ))}
              </tr>
              {expandedIndex === idx && (
                <tr>
                  <td colSpan={metals.length + 2} className="p-4 bg-card/30 backdrop-blur-md">
                    <SampleCharts sample={sample} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SampleCharts: React.FC<{ sample: any }> = ({ sample }) => {
  const metals = Object.keys(whoLimits);
  const currentLevels = metals.map((metal) => sample[metal]);
  const limits = metals.map((metal) => whoLimits[metal]);
  const maxLevel = Math.max(...currentLevels, ...limits);

  const getHeatColor = (value: number) => {
    const intensity = Math.min(1, value / maxLevel);
    const red = Math.floor(255 * intensity);
    return `rgb(${red}, 100, 150)`;
  };

  const barData = {
    labels: metals,
    datasets: [
      { label: "Current Level", data: currentLevels, backgroundColor: "rgba(59,130,246,0.7)" },
      { label: "WHO Limit", data: limits, backgroundColor: "rgba(34,197,94,0.7)" },
    ],
  };
  const barOptions = { responsive: true, plugins: { title: { display: true, text: `Sample ${sample.Sample_ID} - Bar Chart` } } };

  const lineData = {
    labels: metals,
    datasets: [
      { label: "Current Level", data: currentLevels, borderColor: "rgba(59,130,246,0.8)", backgroundColor: "rgba(59,130,246,0.3)", fill: true },
      { label: "WHO Limit", data: limits, borderColor: "rgba(34,197,94,0.8)", backgroundColor: "rgba(34,197,94,0.3)", fill: true },
    ],
  };
  const lineOptions = { responsive: true, plugins: { title: { display: true, text: `Sample ${sample.Sample_ID} - Line Chart` } } };

  const pieData = {
    labels: metals,
    datasets: [{ data: currentLevels, backgroundColor: ["#3b82f6","#22c55e","#f97316","#eab308","#8b5cf6","#f43f5e","#14b8a6","#facc15"] }],
  };
  const pieOptions = { responsive: true, plugins: { title: { display: true, text: `Sample ${sample.Sample_ID} - Pie Chart` } } };

  const radarData = {
    labels: metals,
    datasets: [
      { label: "Current", data: currentLevels, backgroundColor: "rgba(59,130,246,0.2)", borderColor: "rgba(59,130,246,0.7)" },
      { label: "WHO", data: limits, backgroundColor: "rgba(34,197,94,0.2)", borderColor: "rgba(34,197,94,0.7)" },
    ],
  };
  const radarOptions = { responsive: true, plugins: { title: { display: true, text: `Sample ${sample.Sample_ID} - Radar Chart` } } };

  return (
    <div className="space-y-8">
      <Bar data={barData} options={barOptions} />
      <Line data={lineData} options={lineOptions} />
      <div style={{ width: "300px", margin: "0 auto" }}>
        <Pie data={pieData} options={pieOptions} />
      </div>
      <Radar data={radarData} options={radarOptions} />

      {/* Heatmap */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Heatmap</h4>
        <div className="grid grid-cols-8 gap-2 text-center">
          {metals.map((metal, idx) => (
            <div key={metal} style={{ backgroundColor: getHeatColor(currentLevels[idx]), padding: "0.8rem", borderRadius: "0.5rem", color: "#fff" }}>
              <strong>{metal}</strong>
              <div>{currentLevels[idx]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisualizePage;
