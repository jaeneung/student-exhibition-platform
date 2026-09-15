import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { headers } from "next/headers";
import {
  checkThrottle,
  getClientIp,
  recordFailedAttempt,
  resetAttempts,
} from "@/lib/loginThrottle";

let ipCounter = 0;
function freshIp(): string {
  ipCounter += 1;
  return `192.0.2.${ipCounter}`;
}

describe("checkThrottle / recordFailedAttempt", () => {
  it("is not throttled before any failed attempts", async () => {
    const ip = freshIp();
    expect(await checkThrottle(ip)).toEqual({ throttled: false });
  });

  it("stays unthrottled below the max attempt count", async () => {
    const ip = freshIp();
    for (let i = 0; i < 2; i += 1) {
      await recordFailedAttempt(ip);
    }
    expect(await checkThrottle(ip)).toEqual({ throttled: false });
  });

  it("throttles once the max attempt count is reached", async () => {
    const ip = freshIp();
    for (let i = 0; i < 3; i += 1) {
      await recordFailedAttempt(ip);
    }
    const result = await checkThrottle(ip);
    expect(result.throttled).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resetAttempts clears a throttled IP back to unthrottled", async () => {
    const ip = freshIp();
    for (let i = 0; i < 3; i += 1) {
      await recordFailedAttempt(ip);
    }
    expect((await checkThrottle(ip)).throttled).toBe(true);
    await resetAttempts(ip);
    expect(await checkThrottle(ip)).toEqual({ throttled: false });
  });

  it("tracks separate IPs independently", async () => {
    const ipA = freshIp();
    const ipB = freshIp();
    for (let i = 0; i < 3; i += 1) {
      await recordFailedAttempt(ipA);
    }
    expect((await checkThrottle(ipA)).throttled).toBe(true);
    expect((await checkThrottle(ipB)).throttled).toBe(false);
  });

  it("treats an expired window as reset, starting the count over", async () => {
    const ip = freshIp();
    for (let i = 0; i < 3; i += 1) {
      await recordFailedAttempt(ip);
    }
    expect((await checkThrottle(ip)).throttled).toBe(true);

    const realNow = Date.now;
    vi.spyOn(Date, "now").mockImplementation(() => realNow() + 31 * 60 * 1000);
    try {
      expect((await checkThrottle(ip)).throttled).toBe(false);
      await recordFailedAttempt(ip);
      expect((await checkThrottle(ip)).throttled).toBe(false);
    } finally {
      vi.restoreAllMocks();
    }
  });
});

describe("getClientIp", () => {
  it("prefers the Netlify client-connection-ip header", async () => {
    vi.mocked(headers).mockResolvedValue({
      get: (name: string) => (name === "x-nf-client-connection-ip" ? "203.0.113.5" : null),
    } as unknown as Awaited<ReturnType<typeof headers>>);
    expect(await getClientIp()).toBe("203.0.113.5");
  });

  it("falls back to the first x-forwarded-for entry", async () => {
    vi.mocked(headers).mockResolvedValue({
      get: (name: string) => (name === "x-forwarded-for" ? "203.0.113.9, 10.0.0.1" : null),
    } as unknown as Awaited<ReturnType<typeof headers>>);
    expect(await getClientIp()).toBe("203.0.113.9");
  });

  it("falls back to \"unknown\" when neither header is present", async () => {
    vi.mocked(headers).mockResolvedValue({
      get: () => null,
    } as unknown as Awaited<ReturnType<typeof headers>>);
    expect(await getClientIp()).toBe("unknown");
  });
});
