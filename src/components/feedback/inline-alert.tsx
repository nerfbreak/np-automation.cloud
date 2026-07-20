import * as React from "react"
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const IconMap = {
  default: Info,
  destructive: AlertCircle,
  warning: TriangleAlert,
  success: CheckCircle2,
  info: Info,
}

export interface InlineAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "success" | "info"
  title?: string
  children?: React.ReactNode
}

export function InlineAlert({
  className,
  variant = "default",
  title,
  children,
  ...props
}: InlineAlertProps) {
  const Icon = IconMap[variant || "default"]
  
  // Shadcn UI only has default and destructive variants for Alert.
  // We map other semantic variants to default to match Shadcn's pure aesthetic.
  const alertVariant = variant === "destructive" ? "destructive" : "default"

  return (
    <Alert variant={alertVariant} className={className} {...props}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      {children && <AlertDescription>{children}</AlertDescription>}
    </Alert>
  )
}
