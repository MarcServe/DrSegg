"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { KnowledgeMatch } from "@/lib/ai/schemas";
import type { TreatmentRow } from "@/lib/ai/treatments";

const SESSION_KEY = "dr_segira_case_state";

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
  /** KB condition_code from analyze snapshot — matches server treatment resolution when present */
  resolvedConditionCode: string | null;
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
  region: "Global",
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
  resolvedConditionCode: null,
};

function loadFromSession(): CaseState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<CaseState>;
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export function CaseProvider({ children }: { children: ReactNode }) {
  const [caseState, setCaseState] = useState<CaseState>(initialState);

  // Rehydrate from sessionStorage on first mount (survives page refresh)
  useEffect(() => {
    const saved = loadFromSession();
    if (saved.caseId || saved.animalType) {
      setCaseState(saved);
    }
  }, []);

  // Persist to sessionStorage on every state change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(caseState));
    } catch {
      // sessionStorage unavailable (private mode quota) — silent
    }
  }, [caseState]);

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
  const resetCase = useCallback(() => {
    if (typeof window !== "undefined") {
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    }
    setCaseState(initialState);
  }, []);

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
