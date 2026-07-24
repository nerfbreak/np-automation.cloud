"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  id: number
  label: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  const percentage = Math.round((currentStep / steps.length) * 100)

  return (
    <div className={cn("w-full py-4 px-1", className)}>
      {/* Mobile view: compact active step text with progress bar */}
      <div className="flex flex-col md:hidden w-full px-2 mb-6">
        <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          <span>Langkah {currentStep} dari {steps.length}</span>
          <span className="text-primary font-bold">{percentage}%</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
          <div 
            className="bg-primary h-full transition-all duration-300" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-base font-bold text-foreground mt-1">
          {steps[currentStep - 1]?.label}
        </span>
      </div>

      {/* Steps Indicator Container (Desktop only) */}
      <div className="hidden md:flex items-center justify-between w-full relative">
        {/* Progress Line Container */}
        <div 
          className="absolute top-4 h-0.5 -translate-y-1/2 z-0"
          style={{
            left: `calc(100% / ${steps.length} / 2)`,
            right: `calc(100% / ${steps.length} / 2)`
          }}
        >
          {/* Background Line (Muted) */}
          <div className="w-full h-full bg-muted" />
          {/* Active Line (Primary) */}
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
            style={{ 
              width: `${((currentStep - 1) / Math.max(1, steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          return (
            <div key={step.id} className="flex flex-col items-center z-10 flex-1">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all bg-card",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                    ? "border-primary text-primary bg-primary/10 ring-4 ring-primary/20"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[3px]" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              
              {/* Labels on Desktop */}
              <span
                className={cn(
                  "hidden md:block mt-3 text-xs font-bold text-center max-w-[90px] leading-snug transition-colors",
                  isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

