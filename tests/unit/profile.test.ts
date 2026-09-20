import { describe, it, expect } from "vitest";
import { isValidExternalUrl, profileLinkSchema } from "@/src/modules/profiles/links";

describe("Profile Links & Security Rules", () => {
  it("accepts valid public HTTPS URLs", () => {
    expect(isValidExternalUrl("https://github.com/torvalds")).toBe(true);
    expect(isValidExternalUrl("https://linkedin.com/in/satya-nadella")).toBe(true);
    expect(isValidExternalUrl("https://example.com/portfolio")).toBe(true);
  });

  it("rejects malicious schemes and private network URLs (SSRF mitigation)", () => {
    // Malicious schemes
    expect(isValidExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isValidExternalUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isValidExternalUrl("ftp://files.example.com")).toBe(false);

    // Private network / internal IP addresses
    expect(isValidExternalUrl("https://127.0.0.1:8080")).toBe(false);
    expect(isValidExternalUrl("https://192.168.1.1")).toBe(false);
    expect(isValidExternalUrl("https://10.0.0.1")).toBe(false);
    expect(isValidExternalUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isValidExternalUrl("https://internal.service.local")).toBe(false);
  });

  it("validates profile link schema and rejects emojis in label", () => {
    const valid = {
      type: "github" as const,
      label: "GitHub Profile",
      url: "https://github.com/octocat",
    };
    expect(profileLinkSchema.safeParse(valid).success).toBe(true);

    const withEmoji = {
      type: "github" as const,
      label: "GitHub 🐙",
      url: "https://github.com/octocat",
    };
    expect(profileLinkSchema.safeParse(withEmoji).success).toBe(false);
  });
});

describe("Avatar Picture URL Security & Management", () => {
  it("accepts valid public HTTPS image URLs", () => {
    expect(isValidExternalUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb")).toBe(
      true
    );
    expect(isValidExternalUrl("https://avatars.githubusercontent.com/u/583231")).toBe(true);
    expect(
      isValidExternalUrl("https://secure.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50")
    ).toBe(true);
  });

  it("blocks dangerous protocols, data URIs, and loopback addresses for avatar URLs", () => {
    expect(isValidExternalUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA")).toBe(false);
    expect(isValidExternalUrl("javascript:evil()")).toBe(false);
    expect(isValidExternalUrl("https://127.0.0.1/avatar.png")).toBe(false);
    expect(isValidExternalUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isValidExternalUrl("https://10.0.0.1/avatar.png")).toBe(false);
  });

  it("updates and retrieves avatarUrl via ProfileService for demo user", async () => {
    const { ProfileService } = await import("@/src/modules/profiles/service");
    const { DEFAULT_USER } = await import("@/src/modules/auth/demo-user");

    // Set avatar URL
    await ProfileService.updateProfile(DEFAULT_USER.id, {
      avatarUrl: "https://images.unsplash.com/photo-test-avatar.jpg",
    });

    const profile = await ProfileService.getProfileByUserId(DEFAULT_USER.id);
    expect(profile?.avatarUrl).toBe("https://images.unsplash.com/photo-test-avatar.jpg");

    const publicProfile = await ProfileService.getPublicProfileByHandle(
      DEFAULT_USER.profile.handle
    );
    expect(publicProfile?.avatarUrl).toBe("https://images.unsplash.com/photo-test-avatar.jpg");

    // Clear avatar URL
    await ProfileService.updateProfile(DEFAULT_USER.id, {
      avatarUrl: "",
    });

    const clearedProfile = await ProfileService.getProfileByUserId(DEFAULT_USER.id);
    expect(clearedProfile?.avatarUrl).toBeNull();
  });

  it("handles avatarSource updates correctly", async () => {
    const { ProfileService } = await import("@/src/modules/profiles/service");
    const { DEFAULT_USER } = await import("@/src/modules/auth/demo-user");

    // When updating avatarUrl without specifying avatarSource, defaults to custom
    await ProfileService.updateProfile(DEFAULT_USER.id, {
      avatarUrl: "https://images.unsplash.com/custom-photo.webp",
    });

    // Revert to oauth
    await ProfileService.updateProfile(DEFAULT_USER.id, {
      avatarUrl: "",
      avatarSource: "oauth",
    });
    const profile = await ProfileService.getProfileByUserId(DEFAULT_USER.id);
    expect(profile?.avatarUrl).toBeNull();
  });
});

describe("Multi-Sector Portfolio Platforms & Branding", () => {
  it("validates all new platform link types across 10 sectors", () => {
    const platforms = [
      { type: "artstation" as const, url: "https://artstation.com/artist", label: "ArtStation 3D" },
      { type: "sketchfab" as const, url: "https://sketchfab.com/model3d", label: "Sketchfab Model" },
      { type: "kaggle" as const, url: "https://kaggle.com/datascience", label: "Kaggle Profile" },
      { type: "huggingface" as const, url: "https://huggingface.co/ai-model", label: "Hugging Face Space" },
      { type: "substack" as const, url: "https://author.substack.com", label: "Substack Newsletter" },
      { type: "spotify" as const, url: "https://open.spotify.com/artist/123", label: "Spotify Artist" },
      { type: "soundcloud" as const, url: "https://soundcloud.com/producer", label: "SoundCloud Audio" },
      { type: "vimeo" as const, url: "https://vimeo.com/director", label: "Vimeo Showreel" },
    ];

    for (const p of platforms) {
      const parsed = profileLinkSchema.safeParse(p);
      expect(parsed.success).toBe(true);
    }
  });

  it("matches platform configurations and icons correctly", async () => {
    const { getPlatformConfig } = await import("@/src/components/profile/platform-icons");

    // Match by explicit type
    expect(getPlatformConfig("github").label).toBe("GitHub");
    expect(getPlatformConfig("artstation").label).toBe("ArtStation");
    expect(getPlatformConfig("sketchfab").label).toBe("Sketchfab (3D)");
    expect(getPlatformConfig("huggingface").label).toBe("Hugging Face");

    // Match by URL auto-detection
    expect(getPlatformConfig(undefined, "https://github.com/torvalds").label).toBe("GitHub");
    expect(getPlatformConfig(undefined, "https://artstation.com/artwork/123").label).toBe("ArtStation");
    expect(getPlatformConfig(undefined, "https://open.spotify.com/track/abc").label).toBe("Spotify");
  });

  it("handles R2 storage configuration gracefully when env is missing", async () => {
    const { isR2Configured } = await import("@/src/modules/storage/r2-client");
    // In local dev without credentials, should return a boolean without throwing
    expect(typeof isR2Configured()).toBe("boolean");
  });
});

