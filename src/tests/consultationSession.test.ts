import { describe, it, expect } from 'vitest';
import {
  sessionReducer,
  initialSession,
  type ConsultationSession,
} from '../lib/consultationSession';

const mockComplaint = {
  id: 'c-001',
  label: 'Vômito persistente há mais de 24h',
  topic: 'Vômito',
  followup: 'Há quanto tempo o animal está vomitando?',
  options: ['Menos de 12h', 'Entre 12h e 24h', 'Mais de 24h'],
};

const mockAnswer = {
  question: 'Há quanto tempo o animal está vomitando?',
  answer: 'Mais de 24h',
};

// ─── SELECT_COMPLAINT ────────────────────────────────────────────────────────

describe('SELECT_COMPLAINT', () => {
  it('seta complaint e avança step para 1', () => {
    const next = sessionReducer(initialSession, {
      type: 'SELECT_COMPLAINT',
      payload: mockComplaint,
    });

    expect(next.complaint).toEqual(mockComplaint);
    expect(next.step).toBe(1);
  });

  it('limpa followupAnswers anteriores ao trocar queixa', () => {
    const withAnswers: ConsultationSession = {
      ...initialSession,
      step: 2,
      complaint: mockComplaint,
      followupAnswers: [mockAnswer],
    };

    const next = sessionReducer(withAnswers, {
      type: 'SELECT_COMPLAINT',
      payload: { ...mockComplaint, id: 'c-002', topic: 'Letargia' },
    });

    expect(next.followupAnswers).toHaveLength(0);
    expect(next.step).toBe(1);
  });
});

// ─── ANSWER_FOLLOWUP ─────────────────────────────────────────────────────────

describe('ANSWER_FOLLOWUP', () => {
  it('empurra a resposta em followupAnswers e avança step para 2', () => {
    const atStep1: ConsultationSession = {
      ...initialSession,
      step: 1,
      complaint: mockComplaint,
    };

    const next = sessionReducer(atStep1, {
      type: 'ANSWER_FOLLOWUP',
      payload: mockAnswer,
    });

    expect(next.followupAnswers).toHaveLength(1);
    expect(next.followupAnswers[0]).toEqual(mockAnswer);
    expect(next.step).toBe(2);
  });

  it('acumula múltiplas respostas sem sobrescrever', () => {
    const atStep1: ConsultationSession = {
      ...initialSession,
      step: 1,
      followupAnswers: [mockAnswer],
    };

    const secondAnswer = { question: 'Outra?', answer: 'Sim' };
    const next = sessionReducer(atStep1, {
      type: 'ANSWER_FOLLOWUP',
      payload: secondAnswer,
    });

    expect(next.followupAnswers).toHaveLength(2);
    expect(next.followupAnswers[1]).toEqual(secondAnswer);
  });
});

// ─── SET_TRANSCRIPTION ───────────────────────────────────────────────────────

describe('SET_TRANSCRIPTION', () => {
  it('atualiza o campo transcription sem alterar outros campos', () => {
    const atStep2: ConsultationSession = {
      ...initialSession,
      step: 2,
      complaint: mockComplaint,
      followupAnswers: [mockAnswer],
    };

    const next = sessionReducer(atStep2, {
      type: 'SET_TRANSCRIPTION',
      payload: 'Animal apático desde ontem.',
    });

    expect(next.transcription).toBe('Animal apático desde ontem.');
    expect(next.step).toBe(2);
    expect(next.complaint).toEqual(mockComplaint);
    expect(next.followupAnswers).toHaveLength(1);
  });
});

// ─── BACK ────────────────────────────────────────────────────────────────────

