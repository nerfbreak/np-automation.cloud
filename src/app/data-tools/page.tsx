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
import { Database, FileJson, ArrowRightLeft, SearchCode } from "lucide-react"

const tools = [
  {
    id: "tool-1",
    name: "JSON/CSV Converter",
    description: "Convert raw automation output payloads into easily readable spreadsheet formats.",
    icon: FileJson,
  },
  {
    id: "tool-2",
    name: "Data Mapper",
    description: "Map fields from one application (e.g. Workday) to another (e.g. ServiceNow).",
    icon: ArrowRightLeft,
  },
  {
    id: "tool-3",
    name: "Regex Tester",
    description: "Test extraction patterns against raw HTML or text before deploying an automation.",
    icon: SearchCode,
  },
]

export default function DataToolsPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Data Tools" }]}>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 w-full">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Data Tools</h1>
            <p className="text-muted-foreground mt-1">
              Utilities for processing and mapping data outside of automated workflows.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Card key={tool.id} className="flex flex-col">
                <CardHeader>
                  <Icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-xl">{tool.name}</CardTitle>
                  <CardDescription>
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1" />
                <CardFooter>
                  <Button variant="secondary" className="w-full">
                    Launch Tool
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
