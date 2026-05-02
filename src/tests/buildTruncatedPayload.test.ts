import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildTruncatedPayload } from '../lib/anamnesisApi';

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
