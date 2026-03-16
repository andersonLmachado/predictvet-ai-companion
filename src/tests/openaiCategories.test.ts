import { describe, it, expect } from 'vitest';
import { parseOpenAICategories, VALID_CATEGORIES } from '../lib/openaiCategories';

describe('parseOpenAICategories', () => {
  it('JSON válido retorna array filtrado e limitado', () => {
    const result = parseOpenAICategories('["Trato Urinário", "Cardiovascular"]');
    expect(result).toEqual(['Trato Urinário', 'Cardiovascular']);
  });

  it('JSON com markdown fence é parseado corretamente (strip aplicado)', () => {
    const result = parseOpenAICategories('```json\n["Neurologia"]\n```');
    expect(result).toEqual(['Neurologia']);
  });

  it('string vazia retorna array vazio', () => {
    expect(parseOpenAICategories('')).toEqual([]);
  });

  it('JSON não-array retorna array vazio', () => {
    expect(parseOpenAICategories('"Trato Urinário"')).toEqual([]);
  });

  it('mais de 3 categorias válidas retorna apenas as 3 primeiras', () => {
    const fourValid = JSON.stringify(VALID_CATEGORIES.slice(0, 4));
    const result = parseOpenAICategories(fourValid);
    expect(result).toHaveLength(3);
  });

  it('categoria inválida é filtrada, válidas permanecem', () => {
    const result = parseOpenAICategories('["Trato Urinário", "Categoria Inexistente"]');
    expect(result).toEqual(['Trato Urinário']);
  });
});
