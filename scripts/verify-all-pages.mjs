// scripts/verify-all-pages.mjs
const BASE_URL = "http://localhost:8000";

const routes = [
  // Root and SEO
  { path: "/", label: "Root" },
  { path: "/robots.txt", label: "Robots.txt" },
  { path: "/sitemap.xml", label: "Sitemap.xml" },

  // Turkish Public Pages
  { path: "/tr", label: "TR: Anasayfa (Landing)" },
  { path: "/tr/ilanlar", label: "TR: İlanlar (Listing Hub)" },
  { path: "/tr/ilanlar?view=stream", label: "TR: İlanlar Akış Görünümü" },
  { path: "/tr/ilanlar/yeni", label: "TR: Yeni İlan Oluştur" },
  { path: "/tr/kategoriler", label: "TR: Kategoriler Dizini" },
  { path: "/tr/kategori/yazilim-ve-teknoloji", label: "TR: Kategori Detay (Yazılım)" },
  { path: "/tr/giris", label: "TR: Giriş Yap" },
  { path: "/tr/kayit", label: "TR: Kayıt Ol" },
  { path: "/tr/sifremi-unuttum", label: "TR: Şifremi Unuttum" },
  { path: "/tr/sifre-sifirla", label: "TR: Şifre Sıfırla" },
  { path: "/tr/hakkimizda", label: "TR: Hakkımızda" },
  { path: "/tr/iletisim", label: "TR: İletişim" },
  { path: "/tr/yardim", label: "TR: Yardım & SSS" },
  { path: "/tr/marka", label: "TR: Marka Varlıkları" },
  { path: "/tr/sikayet-bildir", label: "TR: İhlal & Şikayet Bildirimi" },
  { path: "/tr/yetkisiz", label: "TR: Yetkisiz Erişim" },
  
  // Turkish Legal Pages
  { path: "/tr/yasal", label: "TR: Yasal Merkez" },
  { path: "/tr/yasal/kullanim-kosullari", label: "TR: Kullanım Koşulları" },
  { path: "/tr/yasal/gizlilik-ve-kvkk", label: "TR: Gizlilik ve KVKK" },
  { path: "/tr/yasal/cerez-politikasi", label: "TR: Çerez Politikası" },
  { path: "/tr/yasal/eslestirme-ve-sorumluluk-reddi", label: "TR: Eşleştirme & Sorumluluk Reddi" },
  { path: "/tr/yasal/kabul-edilebilir-kullanim", label: "TR: Kabul Edilebilir Kullanım" },
  { path: "/tr/yasal/acik-riza-metni", label: "TR: Açık Rıza Metni" },
  { path: "/tr/yasal/uyusmazlik-cozumu", label: "TR: Uyuşmazlık Çözümü" },
  { path: "/tr/yasal/fikri-mulkiyet-ve-telif", label: "TR: Fikri Mülkiyet & Telif" },
  { path: "/tr/yasal/iletisim", label: "TR: Yasal İletişim" },

  // Turkish User & Dashboard Pages
  { path: "/tr/profil/operis", label: "TR: Profil" },
  { path: "/tr/panel", label: "TR: Panel Kısayolu" },
  { path: "/tr/panel/ilanlarim", label: "TR: İlanlarım" },
  { path: "/tr/panel/teklifler/gelen", label: "TR: Gelen Teklifler" },
  { path: "/tr/panel/teklifler/gonderilen", label: "TR: Gönderilen Teklifler" },
  { path: "/tr/panel/aktif-isler", label: "TR: Aktif İşler" },
  { path: "/tr/panel/kaydedilenler", label: "TR: Kaydedilenler" },
  { path: "/tr/panel/kategorilerim", label: "TR: Kategorilerim" },
  { path: "/tr/panel/guvenlik", label: "TR: Güvenlik Paneli" },
  { path: "/tr/panel/bildirimler", label: "TR: Bildirimler" },
  { path: "/tr/ayarlar", label: "TR: Hesap Ayarları" },

  // English Public Pages
  { path: "/en", label: "EN: Homepage (Landing)" },
  { path: "/en/listings", label: "EN: Listings Hub" },
  { path: "/en/listings/new", label: "EN: Post New Job" },
  { path: "/en/categories", label: "EN: Categories Directory" },
  { path: "/en/category/software-and-technology", label: "EN: Category Detail" },
  { path: "/en/login", label: "EN: Login" },
  { path: "/en/register", label: "EN: Register" },
  { path: "/en/forgot-password", label: "EN: Forgot Password" },
  { path: "/en/reset-password", label: "EN: Reset Password" },
  { path: "/en/about", label: "EN: About Us" },
  { path: "/en/contact", label: "EN: Contact" },
  { path: "/en/help", label: "EN: Help & FAQ" },
  { path: "/en/brand", label: "EN: Brand Assets" },
  { path: "/en/report", label: "EN: Report Violation" },
  { path: "/en/unauthorized", label: "EN: Unauthorized" },

  // English Legal Pages
  { path: "/en/legal", label: "EN: Legal Hub" },
  { path: "/en/legal/terms", label: "EN: Terms of Service" },
  { path: "/en/legal/privacy", label: "EN: Privacy Policy" },
  { path: "/en/legal/cookies", label: "EN: Cookie Policy" },

  // English Dashboard Pages
  { path: "/en/dashboard", label: "EN: Dashboard" },
  { path: "/en/dashboard/listings", label: "EN: My Listings" },
  { path: "/en/dashboard/offers/received", label: "EN: Offers Received" },
  { path: "/en/dashboard/offers/sent", label: "EN: Offers Sent" },
  { path: "/en/dashboard/work", label: "EN: Active Workspaces" },
  { path: "/en/dashboard/saved", label: "EN: Saved Items" },
  { path: "/en/dashboard/categories", label: "EN: My Categories" },
  { path: "/en/dashboard/security", label: "EN: Security Settings" },
  { path: "/en/dashboard/notifications", label: "EN: Notifications" },
  { path: "/en/settings", label: "EN: Settings" },

  // Admin Routes
  { path: "/admin/login", label: "Admin: Giriş Ekranı" },
  { path: "/admin", label: "Admin: Dashboard Konsolu" },
  { path: "/admin/listings", label: "Admin: İlan Yönetimi" },
  { path: "/admin/offers", label: "Admin: Teklif Yönetimi" },
  { path: "/admin/engagements", label: "Admin: İş Yönetimi" },
  { path: "/admin/users", label: "Admin: Kullanıcı Yönetimi" },
  { path: "/admin/moderation/abuse", label: "Admin: Moderasyon & Şikayetler" },
  { path: "/admin/security/threats", label: "Admin: Güvenlik Tehditleri" },
  { path: "/admin/monitoring", label: "Admin: Sistem İzleme" },
  { path: "/admin/logs", label: "Admin: Denetim Günlükleri" },
  { path: "/admin/messages", label: "Admin: Mesajlar" },
];

