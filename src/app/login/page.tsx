"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { ShieldAlert, ShieldX, AlertTriangle, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Brute force state
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (locked && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setLocked(false);
            setAttemptsLeft(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [locked, countdown]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (!username || !password) {
      toast.error("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.locked) {
          setLocked(true);
          setCountdown(data.retryAfter ?? 600);
          setAttemptsLeft(0);
        } else {
          if (typeof data.attemptsLeft === "number") {
            setAttemptsLeft(data.attemptsLeft);
          }
          toast.error(data.error || "Login gagal");
        }
        return;
      }

      setAttemptsLeft(null);
      toast.success(`Selamat datang, ${data.user.username}!`);
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-lg border-primary/10">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${locked ? "bg-destructive/10" : "bg-primary/10"}`}>
            {locked
              ? <ShieldX className="w-6 h-6 text-destructive" />
              : <ShieldAlert className="w-6 h-6 text-primary" />
            }
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">NP Automation</CardTitle>
          <CardDescription>
            Masukkan kredensial untuk mengakses sistem internal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Warning: sisa percobaan */}
          {attemptsLeft !== null && attemptsLeft > 0 && !locked && (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertTitle>Login Gagal</AlertTitle>
              <AlertDescription>
                Sisa percobaan: <strong>{attemptsLeft}x</strong> sebelum akun dikunci 10 menit.
              </AlertDescription>
            </Alert>
          )}

          {/* Destructive: akun dikunci + countdown */}
          {locked && (
            <Alert variant="destructive">
              <Lock />
              <AlertTitle>Akun Dikunci</AlertTitle>
              <AlertDescription>
                Terlalu banyak percobaan gagal. Coba lagi dalam{" "}
                <strong className="font-mono">{formatCountdown(countdown)}</strong>.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading || locked}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading || locked}
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading || locked}
              variant={locked ? "secondary" : "default"}
            >
              {loading
                ? "Memverifikasi..."
                : locked
                ? `Dikunci (${formatCountdown(countdown)})`
                : "Masuk"
              }
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center text-xs text-muted-foreground border-t p-4">
          Hanya untuk personel yang berwenang.
        </CardFooter>
      </Card>
    </div>
  );
}
