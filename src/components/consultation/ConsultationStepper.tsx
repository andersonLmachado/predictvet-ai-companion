import { Check } from 'lucide-react';

interface Step {
  label: string;
  description: string;
}

interface ConsultationStepperProps {
  currentStep: number; // 0-indexed
  steps: Step[];
}

const ACTIVE_COLOR = 'hsl(221,73%,45%)';
const DONE_COLOR = 'hsl(162,70%,38%)';
const INACTIVE_COLOR = 'hsl(222,30%,75%)';

const ConsultationStepper = ({ currentStep, steps }: ConsultationStepperProps) => {
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        const color = isDone ? DONE_COLOR : isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <div key={idx} className="contents">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all"
                style={{ background: color, boxShadow: isActive ? `0 0 0 3px ${ACTIVE_COLOR}30` : 'none' }}
              >
                {isDone ? <Check className="w-4 h-4" /> : <span style={{ fontFamily: 'Sora, sans-serif' }}>{idx + 1}</span>}
              </div>
              <div className="text-center">
                <p
                  className="text-xs font-semibold"
                  style={{ fontFamily: 'Nunito Sans, sans-serif', color: isActive ? ACTIVE_COLOR : isDone ? DONE_COLOR : INACTIVE_COLOR }}
                >
                  {step.label}
                </p>
                <p
                  className="text-xs hidden sm:block"
                  style={{ fontFamily: 'Nunito Sans, sans-serif', color: 'hsl(222,30%,60%)' }}
                >
                  {step.description}
                </p>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 mb-5 transition-all"
                style={{ background: idx < currentStep ? DONE_COLOR : 'hsl(217,50%,88%)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConsultationStepper;
