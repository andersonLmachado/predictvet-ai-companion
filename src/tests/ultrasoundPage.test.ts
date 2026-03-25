// src/tests/ultrasoundPage.test.ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { parseAgeYears } from '../pages/UltrasoundPage';

describe('parseAgeYears', () => {
  it('parses integer years', () => expect(parseAgeYears('3 anos')).toBe(3));
  it('parses "6 meses" as 0.5', () => expect(parseAgeYears('6 meses')).toBeCloseTo(0.5));
  it('parses bare number as years', () => expect(parseAgeYears('2')).toBe(2));
  it('returns null for "adulto"', () => expect(parseAgeYears('adulto')).toBeNull());
  it('returns null for null input', () => expect(parseAgeYears(null)).toBeNull());
});
