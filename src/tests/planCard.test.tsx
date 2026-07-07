// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { createRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanCard from '../components/consultation/PlanCard';
import type { SOAPCardHandle } from '../components/consultation/SOAPCard';

const { mockUpsert } = vi.hoisted(() => ({
  mockUpsert: vi.fn().mockResolvedValue({ error: null }),
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
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), warning: vi.fn() }),
}));

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));

const PLAN_TEXT = `EXAMES SOLICITADOS:
- Hemograma completo — triagem inicial
- Ultrassom abdominal — avaliar estruturas

PROTOCOLO E TRATAMENTO:
- Amoxicilina 10mg/kg a cada 12h por 7 dias

RETORNO E MONITORAMENTO:
Retorno em 7 dias.`;

// ── Fallback mode ──────────────────────────────────────────────────────────────

describe('PlanCard — modo fallback', () => {
  it('exibe textarea livre quando value está vazio', () => {
    render(<PlanCard value="" onChange={vi.fn()} patientId="p-1" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.queryByText('Exames Solicitados')).not.toBeInTheDocument();
  });

  it('exibe textarea livre quando texto não tem seções reconhecidas', () => {
    render(
      <PlanCard value="Amoxicilina 10mg/kg. Retorno em 7 dias." onChange={vi.fn()} patientId="p-1" />,
    );
    expect(screen.queryByText('Exames Solicitados')).not.toBeInTheDocument();
  });
});

// ── Structured mode ────────────────────────────────────────────────────────────

describe('PlanCard — modo estruturado', () => {
  it('exibe as 3 seções quando texto tem formato correto', () => {
    render(<PlanCard value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);
    expect(screen.getByText('Exames Solicitados')).toBeInTheDocument();
    expect(screen.getByText('Protocolo e Tratamento')).toBeInTheDocument();
    expect(screen.getByText('Retorno e Monitoramento')).toBeInTheDocument();
  });

  it('renderiza label para cada item de exame', () => {
    render(<PlanCard value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);
    expect(screen.getByText('Hemograma completo — triagem inicial')).toBeInTheDocument();
    expect(screen.getByText('Ultrassom abdominal — avaliar estruturas')).toBeInTheDocument();
  });

  it('marcar um exame adiciona classe line-through ao label', () => {
    render(<PlanCard value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);
    const label = screen.getByText('Hemograma completo — triagem inicial');
    expect(label.className).not.toContain('line-through');

    fireEvent.click(label);

    expect(screen.getByText('Hemograma completo — triagem inicial').className).toContain('line-through');
  });

  it('desmarcar um exame remove a classe line-through', () => {
    render(
      <PlanCard
        value={PLAN_TEXT}
        onChange={vi.fn()}
        patientId="p-1"
        initialApprovedExams={['Hemograma completo — triagem inicial']}
      />,
    );
    const label = screen.getByText('Hemograma completo — triagem inicial');
    expect(label.className).toContain('line-through');

    fireEvent.click(label);

    expect(screen.getByText('Hemograma completo — triagem inicial').className).not.toContain('line-through');
  });

  it('exibe badge de contagem correta de exames selecionados', () => {
    render(
      <PlanCard
        value={PLAN_TEXT}
        onChange={vi.fn()}
        patientId="p-1"
        initialApprovedExams={['Hemograma completo — triagem inicial']}
      />,
    );
    expect(screen.getByText('1 / 2 selecionados')).toBeInTheDocument();
  });
});

// ── save() via ref ─────────────────────────────────────────────────────────────

describe('PlanCard — save() via ref', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it('retorna ok:true sem chamar upsert quando value está vazio', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<PlanCard ref={ref} value="" onChange={vi.fn()} patientId="p-1" />);

    const result = await act(() => ref.current!.save());

    expect(result).toEqual({ ok: true, letter: 'P' });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('retorna ok:false sem chamar upsert quando patientId não está definido', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<PlanCard ref={ref} value={PLAN_TEXT} onChange={vi.fn()} />);

    const result = await act(() => ref.current!.save());

    expect(result).toEqual({ ok: false, letter: 'P' });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('chama upsert com soap_block P e approved_exams ao salvar', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(<PlanCard ref={ref} value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);

    fireEvent.click(screen.getByText('Hemograma completo — triagem inicial'));

    await act(() => ref.current!.save());

    expect(mockUpsert).toHaveBeenCalledOnce();
    const [[payload]] = mockUpsert.mock.calls;
    expect(payload.soap_block).toBe('P');
    expect(payload.approved_exams).toContain('Hemograma completo — triagem inicial');
    expect(payload.approved_treatments).toEqual([]);
  });

  it('inclui initialApprovedTreatments no upsert quando nenhum checkbox novo é marcado', async () => {
    const ref = createRef<SOAPCardHandle>();
    render(
      <PlanCard
        ref={ref}
        value={PLAN_TEXT}
        onChange={vi.fn()}
        patientId="p-1"
        initialApprovedTreatments={['Amoxicilina 10mg/kg a cada 12h por 7 dias']}
      />,
    );

    await act(() => ref.current!.save());

    const [[payload]] = mockUpsert.mock.calls;
    expect(payload.approved_treatments).toContain('Amoxicilina 10mg/kg a cada 12h por 7 dias');
  });

  it('retorna ok:false quando upsert retorna erro', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } });
    const ref = createRef<SOAPCardHandle>();
    render(<PlanCard ref={ref} value={PLAN_TEXT} onChange={vi.fn()} patientId="p-1" />);

    const result = await act(() => ref.current!.save());

    expect(result).toEqual({ ok: false, letter: 'P' });
  });
});
