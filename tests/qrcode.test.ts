import QRCode from "qrcode";
import { describe, expect, it } from "vitest";

/**
 * The launch link and the QR code on a project's detail page are both derived
 * directly from the same `project.launchUrl` field (see app/projects/[id]/page.tsx),
 * so they can never point to different places. This test locks in the other half
 * of that guarantee: QR generation itself is deterministic for a given URL, so
 * re-rendering the detail page never produces a QR code that silently drifts
 * from the launch link for the same project.
 */
describe("QR code generation", () => {
  it("produces a PNG data URL", async () => {
    const dataUrl = await QRCode.toDataURL("https://example.com/exhibits/carbon-tracker");
    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("is deterministic for the same URL", async () => {
    const url = "https://example.com/exhibits/carbon-tracker";
    const first = await QRCode.toDataURL(url);
    const second = await QRCode.toDataURL(url);
    expect(first).toBe(second);
  });

  it("produces different output for different URLs", async () => {
    const a = await QRCode.toDataURL("https://example.com/a");
    const b = await QRCode.toDataURL("https://example.com/b");
    expect(a).not.toBe(b);
  });
});
