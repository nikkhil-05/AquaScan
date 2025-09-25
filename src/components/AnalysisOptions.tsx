import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import WaterBackground from "@/components/WaterBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AnalysisOptions = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = ["Samples", "map", "export"] as const;
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Samples");

  // Set active tab based on URL
  useEffect(() => {
    const path = location.pathname.split("/").pop();
    if (tabs.includes(path as any)) {
      setActiveTab(path as any);
    } else {
      // Default to "visualize" if URL doesn't match
      navigate("/analysis/visualize", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleTabClick = (tab: typeof tabs[number]) => {
    if (tab === "map") {
      // Open Google in a new tab
      window.open("https://www.google.com", "_blank");
    } else {
      setActiveTab(tab);
      navigate(`/analysis/${tab}`);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <WaterBackground />

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Analysis Ready
          </h2>
          <p className="text-muted-foreground text-lg">
            Select an option below to continue your analysis
          </p>
        </div>

        <Card className="p-8 bg-card/40 backdrop-blur-water border-border/30 shadow-water">
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-4 flex-wrap">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  className={`${
                    activeTab === tab
                      ? "bg-water-primary text-white"
                      : "bg-muted/20 text-foreground"
                  }`}
                  onClick={() => handleTabClick(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Button>
              ))}
            </div>

            {/* Page content below tabs */}
            <div className="mt-6">
              <Outlet />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalysisOptions;
