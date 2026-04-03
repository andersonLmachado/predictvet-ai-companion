const TOUR_KEY = 'predictlab_tour_completed'

export function hasTourBeenCompleted(): boolean {
  return localStorage.getItem(TOUR_KEY) === 'true'
}

export function markTourCompleted(): void {
  localStorage.setItem(TOUR_KEY, 'true')
}

export function resetTour(): void {
  localStorage.removeItem(TOUR_KEY)
}
