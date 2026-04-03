import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { tourSteps } from '@/lib/tourSteps'
import { markTourCompleted } from '@/lib/onboardingTour'

let activeTour: ReturnType<typeof driver> | null = null

export function useTour() {
  const startTour = () => {
    if (activeTour?.isActive()) return
    const driverObj = driver({
      showProgress: true,
      steps: tourSteps,
      onDestroyStarted: () => {
        markTourCompleted()
        driverObj.destroy()
      },
      onDestroyed: () => {
        markTourCompleted()
        activeTour = null
      },
    })
    activeTour = driverObj
    driverObj.drive()
  }

  return { startTour }
}
