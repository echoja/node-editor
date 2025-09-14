import React, { createContext, useContext } from "react";
import type { EnginePort } from "../engine/port";
import { pureEngine } from "../engine/pure";

const EngineContext = createContext<EnginePort>(pureEngine);

export const EngineProvider: React.FC<{ engine?: EnginePort; children: React.ReactNode }> = ({ engine, children }) => {
  const value = engine ?? pureEngine;
  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
};

export function useEngine(): EnginePort {
  return useContext(EngineContext);
}

