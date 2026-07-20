"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { changelog, CHANGELOG_SEEN_KEY, LATEST_VERSION } from "@/lib/changelog"
import { Plus, RefreshCw, Wrench, Trash2, Sparkles } from "lucide-react"
import { useEffect } from "react"

const typeConfig = {
  Added: {
    label: "Added",
    icon: Plus,
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  },
  Changed: {
    label: "Changed",
    icon: RefreshCw,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  Fixed: {
    label: "Fixed",
    icon: Wrench,
    className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  },
  Removed: {
    label: "Removed",
    icon: Trash2,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  },
}

export default function ChangelogPage() {
  // Tandai changelog sudah dilihat
  useEffect(() => {
    localStorage.setItem(CHANGELOG_SEEN_KEY, LATEST_VERSION)
    // Trigger storage event agar header bell terupdate
    window.dispatchEvent(new Event("storage"))
  }, [])

  return (
    <AppShell breadcrumbs={[{ label: "Changelog" }]}>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
            <p className="text-muted-foreground mt-1">
              Riwayat pembaruan dan perubahan platform NP Automation.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {changelog.map((entry, i) => (
            <Card key={entry.version} className={i === 0 ? "border-primary/30" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">v{entry.version}</CardTitle>
                    {i === 0 && (
                      <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{entry.date}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {entry.changes.map((group) => {
                  const cfg = typeConfig[group.type]
                  const Icon = cfg.icon
                  return (
                    <div key={group.type}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-xs gap-1 ${cfg.className}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <ul className="space-y-1.5 ml-1">
                        {group.items.map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground/50 pb-4">
          © 2026 IT Support Newspage. All rights reserved.
        </p>
      </div>
    </AppShell>
  )
}
