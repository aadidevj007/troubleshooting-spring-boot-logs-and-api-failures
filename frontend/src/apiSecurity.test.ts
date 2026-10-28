import { describe, expect, it } from "vitest";
import { isAllowedEndpoint, isSafeApiOrigin } from "./apiSecurity";

describe("API safety boundaries", () => {
  it("accepts only local API origins", () => {
    expect(isSafeApiOrigin("http://localhost:8081")).toBe(true);
    expect(isSafeApiOrigin("https://127.0.0.1:8081")).toBe(true);
    expect(isSafeApiOrigin("https://example.com")).toBe(false);
  });

  it("accepts only approved methods and paths", () => {
    expect(isAllowedEndpoint("GET", "/api/students")).toBe(true);
    expect(isAllowedEndpoint("GET", "/api/students/42")).toBe(true);
    expect(isAllowedEndpoint("POST", "/api/diagnostics/scenarios")).toBe(true);
    expect(isAllowedEndpoint("DELETE", "/api/students/1")).toBe(false);
    expect(isAllowedEndpoint("GET", "https://example.com/data")).toBe(false);
  });
});
