import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DatasetUpload from "./components/DatasetUpload";
import AnalysisOptions from "./components/AnalysisOptions";
import Visualize from "./components/Visualize";
import ResultPage from "./components/Result";
import MapPage from "./components/Map";
import ExportPage from "./components/Export";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/upload" element={<DatasetUpload />} />

          {/* Nested routes for Analysis */}
          <Route path="/analysis" element={<AnalysisOptions />}>
            <Route index element={<Visualize />} /> {/* default when /analysis */}
            <Route path="visualize" element={<Visualize />} />
            <Route path="result" element={<ResultPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="export" element={<ExportPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
