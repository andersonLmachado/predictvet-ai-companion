import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildTruncatedPayload } from '../lib/anamnesisApi';
import { serializeVaccines } from '../lib/medicalHistory';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

const BASE_PARAMS = {
  consultationId: 'uuid-123',
  patientId: 'patient-456',
  chiefComplaint: 'Vômito persistente',
  followupAnswers: [],
  transcription: 'Animal com vômito há 2 dias.',
  dynamicAnswers: [],
};

describe('buildTruncatedPayload', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('caso normal: payload sem truncamento e sem flag', () => {
    const result = buildTruncatedPayload(BASE_PARAMS);

    expect(result.consultation_id).toBe('uuid-123');
    expect(result.patient_id).toBe('patient-456');
    expect(result.chief_complaint).toBe('Vômito persistente');
    expect(result.transcription).toBe('Animal com vômito há 2 dias.');
    expect(result.followup_answers).toEqual([]);
    expect(result.respostas_truncadas).toBeUndefined();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('transcription longa: trunca a 500 chars e chama console.warn', () => {
    const longText = 'x'.repeat(600);
    const result = buildTruncatedPayload({ ...BASE_PARAMS, transcription: longText });

    expect(result.transcription).toHaveLength(500);
    expect(console.warn).toHaveBeenCalled();
  });

  it('answer longa: trunca cada answer a 300 chars e chama console.warn', () => {
    const longAnswer = { question: 'Pergunta?', answer: 'a'.repeat(400) };
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      followupAnswers: [longAnswer],
    });

    expect(result.followup_answers[0].answer).toHaveLength(300);
    expect(console.warn).toHaveBeenCalled();
  });

  it('followup_answers estoura 2000 chars: remove últimas e adiciona flag', () => {
    const longAnswers = Array.from({ length: 10 }, (_, i) => ({
      question: `Pergunta ${i}?`,
      answer: 'a'.repeat(280),
    }));

    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      followupAnswers: longAnswers,
    });

    expect(JSON.stringify(result.followup_answers).length).toBeLessThanOrEqual(2000);
    expect(result.respostas_truncadas).toBe(true);
    expect(result.followup_answers.length).toBeLessThan(10);
    expect(console.warn).toHaveBeenCalled();
  });

  it('dynamicAnswers merged: 1 followup + 2 dynamic resulta em array com 3 itens na ordem correta', () => {
    const followup = { question: 'Estático?', answer: 'Sim' };
    const dyn1 = { question: 'Dinâmica 1?', answer: 'Não' };
    const dyn2 = { question: 'Dinâmica 2?', answer: 'Não sei' };

    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      followupAnswers: [followup],
      dynamicAnswers: [dyn1, dyn2],
    });

    expect(result.followup_answers).toHaveLength(3);
    expect(result.followup_answers[0]).toEqual(followup);
    expect(result.followup_answers[1]).toEqual(dyn1);
    expect(result.followup_answers[2]).toEqual(dyn2);
  });

  it('arrays vazios: followup_answers vazio sem flag', () => {
    const result = buildTruncatedPayload(BASE_PARAMS);

    expect(result.followup_answers).toEqual([]);
    expect(result.respostas_truncadas).toBeUndefined();
  });

  it('answer concatenada: resposta com mais de 300 chars após concatenação é truncada', () => {
    const answer = { question: 'Tem dor?', answer: `Sim — ${'detalhe '.repeat(60)}` };
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      dynamicAnswers: [answer],
    });

    expect(result.followup_answers[0].answer).toHaveLength(300);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('clinical_history injection', () => {
  it('inclui clinical_history no payload quando preenchido', () => {
    const result = buildTruncatedPayload({
      consultationId: 'c1',
      patientId: 'p1',
      chiefComplaint: 'tosse',
      followupAnswers: [],
      transcription: '',
      dynamicAnswers: [],
      clinicalHistory: 'Diabetes tipo 2',
    });
    expect(result.clinical_history).toBe('Diabetes tipo 2');
  });

  it('omite clinical_history quando vazio', () => {
    const result = buildTruncatedPayload({
      consultationId: 'c1',
      patientId: 'p1',
      chiefComplaint: 'tosse',
      followupAnswers: [],
      transcription: '',
      dynamicAnswers: [],
      clinicalHistory: '',
    });
    expect(result.clinical_history).toBeUndefined();
  });

  it('trunca clinical_history para 500 chars', () => {
    const longText = 'A'.repeat(600);
    const result = buildTruncatedPayload({
      consultationId: 'c1',
      patientId: 'p1',
      chiefComplaint: 'tosse',
      followupAnswers: [],
      transcription: '',
      dynamicAnswers: [],
      clinicalHistory: longText,
    });
    expect(result.clinical_history).toHaveLength(500);
  });
});

