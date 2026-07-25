import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const redirect = req.nextUrl.searchParams.get("redirect") || "/";

  const refreshToken = req.cookies.get("np_refresh")?.value;

  if (!refreshToken) {
    // No refresh token — go to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      // Refresh failed — clear cookies and go to login
      const loginUrl = new URL("/login", req.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("np_session");
      response.cookies.delete("np_refresh");
      response.cookies.delete("np_user");
      return response;
    }

    // Refresh success — set new cookies and redirect to original destination
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    const targetUrl = new URL(redirect, req.url);
    const response = NextResponse.redirect(targetUrl);

    response.cookies.set("np_session", data.session.access_token, {
      ...cookieOpts,
      maxAge: 60 * 60, // 1 jam
    });

    response.cookies.set("np_refresh", data.session.refresh_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    const role = data.user.user_metadata?.role || "user";
    const username = data.user.email?.replace("@np-automation.cloud", "") || "";
    response.cookies.set(
      "np_user",
      JSON.stringify({ username, role }),
      {
        httpOnly: false,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      }
    );

    return response;
  } catch (err) {
    console.error("[Auth Refresh] Error:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}
