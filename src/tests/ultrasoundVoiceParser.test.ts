// src/tests/ultrasoundVoiceParser.test.ts
import { describe, it, expect } from 'vitest';
import { parseVoiceMeasurements } from '../lib/ultrasoundVoiceParser';

describe('parseVoiceMeasurements — bladder', () => {
  it('extracts bladder wall from "parede zero vírgula quatorze"', () => {
    const result = parseVoiceMeasurements('parede zero vírgula quatorze', 'bladder');
    expect(result.bladder_wall_cm).toBeCloseTo(0.14);
  });

  it('extracts bladder wall from digits "parede 0.13"', () => {
    const result = parseVoiceMeasurements('parede 0.13', 'bladder');
    expect(result.bladder_wall_cm).toBeCloseTo(0.13);
  });
});

describe('parseVoiceMeasurements — kidney', () => {
  it('extracts both kidneys', () => {
    const result = parseVoiceMeasurements(
      'rim esquerdo três vírgula dois rim direito três vírgula quatro',
      'kidney',
    );
    expect(result.kidney_left_cm).toBeCloseTo(3.2);
    expect(result.kidney_right_cm).toBeCloseTo(3.4);
  });

  it('extracts pelvis measurements', () => {
    const result = parseVoiceMeasurements(
      'pelve esquerda zero vírgula quinze pelve direita zero vírgula dezesseis',
      'kidney',
    );
    expect(result.kidney_pelvis_left_cm).toBeCloseTo(0.15);
    expect(result.kidney_pelvis_right_cm).toBeCloseTo(0.16);
  });
});

describe('parseVoiceMeasurements — pancreas', () => {
  it('extracts right and left lobes', () => {
    const result = parseVoiceMeasurements(
      'lobo direito zero vírgula oito lobo esquerdo zero vírgula seis',
      'pancreas',
    );
    expect(result.pancreas_right_lobe_cm).toBeCloseTo(0.8);
    expect(result.pancreas_left_lobe_cm).toBeCloseTo(0.6);
  });

  it('extracts duct', () => {
    const result = parseVoiceMeasurements('ducto zero vírgula dez', 'pancreas');
    expect(result.pancreas_duct_cm).toBeCloseTo(0.10);
  });
});

describe('parseVoiceMeasurements — intestine', () => {
  it('extracts duodenum', () => {
    const result = parseVoiceMeasurements('duodeno 0.45', 'intestine');
    expect(result.intestine_duodenum_cm).toBeCloseTo(0.45);
  });

  it('extracts multiple intestine segments', () => {
    const result = parseVoiceMeasurements(
      'duodeno 0.45 jejuno 0.28 ileo 0.40 colon 0.12',
      'intestine',
    );
    expect(result.intestine_duodenum_cm).toBeCloseTo(0.45);
    expect(result.intestine_jejunum_cm).toBeCloseTo(0.28);
    expect(result.intestine_ileum_cm).toBeCloseTo(0.40);
    expect(result.intestine_colon_cm).toBeCloseTo(0.12);
  });
});

describe('parseVoiceMeasurements — adrenal', () => {
  it('extracts left and right adrenal', () => {
    const result = parseVoiceMeasurements(
      'esquerda 0.45 direita 0.42',
      'adrenal',
    );
    expect(result.adrenal_left_cm).toBeCloseTo(0.45);
    expect(result.adrenal_right_cm).toBeCloseTo(0.42);
  });
});

describe('parseVoiceMeasurements — reproductive', () => {
  it('extracts prostate dimensions', () => {
    const result = parseVoiceMeasurements(
      'comprimento dois vírgula três altura um vírgula oito largura dois',
      'reproductive',
    );
    expect(result.prostate_length_cm).toBeCloseTo(2.3);
    expect(result.prostate_height_cm).toBeCloseTo(1.8);
    expect(result.prostate_width_cm).toBeCloseTo(2.0);
  });
});

describe('parseVoiceMeasurements — edge cases', () => {
  it('returns empty object for unknown organ', () => {
    const result = parseVoiceMeasurements('qualquer coisa', 'unknown_organ');
    expect(result).toEqual({});
  });

  it('returns empty object when no numbers can be extracted', () => {
    const result = parseVoiceMeasurements('texto sem números', 'bladder');
    expect(result).toEqual({});
  });

  it('never throws for malformed input', () => {
    expect(() => parseVoiceMeasurements('', 'kidney')).not.toThrow();
    expect(() => parseVoiceMeasurements('???', '')).not.toThrow();
  });
});
