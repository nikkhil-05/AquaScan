import React, { useState } from 'react';
import { useDataset } from '@/context/DataContext';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Visualize from '@/components/Visualize';

const Samples = () => {
  const { data } = useDataset();
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-6">
        <p>No dataset samples available. Please upload a file first on the main page.</p>
      </div>
    );
  }

  // Determine metals dynamically from dataset
  const metals = Array.from(
    new Set(
      data.flatMap(row => Object.keys(row.all_metal_conc || {}))
    )
  );

  // WHO limits
  const whoLimits: Record<string, number> = {
    Lead: 0.05,
    Cadmium: 0.003,
    Arsenic: 0.01,
    Mercury: 0.006,
    Chromium: 0.05,
    Copper: 2,
    Zinc: 3,
    Nickel: 0.02,
  };

//   function getColor(metal: string, value: number) {
//   const limit = whoLimits[metal];

//   if (value > limit) {
//     return "text-red-500 font-semibold bg-red-500/10";   // 🚨 above limit
//   } else if (value > 0.7 * limit) {
//     return "text-yellow-500 font-semibold bg-yellow-500/10"; // ⚠️ near limit
//   } else {
//     return "text-green-500";  // ✅ safe
//   }
// }

  const handleRowClick = (index: number) => {
    setExpandedRowIndex(expandedRowIndex === index ? null : index);
  };

  const prepareDataForVisualize = (row: any) => {
    const currentLevels = metals.map(metal => row.all_metal_conc[metal] || 0);
    const limits = metals.map(metal => whoLimits[metal] || 0);
    return { metals, currentLevels, whoLimits: limits };
  };

  const getLatLng = (geometry: any) => {
    try {
      const geo = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
      return { lat: geo.coordinates[1], lng: geo.coordinates[0] };
    } catch {
      return { lat: '-', lng: '-' };
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Dataset Samples</h2>

      {/* Table Header */}
      <div
  className="flex-shrink-0 border border-border rounded-t-lg overflow-x-auto"
  style={{
    background: "linear-gradient(90deg, rgba(5,78,107,1) 0%, rgba(32,119,186,1) 51%, rgba(83,157,237,1) 100%)"
  }}
>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="w-12 px-2 py-3"></th>
              <th className="px-4 py-3">Sample ID</th>
              <th className="px-4 py-3">Latitude</th>
              <th className="px-4 py-3">Longitude</th>
              {metals.map(m => (
                <th key={m + 'mgL'} className="px-4 py-3">
                  {m} mg L
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* Table Body */}
      <div className="flex-1 border-x border-b border-border rounded-b-lg overflow-auto bg-card max-h-[70vh]">
        <table className="w-full">
          <tbody>
            {data.map((row, index) => {
              const { lat, lng } = getLatLng(row.geometry);
              return (
                <React.Fragment key={row.Sample_ID}>
                  <tr
                    onClick={() => handleRowClick(index)}
                    className="cursor-pointer hover:bg-muted/50 border-b border-border"
                  >
                    <td className="w-12 px-2 py-3 text-center">
                      {expandedRowIndex === index ? (
                        <ChevronUp className="mx-auto w-4 h-4" />
                      ) : (
                        <ChevronDown className="mx-auto w-4 h-4" />
                      )}
                    </td>
                    <td className="px-4 py-3">{row.Sample_ID}</td>
                    <td className="px-4 py-3">{lat}</td>
                    <td className="px-4 py-3">{lng}</td>
                    {metals.map(m => {

                    //   console.log("Metals in row:", Object.keys(row.all_metal_conc));
                    //   console.log("WHO Limits:", Object.keys(whoLimits));

                    // console.log(`Metal: ${m}`, 'Value:', row.all_metal_conc[m], 'Limit:', whoLimits[m]);

                    return (
                      <td
                        key={m}
                        className={`px-4 py-3 font-mono ${
                          row.all_metal_conc[m] > whoLimits[m]
                            ? 'text-red-500 font-semibold bg-red-500/10'
                            : (row.all_metal_conc[m] > 0.6 * whoLimits[m]) && (row.all_metal_conc[m] <= whoLimits[m])
                              ? "text-yellow-500 font-semibold bg-yellow-500/10"
                              : "text-green-500"
                        }`}
                      >
                        {row.all_metal_conc[m] || 0}
                      </td>
                    );
                  })}

                  </tr>

                  {expandedRowIndex === index && (
                    <tr>
                      <td colSpan={4 + metals.length} className="p-0">
                        <div className="p-6 bg-muted/20 border-t border-border">
                          <h4 className="text-lg font-semibold mb-2">
                            Sample {row.Sample_ID} Analysis
                          </h4>
                          <p className="mb-4 text-sm text-muted-foreground">
                            HMPI: <span className="font-semibold">{row.HMPI.toFixed(2)}</span>
                          </p>
                          <Visualize dataset={prepareDataForVisualize(row)} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 text-sm text-muted-foreground flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-destructive/20 border border-destructive rounded"></div>
          <span>Exceeds WHO limits</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400/20 border border-green-400 rounded"></div>
          <span>Within WHO limits</span>
        </div>
      </div>
    </div>
  );
};

export default Samples;
