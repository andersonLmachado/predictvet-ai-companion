import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchMedicalHistory,
  saveMedicalHistory,
  serializeVaccines,
  type Vaccine,
} from '../lib/medicalHistory';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';

function makeFetchChain(result: { data: any; error: any }) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
}

function makeUpdateChain(result: { error: { message: string } | null }) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue(result),
  };
}

describe('fetchMedicalHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna os campos quando preenchidos', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({
        data: {
          allergies: 'Dipirona',
          previous_diseases: 'Cinomose (2022)',
          vaccines: [{ name: 'V8', date: '2024-03-15' }],
        },
        error: null,
      })
    );
    const result = await fetchMedicalHistory('pat-001');
    expect(result.allergies).toBe('Dipirona');
    expect(result.previousDiseases).toBe('Cinomose (2022)');
    expect(result.vaccines).toEqual([{ name: 'V8', date: '2024-03-15' }]);
  });

  it('retorna defaults quando campos são null', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({
        data: { allergies: null, previous_diseases: null, vaccines: null },
        error: null,
      })
    );
    const result = await fetchMedicalHistory('pat-002');
    expect(result.allergies).toBe('');
    expect(result.previousDiseases).toBe('');
    expect(result.vaccines).toEqual([]);
  });

  it('retorna defaults quando data é null (paciente não encontrado)', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: null, error: null })
    );
    const result = await fetchMedicalHistory('pat-003');
    expect(result.allergies).toBe('');
    expect(result.previousDiseases).toBe('');
    expect(result.vaccines).toEqual([]);
  });

  it('lança quando Supabase retorna erro', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({ data: null, error: { message: 'DB error' } })
    );
    await expect(fetchMedicalHistory('pat-004')).rejects.toThrow('DB error');
  });
});

describe('saveMedicalHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolve sem erro no sucesso', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(makeUpdateChain({ error: null }));
    await expect(
      saveMedicalHistory('pat-001', { allergies: 'Dipirona', previousDiseases: '', vaccines: [] })
    ).resolves.toBeUndefined();
  });

  it('envia allergies como null quando vazio', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);
    await saveMedicalHistory('pat-002', { allergies: '', previousDiseases: '', vaccines: [] });
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ allergies: null, previous_diseases: null })
    );
  });

  it('lança quando Supabase retorna erro', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeUpdateChain({ error: { message: 'RLS violation' } })
    );
    await expect(
      saveMedicalHistory('pat-003', { allergies: '', previousDiseases: '', vaccines: [] })
    ).rejects.toThrow('RLS violation');
  });
});

describe('fetchMedicalHistory — campos estendidos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna os novos campos quando preenchidos', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({
        data: {
          allergies: null,
          previous_diseases: null,
          vaccines: null,
          deworming: [{ date: '2024-01-10', activeIngredient: 'Praziquantel', weightKg: '4.5' }],
          continuous_medications: [
            { name: 'Levotiroxina', dose: '0.1mg', frequency: '1x/dia', indication: 'Hipotireoidismo' },
          ],
          surgeries: [{ date: '2023-05-20', procedure: 'Ovariohisterectomia', anesthesiaReaction: 'Nenhuma' }],
          reproductive_status: 'Castrado',
          reproductive_date: '2023-05-20',
          blood_type: 'DEA 1.1 positivo',
          transfusion_history: 'Nenhuma transfusão prévia',
          infectious_diseases: [
            { disease: 'Leishmaniose', status: 'Negativo', testDate: '2024-02-01', method: 'ELISA' },
          ],
          drug_restrictions: 'MDR1/ABCB1 suspeito',
        },
        error: null,
      })
    );

    const result = await fetchMedicalHistory('pat-010');

    expect(result.deworming).toEqual([{ date: '2024-01-10', activeIngredient: 'Praziquantel', weightKg: '4.5' }]);
    expect(result.continuousMedications).toEqual([
      { name: 'Levotiroxina', dose: '0.1mg', frequency: '1x/dia', indication: 'Hipotireoidismo' },
    ]);
    expect(result.surgeries).toEqual([
      { date: '2023-05-20', procedure: 'Ovariohisterectomia', anesthesiaReaction: 'Nenhuma' },
    ]);
    expect(result.reproductiveStatus).toBe('Castrado');
    expect(result.reproductiveDate).toBe('2023-05-20');
    expect(result.bloodType).toBe('DEA 1.1 positivo');
    expect(result.transfusionHistory).toBe('Nenhuma transfusão prévia');
    expect(result.infectiousDiseases).toEqual([
      { disease: 'Leishmaniose', status: 'Negativo', testDate: '2024-02-01', method: 'ELISA' },
    ]);
    expect(result.drugRestrictions).toBe('MDR1/ABCB1 suspeito');
  });

  it('retorna defaults quando os novos campos são null', async () => {
    vi.mocked(supabase.from as any).mockReturnValue(
      makeFetchChain({
        data: {
          allergies: null,
          previous_diseases: null,
          vaccines: null,
          deworming: null,
          continuous_medications: null,
          surgeries: null,
          reproductive_status: null,
          reproductive_date: null,
          blood_type: null,
          transfusion_history: null,
          infectious_diseases: null,
          drug_restrictions: null,
        },
        error: null,
      })
    );

    const result = await fetchMedicalHistory('pat-011');

    expect(result.deworming).toEqual([]);
    expect(result.continuousMedications).toEqual([]);
    expect(result.surgeries).toEqual([]);
    expect(result.reproductiveStatus).toBe('');
    expect(result.reproductiveDate).toBe('');
    expect(result.bloodType).toBe('');
    expect(result.transfusionHistory).toBe('');
    expect(result.infectiousDiseases).toEqual([]);
    expect(result.drugRestrictions).toBe('');
  });
});

