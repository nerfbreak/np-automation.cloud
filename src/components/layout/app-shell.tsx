"use client";

import * as React from "react";
import { Suspense } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: {
    label: string;
    href?: string;
  }[];
}

export function AppShell({ children, breadcrumbs }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <main className="flex flex-1 flex-col overflow-hidden">
          <AppHeader breadcrumbs={breadcrumbs} />
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
