// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aggregateSaveResults } from '../lib/soapSaveOrchestrator';
import React, { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SOAPCard, { type SOAPCardHandle } from '../components/consultation/SOAPCard';

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockUpsert, mockSonnerSuccess } = vi.hoisted(() => ({
  mockUpsert: vi.fn().mockResolvedValue({ error: null }),
  mockSonnerSuccess: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
  },
}));

vi.mock('@/contexts/PatientContext', () => ({
  usePatient: () => ({ refreshPatientState: vi.fn() }),
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: mockSonnerSuccess, error: vi.fn(), warning: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

// ── Pure function tests ──────────────────────────────────────────────────────

describe('aggregateSaveResults', () => {
  it('retorna success:true quando todos os cards salvam', () => {
    const results = [
      { ok: true, letter: 'S' },
      { ok: true, letter: 'O' },
      { ok: true, letter: 'A' },
      { ok: true, letter: 'P' },
    ];
    expect(aggregateSaveResults(results)).toEqual({ success: true, failedLetters: [] });
  });

  it('retorna success:false com letras dos blocos que falharam', () => {
    const results = [
      { ok: true, letter: 'S' },
      { ok: false, letter: 'O' },
      { ok: true, letter: 'A' },
      { ok: false, letter: 'P' },
    ];
    expect(aggregateSaveResults(results)).toEqual({ success: false, failedLetters: ['O', 'P'] });
  });

  it('ignora entradas undefined (cards com save() sem resposta)', () => {
    const results = [
      { ok: true, letter: 'S' },
      undefined,
      { ok: true, letter: 'A' },
      undefined,
    ];
    expect(aggregateSaveResults(results)).toEqual({ success: true, failedLetters: [] });
  });
});

// ── SOAPCard helpers ─────────────────────────────────────────────────────────

const baseProps = {
  letter: 'S',
  title: 'Subjetivo',
  subtitle: 'Anamnese',
  placeholder: 'Digite aqui...',
  value: 'conteúdo inicial',
  onChange: vi.fn(),
  accentColor: 'hsl(210,70%,50%)',
  icon: null,
  patientId: 'patient-123',
};

// ── save() via ref ───────────────────────────────────────────────────────────

describe('SOAPCard — save() via ref', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('retorna ok:true e não chama upsert quando conteúdo está vazio', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<SOAPCard {...baseProps} value="" ref={ref} />);

    const result = await act(() => ref.current!.save());

    expect(result).toEqual({ ok: true, letter: 'S' });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('retorna ok:true e chama upsert quando há conteúdo', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<SOAPCard {...baseProps} ref={ref} />);

    const result = await act(() => ref.current!.save());

    expect(result).toEqual({ ok: true, letter: 'S' });
    expect(mockUpsert).toHaveBeenCalledOnce();
  });
});

// ── isDirty indicator ────────────────────────────────────────────────────────

describe('SOAPCard — indicador isDirty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('não exibe o ponto laranja no estado inicial', () => {
    render(<SOAPCard {...baseProps} />);
    expect(screen.queryByLabelText('alterações não salvas')).not.toBeInTheDocument();
  });

  it('exibe o ponto laranja após editar o conteúdo', () => {
    render(<SOAPCard {...baseProps} />);
    const textarea = screen.getByPlaceholderText('Digite aqui...');

    fireEvent.change(textarea, { target: { value: 'conteúdo editado' } });

    expect(screen.getByLabelText('alterações não salvas')).toBeInTheDocument();
  });

  it('remove o ponto laranja após save() via ref com sucesso', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<SOAPCard {...baseProps} ref={ref} />);
    const textarea = screen.getByPlaceholderText('Digite aqui...');

    fireEvent.change(textarea, { target: { value: 'conteúdo editado' } });
    expect(screen.getByLabelText('alterações não salvas')).toBeInTheDocument();

    await act(() => ref.current!.save());

    expect(screen.queryByLabelText('alterações não salvas')).not.toBeInTheDocument();
  });
});

// ── ECC (body_condition_score) ─────────────────────────────────────────────

const oBaseProps = {
  letter: 'O',
  title: 'Objetivo',
  subtitle: 'Exame físico',
  placeholder: 'Digite aqui...',
  value: '',
  onChange: vi.fn(),
  accentColor: 'hsl(160,60%,40%)',
  icon: null,
  patientId: 'patient-123',
};

describe('SOAPCard — Escore de Condição Corporal (ECC)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('inclui body_condition_score no upsert quando preenchido no bloco O', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<SOAPCard {...oBaseProps} bodyConditionScore="7" ref={ref} />);

    await act(() => ref.current!.save());

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ body_condition_score: 7 }),
      expect.anything()
    );
  });

  it('envia body_condition_score null quando não preenchido no bloco O', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<SOAPCard {...oBaseProps} weightKg="4.5" ref={ref} />);

    await act(() => ref.current!.save());

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ body_condition_score: null }),
      expect.anything()
    );
  });

  it('não inclui body_condition_score para blocos que não são O', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<SOAPCard {...baseProps} bodyConditionScore="7" value="conteúdo" ref={ref} />);

    await act(() => ref.current!.save());

    const [payload] = mockUpsert.mock.calls[0];
    expect(payload).not.toHaveProperty('body_condition_score');
  });
});