describe('saveMedicalHistory — campos estendidos', () => {
  beforeEach(() => vi.clearAllMocks());

  const fullHistory = {
    allergies: '',
    previousDiseases: '',
    vaccines: [],
    deworming: [{ date: '2024-01-10', activeIngredient: 'Praziquantel', weightKg: '4.5' }],
    continuousMedications: [
      { name: 'Levotiroxina', dose: '0.1mg', frequency: '1x/dia', indication: 'Hipotireoidismo' },
    ],
    surgeries: [{ date: '2023-05-20', procedure: 'Ovariohisterectomia', anesthesiaReaction: 'Nenhuma' }],
    reproductiveStatus: 'Castrado' as const,
    reproductiveDate: '2023-05-20',
    bloodType: 'DEA 1.1 positivo',
    transfusionHistory: '',
    infectiousDiseases: [
      { disease: 'Leishmaniose', status: 'Negativo' as const, testDate: '2024-02-01', method: 'ELISA' },
    ],
    drugRestrictions: 'MDR1/ABCB1 suspeito',
  };

  it('envia os novos campos JSONB e de texto corretamente', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);

    await saveMedicalHistory('pat-012', fullHistory);

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        deworming: fullHistory.deworming,
        continuous_medications: fullHistory.continuousMedications,
        surgeries: fullHistory.surgeries,
        reproductive_status: 'Castrado',
        reproductive_date: '2023-05-20',
        blood_type: 'DEA 1.1 positivo',
        transfusion_history: null,
        infectious_diseases: fullHistory.infectiousDiseases,
        drug_restrictions: 'MDR1/ABCB1 suspeito',
      })
    );
  });

  it('envia campos de texto opcionais como null quando vazios', async () => {
    const chain = makeUpdateChain({ error: null });
    vi.mocked(supabase.from as any).mockReturnValue(chain);

    await saveMedicalHistory('pat-013', {
      ...fullHistory,
      reproductiveStatus: '',
      reproductiveDate: '',
      bloodType: '',
      drugRestrictions: '',
    });

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        reproductive_status: null,
        reproductive_date: null,
        blood_type: null,
        drug_restrictions: null,
      })
    );
  });
});

describe('serializeVaccines', () => {
  it('retorna string vazia para array vazio', () => {
    expect(serializeVaccines([])).toBe('');
  });

  it('serializa vacina com nome e data', () => {
    const vaccines: Vaccine[] = [{ name: 'V8', date: '2024-03-15' }];
    expect(serializeVaccines(vaccines)).toBe('V8 (15/03/2024)');
  });

  it('serializa múltiplas vacinas separadas por vírgula', () => {
    const vaccines: Vaccine[] = [
      { name: 'V8', date: '2024-03-15' },
      { name: 'Antirrábica', date: '2024-03-15' },
    ];
    expect(serializeVaccines(vaccines)).toBe('V8 (15/03/2024), Antirrábica (15/03/2024)');
  });

  it('omite vacinas com nome vazio', () => {
    const vaccines: Vaccine[] = [
      { name: '', date: '2024-01-01' },
      { name: 'V8', date: '2024-03-15' },
    ];
    expect(serializeVaccines(vaccines)).toBe('V8 (15/03/2024)');
  });

  it('exibe apenas o nome quando data está vazia', () => {
    const vaccines: Vaccine[] = [{ name: 'V8', date: '' }];
    expect(serializeVaccines(vaccines)).toBe('V8');
  });
});
