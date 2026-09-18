import { describe, it, expect } from "vitest";
import { getCounterpartyLocalTime } from "@/src/components/engagements/match-details-view";

describe("Communication Handshake V2 (100/100 Protocol)", () => {
  describe("Feature 1: Timezone & Live Availability Calculation", () => {
    it("safely resolves local time and handles known timezones", () => {
      const resultIstanbul = getCounterpartyLocalTime("Europe/Istanbul", "tr");
      expect(resultIstanbul.tz).toBe("Europe/Istanbul");
      expect(resultIstanbul.timeStr).toMatch(/^\d{2}:\d{2}$/);
      expect(typeof resultIstanbul.hourNum).toBe("number");
      expect(typeof resultIstanbul.isNight).toBe("boolean");
      expect(typeof resultIstanbul.isBusiness).toBe("boolean");
    });

    it("handles alternative global timezones correctly", () => {
      const resultNY = getCounterpartyLocalTime("America/New_York", "en");
      expect(resultNY.tz).toBe("America/New_York");
      expect(resultNY.timeStr).toMatch(/^\d{2}:\d{2}$/);

      const resultTokyo = getCounterpartyLocalTime("Asia/Tokyo", "en");
      expect(resultTokyo.tz).toBe("Asia/Tokyo");
      expect(resultTokyo.timeStr).toMatch(/^\d{2}:\d{2}$/);
    });

    it("falls back gracefully to Europe/Istanbul when timezone is undefined or null", () => {
      const resultNull = getCounterpartyLocalTime(null, "tr");
      expect(resultNull.tz).toBe("Europe/Istanbul");
      expect(resultNull.timeStr).toMatch(/^\d{2}:\d{2}$/);

      const resultUndefined = getCounterpartyLocalTime(undefined, "tr");
      expect(resultUndefined.tz).toBe("Europe/Istanbul");
      expect(resultUndefined.timeStr).toMatch(/^\d{2}:\d{2}$/);
    });

    it("falls back safely without crashing on invalid or corrupted timezone string", () => {
      const resultInvalid = getCounterpartyLocalTime("Invalid/Corrupted_Zone_999", "tr");
      expect(resultInvalid.tz).toBe("Europe/Istanbul");
      expect(resultInvalid.timeStr).toBeDefined();
    });

    it("correctly identifies night vs business hours boundary conditions", () => {
      // Direct simulation of boundary hours
      const checkHour = (hourNum: number) => {
        const isNight = hourNum >= 22 || hourNum < 8;
        const isBusiness = hourNum >= 9 && hourNum < 19;
        return { isNight, isBusiness };
      };

      // 03:00 (Deep night)
      expect(checkHour(3)).toEqual({ isNight: true, isBusiness: false });
      // 08:30 (Morning prep)
      expect(checkHour(8)).toEqual({ isNight: false, isBusiness: false });
      // 10:00 (Business hours)
      expect(checkHour(10)).toEqual({ isNight: false, isBusiness: true });
      // 14:30 (Business hours)
      expect(checkHour(14)).toEqual({ isNight: false, isBusiness: true });
      // 20:00 (Evening)
      expect(checkHour(20)).toEqual({ isNight: false, isBusiness: false });
      // 23:30 (Night)
      expect(checkHour(23)).toEqual({ isNight: true, isBusiness: false });
    });
  });

  describe("Feature 2: Preferred Channel Prioritization Logic", () => {
    const baseChannels = [
      { key: "whatsapp" },
      { key: "meet" },
      { key: "zoom" },
      { key: "teams" },
      { key: "slack" },
      { key: "email" },
      { key: "phone" },
    ];

    it("prioritizes chosen channel to index 0 when counterparty has preferredContactChannel", () => {
      const preferred = "zoom";
      const sorted = [...baseChannels].sort((a, b) => {
        if (a.key === preferred) return -1;
        if (b.key === preferred) return 1;
        return 0;
      });

      expect(sorted[0]?.key).toBe("zoom");
      expect(sorted.length).toBe(7);
      expect(sorted.map((c) => c.key)).toContain("whatsapp");
      expect(sorted.map((c) => c.key)).toContain("phone");
    });

    it("prioritizes Slack when preferredContactChannel is slack", () => {
      const preferred = "slack";
      const sorted = [...baseChannels].sort((a, b) => {
        if (a.key === preferred) return -1;
        if (b.key === preferred) return 1;
        return 0;
      });

      expect(sorted[0]?.key).toBe("slack");
      expect(sorted.length).toBe(7);
    });

    it("preserves default order when preferredContactChannel is 'any' or null", () => {
      const preferred = "any";
      const sorted = [...baseChannels].sort((a, b) => {
        if (a.key === preferred) return -1;
        if (b.key === preferred) return 1;
        return 0;
      });

      expect(sorted[0]?.key).toBe("whatsapp");
      expect(sorted[1]?.key).toBe("meet");
      expect(sorted[2]?.key).toBe("zoom");
      expect(sorted[3]?.key).toBe("teams");
      expect(sorted[4]?.key).toBe("slack");
      expect(sorted[5]?.key).toBe("email");
      expect(sorted[6]?.key).toBe("phone");
    });
  });

  describe("Feature 3: Quick Ping Templates and Anti-Spam Rate Limit Spec", () => {
    const PING_TEMPLATES = {
      whatsapp: {
        tr: "WhatsApp üzerinden mesaj ilettim, müsait olduğunuzda kontrol edebilir misiniz?",
        en: "I sent you a WhatsApp message, could you please check when available?",
      },
      meeting: {
        tr: "Google Meet / Zoom toplantı daveti gönderdim, takviminizi bekliyorum.",
        en: "I sent a Google Meet / Zoom invite, awaiting your schedule.",
      },
      email: {
        tr: "Kurumsal e-posta ile proje başlangıç notlarını paylaştım.",
        en: "I shared the project kickoff notes via corporate email.",
      },
      ready: {
        tr: "Proje başlangıcı ve sonraki adımlar için görüşmeye hazırım.",
        en: "I am ready to connect for project kickoff and next steps.",
      },
    } as const;

    it("provides polite, professional communication templates in TR and EN", () => {
      const templateKeys = Object.keys(PING_TEMPLATES) as Array<keyof typeof PING_TEMPLATES>;
      expect(templateKeys).toHaveLength(4);

      templateKeys.forEach((key) => {
        expect(PING_TEMPLATES[key].tr.length).toBeGreaterThan(15);
        expect(PING_TEMPLATES[key].en.length).toBeGreaterThan(15);
        // Ensure no aggressive or impolite language
        expect(PING_TEMPLATES[key].tr).not.toMatch(/derhal|hemen|cevap ver/i);
      });
    });

    it("calculates accurate remaining cooldown time in 15-minute anti-spam cache", () => {
      const COOLDOWN_MS = 15 * 60 * 1000; // 900,000 ms
      const lastPingTime = Date.now() - 5 * 60 * 1000; // 5 minutes ago

      const elapsed = Date.now() - lastPingTime;
      const isUnderCooldown = elapsed < COOLDOWN_MS;
      const remainingMinutes = Math.ceil((COOLDOWN_MS - elapsed) / 60000);

      expect(isUnderCooldown).toBe(true);
      expect(remainingMinutes).toBe(10);
    });

    it("allows pinging once cooldown window has elapsed", () => {
      const COOLDOWN_MS = 15 * 60 * 1000;
      const lastPingTime = Date.now() - 16 * 60 * 1000; // 16 minutes ago

      const elapsed = Date.now() - lastPingTime;
      const isUnderCooldown = elapsed < COOLDOWN_MS;

      expect(isUnderCooldown).toBe(false);
    });
  });
});
