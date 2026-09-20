import { describe, it, expect } from "vitest";
import { proxy } from "@/src/proxy";
import { NextRequest } from "next/server";

describe("Dashboard and Panel Redirects & Aliases in Proxy", () => {
  function makeRequest(urlStr: string) {
    return new NextRequest(new URL(urlStr, "https://operis.com"));
  }

  it("redirects /tr/dashboard to /tr/panel/ilanlarim with 301", async () => {
    const req = makeRequest("https://operis.com/tr/dashboard");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/panel/ilanlarim");
  });

  it("redirects /tr/panel to /tr/panel/ilanlarim with 301", async () => {
    const req = makeRequest("https://operis.com/tr/panel");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/panel/ilanlarim");
  });

  it("redirects /tr/panel/ayarlar to /tr/ayarlar with 301", async () => {
    const req = makeRequest("https://operis.com/tr/panel/ayarlar");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/ayarlar");
  });

  it("redirects /tr/guvenlik to /tr/panel/guvenlik with 301", async () => {
    const req = makeRequest("https://operis.com/tr/guvenlik");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/panel/guvenlik");
  });

  it("redirects /tr/bildirimler to /tr/panel/bildirimler with 301", async () => {
    const req = makeRequest("https://operis.com/tr/bildirimler");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/panel/bildirimler");
  });

  it("redirects /tr/kategorilerim to /tr/panel/kategorilerim with 301", async () => {
    const req = makeRequest("https://operis.com/tr/kategorilerim");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/panel/kategorilerim");
  });

  it("redirects /tr/dashboard/saved to /tr/panel/kaydedilenler with 301", async () => {
    const req = makeRequest("https://operis.com/tr/dashboard/saved");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/panel/kaydedilenler");
  });

  it("redirects /tr/dashboard/work to /tr/panel/aktif-isler with 301", async () => {
    const req = makeRequest("https://operis.com/tr/dashboard/work");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/panel/aktif-isler");
  });
});
