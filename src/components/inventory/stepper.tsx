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
    <div 
      className={cn("flex items-center w-full pb-8 overflow-x-auto", className)}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none min-w-[120px] md:min-w-0">
          <div className="relative flex items-center justify-center">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                currentStep > step.id
                  ? "bg-primary border-primary text-primary-foreground"
                  : currentStep === step.id
                  ? "border-primary text-primary bg-primary/10"
                  : "border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {currentStep > step.id ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{step.id}</span>
              )}
            </div>
            <span
              className={cn(
                "absolute top-10 w-24 text-center text-xs font-medium leading-tight",
                currentStep >= step.id
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 flex-1 mx-2 transition-all",
                currentStep > step.id ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
