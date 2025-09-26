import React from "react";
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
  Filler, // ✅ Register Filler plugin
} from "chart.js";

// Register all Chart.js components
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
  Legend,
  Filler // ✅ Needed for `fill: true` in Line chart
);

interface VisualizeProps {
  dataset?: {
    metals: string[];
    currentLevels: number[];
    whoLimits: number[];
    hmpi?: number;
  };
}

const Visualize: React.FC<VisualizeProps> = ({ dataset }) => {
  if (!dataset) return null;

  const { metals, currentLevels, whoLimits, hmpi } = dataset;

  // Colors for bar chart
  const barColors = currentLevels.map((val, i) =>
    val > whoLimits[i] ? "rgba(220,38,38,0.7)" : "rgba(34,197,94,0.7)"
  );

  // Bar Chart
  const barData = {
    labels: metals,
    datasets: [
      { label: "Current Level (mg/L)", data: currentLevels, backgroundColor: barColors },
      { label: "WHO Safe Limit (mg/L)", data: whoLimits, backgroundColor: "rgba(59,130,246,0.7)" },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Heavy Metal Concentrations" },
    },
  };

  // Line Chart
  const lineData = {
    labels: metals,
    datasets: [
      {
        label: "Current Levels",
        data: currentLevels,
        borderColor: "rgba(220,38,38,0.8)",
        backgroundColor: "rgba(220,38,38,0.2)",
        fill: true, // ✅ Filler plugin needed
      },
      {
        label: "WHO Limits",
        data: whoLimits,
        borderColor: "rgba(34,197,94,0.8)",
        backgroundColor: "rgba(34,197,94,0.2)",
        fill: true,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: { legend: { position: "top" as const }, title: { display: true, text: "Trend Comparison" } },
  };

  // Pie Chart
  const pieData = {
    labels: metals,
    datasets: [
      {
        data: currentLevels,
        backgroundColor: metals.map((_, i) => (currentLevels[i] > whoLimits[i] ? "#dc2626" : "#22c55e")),
      },
    ],
  };

  const pieOptions = { responsive: true, plugins: { title: { display: true, text: "Proportion of Metals" } } };

  // Radar Chart
  const radarData = {
    labels: metals,
    datasets: [
      { label: "Current Levels", data: currentLevels, backgroundColor: "rgba(220,38,38,0.2)", borderColor: "rgba(220,38,38,0.8)" },
      { label: "WHO Limits", data: whoLimits, backgroundColor: "rgba(34,197,94,0.2)", borderColor: "rgba(34,197,94,0.8)" },
    ],
  };

  const radarOptions = { responsive: true, plugins: { title: { display: true, text: "Radar Comparison" } } };

  // Heatmap: color intensity based on level
  const maxLevel = Math.max(...currentLevels, ...whoLimits);
  const getHeatColor = (value: number) => {
    const intensity = Math.min(1, value / maxLevel);
    const red = Math.floor(220 * intensity);
    return `rgb(${red}, 100, 150)`;
  };

  return (
    <div className="space-y-12">
      {hmpi !== undefined && (
        <div className="text-xl font-bold text-foreground mb-4">HMPI: {hmpi.toFixed(2)}</div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Bar Chart: Heavy Metal Concentrations</h3>
        <Bar data={barData} options={barOptions} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Line Chart: Trend Comparison</h3>
        <Line data={lineData} options={lineOptions} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Pie Chart: Distribution of Metals</h3>
        <div style={{ width: "300px", height: "300px", margin: "0 auto" }}>
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Radar Chart: Current vs WHO</h3>
        <Radar data={radarData} options={radarOptions} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Heatmap: Metal Concentrations</h3>
        <div className="grid grid-cols-6 gap-2 text-center">
          {metals.map((metal, idx) => (
            <div
              key={metal}
              style={{
                backgroundColor: getHeatColor(currentLevels[idx]),
                padding: "1rem",
                borderRadius: "0.5rem",
                color: "#fff",
              }}
            >
              <strong>{metal}</strong>
              <div>{currentLevels[idx]} mg/L</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Visualize;
