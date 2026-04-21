import { describe, it, expect } from 'vitest';
import { buildPatientUpdatePayload, validatePatientEdit } from '../lib/patientEdit';

// ─── buildPatientUpdatePayload ───────────────────────────────────────────────

describe('buildPatientUpdatePayload', () => {
  it('converte age string numérica para number', () => {
    const result = buildPatientUpdatePayload({
      name: 'Thor',
      owner_name: 'João',
      species: 'canina',
      breed: 'Labrador',
      age: '5',
    });
    expect(result.age).toBe(5);
  });

  it('converte age string vazia para null', () => {
    const result = buildPatientUpdatePayload({
      name: 'Luna',
      owner_name: 'Maria',
      species: 'felina',
      breed: 'SRD',
      age: '',
    });
    expect(result.age).toBeNull();
  });

  it('mapeia todos os campos corretamente', () => {
    const result = buildPatientUpdatePayload({
      name: 'Rex',
      owner_name: 'Pedro',
      species: 'canina',
      breed: 'Poodle',
      age: '3',
    });
    expect(result).toEqual({
      name: 'Rex',
      owner_name: 'Pedro',
      species: 'canina',
      breed: 'Poodle',
      age: 3,
    });
  });
});

// ─── validatePatientEdit ─────────────────────────────────────────────────────

describe('validatePatientEdit', () => {
  it('retorna null quando todos os campos obrigatórios estão preenchidos', () => {
    expect(validatePatientEdit({ name: 'Thor', owner_name: 'João', species: 'canina', breed: 'Lab', age: '3' })).toBeNull();
  });

  it('retorna mensagem de erro quando name está vazio', () => {
    const result = validatePatientEdit({ name: '', owner_name: 'João', species: 'canina', breed: 'Lab', age: '3' });
    expect(result).toBe('O nome do animal é obrigatório.');
  });

  it('retorna mensagem de erro quando owner_name está vazio', () => {
    const result = validatePatientEdit({ name: 'Thor', owner_name: '', species: 'canina', breed: 'Lab', age: '3' });
    expect(result).toBe('O nome do tutor é obrigatório.');
  });

  it('age vazia é permitida (campo opcional)', () => {
    expect(validatePatientEdit({ name: 'Thor', owner_name: 'João', species: 'canina', breed: 'Lab', age: '' })).toBeNull();
  });
});
