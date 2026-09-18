export interface InMemoryNotification {
  id: string;
  userId?: string;
  type: string;
  payloadJson: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

// Realistic sample notifications for development and demo mode resilience
export const inMemoryFallbackNotifications: InMemoryNotification[] = [
  {
    id: "notif-1",
    type: "OFFER_RECEIVED",
    payloadJson: {
      title: "Yeni Teklif Alındı",
      message: "Next.js Kurumsal E-Ticaret ilanınız için 45.000 TL tutarında yeni teklif iletildi.",
      actionUrl: "/tr/panel/teklifler/gelen",
    },
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
  },
  {
    id: "notif-2",
    type: "OFFER_ACCEPTED",
    payloadJson: {
      title: "Teklifiniz Kabul Edildi!",
      message:
        "Mobil Pazaryeri Uygulaması ilanına sunduğunuz teklif ilan sahibi tarafından onaylandı.",
      actionUrl: "/tr/panel/teklifler/gonderilen",
    },
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
  },
  {
    id: "notif-3",
    type: "MATCHED",
    payloadJson: {
      title: "Kategori Radarı: Yeni İlan",
      message:
        "Takip ettiğiniz 'Mobil Uygulama' kategorisinde yeni bir teknoloji ilanı yayınlandı.",
      actionUrl: "/tr/ilanlar",
    },
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "notif-4",
    type: "SECURITY_EVENT",
    payloadJson: {
      title: "Güvenlik Bildirimi",
      message:
        "Hesabınıza İstanbul konumundaki güncel tarayıcı oturumundan başarıyla giriş yapıldı.",
      actionUrl: "/tr/panel/ayarlar",
    },
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: "notif-5",
    type: "OFFER_UPDATED",
    payloadJson: {
      title: "Teklif Revizesi İletildi",
      message:
        "SaaS Dashboard projesindeki teklif parametreleri serbest çalışan tarafından revize edildi.",
      actionUrl: "/tr/panel/teklifler/gelen",
    },
    readAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
  },
  {
    id: "notif-6",
    type: "COMPLETION_CONFIRMED",
    payloadJson: {
      title: "Proje Başarıyla Tamamlandı",
      message: "API Entegrasyonu projesinin teslimatı müşteri tarafından onaylandı ve arşivlendi.",
      actionUrl: "/tr/panel/ilanlarim",
    },
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "notif-7",
    type: "LISTING_EXPIRING_SOON",
    payloadJson: {
      title: "Canlılık Uyarısı (24 Saat Kaldı)",
      message:
        "Yayınladığınız projenin 7 günlük tazelik süresi yarın dolacaktır. Tek tıkla yenileyebilirsiniz.",
      actionUrl: "/tr/panel/ilanlarim",
    },
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 32).toISOString(),
  },
  {
    id: "notif-8",
    type: "MODERATION_ACTION",
    payloadJson: {
      title: "İlan Kalite Onayı Verildi",
      message: "Yeni yayınladığınız ilan Operis sıfır-spam ve içerik denetimini başarıyla geçti.",
      actionUrl: "/tr/ilanlar",
    },
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    id: "notif-9",
    type: "MATCHED",
    payloadJson: {
      title: "Yeni Proje Eşleşmesi",
      message: "İlgi alanlarınıza uygun 'Yapay Zeka & LLM Entegrasyonu' ilanı yayına girdi.",
      actionUrl: "/tr/ilanlar",
    },
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 62).toISOString(),
  },
  {
    id: "notif-10",
    type: "OFFER_RECEIVED",
    payloadJson: {
      title: "Yeni Teklif Alındı",
      message: "Fintech Mobil Uygulaması için 80.000 TL tutarında yeni teklif iletildi.",
      actionUrl: "/tr/panel/teklifler/gelen",
    },
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 74).toISOString(),
  },
];
