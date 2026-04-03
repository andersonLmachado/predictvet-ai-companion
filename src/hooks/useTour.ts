import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { tourSteps } from '@/lib/tourSteps'
import { markTourCompleted } from '@/lib/onboardingTour'

export function useTour() {
  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      steps: tourSteps,
      onDestroyStarted: () => {
        markTourCompleted()
        driverObj.destroy()
      },
      onDestroyed: () => {
        markTourCompleted()
      },
    })
    driverObj.drive()
  }

  return { startTour }
}
