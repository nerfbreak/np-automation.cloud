import { NextRequest } from "next/server"
import { extractNewspageStock, BotProgressEvent } from "@/lib/newspage-bot"
import { supabaseAdmin } from "@/lib/supabase"
import { decrypt } from "@/lib/crypto"

export const maxDuration = 300 // 5 minutes max

export async function POST(req: NextRequest) {
  const { warehouseCode = "", username = "" } = await req.json().catch(() => ({}))

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: BotProgressEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        if (!username) {
          throw new Error("Username (Distributor Code) is missing")
        }

        // Fetch credentials from DB
        const { data: distributor, error: distError } = await supabaseAdmin
          .from('distributors')
          .select('username, password_encrypted')
          .eq('username', username)
          .single()

        if (distError || !distributor) {
          throw new Error(`Distributor ${username} not found`)
        }

        const plainPassword = decrypt(distributor.password_encrypted)
        const creds = { username: distributor.username, password: plainPassword }

        const result = await extractNewspageStock(creds, warehouseCode, send)

        // Kirim hasil akhir
        send({ type: "result", data: result.rows, rawCsv: result.rawCsv })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error"
        send({ type: "error", message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
