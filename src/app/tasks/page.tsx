"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/data-display/data-table";
import { MetricCard } from "@/components/data-display/metric-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow, differenceInMinutes, differenceInSeconds } from "date-fns";
import { Copy, Download, Image as ImageIcon, Ban, Clock, Play, Inbox, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

export default function TasksPage() {
  const [jobs, setJobs] = useState<RealJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelJobId, setCancelJobId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const handleCancelJob = async (jobId: string) => {
    setCancelDialogOpen(false);
    setCancelJobId(null);
    const toastId = toast.loading("Membatalkan task...");
    try {
      const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });
      if (res.ok) {
        toast.success("Task dibatalkan", { id: toastId });
        setJobs(prev => prev.filter(j => j.job_id !== jobId));
      } else {
        const err = await res.json();
        toast.error("Gagal membatalkan task", { id: toastId, description: err.error });
      }
    } catch (e: any) {
      toast.error("Terjadi kesalahan", { id: toastId, description: e.message });
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        const res = await fetch("/api/jobs");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.jobs) {
          const activeJobs = data.jobs.filter((j: RealJob) => j.status === "PENDING" || j.status === "RUNNING");
          setJobs(activeJobs);
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

  const pendingCount = jobs.filter(j => j.status === "PENDING").length;
  const runningCount = jobs.filter(j => j.status === "RUNNING").length;

  const filteredJobs = activeTab === "all"
    ? jobs
    : activeTab === "pending"
      ? jobs.filter(j => j.status === "PENDING")
      : jobs.filter(j => j.status === "RUNNING");

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
                <div className="font-medium text-sm truncate max-w-[280px]">
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
        <StatusBadge status={row.getValue("status")} />
      ),
    },
    {
      id: "time",
      header: "Time",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
        </span>
      ),
    },
    {
      id: "duration",
      header: "Duration",
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "PENDING") return <span className="text-muted-foreground text-xs">-</span>;
        
        const start = new Date(row.original.created_at);
        const end = status === "RUNNING" ? new Date() : new Date(row.original.updated_at);
        
        const diffMins = differenceInMinutes(end, start);
        const diffSecs = differenceInSeconds(end, start) % 60;
        
        return (
          <span className="text-sm text-muted-foreground">
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
        
        if (status === "RUNNING" || status === "PENDING") {
          return (
            <TooltipProvider delay={300}>
              <div className="flex items-center justify-end">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCancelJobId(jobId);
                          setCancelDialogOpen(true);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        <span className="sr-only">Cancel Task</span>
                      </Button>
                    }
                  />
                  <TooltipContent side="bottom" align="end">Cancel Task</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          );
        }

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
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
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
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
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
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
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

  const cancelTargetJob = cancelJobId ? jobs.find(j => j.job_id === cancelJobId) : null;

  return (
    <AppShell breadcrumbs={[{ label: "Tasks" }]}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Active Tasks</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Compact view of all running and pending operations.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Auto-refreshing
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Total Active"
              value={jobs.length}
              icon={<RefreshCcw className="h-4 w-4" />}
              className="bg-card border-border/50 shadow-sm"
            />
            <MetricCard
              title="Pending"
              value={pendingCount}
              icon={<Clock className="h-4 w-4" />}
              className="bg-card border-border/50 shadow-sm"
            />
            <MetricCard
              title="Running"
              value={runningCount}
              icon={<Play className="h-4 w-4" />}
              className="bg-card border-border/50 shadow-sm"
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
                </div>
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Inbox className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No active tasks</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  All operations have completed. Start a new inventory adjustment to see tasks here.
                </p>
                <Button
                  render={<a href="/inventory-adjustment" />}
                >
                  Start New Adjustment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  All ({jobs.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({pendingCount})
                </TabsTrigger>
                <TabsTrigger value="running">
                  Running ({runningCount})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <DataTable columns={columns} data={filteredJobs} searchKey="distributor_username" searchPlaceholder="Search distributor..." defaultPageSize={10} />
              </TabsContent>
              <TabsContent value="pending">
                <DataTable columns={columns} data={filteredJobs} searchKey="distributor_username" searchPlaceholder="Search distributor..." defaultPageSize={10} />
              </TabsContent>
              <TabsContent value="running">
                <DataTable columns={columns} data={filteredJobs} searchKey="distributor_username" searchPlaceholder="Search distributor..." defaultPageSize={10} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Task?</DialogTitle>
            <DialogDescription>
              Task untuk <span className="font-medium text-foreground">{cancelTargetJob?.distributor_name || cancelTargetJob?.distributor_username}</span> akan dibatalkan. Aksi ini tidak bisa di-undo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Kembali
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => cancelJobId && handleCancelJob(cancelJobId)}
            >
              <Ban className="h-4 w-4 mr-1" />
              Ya, Batalkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
