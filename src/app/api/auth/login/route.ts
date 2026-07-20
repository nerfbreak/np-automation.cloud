import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 10 * 60; // 10 menit

function getLockKey(identifier: string) {
  return `login:lock:${identifier}`;
}
function getAttemptsKey(identifier: string) {
  return `login:attempts:${identifier}`;
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    // Identifikasi berdasarkan username (lowercase biar konsisten)
    const identifier = username.trim().toLowerCase();

    // ── Cek apakah sedang dikunci ──────────────────────────────────────────
    const lockKey = getLockKey(identifier);
    const attemptsKey = getAttemptsKey(identifier);

    const isLocked = await redis.get(lockKey);
    if (isLocked) {
      const ttl = await redis.ttl(lockKey);
      const minutesLeft = Math.ceil(ttl / 60);
      return NextResponse.json(
        {
          error: `Akun sementara dikunci karena terlalu banyak percobaan login yang gagal. Coba lagi dalam ${minutesLeft} menit.`,
          locked: true,
          retryAfter: ttl,
        },
        { status: 429 }
      );
    }

    // ── Coba login ke Supabase ──────────────────────────────────────────────
    const email = `${identifier}@np-automation.cloud`;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      // Login gagal — catat percobaan
      const attempts = await redis.incr(attemptsKey);

      // Set TTL pada key percobaan (reset otomatis setelah 15 menit tidak ada aktivitas)
      if (attempts === 1) {
        await redis.expire(attemptsKey, 15 * 60);
      }

      const remaining = MAX_ATTEMPTS - attempts;

      if (attempts >= MAX_ATTEMPTS) {
        // Kunci akun selama 10 menit
        await redis.set(lockKey, "1", "EX", LOCKOUT_SECONDS);
        await redis.del(attemptsKey);

        return NextResponse.json(
          {
            error: `Login gagal terlalu banyak kali. Akun dikunci selama 10 menit.`,
            locked: true,
            retryAfter: LOCKOUT_SECONDS,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `Username atau password salah. Sisa percobaan: ${remaining}`,
          attemptsLeft: remaining,
        },
        { status: 401 }
      );
    }

    // ── Login berhasil — reset counter ─────────────────────────────────────
    await redis.del(attemptsKey);
    await redis.del(lockKey);

    const role = data.user.user_metadata?.role || "user";

    const response = NextResponse.json({ success: true, user: { username: identifier, role } });

    // Cookie valid 7 hari
    response.cookies.set("np_session", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set("np_user", JSON.stringify({ username: identifier, role }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
