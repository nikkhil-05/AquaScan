import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from "lucide-react";

const ExportPage = () => {
  // URLs for downloadable files
  const pdfUrl = "/files/hmpi_report.pdf"; // replace with actual path
  const excelUrl = "/files/hmpi_data.xlsx"; // replace with actual path

  return (
    <div className="p-8 space-x-10 space-y-10">
      <h1 className="text-3xl font-bold mb-4">Export Analysis Results</h1>
      <p className="text-muted-foreground mb-8">
        Download your computed HMPI data in various formats for reporting and further analysis
      </p>

      {/* Grid Container for 2x2 Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* PDF Report Card 1 */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> PDF Long Summary
            </CardTitle>
            <CardDescription>Complete analysis report with charts and maps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~2.5 MB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Executive Summary</li>
              <li>Data Tables</li>
              <li>Visualizations</li>
              <li>Intra Sample Analysis</li>
            </ul>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button className="mt-4 w-full">Download PDF Report</Button>
            </a>
          </CardContent>
        </Card>

        {/* PDF Report Card 2 */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> PDF Short Summary
            </CardTitle>
            <CardDescription>Complete analysis report with charts and maps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~2.5 MB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Executive Summary</li>
              <li>Data Tables</li>
              <li>Visualizations</li>
              <li>Inter Sample Analysis</li>
            </ul>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button className="mt-4 w-full">Download PDF Report</Button>
            </a>
          </CardContent>
        </Card>

        {/* PDF Report Card 3 */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Download Your Map
            </CardTitle>
            <CardDescription>Complete analysis report with charts and maps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~2.5 MB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Interactive Map</li>
              <li>Categorization</li>
              <li>Visualizations</li>
              <li>Geographic Overview</li>
            </ul>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button className="mt-4 w-full">Download PDF Report</Button>
            </a>
          </CardContent>
        </Card>

        {/* Excel Workbook Card */}
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" /> Excel Workbook
            </CardTitle>
            <CardDescription>Raw data with computed indices in spreadsheet format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">~850 KB</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
              <li>Raw Data</li>
              <li>Computed Indices</li>
              <li>Summary Statistics</li>
              <li>Metadata</li>
            </ul>
            <a href={excelUrl} target="_blank" rel="noopener noreferrer">
              <Button className="mt-4 w-full">Download Excel Workbook</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExportPage;