describe('BACK', () => {
  it('no step 2: volta para step 1 mantendo complaint e followupAnswers', () => {
    const atStep2: ConsultationSession = {
      ...initialSession,
      step: 2,
      complaint: mockComplaint,
      followupAnswers: [mockAnswer],
      transcription: 'Algum texto',
    };

    const next = sessionReducer(atStep2, { type: 'BACK' });

    expect(next.step).toBe(1);
    expect(next.complaint).toEqual(mockComplaint);
    expect(next.followupAnswers).toHaveLength(1);
    expect(next.transcription).toBe('Algum texto');
  });

  it('no step 1: volta para step 0 sem limpar nada', () => {
    const atStep1: ConsultationSession = {
      ...initialSession,
      step: 1,
      complaint: mockComplaint,
    };

    const next = sessionReducer(atStep1, { type: 'BACK' });

    expect(next.step).toBe(0);
    expect(next.complaint).toEqual(mockComplaint);
  });

  it('no step 0: não vai para step negativo', () => {
    const next = sessionReducer(initialSession, { type: 'BACK' });
    expect(next.step).toBe(0);
  });

  it('limpa submitError e reset submitStatus para idle', () => {
    const withError: ConsultationSession = {
      ...initialSession,
      step: 2,
      submitStatus: 'error',
      submitError: 'Falha de rede',
    };

    const next = sessionReducer(withError, { type: 'BACK' });

    expect(next.submitStatus).toBe('idle');
    expect(next.submitError).toBeNull();
  });
});

// ─── SUBMIT_START ────────────────────────────────────────────────────────────

describe('SUBMIT_START', () => {
  it('muda submitStatus para sending e limpa submitError', () => {
    const withError: ConsultationSession = {
      ...initialSession,
      submitStatus: 'error',
      submitError: 'Erro anterior',
    };

    const next = sessionReducer(withError, { type: 'SUBMIT_START' });

    expect(next.submitStatus).toBe('sending');
    expect(next.submitError).toBeNull();
  });
});

// ─── SUBMIT_SUCCESS ──────────────────────────────────────────────────────────

describe('SUBMIT_SUCCESS', () => {
  it('muda submitStatus para success', () => {
    const sending: ConsultationSession = {
      ...initialSession,
      submitStatus: 'sending',
    };

    const next = sessionReducer(sending, { type: 'SUBMIT_SUCCESS' });

    expect(next.submitStatus).toBe('success');
  });
});

// ─── SUBMIT_ERROR ────────────────────────────────────────────────────────────

describe('SUBMIT_ERROR', () => {
  it('muda submitStatus para error e popula submitError', () => {
    const sending: ConsultationSession = {
      ...initialSession,
      submitStatus: 'sending',
    };

    const next = sessionReducer(sending, {
      type: 'SUBMIT_ERROR',
      payload: 'n8n respondeu 500: Internal Server Error',
    });

    expect(next.submitStatus).toBe('error');
    expect(next.submitError).toBe('n8n respondeu 500: Internal Server Error');
  });
});

// ─── RESET ───────────────────────────────────────────────────────────────────

describe('RESET', () => {
  it('volta ao estado inicial completo', () => {
    const dirty: ConsultationSession = {
      step: 2,
      complaint: mockComplaint,
      followupAnswers: [mockAnswer],
      transcription: 'Texto longo',
      submitStatus: 'error',
      submitError: 'Algo deu errado',
    };

    const next = sessionReducer(dirty, { type: 'RESET' });

    expect(next).toEqual(initialSession);
  });
});

// ─── ADVANCE_TO_DYNAMIC ──────────────────────────────────────────────────────

describe('ADVANCE_TO_DYNAMIC', () => {
  it('avança step de 2 para 3 preservando complaint, followupAnswers e transcription', () => {
    const atStep2: ConsultationSession = {
      ...initialSession,
      step: 2,
      complaint: mockComplaint,
      followupAnswers: [mockAnswer],
      transcription: 'Animal apático desde ontem.',
    };

    const next = sessionReducer(atStep2, { type: 'ADVANCE_TO_DYNAMIC' });

    expect(next.step).toBe(3);
    expect(next.complaint).toEqual(mockComplaint);
    expect(next.followupAnswers).toHaveLength(1);
    expect(next.transcription).toBe('Animal apático desde ontem.');
    expect(next.submitStatus).toBe('idle');
  });
});
