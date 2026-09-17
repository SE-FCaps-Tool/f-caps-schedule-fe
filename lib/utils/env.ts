// NEXT_PUBLIC_ENV=production phải set thủ công ở deploy (docs/SETUP.md) vì trên
// Vercel, NODE_ENV luôn là "production" cho mọi `next build` kể cả Preview —
// NODE_ENV không đủ để phân biệt production thật với preview branch khác.
export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENV === "production";
}
