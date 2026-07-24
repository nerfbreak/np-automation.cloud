"use client";

import { useEffect, useState } from "react";
import { Server, Cpu, HardDrive, Network, MemoryStick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SystemStats {
  cpu: { load: number; cores: number };
  memory: { total: number; used: number; free: number };
  storage: { total: number; used: number; free: number };
  network: { rx_sec: number; tx_sec: number };
  timestamp: number;
}

export function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/system/stats");
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        if (isMounted) setStats(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000); // refresh every 3 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!stats) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" /> VPS System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-16 items-center justify-center text-muted-foreground animate-pulse">
            Connecting to VPS...
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const memPercent = (stats.memory.used / stats.memory.total) * 100;
  const storagePercent = (stats.storage.used / stats.storage.total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Server className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold tracking-tight">VPS Server Status</h3>
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full ml-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live
        </span>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CPU */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">CPU ({stats.cpu.cores} Cores)</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cpu.load.toFixed(1)}%</div>
          </CardContent>
        </Card>

        {/* RAM */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RAM ({formatBytes(stats.memory.free, 1)} Free)</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memPercent.toFixed(1)}%</div>
            <div className="w-full h-1.5 bg-secondary rounded-full mt-2">
              <div 
                className={`h-1.5 rounded-full ${memPercent > 80 ? 'bg-destructive' : 'bg-primary'}`} 
                style={{ width: `${memPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storagePercent.toFixed(1)}%</div>
            <div className="w-full h-1.5 bg-secondary rounded-full mt-2">
              <div 
                className={`h-1.5 rounded-full ${storagePercent > 90 ? 'bg-destructive' : 'bg-primary'}`} 
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Network */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network (Rx/Tx)</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-xl font-bold">{formatBytes(stats.network.rx_sec)}/s ↓</span>
              <span className="text-sm text-muted-foreground mt-1">{formatBytes(stats.network.tx_sec)}/s ↑</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
