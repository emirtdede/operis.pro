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

  it("redirects /tr/guvenlik to /tr/ayarlar?tab=security with 301", async () => {
    const req = makeRequest("https://operis.com/tr/guvenlik");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/ayarlar?tab=security");
  });

  it("redirects /tr/panel/guvenlik to /tr/ayarlar?tab=security with 301", async () => {
    const req = makeRequest("https://operis.com/tr/panel/guvenlik");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/ayarlar?tab=security");
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

  it("redirects /tr/ilan-ver to /tr/ilanlar/yeni with 301", async () => {
    const req = makeRequest("https://operis.com/tr/ilan-ver");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/ilanlar/yeni");
  });

  it("redirects /tr/kullanim-kosullari to /tr/yasal/kullanim-kosullari with 301", async () => {
    const req = makeRequest("https://operis.com/tr/kullanim-kosullari");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/yasal/kullanim-kosullari");
  });

  it("redirects /tr/gizlilik to /tr/yasal/gizlilik-ve-kvkk with 301", async () => {
    const req = makeRequest("https://operis.com/tr/gizlilik");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/yasal/gizlilik-ve-kvkk");
  });

  it("redirects /tr/cerezler to /tr/yasal/cerez-politikasi with 301", async () => {
    const req = makeRequest("https://operis.com/tr/cerezler");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/tr/yasal/cerez-politikasi");
  });

  it("redirects /en/post-job to /en/listings/new with 301", async () => {
    const req = makeRequest("https://operis.com/en/post-job");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/en/listings/new");
  });

  it("redirects /en/terms to /en/legal/terms with 301", async () => {
    const req = makeRequest("https://operis.com/en/terms");
    const res = await proxy(req);
    expect(res).toBeDefined();
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe("https://operis.com/en/legal/terms");
  });
});
