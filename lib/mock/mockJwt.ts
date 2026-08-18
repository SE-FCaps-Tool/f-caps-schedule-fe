// Sinh JWT giả (không ký) để preview UI khi chưa có backend thật.
// jwtDecode() chỉ base64url-decode phần payload, không xác thực chữ ký,
// nên chuỗi 3 phần "header.payload.signature" là đủ để cookie đi qua proxy.ts.

function base64UrlEncode(input: string): string {
  const base64 =
    typeof window === "undefined"
      ? Buffer.from(input, "utf-8").toString("base64")
      : btoa(unescape(encodeURIComponent(input)));

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface MockTokenPayload {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export function createMockToken(
  payload: MockTokenPayload,
  expiresInSeconds = 60 * 60 * 24 * 7
): string {
  const header = { alg: "none", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };

  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(body)
  )}.mock-signature`;
}
