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
  return (
    <div className={cn("w-full py-4 px-1", className)}>
      {/* Mobile view: compact active step text */}
      <div className="flex flex-col md:hidden items-center justify-center mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary/80">
          Langkah {currentStep} dari {steps.length}
        </span>
        <span className="text-lg font-extrabold text-foreground mt-0.5">
          {steps[currentStep - 1]?.label}
        </span>
      </div>

      {/* Steps Indicator Container */}
      <div className="flex items-center justify-between w-full relative">
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

