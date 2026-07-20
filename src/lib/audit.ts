import { supabaseAdmin } from "./supabase";

export async function logAudit(action: string, actor: string, resource: string, details?: string) {
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert([
      {
        action,
        actor,
        resource,
        details: details || null,
      },
    ]);

    if (error) {
      console.error("Failed to insert audit log:", error);
    }
  } catch (error) {
    console.error("Error logging audit:", error);
  }
}
