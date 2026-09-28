import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleApiError } from "@/src/lib/api/error-response";

describe("API Error Sanitization & CWE-209 Information Exposure Prevention", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("1. handleApiError core functionality", () => {
    it("sanitizes unexpected internal exceptions and returns generic 500 without leaking stack or message", async () => {
      const dbException = new Error(
        "PostgreSQL FATAL: password authentication failed for user 'operis_admin'"
      );

      const response = handleApiError(
        dbException,
        {
          en: "An unexpected internal error occurred.",
          tr: "Beklenmeyen bir sunucu hatası oluştu.",
        },
        { isEn: true, logPrefix: "[Test API]" }
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "An unexpected internal error occurred." });
      expect(data.error).not.toContain("operis_admin");
      expect(data.error).not.toContain("PostgreSQL");

      // Verify server-side logging retained the original exception for observability
      expect(consoleErrorSpy).toHaveBeenCalledWith("[Test API]:", dbException);
    });

    it("returns Turkish localized fallback when isEn is false", async () => {
      const networkErr = new Error("ECONNREFUSED 127.0.0.1:5432");

      const response = handleApiError(
        networkErr,
        {
          en: "Service unavailable.",
          tr: "Servis geçici olarak kullanılamıyor.",
        },
        { isEn: false }
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Servis geçici olarak kullanılamıyor." });
    });

    it("correctly matches allowed business error whitelist and returns custom status code", async () => {
      const businessErr = new Error(
        "CONCURRENCY_CONFLICT: row was modified by another transaction"
      );

      const response = handleApiError(
        businessErr,
        {
          en: "Operation failed.",
          tr: "İşlem başarısız.",
        },
        {
          isEn: true,
          status: 500,
          allowedMessages: {
            CONCURRENCY_CONFLICT: {
              en: "Contract has already been signed or is locked.",
              tr: "Sözleşme zaten imzalanmış veya kilitlidir.",
              status: 409,
            },
          },
        }
      );

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data).toEqual({ error: "Contract has already been signed or is locked." });
      expect(data.error).not.toContain("row was modified");
    });

    it("falls back to generic error when error does not match any allowedMessages pattern", async () => {
      const unknownErr = new Error("SyntaxError: Unexpected token < in JSON at position 0");

      const response = handleApiError(
        unknownErr,
        {
          en: "Could not process request.",
          tr: "İstek işlenemedi.",
        },
        {
          isEn: false,
          allowedMessages: {
            INVALID_PARAM: {
              en: "Invalid parameter.",
              tr: "Geçersiz parametre.",
              status: 400,
            },
          },
        }
      );

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "İstek işlenemedi." });
    });

    it("handles non-Error objects (strings, undefined, numbers) gracefully", async () => {
      const response = handleApiError("String thrown as exception", "Generic safe fallback", {
        status: 500,
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Generic safe fallback" });
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("2. Security audit: verify sensitive patterns are strictly filtered", () => {
    const sensitiveTriggers = [
      "drizzle-orm/node_modules/pg",
      "select * from \"users\" where id = 'admin'",
      "SECRET_KEY_EXPOSURE_sk_live_12345",
      "table 'engagements' does not exist in schema",
      "deadlock detected on process 19284",
    ];

    it.each(sensitiveTriggers)(
      "never includes internal error text '%s' in client response",
      async (leakText) => {
        const rawError = new Error(`Internal failure: ${leakText}`);
        const res = handleApiError(
          rawError,
          {
            en: "An error occurred while processing your request.",
            tr: "İşleminiz gerçekleştirilirken bir hata oluştu.",
          },
          { isEn: true }
        );

        const json = await res.json();
        expect(json.error).toBe("An error occurred while processing your request.");
        expect(json.error).not.toContain(leakText);
      }
    );
  });
});
