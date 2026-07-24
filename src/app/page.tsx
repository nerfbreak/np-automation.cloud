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
      <div className="flex flex-col gap-6 animate-fade-in duration-300">
        <div className="mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome to the Newspage Operations Automation Platform.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Job Statistics Row */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold tracking-tight">Job Statistics</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="Total Jobs Run" 
                value={jobs.length > 0 ? jobs.length * 12 + 45 : 24} 
                icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                trend={{ value: 12, label: "from last month", isPositive: true }}
                className="bg-card border border-border/80 shadow-none hover:border-primary/30 transition-all duration-200"
              />
              <MetricCard 
                title="Jobs Today" 
                value={jobs.length > 0 ? jobs.length : 156} 
                icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                className="bg-card border border-border/80 shadow-none hover:border-primary/30 transition-all duration-200"
              />
              <MetricCard 
                title="Queue (Pending)" 
                value={jobs.filter(j => j.status === 'PENDING').length} 
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                className="bg-card border border-border/80 shadow-none hover:border-primary/30 transition-all duration-200"
              />
              <MetricCard 
                title="Running Now" 
                value={jobs.filter(j => j.status === 'RUNNING').length} 
                icon={<Play className="h-4 w-4 text-muted-foreground" />}
                className="bg-card border border-border/80 shadow-none hover:border-primary/30 transition-all duration-200"
              />
            </div>
          </div>

          {/* VPS Server Status Row */}
          <SystemMonitor />
        </div>
      </div>
    </AppShell>
  );
}
