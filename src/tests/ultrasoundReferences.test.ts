// src/tests/ultrasoundReferences.test.ts
import { describe, it, expect } from 'vitest';
import {
  checkReference,
  getAdrenalReference,
  getPancreasDuctReference,
  CANIS_REFS,
  FELIS_REFS,
} from '../lib/ultrasoundReferences';

describe('checkReference', () => {
  it('returns normal when value is within range', () => {
    expect(checkReference(0.10, null, 0.14)).toBe('normal');
    expect(checkReference(0.17, 0.13, 0.17)).toBe('normal'); // exactly at max (strict > so max itself is normal)
  });

  it('returns alto when value exceeds max', () => {
    expect(checkReference(0.20, null, 0.14)).toBe('alto');
    expect(checkReference(0.18, 0.13, 0.17)).toBe('alto');
  });

  it('returns baixo when value is below min', () => {
    expect(checkReference(0.10, 0.13, 0.17)).toBe('baixo');
  });

  it('returns normal when max is null (no upper limit)', () => {
    expect(checkReference(999, null, null)).toBe('normal');
  });
});

describe('getAdrenalReference — canis', () => {
  it('returns correct range for 7kg dog (5-10 band)', () => {
    const ref = getAdrenalReference('canis', 'left', 7);
    expect(ref).toEqual({ min: 0.30, max: 0.55 });
  });

  it('returns correct right adrenal for 15kg dog (10-20 band)', () => {
    const ref = getAdrenalReference('canis', 'right', 15);
    expect(ref).toEqual({ min: 0.35, max: 0.75 });
  });

  it('returns null for dog < 2.5kg', () => {
    expect(getAdrenalReference('canis', 'left', 1.5)).toBeNull();
  });

  it('returns null for dog > 40kg', () => {
    expect(getAdrenalReference('canis', 'left', 45)).toBeNull();
  });

  it('returns null when weightKg is null', () => {
    expect(getAdrenalReference('canis', 'left', null)).toBeNull();
  });
});

describe('getAdrenalReference — felis', () => {
  it('returns correct range for 3kg cat (< 4 band)', () => {
    expect(getAdrenalReference('felis', 'left', 3)).toEqual({ min: 0.24, max: 0.39 });
  });

  it('returns correct range for 5kg cat (4-8 band)', () => {
    expect(getAdrenalReference('felis', 'left', 5)).toEqual({ min: 0.26, max: 0.48 });
  });

  it('returns null for cat > 8kg', () => {
    expect(getAdrenalReference('felis', 'left', 9)).toBeNull();
  });
});

describe('getPancreasDuctReference', () => {
  it('returns max 0.13 for felis under 10 years', () => {
    expect(getPancreasDuctReference('felis', 5)).toEqual({ max: 0.13 });
  });

  it('returns max 0.25 for felis 10+ years', () => {
    expect(getPancreasDuctReference('felis', 10)).toEqual({ max: 0.25 });
    expect(getPancreasDuctReference('felis', 14)).toEqual({ max: 0.25 });
  });

  it('returns null for felis with unknown age', () => {
    expect(getPancreasDuctReference('felis', null)).toBeNull();
  });

  it('returns null for canis (no reference)', () => {
    expect(getPancreasDuctReference('canis', 5)).toBeNull();
    expect(getPancreasDuctReference('canis', null)).toBeNull();
  });
});

describe('Reference constants', () => {
  it('CANIS_REFS has expected fields', () => {
    expect(CANIS_REFS.bladder_wall_cm.max).toBe(0.14);
    expect(CANIS_REFS.intestine_duodenum_cm.max).toBe(0.50);
  });

  it('FELIS_REFS has expected fields', () => {
    expect(FELIS_REFS.bladder_wall_cm.min).toBe(0.13);
    expect(FELIS_REFS.bladder_wall_cm.max).toBe(0.17);
    expect(FELIS_REFS.kidney_cm.min).toBe(3.0);
  });
});
