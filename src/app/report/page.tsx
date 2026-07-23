"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/data-display/data-table";
import { MetricCard } from "@/components/data-display/metric-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow, differenceInMinutes, differenceInSeconds } from "date-fns";
import { Download, Copy, Image as ImageIcon, CheckCircle2, XCircle, TrendingUp, FileText, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { copyJobResultText, copyJobResultImage } from "@/lib/utils";

interface RealJob {
  id: string;
  job_id: string;
  distributor_username: string;
  distributor_name?: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  result_summary: string | null;
  created_at: string;
  updated_at: string;
}

export default function ReportPage() {
  const [jobs, setJobs] = useState<RealJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.jobs) {
          const finishedJobs = data.jobs.filter((j: RealJob) => j.status === "COMPLETED" || j.status === "FAILED");
          setJobs(finishedJobs);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const columns: ColumnDef<RealJob>[] = [
    {
      accessorKey: "distributor_username",
      header: "Distributor",
      cell: ({ row }) => {
        const name = row.original.distributor_name || row.getValue("distributor_username") as string;
        return (
          <TooltipProvider delay={300}>
            <Tooltip>
              <TooltipTrigger>
                <div className="font-semibold text-base truncate max-w-[200px]">
                  {name}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={row.getValue("status")} />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
          </span>
        </div>
      ),
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "PENDING") return <span className="text-muted-foreground text-sm">-</span>;
        
        const start = new Date(row.original.created_at);
        const end = status === "RUNNING" ? new Date() : new Date(row.original.updated_at);
        
        const diffMins = differenceInMinutes(end, start);
        const diffSecs = differenceInSeconds(end, start) % 60;
        
        return (
          <span className="text-sm font-mono text-muted-foreground">
            {diffMins > 0 ? `${diffMins}m ` : ''}{diffSecs}s
          </span>
        );
      },
    },
    {
      accessorKey: "result_summary",
      header: "Summary",
      cell: ({ row }) => {
        const summary = row.getValue("result_summary") as string | null;
        return (
          <TooltipProvider delay={300}>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-sm max-w-[300px] truncate">
                  {summary || "-"}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-[400px]">
                <p>{summary || "-"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const status = row.original.status;
        const jobId = row.original.job_id;
        
        if (status === "COMPLETED") {
          return (
            <TooltipProvider delay={300}>
              <div className="flex items-center gap-1 justify-end">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        nativeButton={false}
                        render={
                          <a
                            href={`/screenshots/${jobId}.png`}
                            download={`bukti_stkadj_${jobId}.png`}
                            target="_blank"
                            rel="noreferrer"
                          />
                        }
                        className="h-7 w-7 text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span className="sr-only">Unduh Bukti</span>
                      </Button>
                    }
                  />
                  <TooltipContent>Unduh Bukti Screenshot</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:bg-muted"
                        onClick={async () => {
                          const toastId = toast.loading("Menyalin gambar...");
                          const result = await copyJobResultImage(jobId);
                          
                          if (result.success) {
                            toast.success("Gambar disalin!", { 
                              id: toastId,
                              description: "Siap di-paste ke WhatsApp." 
                            });
                          } else {
                            toast.error("Gagal", { 
                              id: toastId,
                              description: "Gagal mengambil gambar." 
                            });
                          }
                        }}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="sr-only">Salin Gambar</span>
                      </Button>
                    }
                  />
                  <TooltipContent>Salin Gambar</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:bg-muted"
                        onClick={async () => {
                          const summary = row.getValue("result_summary") as string || "";
                          const distributorUsername = row.original.distributor_username;
                          const distributorName = row.original.distributor_name || "";
                          
                          // Calculate duration
                          const start = new Date(row.original.created_at);
                          const end = row.original.status === "RUNNING" ? new Date() : new Date(row.original.updated_at);
                          const diffMins = differenceInMinutes(end, start);
                          const diffSecs = differenceInSeconds(end, start) % 60;
                          const durationStr = diffMins > 0 ? `${diffMins}m ${diffSecs}s` : `${diffSecs}s`;
                          
                          const result = await copyJobResultText(distributorName, distributorUsername, summary, durationStr);
                          
                          if (result.success) {
                            toast.success("Teks disalin!", { 
                              description: "Siap di-paste ke WhatsApp." 
                            });
                          } else {
                            toast.error("Gagal", { 
                              description: "Gagal menyalin teks." 
                            });
                          }
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="sr-only">Salin Teks</span>
                      </Button>
                    }
                  />
                  <TooltipContent>Salin Teks</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          );
        }
        return null;
      }
    }
  ];

  const completedCount = jobs.filter(j => j.status === "COMPLETED").length;
  const failedCount = jobs.filter(j => j.status === "FAILED").length;
  const successRate = jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0;

  const filteredJobs = activeTab === "all"
    ? jobs
    : activeTab === "completed"
      ? jobs.filter(j => j.status === "COMPLETED")
      : jobs.filter(j => j.status === "FAILED");

  return (
    <AppShell breadcrumbs={[{ label: "Report" }]}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs Report</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            History of all completed and failed operations.
          </p>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Jobs"
              value={jobs.length}
              icon={<FileText className="h-4 w-4 text-sky-500" />}
              className="bg-gradient-to-br from-card to-card/50 border-sky-900/20 shadow-sm"
            />
            <MetricCard
              title="Completed"
              value={completedCount}
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              className="bg-gradient-to-br from-card to-card/50 border-emerald-900/20 shadow-sm"
            />
            <MetricCard
              title="Failed"
              value={failedCount}
              icon={<XCircle className="h-4 w-4 text-red-500" />}
              className="bg-gradient-to-br from-card to-card/50 border-red-900/20 shadow-sm"
            />
            <MetricCard
              title="Success Rate"
              value={`${successRate}%`}
              icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
              className="bg-gradient-to-br from-card to-card/50 border-amber-900/20 shadow-sm"
            />
          </div>
        )}

        {/* Tabs + Table */}
        <div className="mt-2">
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No completed jobs yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Completed and failed jobs will appear here after processing.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({jobs.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedCount})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Failed ({failedCount})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <DataTable columns={columns} data={filteredJobs} searchKey="distributor_username" searchPlaceholder="Search distributor..." defaultPageSize={10} />
              </TabsContent>
              <TabsContent value="completed">
                <DataTable columns={columns} data={filteredJobs} searchKey="distributor_username" searchPlaceholder="Search distributor..." defaultPageSize={10} />
              </TabsContent>
              <TabsContent value="failed">
                <DataTable columns={columns} data={filteredJobs} searchKey="distributor_username" searchPlaceholder="Search distributor..." defaultPageSize={10} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </AppShell>
  );
}
