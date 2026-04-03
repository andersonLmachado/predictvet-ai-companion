import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── Mock localStorage (env: node não tem localStorage) ──
const store: Record<string, string> = {}
const localStorageMock = {
  getItem:    (k: string)            => store[k] ?? null,
  setItem:    (k: string, v: string) => { store[k] = v },
  removeItem: (k: string)            => { delete store[k] },
  clear:      ()                     => { Object.keys(store).forEach(k => delete store[k]) },
}
vi.stubGlobal('localStorage', localStorageMock)

import {
  hasTourBeenCompleted,
  markTourCompleted,
  resetTour,
} from '../lib/onboardingTour'

const TOUR_KEY = 'predictlab_tour_completed'

describe('onboardingTour', () => {
  beforeEach(() => localStorageMock.clear())

  it('hasTourBeenCompleted retorna false quando localStorage está vazio', () => {
    expect(hasTourBeenCompleted()).toBe(false)
  })

  it('markTourCompleted persiste flag no localStorage', () => {
    markTourCompleted()
    expect(localStorageMock.getItem(TOUR_KEY)).toBe('true')
  })

  it('hasTourBeenCompleted retorna true após markTourCompleted', () => {
    markTourCompleted()
    expect(hasTourBeenCompleted()).toBe(true)
  })

  it('resetTour remove o flag do localStorage', () => {
    markTourCompleted()
    resetTour()
    expect(localStorageMock.getItem(TOUR_KEY)).toBeNull()
  })

  it('hasTourBeenCompleted retorna false após resetTour', () => {
    markTourCompleted()
    resetTour()
    expect(hasTourBeenCompleted()).toBe(false)
  })
})
