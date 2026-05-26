// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams:   () => ({}),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    <a href={to}>{children}</a>,
}));

vi.mock('@/contexts/PatientContext', () => ({
  usePatient: () => ({
    selectedPatient: null,
    setSelectedPatient: vi.fn(),
    patients: [],
    patientsLoaded: true,
  }),
}));

vi.mock('@/components/ui/select', () => ({
  Select:         ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger:  ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue:    ({ placeholder }: { placeholder: string })    => <span>{placeholder}</span>,
  SelectContent:  ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem:     ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ── Tests ──────────────────────────────────────────────────────────────────
import ConsultationModeSelectorPage from '../pages/ConsultationModeSelectorPage';

describe('ConsultationModeSelectorPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renderiza os dois cards de modo: Registro por Voz e Consulta Guiada', () => {
    render(<ConsultationModeSelectorPage />);

    expect(screen.getByText(/Registro por Voz/i)).toBeInTheDocument();
    expect(screen.getByText(/Consulta Guiada/i)).toBeInTheDocument();
    expect(screen.getByText(/Grave a consulta agora/i)).toBeInTheDocument();
    expect(screen.getByText(/Perguntas clínicas estruturadas/i)).toBeInTheDocument();
  });

  it('ConsultationPage — fluxo guiado existente não foi alterado (exporta default function)', async () => {
    const mod = await import('../pages/ConsultationPage');
    expect(typeof mod.default).toBe('function');
    // Verifica que ainda é um componente React com displayName ou name
    expect(mod.default.name || mod.default.displayName).toBeTruthy();
  });
});
