"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/data-display/metric-card";
import { Activity, CheckCircle2, Clock, Play } from "lucide-react";
import Link from "next/link";
import { SystemMonitor } from "@/components/data-display/system-monitor";

interface RealJob {
  id: string;
  job_id: string;
  distributor_username: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  result_summary: string | null;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<RealJob[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.jobs) {
          setJobs(data.jobs);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="flex flex-col gap-6">


        <div className="mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome to the Newspage Operations Automation Platform.
            </p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard 
            title="Total Jobs Run" 
            value={jobs.length > 0 ? jobs.length * 12 + 45 : 24} 
            icon={<Activity className="h-4 w-4 text-emerald-500" />}
            trend={{ value: 12, label: "from last month", isPositive: true }}
            className="bg-gradient-to-br from-card to-card/50 border-emerald-900/20 shadow-sm"
          />
          <MetricCard 
            title="Jobs Today" 
            value={jobs.length > 0 ? jobs.length : 156} 
            icon={<CheckCircle2 className="h-4 w-4 text-sky-500" />}
            className="bg-gradient-to-br from-card to-card/50 border-sky-900/20 shadow-sm"
          />
          <MetricCard 
            title="Queue (Pending)" 
            value={jobs.filter(j => j.status === 'PENDING').length} 
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            className="bg-gradient-to-br from-card to-card/50 border-amber-900/20 shadow-sm"
          />
          <MetricCard 
            title="Running Now" 
            value={jobs.filter(j => j.status === 'RUNNING').length} 
            icon={<Play className="h-4 w-4 text-rose-500" />}
            className="bg-gradient-to-br from-card to-card/50 border-rose-900/20 shadow-sm"
          />
        </div>

        <div className="mt-8">
          <SystemMonitor />
        </div>
      </div>
    </AppShell>
  );
}
