import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useCallback: (fn: any) => fn,
  }
})

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

// ── useTour ───────────────────────────────────────────────────────────────────
vi.mock('driver.js/dist/driver.css', () => ({}))

const mockDestroy = vi.fn()
vi.mock('driver.js', () => ({
  driver: vi.fn().mockImplementation((config: any) => {
    return {
      isActive: vi.fn().mockReturnValue(false),
      drive: vi.fn().mockImplementation(() => {
        // simulate the tour ending (calls onDestroyed callback)
        config.onDestroyed?.()
      }),
      destroy: mockDestroy,
    }
  }),
}))

import { useTour } from '../hooks/useTour'

describe('useTour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('retorna função startTour', () => {
    const { startTour } = useTour()
    expect(typeof startTour).toBe('function')
  })

  it('startTour instancia driver e chama drive()', () => {
    const { startTour } = useTour()
    startTour()
    // markTourCompleted is called by onDestroyed, confirming driver was instantiated and drive() ran
    expect(hasTourBeenCompleted()).toBe(true)
  })

  it('markTourCompleted é chamado quando o tour é encerrado', () => {
    const { startTour } = useTour()
    startTour()
    // drive() mock calls onDestroyed, which calls markTourCompleted()
    expect(hasTourBeenCompleted()).toBe(true)
  })
})
