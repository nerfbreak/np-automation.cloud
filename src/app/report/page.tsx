"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/data-display/metric-card";
import { StatusBadge } from "@/components/feedback/status-badge";
import { formatDistanceToNow, differenceInMinutes, differenceInSeconds } from "date-fns";
import { Download, Copy, Image as ImageIcon, CheckCircle2, XCircle, TrendingUp, FileText, Inbox, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { copyJobResultText, copyJobResultImage } from "@/lib/utils";

const PAGE_SIZE = 20;

interface RealJob {
  id: string; job_id: string;
  distributor_username: string; distributor_name?: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  result_summary: string | null; created_at: string; updated_at: string;
}

function getDuration(job: RealJob): string {
  const start = new Date(job.created_at);
  const end = job.status === "RUNNING" ? new Date() : new Date(job.updated_at);
  const m = differenceInMinutes(end, start);
  const s = differenceInSeconds(end, start) % 60;
  return m > 0 ? `${m}m ${s}s` : s > 0 ? `${s}s` : "0s";
}

const SUMMARY_LIMIT = 80;

function SummaryCell({ summary }: { summary: string }) {
  const [open, setOpen] = useState(false);
  const truncated = summary.length > SUMMARY_LIMIT;
  const preview = truncated ? summary.slice(0, SUMMARY_LIMIT) + "…" : summary;
  return (
    <TableCell className="py-3 text-xs text-muted-foreground whitespace-normal break-words max-w-[300px]">
      <span>{preview}</span>
      {truncated && (
        <>
          <button
            onClick={() => setOpen(true)}
            className="ml-1 text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            Show more
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Summary</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
                {summary}
              </p>
            </DialogContent>
          </Dialog>
        </>
      )}
    </TableCell>
  );
}

function JobRow({ job }: { job: RealJob }) {
  const name = job.distributor_name || job.distributor_username;
  const duration = job.status === "PENDING" ? null : getDuration(job);
  const summary = job.result_summary || "-";
  return (
    <TableRow>
      <TableCell className="py-3">
        <div className="font-medium text-sm">{name}</div>
        {job.distributor_name && <div className="text-xs text-muted-foreground mt-0.5">{job.distributor_username}</div>}
      </TableCell>
      <TableCell className="py-3"><StatusBadge status={job.status} /></TableCell>
      <TableCell className="py-3 whitespace-nowrap text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
      </TableCell>
      <TableCell className="py-3 whitespace-nowrap text-xs tabular-nums text-muted-foreground">{duration ?? "-"}</TableCell>
      <SummaryCell summary={summary} />
      <TableCell className="py-3">
        {job.status === "COMPLETED" && (
          <TooltipProvider delay={300}>
            <div className="flex items-center gap-0.5 justify-end">
              <Tooltip>
                <TooltipTrigger render={
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => { const a = document.createElement("a"); a.href=`/screenshots/${job.job_id}.png`; a.download=`bukti_${job.job_id}.png`; a.click(); }}>
                    <Download className="h-3.5 w-3.5" /><span className="sr-only">Unduh Screenshot</span>
                  </Button>
                }/>
                <TooltipContent>Unduh Screenshot</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={async () => { const tid=toast.loading("Menyalin..."); const r=await copyJobResultImage(job.job_id); r.success?toast.success("Gambar disalin!",{id:tid}):toast.error("Gagal mengambil gambar",{id:tid}); }}>
                    <ImageIcon className="h-3.5 w-3.5" /><span className="sr-only">Salin Gambar</span>
                  </Button>
                }/>
                <TooltipContent>Salin Gambar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger render={
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={async () => {
                      const r = await copyJobResultText(
                        job.distributor_name || "",
                        job.distributor_username,
                        job.result_summary || "",
                        duration || "0s"
                      );
                      r.success ? toast.success("Teks disalin!") : toast.error("Gagal menyalin teks");
                    }}>
                    <Copy className="h-3.5 w-3.5" /><span className="sr-only">Salin Teks</span>
                  </Button>
                }/>
                <TooltipContent>Salin Teks</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </TableCell>
    </TableRow>
  );
}

function Pagination({ page, total, pageSize, onChange }: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-2 py-3 border-t">
      <p className="text-xs text-muted-foreground">
        {(page - 1) * pageSize + 1}&#8211;{Math.min(page * pageSize, total)} dari {total} jobs
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs px-2 tabular-nums">{page} / {totalPages}</span>
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [jobs, setJobs] = useState<RealJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const fetch_ = async () => {
      try {
        const r = await fetch("/api/jobs");
        if (!r.ok) return;
        const d = await r.json();
        if (isMounted) setJobs(Array.isArray(d) ? d : (d.jobs ?? []));
      } catch {} finally { if (isMounted) setIsLoading(false); }
    };
    fetch_();
    const iv = setInterval(fetch_, 5000);
    return () => { isMounted = false; clearInterval(iv); };
  }, []);

  const completedCount = jobs.filter(j => j.status === "COMPLETED").length;
  const failedCount = jobs.filter(j => j.status === "FAILED").length;
  const successRate = jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0;

  const filteredJobs = (
    activeTab === "all" ? jobs :
    activeTab === "completed" ? jobs.filter(j => j.status === "COMPLETED") :
    jobs.filter(j => j.status === "FAILED")
  ).filter(j => (j.distributor_name || j.distributor_username).toLowerCase().includes(search.toLowerCase()));

  const pagedJobs = filteredJobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const handleTabChange = (v: string) => { setActiveTab(v); setSearch(""); setPage(1); };
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <AppShell breadcrumbs={[{ label: "Report" }]}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs Report</h1>
          <p className="text-muted-foreground mt-2 text-sm">History of all completed and failed operations.</p>
        </div>



        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({length:4}).map((_,i) => (
              <Card key={i}><CardContent className="pt-4"><Skeleton className="h-4 w-24 mb-2"/><Skeleton className="h-8 w-12"/></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="Total Jobs" value={jobs.length} icon={<FileText className="h-4 w-4"/>} className="bg-card border-border/50 shadow-sm"/>
            <MetricCard title="Completed" value={completedCount} icon={<CheckCircle2 className="h-4 w-4"/>} className="bg-card border-border/50 shadow-sm"/>
            <MetricCard title="Failed" value={failedCount} icon={<XCircle className="h-4 w-4"/>} className="bg-card border-border/50 shadow-sm"/>
            <MetricCard title="Success Rate" value={`${successRate}%`} icon={<TrendingUp className="h-4 w-4"/>} className="bg-card border-border/50 shadow-sm"/>
          </div>
        )}
        {isLoading ? (
          <Card><CardContent className="py-8">
            <div className="space-y-3"><Skeleton className="h-8 w-full"/><Skeleton className="h-12 w-full"/><Skeleton className="h-12 w-full"/></div>
          </CardContent></Card>
        ) : jobs.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4"><Inbox className="h-8 w-8 text-muted-foreground"/></div>
            <h3 className="text-lg font-semibold mb-1">No completed jobs yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">Completed and failed jobs will appear here after processing.</p>
          </CardContent></Card>
        ) : (
          <Tabs defaultValue="all" onValueChange={handleTabChange}>
            <div className="flex items-center justify-between mb-3">
              <TabsList>
                <TabsTrigger value="all">All ({jobs.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
                <TabsTrigger value="failed">Failed ({failedCount})</TabsTrigger>
              </TabsList>
              <div className="relative w-[220px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search distributor..." value={search} onChange={e => handleSearch(e.target.value)} className="pl-8 h-9"/>
              </div>
            </div>
            {(["all","completed","failed"] as const).map(tab => (
              <TabsContent key={tab} value={tab} className="mt-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[220px]">Distributor</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[140px]">Time</TableHead>
                        <TableHead className="w-[90px]">Duration</TableHead>
                        <TableHead className="max-w-[300px]">Summary</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedJobs.length === 0
                        ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground">Tidak ada data.</TableCell></TableRow>
                        : pagedJobs.map(job => <JobRow key={job.id} job={job}/>)
                      }
                    </TableBody>
                  </Table>
                  <Pagination page={page} total={filteredJobs.length} pageSize={PAGE_SIZE} onChange={setPage}/>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </AppShell>
  );
}
