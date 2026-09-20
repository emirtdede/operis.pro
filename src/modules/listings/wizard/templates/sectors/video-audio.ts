import type { WizardQuestion } from "../types";

export const videoAudioQuestions: WizardQuestion[] = [
  {
    key: "rawFootageSource",
    type: "single",
    required: true,
    labelKey: "Ham Görüntü ve Çekim Kaynağı",
    labelEn: "Footage & Source Media",
    clarityWeight: 10,
    helpTip: "Videonun montajı için ham kayıtların durumunu belirtin.",
    helpTipEn: "Clarify video footage source.",
    options: [
      {
        value: "client_raw_ready",
        label: "Ham Çekimler (4K/HD) Hazır ve Bulutta Yüklü",
        labelEn: "Client Raw Footage (4K/HD) Ready on Cloud",
      },
      {
        value: "commercial_stock_only",
        label: "Lisanslı Stok Video ve Fotoğraflar Kullanılacak",
        labelEn: "Commercial Stock Footage & Photos",
      },
      {
        value: "pure_motion_animation",
        label: "Kamera Çekimi Yok; Tamamen 2D/3D Motion Grafik ve Animasyon",
        labelEn: "No Camera Footage; 100% 2D/3D Motion Animation",
      },
    ],
  },
  {
    key: "aspectRatioTarget",
    type: "single",
    required: true,
    labelKey: "Hedef Format ve En-Boy Oranı",
    labelEn: "Aspect Ratio & Platforms",
    clarityWeight: 10,
    helpTip: "Videonun dikey mi yatay mı olacağını belirleyin.",
    helpTipEn: "Specify target video orientation.",
    options: [
      {
        value: "vertical_9_16",
        label: "9:16 Dikey (Instagram Reels, TikTok, YouTube Shorts)",
        labelEn: "9:16 Vertical (Reels, TikTok, Shorts)",
      },
      {
        value: "horizontal_16_9",
        label: "16:9 Yatay (YouTube, Web Sitesi, Sunum, TV)",
        labelEn: "16:9 Horizontal (YouTube, Website, TV)",
      },
      {
        value: "both_master_and_cutdowns",
        label: "Her İki Format (Yatay Master Video + Dikey Sosyal Medya Kesitleri)",
        labelEn: "Both Formats (16:9 Master + 9:16 Social Cutdowns)",
      },
    ],
  },
  {
    key: "audioVoiceoverLicensing",
    type: "single",
    required: true,
    labelKey: "Seslendirme ve Müzik Lisansı",
    labelEn: "Voiceover & Audio Licensing",
    clarityWeight: 10,
    helpTip: "Seslendirme ve fon müziği telif kapsamını belirleyin.",
    helpTipEn: "Define audio voice-over and music licensing.",
    options: [
      {
        value: "pro_voiceover_licensed_music",
        label: "Profesyonel Seslendirmen + Ticari Lisanslı Müzik Dahil",
        labelEn: "Professional Human Voiceover + Commercial Music License",
      },
      {
        value: "client_provides_audio",
        label: "Ses Kaydı İşveren Tarafından Sağlanacak",
        labelEn: "Audio Voiceover Supplied by Client",
      },
      {
        value: "ai_voice_and_royalty_free",
        label: "Yapay Zeka Seslendirme ve Telifsiz Fon Müziği Yeterli",
        labelEn: "AI Voiceover & Royalty-Free Stock Audio Sufficient",
      },
    ],
  },
  {
    key: "targetDuration",
    type: "single",
    required: true,
    labelKey: "Hedef Video Süresi",
    labelEn: "Target Duration",
    clarityWeight: 10,
    helpTip: "Videonun hedef uzunluğunu seçin.",
    helpTipEn: "Select target length.",
    options: [
      {
        value: "under_60s",
        label: "60 Saniye Altı (Kısa Vurucu Format)",
        labelEn: "Under 60 Seconds (Short-Form)",
      },
      {
        value: "one_to_three_min",
        label: "1 - 3 Dakika (Ürün Tanıtımı / Açıklayıcı Video)",
        labelEn: "1 - 3 Minutes (Product Explainer)",
      },
      {
        value: "long_form_5min_plus",
        label: "5 Dakika ve Üzeri (Eğitim, Podcast, Belgesel Format)",
        labelEn: "5+ Minutes (Podcast / Long-Form / Tutorial)",
      },
    ],
  },
];
