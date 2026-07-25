import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function copyJobResultText(
  distributorName: string,
  distributorUsername: string,
  summary: string,
  duration: string
): Promise<{ success: boolean }> {
  try {
    const text = `*${distributorName}* (@${distributorUsername})\n${summary}\n_Durasi: ${duration}_`
    await navigator.clipboard.writeText(text)
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function copyJobResultImage(jobId: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`/api/jobs/${jobId}/screenshot`)
    if (!res.ok) return { success: false }
    const { screenshotBase64 } = await res.json()
    const imgRes = await fetch(`data:image/png;base64,${screenshotBase64}`)
    const blob = await imgRes.blob()
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
    return { success: true }
  } catch {
    return { success: false }
  }
}

