// src/Components/FilterContext.jsx
import React, { createContext, useContext, useState } from "react";

// Create Context
const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [year, setYear] = useState("Yearly");
  const [sector, setSector] = useState("All");
  const [riskLevel, setRiskLevel] = useState("All");

  return (
    <FilterContext.Provider
      value={{ year, setYear, sector, setSector, riskLevel, setRiskLevel }}
    >
      {children}
    </FilterContext.Provider>
  );
};

// Custom hook to access filters easily
export const useFilters = () => useContext(FilterContext);
