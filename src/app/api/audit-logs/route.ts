import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit logs" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Audit Logs API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
