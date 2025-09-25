import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const DatasetUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendData, setBackendData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // open file dialog
  const openFileDialog = () => fileInputRef.current?.click();

  // handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadFileToBackend(files[0]);
    }
  };

  // upload file to backend
  const uploadFileToBackend = async (file: File) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: 'Invalid File Type',
        description: 'Upload CSV or Excel',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Max size 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;
      console.log('Backend response:', data);

      setBackendData(data);
      setIsProcessing(false);

      toast({
        title: 'Upload Successful',
        description: `${file.name} processed successfully!`,
      });
    } catch (error: any) {
      console.error(error);
      setIsProcessing(false);
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.error || 'Server error',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Upload Groundwater Dataset</h2>
          <p className="text-muted-foreground">
            Upload heavy metal data with geo-coordinates for HMPI analysis
          </p>
        </div>

        {!uploadedFile ? (
          <div className="relative border-2 border-water-primary bg-water-primary/20 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              {/* upload icon (clickable) */}
              <div
                className="p-4 rounded-full bg-water-primary/20 cursor-pointer"
                onClick={openFileDialog}
              >
                <Upload className="w-8 h-8 text-water-primary" />
              </div>

              <p className="text-lg font-medium mb-2">Drop your dataset here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse files
              </p>

              {/* button to select file */}
              <Button
                onClick={openFileDialog}
                variant="outline"
                className="border-water-primary text-water-primary"
              >
                Select File
              </Button>

              <div className="text-xs text-muted-foreground mt-2">
                Supported: CSV, Excel (.xlsx, .xls) • Max 10MB
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border">
              <FileSpreadsheet className="w-8 h-8 text-water-primary" />
              <div className="flex-1">
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {isProcessing && (
                <div className="text-water-primary animate-spin">Processing...</div>
              )}
            </div>

            {/* ✅ show Go to Analysis only after processing */}
            {backendData && !isProcessing && (
              <Button
                onClick={() =>
                  navigate('/analysis', {
                    state: {
                      geojson: backendData.GeoJSON,
                      fileName: uploadedFile?.name,
                    },
                  })
                }
                className="self-end bg-water-primary text-white"
              >
                Go to Analysis
              </Button>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-water-secondary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Dataset Requirements:</p>
              <ul className="space-y-1 text-xs">
                <li>• Heavy metal values (mg/L or μg/L)</li>
                <li>• Geographic coordinates (lat, long)</li>
                <li>• Standard column headers</li>
                <li>• Supported metals: Pb, Cd, As, Hg, Cr, Cu, Zn, Ni</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatasetUpload;
