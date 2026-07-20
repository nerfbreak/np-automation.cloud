"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTable } from "@/components/data-display/data-table";
import { StatusBadge } from "@/components/feedback/status-badge";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow, differenceInMinutes, differenceInSeconds } from "date-fns";
import { Download, Copy, Eye, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
          <div className="font-semibold text-base" title={name}>
            {name}
          </div>
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
          <div className="text-sm max-w-[300px] truncate" title={summary || "-"}>
            {summary || "-"}
          </div>
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

  return (
    <AppShell breadcrumbs={[{ label: "Report" }]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs Report</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            History of all completed and failed operations.
          </p>
        </div>
        
        <div className="mt-4">
          <DataTable columns={columns} data={jobs} defaultPageSize={5} />
        </div>
      </div>
    </AppShell>
  );
}
