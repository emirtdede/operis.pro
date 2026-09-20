import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileService } from "@/src/modules/profiles/service";
import { POST as verifyCompanyRoute } from "@/src/app/api/profile/company-verify/route";

// Mock the session module
vi.mock("@/src/modules/auth/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "usr_corporate_test_123",
    role: "CLIENT",
    email: "corp@operis.pro",
  }),
}));

// Mock rate limiting to avoid test throttling
vi.mock("@/src/lib/security/rate-limit", () => ({
  evaluateSecurityAccessAsync: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  normalizeIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Company Verification Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ProfileService.verifyCompany", () => {
    it("should successfully verify a corporate company with valid 10-digit VKN", async () => {
      const result = await ProfileService.verifyCompany("usr_corporate_test_123", {
        companyName: "Acme Teknoloji anonim şirketi",
        taxId: "8790017566",
        taxOffice: "Kadıköy",
        companyType: "ANONIM",
        websiteUrl: "https://acme.com",
      });

      expect(result.isCompanyVerified).toBe(true);
      expect(result.companyName).toBe("Acme Teknoloji A.Ş.");
      expect(result.companyType).toBe("ANONIM");
      expect(result.taxOffice).toBe("Kadıköy");
      expect(result.vknMasked).toBe("879***7566");
      expect(result.companyVerifiedAt).toBeInstanceOf(Date);
    });

    it("should successfully verify a sole proprietor with valid 11-digit TCKN", async () => {
      const result = await ProfileService.verifyCompany("usr_sole_test_456", {
        companyName: "Demir Yıldız Danışmanlık",
        taxId: "10000000146",
        taxOffice: "Beşiktaş",
        companyType: "SAHIS",
      });

      expect(result.isCompanyVerified).toBe(true);
      expect(result.companyName).toBe("Demir Yıldız Danışmanlık");
      expect(result.companyType).toBe("SAHIS");
      expect(result.vknMasked).toBe("100*****146");
    });

    it("should reject verification with invalid 10-digit VKN checksum", async () => {
      await expect(
        ProfileService.verifyCompany("usr_fail_1", {
          companyName: "Fake Corp A.Ş.",
          taxId: "1234567899", // Invalid check digit
          taxOffice: "Şişli",
        })
      ).rejects.toThrow(/Vergi Kimlik Numarası \(VKN\) algoritması geçersizdir/i);
    });

    it("should reject verification with invalid 11-digit TCKN checksum", async () => {
      await expect(
        ProfileService.verifyCompany("usr_fail_2", {
          companyName: "Invalid Proprietor",
          taxId: "11111111111", // Invalid TCKN
          taxOffice: "Şişli",
        })
      ).rejects.toThrow(/Şahıs Vergi Numarası algoritması geçersizdir/i);
    });

    it("should reject empty or whitespace company title", async () => {
      await expect(
        ProfileService.verifyCompany("usr_fail_3", {
          companyName: "   ",
          taxId: "8790017566",
          taxOffice: "Kadıköy",
        })
      ).rejects.toThrow(/Şirket unvanı en az 3/i);
    });

    it("should reject empty or whitespace tax office", async () => {
      await expect(
        ProfileService.verifyCompany("usr_fail_4", {
          companyName: "Valid Title Ltd. Şti.",
          taxId: "8790017566",
          taxOffice: "   ",
        })
      ).rejects.toThrow(/Vergi dairesi adı 2-80 karakter/i);
    });
  });

  describe("API Route POST /api/profile/company-verify", () => {
    it("should return 400 when required fields are missing", async () => {
      const request = new Request("http://localhost:3000/api/profile/company-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Acme A.Ş.",
          // taxId missing
        }),
      });

      const res = await verifyCompanyRoute(request);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBeDefined();
    });

    it("should return 400 when tax ID checksum is invalid", async () => {
      const request = new Request("http://localhost:3000/api/profile/company-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Acme A.Ş.",
          taxId: "9999999999",
          taxOffice: "Kadıköy",
        }),
      });

      const res = await verifyCompanyRoute(request);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toMatch(/Vergi Kimlik Numarası \(VKN\) algoritması geçersizdir/i);
    });

    it("should return 200 with verified company details on valid submission", async () => {
      const request = new Request("http://localhost:3000/api/profile/company-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Operis Bilişim ltd. şti.",
          taxId: "8790017566",
          taxOffice: "Beşiktaş",
          companyType: "LIMITED",
        }),
      });

      const res = await verifyCompanyRoute(request);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.isCompanyVerified).toBe(true);
      expect(json.data.companyName).toBe("Operis Bilişim Ltd. Şti.");
      expect(json.data.vknMasked).toBe("879***7566");
      expect(json.data.taxOffice).toBe("Beşiktaş");
    });
  });
});
