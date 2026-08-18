import { headers } from "next/headers";
import { getSiteUrl } from "./site";

// Chỉ dùng trong Server Components — headers() là async ở Next.js 16
export async function getSiteUrlFromRequest(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") || "https";

    if (!host) return getSiteUrl();

    return `${proto}://${host}`;
  } catch {
    return getSiteUrl();
  }
}
