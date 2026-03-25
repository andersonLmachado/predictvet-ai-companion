// src/tests/ultrasoundReportGenerator.test.ts
import { describe, it, expect } from 'vitest';
import { generateReport, buildPrintableHtml } from '../lib/ultrasoundReportGenerator';
import type { UltrasoundReportData } from '../types/ultrasound';

const BASE_CANIS_FEMALE: UltrasoundReportData = {
  patient_id: 'p-001',
  species: 'canis',
  sex: 'female',
  equipment: 'Infinit X PRO',
  bladder_wall_cm: 0.12,
  kidney_left_cm: 4.1,
  kidney_right_cm: 4.0,
  kidney_pelvis_left_cm: 0.15,
  kidney_pelvis_right_cm: 0.16,
  gallbladder_wall_cm: 0.10,
  gallbladder_duct_cm: 0.20,
  stomach_wall_cm: 0.40,
  intestine_duodenum_cm: 0.45,
  intestine_jejunum_cm: 0.28,
  intestine_ileum_cm: 0.40,
  intestine_colon_cm: 0.12,
  pancreas_right_lobe_cm: 0.80,
  pancreas_left_lobe_cm: 0.60,
  pancreas_duct_cm: 0.10,
  adrenal_left_cm: 0.45,
  adrenal_right_cm: 0.42,
  uterus_notes: 'sem alterações',
  ovary_left_cm1: 1.2,
  ovary_left_cm2: 0.8,
  ovary_right_cm1: 1.1,
  ovary_right_cm2: 0.9,
  diagnostic_impression: 'Exame dentro dos padrões de normalidade.',
};

describe('generateReport', () => {
  it('includes bladder measurement in output', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('0.12 cm');
    expect(report).toContain('BEXIGA URINÁRIA');
  });

  it('includes both kidney measurements', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('RE: 4.1 cm');
    expect(report).toContain('RD: 4.0 cm');
  });

  it('includes female reproductive section for sex=female', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('OVÁRIOS');
    expect(report).toContain('1.2');
    expect(report).not.toContain('PRÓSTATA');
    expect(report).not.toContain('TESTÍCULOS');
  });

  it('includes castrated female banner for sex=female_castrated', () => {
    const report = generateReport({ ...BASE_CANIS_FEMALE, sex: 'female_castrated' });
    expect(report).toContain('ovariohisterectomizada');
    expect(report).not.toContain('OVÁRIOS:');
  });

  it('includes male reproductive section for sex=male', () => {
    const data: UltrasoundReportData = {
      ...BASE_CANIS_FEMALE,
      sex: 'male',
      prostate_length_cm: 2.3,
      prostate_height_cm: 1.8,
      prostate_width_cm: 2.0,
      testis_left_cm1: 2.1,
      testis_left_cm2: 1.5,
      testis_right_cm1: 2.0,
      testis_right_cm2: 1.4,
    };
    const report = generateReport(data);
    expect(report).toContain('PRÓSTATA');
    expect(report).toContain('2.3 cm');
    expect(report).not.toContain('OVÁRIOS');
  });

  it('includes castrated male banner for sex=male_castrated', () => {
    const report = generateReport({ ...BASE_CANIS_FEMALE, sex: 'male_castrated' });
    expect(report).toContain('orquiectomizado');
    expect(report).not.toContain('PRÓSTATA');
  });

  it('uses [não mensurado] for null fields', () => {
    const data: UltrasoundReportData = {
      ...BASE_CANIS_FEMALE,
      bladder_wall_cm: null,
    };
    const report = generateReport(data);
    expect(report).toContain('[não mensurado]');
  });

  it('includes diagnostic impression when provided', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('IMPRESSÃO DIAGNÓSTICA');
    expect(report).toContain('Exame dentro dos padrões de normalidade.');
  });

  it('includes fixed footer disclaimer', () => {
    const report = generateReport(BASE_CANIS_FEMALE);
    expect(report).toContain('linfonodomegalia');
    expect(report).toContain('Infinit X PRO');
    expect(report).toContain('48 a 72 horas');
  });

  it('felis castrated male report', () => {
    const data: UltrasoundReportData = {
      patient_id: 'p-002',
      species: 'felis',
      sex: 'male_castrated',
      equipment: 'Infinit X PRO',
    };
    const report = generateReport(data);
    expect(report).toContain('orquiectomizado');
    expect(report).toContain('BEXIGA');
    expect(report).toContain('RINS');
  });
});

describe('buildPrintableHtml', () => {
  const patient = { name: 'Rex', species: 'canis', owner_name: 'João Silva', age: '3 anos' };

  it('returns valid HTML with patient name in title', () => {
    const html = buildPrintableHtml('Laudo texto', patient, '25/03/2026');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Rex');
    expect(html).toContain('João Silva');
    expect(html).toContain('25/03/2026');
  });

  it('escapes special HTML characters in report text', () => {
    const html = buildPrintableHtml('<script>alert("xss")</script>', patient, '25/03/2026');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('includes age when provided', () => {
    const html = buildPrintableHtml('Laudo', patient, '25/03/2026');
    expect(html).toContain('3 anos');
  });

  it('omits age section when null', () => {
    const html = buildPrintableHtml('Laudo', { ...patient, age: null }, '25/03/2026');
    expect(html).not.toContain('Idade');
  });
});
