import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface PatientInfo {
  id: string;
  name: string;
  owner_name: string;
  species?: string;
  breed?: string;
  age?: string | number | null;
}

interface PatientContextType {
  selectedPatient: PatientInfo | null;
  setSelectedPatient: (patient: PatientInfo | null) => void;
  patients: PatientInfo[];
  loadPatients: () => Promise<void>;
  patientsLoaded: boolean;
  consultationRefreshKey: number;
  refreshPatientState: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

const STORAGE_KEY = 'predictlab_selected_patient';
const API_PATIENTS_URL = 'https://n8nvet.predictlab.com.br/webhook/buscar-pacientes';

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPatient, setSelectedPatientState] = useState<PatientInfo | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [consultationRefreshKey, setConsultationRefreshKey] = useState(0);

  const setSelectedPatient = useCallback((patient: PatientInfo | null) => {
    setSelectedPatientState(patient);
    if (patient) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(patient));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const response = await fetch(API_PATIENTS_URL);
      if (!response.ok) throw new Error('Falha ao buscar pacientes');
      const data = await response.json();
      const rawList = Array.isArray(data) ? data : data?.id != null ? [data] : [];
      const list: PatientInfo[] = rawList.map((p: any) => ({
        id: String(p.id),
        name: p.name ?? '',
        owner_name: p.owner_name ?? '',
        species: p.species ?? '',
        breed: p.breed ?? '',
        age: p.age ?? null,
      }));
      setPatients(list);
      setPatientsLoaded(true);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      setPatientsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const refreshPatientState = useCallback(() => {
    setConsultationRefreshKey((prev) => prev + 1);

    if (selectedPatient) {
      // Force a new object reference so dependent screens can react immediately.
      setSelectedPatientState({ ...selectedPatient });
    }
  }, [selectedPatient]);

  return (
    <PatientContext.Provider
      value={{
        selectedPatient,
        setSelectedPatient,
        patients,
        loadPatients,
        patientsLoaded,
        consultationRefreshKey,
        refreshPatientState,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatient must be used within PatientProvider');
  return context;
};
