"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type HealthStatus = "healthy" | "mild_concern" | "likely_sick" | "critical" | null;

interface CaseState {
  caseId: string | null;
  animalType: string | null;
  symptoms: string[];
  healthStatus: HealthStatus;
  confidence: number;
  possibleConditions: string[];
  severity: string | null;
  region: string;
}

interface CaseContextType {
  caseState: CaseState;
  setCaseId: (id: string) => void;
  setAnimalType: (type: string) => void;
  addSymptom: (symptom: string) => void;
  setHealthStatus: (status: HealthStatus, confidence: number) => void;
  setAnalysisResult: (conditions: string[], severity: string) => void;
  setRegion: (region: string) => void;
  resetCase: () => void;
}

const initialState: CaseState = {
  caseId: null,
  animalType: null,
  symptoms: [],
  healthStatus: null,
  confidence: 0,
  possibleConditions: [],
  severity: null,
  region: "Northern Highlands District",
};

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [caseState, setCaseState] = useState<CaseState>(initialState);

  const setCaseId = (id: string) => setCaseState((prev) => ({ ...prev, caseId: id }));
  const setAnimalType = (type: string) => setCaseState((prev) => ({ ...prev, animalType: type }));
  const addSymptom = (symptom: string) => setCaseState((prev) => ({ ...prev, symptoms: [...prev.symptoms, symptom] }));
  const setHealthStatus = (status: HealthStatus, confidence: number) => setCaseState((prev) => ({ ...prev, healthStatus: status, confidence }));
  const setAnalysisResult = (conditions: string[], severity: string) => setCaseState((prev) => ({ ...prev, possibleConditions: conditions, severity }));
  const setRegion = (region: string) => setCaseState((prev) => ({ ...prev, region }));
  const resetCase = () => setCaseState(initialState);

  return (
    <CaseContext.Provider
      value={{
        caseState,
        setCaseId,
        setAnimalType,
        addSymptom,
        setHealthStatus,
        setAnalysisResult,
        setRegion,
        resetCase,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
}

export function useCase() {
  const context = useContext(CaseContext);
  if (context === undefined) {
    throw new Error("useCase must be used within a CaseProvider");
  }
  return context;
}
