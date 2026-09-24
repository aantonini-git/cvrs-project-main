import { createContext, useState } from "react";

export const DataContext = createContext();

export function DataProvider({ children }) {

  const [data, setData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoricalData, setCategoricalData] = useState([]);
  const [identifiersList, setIdentifiersList] = useState([]);
  const [selectedIdentifier, setSelectedIdentifier] = useState([]);

  const value = {
    data,
    setData,
    selectedIds,
    setSelectedIds,
    selectedCategory,
    setSelectedCategory,
    categoricalData,
    setCategoricalData,
    identifiersList,
    setIdentifiersList,
    selectedIdentifier, 
    setSelectedIdentifier
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}