describe('medical history injection', () => {
  it('inclui allergies quando preenchido, truncado a 300 chars', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      allergies: 'Dipirona',
    });
    expect(result.allergies).toBe('Dipirona');
  });

  it('omite allergies quando vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, allergies: '' });
    expect(result.allergies).toBeUndefined();
  });

  it('trunca allergies a 300 chars', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      allergies: 'A'.repeat(400),
    });
    expect(result.allergies).toHaveLength(300);
  });

  it('inclui previous_diseases quando preenchido', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      previousDiseases: 'Cinomose (2022)',
    });
    expect(result.previous_diseases).toBe('Cinomose (2022)');
  });

  it('omite previous_diseases quando vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, previousDiseases: '' });
    expect(result.previous_diseases).toBeUndefined();
  });

  it('inclui vaccines serializado quando array não-vazio', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      vaccines: [{ name: 'V8', date: '2024-03-15' }],
    });
    expect(result.vaccines).toBe('V8 (15/03/2024)');
  });

  it('omite vaccines quando array vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, vaccines: [] });
    expect(result.vaccines).toBeUndefined();
  });

  it('omite vaccines quando undefined', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS });
    expect(result.vaccines).toBeUndefined();
  });
});

describe('extended medical history injection', () => {
  it('inclui continuous_medications serializado e truncado a 300 chars', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      continuousMedications: [
        { name: 'Enrofloxacino', dose: '10mg', frequency: '2x/dia', indication: 'Piometra' },
      ],
    });
    expect(result.continuous_medications).toBe('Enrofloxacino 10mg 2x/dia (Piometra)');
  });

  it('omite continuous_medications quando array vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, continuousMedications: [] });
    expect(result.continuous_medications).toBeUndefined();
  });

  it('trunca continuous_medications a 300 chars', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      continuousMedications: [{ name: 'A'.repeat(400), dose: '', frequency: '', indication: '' }],
    });
    expect(result.continuous_medications).toHaveLength(300);
  });

  it('inclui drug_restrictions quando preenchido, truncado a 300 chars', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      drugRestrictions: 'MDR1/ABCB1 em raças pastoras',
    });
    expect(result.drug_restrictions).toBe('MDR1/ABCB1 em raças pastoras');
  });

  it('omite drug_restrictions quando vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, drugRestrictions: '' });
    expect(result.drug_restrictions).toBeUndefined();
  });

  it('trunca drug_restrictions a 300 chars', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, drugRestrictions: 'A'.repeat(400) });
    expect(result.drug_restrictions).toHaveLength(300);
  });

  it('inclui reproductive_status quando preenchido', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, reproductiveStatus: 'Castrado' });
    expect(result.reproductive_status).toBe('Castrado');
  });

  it('omite reproductive_status quando vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, reproductiveStatus: '' });
    expect(result.reproductive_status).toBeUndefined();
  });

  it('inclui infectious_diseases serializado quando array não-vazio', () => {
    const result = buildTruncatedPayload({
      ...BASE_PARAMS,
      infectiousDiseases: [
        { disease: 'Leishmaniose', status: 'Positivo', testDate: '2024-03-15', method: 'ELISA' },
      ],
    });
    expect(result.infectious_diseases).toBe('Leishmaniose: Positivo (ELISA, 15/03/2024)');
  });

  it('omite infectious_diseases quando array vazio', () => {
    const result = buildTruncatedPayload({ ...BASE_PARAMS, infectiousDiseases: [] });
    expect(result.infectious_diseases).toBeUndefined();
  });
});
