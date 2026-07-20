"use client"

import { AppShell } from "@/components/layout/app-shell"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Bot,
  Send,
  Info,
  Globe,
  GitBranch,
} from "lucide-react"

const appVersion = "0.3.0"
const buildDate = "20 Juli 2026"

export default function SettingsPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Settings" }]}>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Informasi sistem dan konfigurasi platform NP Automation.
          </p>
        </div>

        <div className="grid gap-6">

          {/* About */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <CardTitle>Tentang Aplikasi</CardTitle>
              </div>
              <CardDescription>Informasi versi dan platform yang digunakan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Nama Aplikasi</span>
                <span className="font-medium">NP Automation</span>

                <span className="text-muted-foreground">Versi</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{appVersion}</span>
                  <Badge variant="secondary" className="text-xs">Stable</Badge>
                </div>

                <span className="text-muted-foreground">Tanggal Build</span>
                <span className="font-medium">{buildDate}</span>

                <span className="text-muted-foreground">Framework</span>
                <span className="font-medium">Next.js 16.2 (React 19)</span>

                <span className="text-muted-foreground">Runtime</span>
                <span className="font-medium">Node.js 20 LTS</span>

                <span className="text-muted-foreground">Database</span>
                <span className="font-medium">Supabase (PostgreSQL)</span>
              </div>
            </CardContent>
          </Card>

          {/* Bot Config */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle>Konfigurasi Bot</CardTitle>
              </div>
              <CardDescription>Informasi pengaturan bot Playwright yang berjalan di background.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Engine</span>
                <span className="font-medium">Playwright (Chromium)</span>

                <span className="text-muted-foreground">Mode</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Headless</span>
                  <Badge className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">Aktif</Badge>
                </div>

                <span className="text-muted-foreground">Queue System</span>
                <span className="font-medium">BullMQ + Redis</span>

                <span className="text-muted-foreground">Target Portal</span>
                <span className="font-medium">Newspage (Stock Adjustment)</span>

                <span className="text-muted-foreground">Max Retry</span>
                <span className="font-medium">3x (exponential backoff)</span>
              </div>
            </CardContent>
          </Card>

          {/* Telegram */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <CardTitle>Notifikasi Telegram</CardTitle>
              </div>
              <CardDescription>Bot Telegram aktif untuk mengirim laporan setelah eksekusi selesai.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                  <span className="font-medium">Terhubung</span>
                </div>

                <span className="text-muted-foreground">Isi Notifikasi</span>
                <span className="font-medium">Screenshot + Caption Laporan</span>

                <span className="text-muted-foreground">Trigger</span>
                <span className="font-medium">Otomatis saat task selesai</span>
              </div>
            </CardContent>
          </Card>

          {/* Domain & Deployment */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Deployment</CardTitle>
              </div>
              <CardDescription>Informasi server dan domain yang digunakan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Domain</span>
                <span className="font-medium">np-automation.cloud</span>

                <span className="text-muted-foreground">Server</span>
                <span className="font-medium">VPS Ubuntu 22.04 (2 vCPU / 4GB RAM)</span>

                <span className="text-muted-foreground">CDN / Firewall</span>
                <span className="font-medium">Cloudflare</span>

                <span className="text-muted-foreground">Process Manager</span>
                <span className="font-medium">PM2</span>

                <span className="text-muted-foreground">Reverse Proxy</span>
                <span className="font-medium">Nginx</span>
              </div>
            </CardContent>
          </Card>

          {/* Source Code */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                <CardTitle>Source Code</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Repository</span>
                <a
                  href="https://github.com/nerfbreak/np-automation.cloud"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline truncate"
                >
                  github.com/nerfbreak/np-automation.cloud
                </a>

                <span className="text-muted-foreground">Visibilitas</span>
                <span className="font-medium">Private</span>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Disclaimer */}
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <CardTitle className="text-base text-yellow-700 dark:text-yellow-400">Disclaimer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This application is an independently developed by{" "}
                <span className="font-medium text-foreground">Muhammad Rizki Firdaus (Contractor)</span>,
                unofficial utility designed solely to automate repetitive tasks, improve operational
                efficiency, and save working hours. It is not officially endorsed, sponsored, or
                affiliated with{" "}
                <span className="font-medium text-foreground">Reckitt</span>,{" "}
                <span className="font-medium text-foreground">Accenture</span>, or the{" "}
                <span className="font-medium text-foreground">Newspage</span> platform.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-4 border-t pt-3">
                © 2026 IT Support Newspage. All rights reserved.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppShell>
  )
}
