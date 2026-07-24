"use client"

import { cn } from "@/lib/utils"

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
    <div className={cn("flex flex-wrap md:flex-nowrap gap-3 w-full py-3", className)}>
      {steps.map((step) => {
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        return (
          <div 
            key={step.id} 
            className={cn(
              "flex-1 min-w-[100px] border-t-2 pt-2.5 transition-all flex flex-col gap-1",
              isActive 
                ? "border-primary" 
                : isCompleted 
                ? "border-primary" 
                : "border-muted"
            )}
          >
            <span className={cn(
              "text-[9px] uppercase tracking-wider font-bold",
              isActive ? "text-primary" : "text-muted-foreground/60"
            )}>
              Langkah {step.id}
            </span>
            <span className={cn(
              "text-xs font-semibold leading-tight",
              isActive ? "text-foreground font-bold" : isCompleted ? "text-foreground/80" : "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}


