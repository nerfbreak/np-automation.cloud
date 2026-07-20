"use client";

import * as React from "react";
import { Bell, Search, Sparkles } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { changelog, CHANGELOG_SEEN_KEY, LATEST_VERSION } from "@/lib/changelog";
import Link from "next/link";

interface AppHeaderProps {
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

export function AppHeader({ breadcrumbs }: AppHeaderProps) {
  const { state } = useSidebar();
  const [hasNew, setHasNew] = React.useState(false);
  const latestEntry = changelog[0];

  // Cek apakah ada update baru yang belum dilihat
  const checkNew = React.useCallback(() => {
    const seen = localStorage.getItem(CHANGELOG_SEEN_KEY);
    setHasNew(seen !== LATEST_VERSION);
  }, []);

  React.useEffect(() => {
    checkNew();
    window.addEventListener("storage", checkNew);
    return () => window.removeEventListener("storage", checkNew);
  }, [checkNew]);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="hidden md:flex items-center gap-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            Production
          </Badge>
          
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs ? (
                breadcrumbs.map((item, index) => (
                  <React.Fragment key={item.label}>
                    <BreadcrumbItem>
                      {item.href ? (
                        <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Bell Notification */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="text-muted-foreground relative">
                <Bell className="h-4 w-4" />
                {hasNew && (
                  <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="w-80 p-0 overflow-hidden"
          >
            {/* Header popup */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <span className="text-sm font-semibold">Notifikasi</span>
              {hasNew && (
                <Badge className="text-[10px] bg-destructive/15 text-destructive border-destructive/30">
                  Baru
                </Badge>
              )}
            </div>

            {/* Changelog terbaru */}
            <div className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    Update v{latestEntry.version} tersedia
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {latestEntry.date} · {latestEntry.changes.reduce((a, c) => a + c.items.length, 0)} perubahan baru
                  </p>
                  <ul className="mt-2 space-y-1">
                    {latestEntry.changes[0].items.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                        <span className="line-clamp-1">{item}</span>
                      </li>
                    ))}
                    {latestEntry.changes[0].items.length > 3 && (
                      <li className="text-xs text-muted-foreground/60 ml-2.5">
                        +{latestEntry.changes[0].items.length - 3} lainnya...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer link */}
            <div className="border-t px-4 py-2.5">
              <Link
                href="/changelog"
                onClick={() => {
                  localStorage.setItem(CHANGELOG_SEEN_KEY, LATEST_VERSION);
                  setHasNew(false);
                }}
                className="text-xs text-primary hover:underline font-medium"
              >
                Lihat semua changelog →
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
      </div>
    </header>
  );
}
