// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'vet-1' } }),
}));

const toastSpy = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock('@/lib/vetNotes', () => ({
  updateVetNotesAndLaboratory: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/examDate', () => ({
  extractExamDate: vi.fn().mockResolvedValue({ exam_date: null, laboratory: null }),
  updateExamDate: vi.fn().mockResolvedValue(undefined),
  formatExamDate: (d: string) => d,
}));

vi.mock('@/lib/examDuplicateCheck', () => ({
  findDuplicateExam: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/components/dashboard/ClinicalSignsSection', () => ({
  default: () => <div data-testid="clinical-signs-stub" />,
}));

vi.mock('@/components/patient/ClinicalHistoryCard', () => ({
  default: () => <div data-testid="clinical-history-stub" />,
}));

vi.mock('@/components/analysis/AnalysisResults', () => ({
  default: () => <div data-testid="analysis-results-stub" />,
}));

vi.mock('@/components/analysis/ExamReport', () => ({
  default: () => <div data-testid="exam-report-stub" />,
}));

// Controlled mock for the shadcn/radix Select so patient choice can be
// triggered without needing Radix's portal/pointer-capture behavior in
// happy-dom, while still round-tripping value/onValueChange like the real
// component does.
const SelectCtx = React.createContext<{ onValueChange: (v: string) => void }>({
  onValueChange: () => {},
});
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <SelectCtx.Provider value={{ onValueChange }}>
      <div data-testid="patient-select" data-value={value}>{children}</div>
    </SelectCtx.Provider>
  ),
  SelectTrigger: ({ children, id }: any) => <div id={id}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => {
    const { onValueChange } = React.useContext(SelectCtx);
    return (
      <button type="button" onClick={() => onValueChange(value)}>
        {children}
      </button>
    );
  },
}));

import Exams from '../pages/Exams';

const PATIENT = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Rex',
  owner_name: 'Ana',
  breed: 'Labrador',
  age: '3',
  species: 'Canina',
  sex: 'M',
};

function mockFetchSequence() {
  global.fetch = vi.fn((url: string, opts?: any) => {
    if (url.includes('buscar-pacientes')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([PATIENT]),
      } as Response);
    }
    if (url.includes('analisar-arquivo')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            resumo_clinico: 'Resumo de teste',
            resultados: [],
          }),
      } as Response);
    }
    if (url.includes('salvar-exame')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'exam-123' }),
      } as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch to ${url}`));
  }) as unknown as typeof fetch;
}

async function selectPatientAndUpload() {
  render(<Exams />);

  const patientButton = await screen.findByText(/Rex \(Ana\)/i);
  fireEvent.click(patientButton);

  await waitFor(() => {
    expect(screen.getByText('Dados do Paciente')).toBeInTheDocument();
  });

  const file = new File(['dummy'], 'exame.pdf', { type: 'application/pdf' });
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });

  return screen.findByRole('button', { name: /Salvar Exame/i });
}

describe('Exams — persistência do paciente selecionado após salvar', () => {
  beforeEach(() => {
    mockFetchSequence();
    toastSpy.mockClear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('mantém o paciente selecionado visível após salvar o exame com sucesso', async () => {
    const saveButton = await selectPatientAndUpload();

    // Paciente ainda deve estar selecionado neste ponto
    expect(screen.getByText('Dados do Paciente')).toBeInTheDocument();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Exame salvo/i })).toBeInTheDocument();
    });

    // Bug 1: o seletor de paciente NÃO deve voltar ao estado inicial (em branco)
    expect(screen.getByText('Dados do Paciente')).toBeInTheDocument();
    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.queryByText('Selecione um paciente acima para enviar exames.')).not.toBeInTheDocument();
  });

  it('mantém o paciente selecionado após salvar e a página ser remontada (ex: navegar e voltar)', async () => {
    const saveButton = await selectPatientAndUpload();
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Exame salvo/i })).toBeInTheDocument();
    });

    cleanup();

    // Simula sair da tela de Exames e voltar (remontagem do componente)
    render(<Exams />);

    await waitFor(() => {
      expect(screen.getByText('Dados do Paciente')).toBeInTheDocument();
    });
    expect(screen.getByText('Rex')).toBeInTheDocument();
  });

  it('só limpa o paciente selecionado quando o usuário clica em "Novo Exame"', async () => {
    const saveButton = await selectPatientAndUpload();
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Exame salvo/i })).toBeInTheDocument();
    });

    const newExamButton = screen.getByRole('button', { name: /Novo Exame/i });
    fireEvent.click(newExamButton);

    expect(screen.queryByText('Dados do Paciente')).not.toBeInTheDocument();
    expect(
      screen.getByText('Selecione um paciente acima para enviar exames.')
    ).toBeInTheDocument();
  });
});

describe('Exams — visibilidade e feedback do botão Salvar Exame', () => {
  beforeEach(() => {
    mockFetchSequence();
    toastSpy.mockClear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('a barra de ação com o botão Salvar Exame é fixa (sticky) para permanecer visível ao rolar a tela', async () => {
    const saveButton = await selectPatientAndUpload();

    const actionBar = saveButton.closest('div[class*="sticky"]');
    expect(actionBar).not.toBeNull();
    expect(actionBar?.className).toMatch(/sticky/);
  });

  it('mostra mensagem de erro clara e persistente quando salvar o exame falha', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('buscar-pacientes')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([PATIENT]) } as Response);
      }
      if (url.includes('analisar-arquivo')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ resumo_clinico: 'Resumo', resultados: [] }),
        } as Response);
      }
      if (url.includes('salvar-exame')) {
        return Promise.resolve({ ok: false, status: 500 } as Response);
      }
      return Promise.reject(new Error(`Unexpected fetch to ${url}`));
    }) as unknown as typeof fetch;

    const saveButton = await selectPatientAndUpload();
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(/não foi possível salvar o exame/i)
      ).toBeInTheDocument();
    });
  });

  it('mostra mensagem de erro clara quando a análise do upload falha', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url.includes('buscar-pacientes')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([PATIENT]) } as Response);
      }
      if (url.includes('analisar-arquivo')) {
        return Promise.resolve({ ok: false, status: 500 } as Response);
      }
      return Promise.reject(new Error(`Unexpected fetch to ${url}`));
    }) as unknown as typeof fetch;

    render(<Exams />);
    const patientButton = await screen.findByText(/Rex \(Ana\)/i);
    fireEvent.click(patientButton);
    await waitFor(() => {
      expect(screen.getByText('Dados do Paciente')).toBeInTheDocument();
    });

    const file = new File(['dummy'], 'exame.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(/não foi possível analisar o arquivo/i)
      ).toBeInTheDocument();
    });
  });
});
