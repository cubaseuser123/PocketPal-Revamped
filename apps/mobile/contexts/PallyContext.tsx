import React, { createContext, useContext, useState, ReactNode } from "react";

interface PallyContextType {
  isPallyOpen: boolean;
  openPally: () => void;
  closePally: () => void;
  togglePally: () => void;
}

const PallyContext = createContext<PallyContextType | undefined>(undefined);

export function PallyProvider({ children }: { children: ReactNode }) {
  const [isPallyOpen, setIsPallyOpen] = useState(false);

  const openPally = () => setIsPallyOpen(true);
  const closePally = () => setIsPallyOpen(false);
  const togglePally = () => setIsPallyOpen((prev) => !prev);

  return (
    <PallyContext.Provider
      value={{ isPallyOpen, openPally, closePally, togglePally }}
    >
      {children}
    </PallyContext.Provider>
  );
}

export function usePally() {
  const context = useContext(PallyContext);
  if (!context) {
    throw new Error("usePally must be used within a PallyProvider");
  }
  return context;
}
