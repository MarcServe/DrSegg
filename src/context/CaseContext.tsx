"use client";

import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import type { KnowledgeMatch } from "@/lib/ai/schemas";
import type { TreatmentRow } from "@/lib/ai/treatments";

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
  summary: string | null;
  needsMoreInfo: boolean;
  missingInformation: string[];
  redFlags: string[];
  recommendationType: string | null;
  suggestedNextChecks: string[];
  assessmentDisclaimer: string | null;
  differentialDiagnoses: { condition: string; confidence: number }[];
  escalationSuggested: boolean;
  supportingEvidence: string[];
  knowledgeMatches: KnowledgeMatch[];
  treatments: TreatmentRow[];
  modelUsed: string | null;
}

interface CaseContextType {
  caseState: CaseState;
  setCaseId: (id: string) => void;
  setAnimalType: (type: string) => void;
  addSymptom: (symptom: string) => void;
  setHealthStatus: (status: HealthStatus, confidence: number) => void;
  setAnalysisResult: (conditions: string[], severity: string) => void;
  setRegion: (region: string) => void;
  setSymptoms: (symptoms: string[]) => void;
  setAssessmentDetails: (partial: Partial<Omit<CaseState, "caseId" | "animalType" | "symptoms">>) => void;
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
  summary: null,
  needsMoreInfo: false,
  missingInformation: [],
  redFlags: [],
  recommendationType: null,
  suggestedNextChecks: [],
  assessmentDisclaimer: null,
  differentialDiagnoses: [],
  escalationSuggested: false,
  supportingEvidence: [],
  knowledgeMatches: [],
  treatments: [],
  modelUsed: null,
};

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [caseState, setCaseState] = useState<CaseState>(initialState);

  const setCaseId = useCallback((id: string) => setCaseState((prev) => ({ ...prev, caseId: id })), []);
  const setAnimalType = useCallback((type: string) => setCaseState((prev) => ({ ...prev, animalType: type })), []);
  const addSymptom = useCallback(
    (symptom: string) => setCaseState((prev) => ({ ...prev, symptoms: [...prev.symptoms, symptom] })),
    []
  );
  const setHealthStatus = useCallback(
    (status: HealthStatus, confidence: number) =>
      setCaseState((prev) => ({ ...prev, healthStatus: status, confidence })),
    []
  );
  const setAnalysisResult = useCallback(
    (conditions: string[], severity: string) =>
      setCaseState((prev) => ({ ...prev, possibleConditions: conditions, severity })),
    []
  );
  const setRegion = useCallback((region: string) => setCaseState((prev) => ({ ...prev, region })), []);
  const setSymptoms = useCallback((symptoms: string[]) => setCaseState((prev) => ({ ...prev, symptoms })), []);
  const setAssessmentDetails = useCallback(
    (partial: Partial<Omit<CaseState, "caseId" | "animalType" | "symptoms">>) =>
      setCaseState((prev) => ({ ...prev, ...partial })),
    []
  );
  const resetCase = useCallback(() => setCaseState(initialState), []);

  const value = useMemo(
    () => ({
      caseState,
      setCaseId,
      setAnimalType,
      addSymptom,
      setHealthStatus,
      setAnalysisResult,
      setRegion,
      setSymptoms,
      setAssessmentDetails,
      resetCase,
    }),
    [
      caseState,
      setCaseId,
      setAnimalType,
      addSymptom,
      setHealthStatus,
      setAnalysisResult,
      setRegion,
      setSymptoms,
      setAssessmentDetails,
      resetCase,
    ]
  );

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
}

export function useCase() {
  const context = useContext(CaseContext);
  if (context === undefined) {
    throw new Error("useCase must be used within a CaseProvider");
  }
  return context;
}