async function checkRoute(route) {
  const url = BASE_URL + route.path;
  const start = Date.now();
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const durationMs = Date.now() - start;
      const status = res.status;
      
      const hasError = text.includes("Unhandled Runtime Error") || 
                       text.includes("Internal Server Error") ||
                       text.includes("Error: Minified React error");

      return {
        path: route.path,
        label: route.label,
        status,
        durationMs,
        bodyLength: text.length,
        hasError,
        ok: !hasError && (status === 200 || status === 401 || status === 403),
      };
    } catch (err) {
      if (attempt === 1) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return {
        path: route.path,
        label: route.label,
        status: 0,
        durationMs: Date.now() - start,
        hasError: true,
        errorMsg: err.message,
        ok: false,
      };
    }
  }
}

async function main() {
  console.log(`Starting page audit for ${routes.length} routes against ${BASE_URL}...`);
  console.log("--------------------------------------------------------------------------------");

  const results = [];
  for (const route of routes) {
    const res = await checkRoute(route);
    results.push(res);
    const pathStr = route.path.padEnd(42);
    if (res.ok) {
      console.log(`[PASS] ${pathStr} Status: ${res.status} (${res.durationMs}ms, ${res.bodyLength} B)`);
    } else {
      console.log(`[FAIL] ${pathStr} Status: ${res.status} ${res.errorMsg || (res.hasError ? "Runtime Error In Body" : "Failed")}`);
    }
  }

  console.log("--------------------------------------------------------------------------------");
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log(`Audit Complete: ${passed} PASSED, ${failed} FAILED out of ${results.length} tested routes.`);
  
  if (failed > 0) {
    console.log("\nFailed Routes Details:");
    for (const f of results.filter(r => !r.ok)) {
      console.log(`- ${f.path} (${f.label}): Status ${f.status}, Error: ${f.errorMsg || "Content error"}`);
    }
  }
}

main().catch(console.error);
