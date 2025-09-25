import React, { createContext, useState, useContext, ReactNode } from 'react';

interface DatasetContextType {
  data: any[];
  setData: (data: any[]) => void;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<any[]>([]);

  return (
    <DatasetContext.Provider value={{ data, setData }}>
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = () => {
  const context = useContext(DatasetContext);
  if (context === undefined) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
};