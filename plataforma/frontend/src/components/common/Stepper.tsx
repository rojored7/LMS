import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

export interface Step {
  id: string | number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  allowClickOnCompleted?: boolean;
  showStepNumbers?: boolean;
}

const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
  className = '',
  allowClickOnCompleted = true,
  showStepNumbers = true,
}) => {
  const isStepCompleted = (stepIndex: number) => stepIndex < currentStep;
  const isStepActive = (stepIndex: number) => stepIndex === currentStep;
  const isStepClickable = (stepIndex: number) => {
    if (!onStepClick) return false;
    return allowClickOnCompleted ? stepIndex <= currentStep : false;
  };

  const handleStepClick = (stepIndex: number) => {
    if (isStepClickable(stepIndex) && onStepClick) {
      onStepClick(stepIndex);
    }
  };

  return (
    <div
      className={`
        stepper-container
        ${orientation === 'horizontal' ? 'flex items-center' : 'flex flex-col'}
        ${className}
      `}
    >
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`
            flex items-center
            ${orientation === 'horizontal' ? 'flex-1' : 'w-full mb-8'}
            ${index === steps.length - 1 ? '' : orientation === 'horizontal' ? 'pr-4' : ''}
          `}
        >
          <div className="flex items-center">
            <button
              onClick={() => handleStepClick(index)}
              disabled={!isStepClickable(index)}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${isStepCompleted(index)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : isStepActive(index)
                  ? 'bg-white border-blue-600 text-blue-600'
                  : 'bg-white border-gray-300 text-gray-500'
                }
                ${isStepClickable(index) ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}
              `}
              aria-label={step.title}
            >
              {isStepCompleted(index) ? (
                <CheckIcon className="w-5 h-5" />
              ) : showStepNumbers ? (
                <span className="text-sm font-medium">{index + 1}</span>
              ) : (
                <span className="w-2 h-2 bg-current rounded-full" />
              )}
            </button>

            <div className="ml-3">
              <p
                className={`
                  text-sm font-medium
                  ${isStepActive(index) ? 'text-blue-600' : isStepCompleted(index) ? 'text-gray-900' : 'text-gray-500'}
                `}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              )}
            </div>
          </div>

          {index < steps.length - 1 && (
            <div
              className={`
                ${orientation === 'horizontal' ? 'flex-1 ml-4' : 'ml-5 mt-4 mb-4 w-0.5 h-16'}
              `}
            >
              <div
                className={`
                  ${orientation === 'horizontal' ? 'h-0.5 w-full' : 'h-full w-0.5'}
                  ${isStepCompleted(index + 1) ? 'bg-blue-600' : 'bg-gray-300'}
                  transition-colors
                `}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Stepper;