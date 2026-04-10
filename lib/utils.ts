import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fix storage URL for Mixed Content issues (HTPS -> HTTP)
 * Transforms internal absolute HTTP URLs (from Supabase or local dev)
 * to relative proxied paths starting with /supabase
 */
export function fixStorageUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  // List of base URLs to be proxied
  const storageBases = [
    "http://172.16.1.214:8000",
    "http://localhost:8000",
    // Could add NEXT_PUBLIC_SUPABASE_URL if it's an absolute internal one
  ];

  let fixedUrl = url;
  for (const base of storageBases) {
    if (fixedUrl.startsWith(base)) {
      fixedUrl = fixedUrl.replace(base, "/supabase");
      break;
    }
  }

  return fixedUrl;
}
