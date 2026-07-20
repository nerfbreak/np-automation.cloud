"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { automationTemplates } from "@/mocks/templates"
import {
  Plus,
  MonitorPlay,
  DownloadCloud,
  Users,
  Key,
  CalendarRange,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

const categoryIcons: Record<string, React.ElementType> = {
  "HR Operations": Users,
  "Reporting": DownloadCloud,
  "Security": Key,
  "Monitoring": MonitorPlay,
  "Data Sync": CalendarRange,
}

const usageCounts: Record<string, number> = {
  "tpl-offboarding": 142,
  "tpl-sales-export": 89,
  "tpl-password-rotation": 230,
  "tpl-uptime-check": 412,
  "tpl-schedule-sync": 56,
}

export default function TemplatesPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Templates" }]}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Automation Templates</h1>
            <p className="text-muted-foreground mt-2">
              Start quickly with pre-configured workflows. Pilih template dan form builder akan otomatis ter-isi.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          <Card className="flex flex-col group hover:border-primary/50 transition-colors bg-gradient-to-br from-card to-card/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <MonitorPlay className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary">Inventory</Badge>
              </div>
              <CardTitle className="text-xl">Inventory Adjustment</CardTitle>
              <CardDescription className="line-clamp-2">
                Automate inventory adjustments into the Newspage system using Excel data.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MonitorPlay className="h-4 w-4" />
                Sering digunakan
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Excel parsing, Validation, Automation
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                nativeButton={false}
                render={
                  <Link href={`/inventory-adjustment`}>
                    Gunakan Template <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                }
              />
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
