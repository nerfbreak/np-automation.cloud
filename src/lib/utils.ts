import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export async function copyJobResultText(distributorName: string, distributorUsername: string, summary: string, duration: string) {
  const distributorDisplay = distributorName ? `${distributorName} (${distributorUsername})` : distributorUsername;
  const textToCopy = `Stok Adjustment Report\nDistributor: ${distributorDisplay}\nStatus: ${summary}\nDuration: ${duration}`;
  
  try {
    await navigator.clipboard.writeText(textToCopy);
    return { success: true };
  } catch (error) {
    console.error("Failed to copy text", error);
    return { success: false };
  }
}

export async function copyJobResultImage(jobId: string) {
  try {
    const response = await fetch(`/screenshots/${jobId}.png`);
    if (!response.ok) {
      throw new Error("Screenshot not found");
    }
    const imageBlob = await response.blob();
    const pngBlob = new Blob([imageBlob], { type: "image/png" });
    
    const clipboardItem = new ClipboardItem({
      "image/png": pngBlob
    });
    
    await navigator.clipboard.write([clipboardItem]);
    return { success: true };
  } catch (error) {
    console.error("Failed to copy image", error);
    return { success: false };
  }
}
