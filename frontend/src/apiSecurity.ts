export function isSafeApiOrigin(
  value: string,
  currentOrigin = typeof window === "undefined" ? "http://localhost" : window.location.origin,
): boolean {
  try {
    const url = new URL(value, currentOrigin);
    return ["http:", "https:"].includes(url.protocol)
      && ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function isAllowedEndpoint(method: string, path: string): boolean {
  return [
    "GET /api/students",
    "GET /api/diagnostics/database",
    "POST /api/diagnostics/scenarios",
    "POST /api/students",
  ].includes(`${method} ${path}`) || (method === "GET" && /^\/api\/students\/\d+$/.test(path));
}
