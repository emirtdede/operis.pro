import { ProfileLinkItem } from "./profile-form-reducer";

export interface ProfileSettingsFormProps {
  initialProfile: {
    displayName: string;
    handle: string;
    about: string | null;
    avatarUrl?: string | null;
    showLocation: boolean;
    revealPhoneAfterMatch: boolean;
    preferredContactChannel?: string | null;
    timeZone?: string | null;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    email?: string;
    isCompanyVerified?: boolean;
    companyName?: string | null;
    companyType?: string | null;
    taxOffice?: string | null;
    vknMasked?: string | null;
    companyVerifiedAt?: Date | string | null;
    links: ProfileLinkItem[];
  };
  locale: string;
}

export const getLinkTypes = (isTr: boolean) => [
  { value: "github", label: "GitHub (Yazılım / Kod)", placeholder: "https://github.com/..." },
  { value: "gitlab", label: "GitLab", placeholder: "https://gitlab.com/..." },
  { value: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { value: "behance", label: isTr ? "Behance (Tasarım)" : "Behance (Design)", placeholder: "https://behance.net/..." },
  { value: "dribbble", label: isTr ? "Dribbble (Tasarım)" : "Dribbble (Design)", placeholder: "https://dribbble.com/..." },
  { value: "figma", label: isTr ? "Figma (Prototip & Tasarım)" : "Figma (Prototype & Design)", placeholder: "https://figma.com/@..." },
  { value: "artstation", label: isTr ? "ArtStation (3D & Dijital Sanat)" : "ArtStation (3D & Concept)", placeholder: "https://artstation.com/..." },
  { value: "sketchfab", label: isTr ? "Sketchfab (İnteraktif 3D)" : "Sketchfab (Interactive 3D)", placeholder: "https://sketchfab.com/..." },
  { value: "medium", label: isTr ? "Medium (Makale & Blog)" : "Medium (Articles & Blog)", placeholder: "https://medium.com/@..." },
  { value: "substack", label: isTr ? "Substack (Bülten)" : "Substack (Newsletter)", placeholder: "https://...substack.com" },
  { value: "youtube", label: isTr ? "YouTube (Video & Showreel)" : "YouTube (Video & Showreel)", placeholder: "https://youtube.com/@..." },
  { value: "vimeo", label: isTr ? "Vimeo (Video Prodüksiyon)" : "Vimeo (Production)", placeholder: "https://vimeo.com/..." },
  { value: "soundcloud", label: isTr ? "SoundCloud (Ses & Müzik)" : "SoundCloud (Audio)", placeholder: "https://soundcloud.com/..." },
  { value: "spotify", label: isTr ? "Spotify (Müzik & Podcast)" : "Spotify (Music & Podcast)", placeholder: "https://open.spotify.com/..." },
  { value: "kaggle", label: isTr ? "Kaggle (Veri Bilimi & AI)" : "Kaggle (Data Science & AI)", placeholder: "https://kaggle.com/..." },
  { value: "huggingface", label: isTr ? "Hugging Face (Yapay Zeka Modelleri)" : "Hugging Face (AI Models)", placeholder: "https://huggingface.co/..." },
  { value: "stackoverflow", label: "Stack Overflow", placeholder: "https://stackoverflow.com/users/..." },
  { value: "codepen", label: "CodePen", placeholder: "https://codepen.io/..." },
  { value: "devto", label: "Dev.to", placeholder: "https://dev.to/..." },
  { value: "twitter", label: "X (Twitter)", placeholder: "https://x.com/..." },
  {
    value: "website",
    label: isTr ? "Kişisel Web Sitesi" : "Personal Website",
    placeholder: isTr ? "https://alanadi.com" : "https://yourdomain.com",
  },
  {
    value: "portfolio",
    label: isTr ? "Portfolyo / Canlı Demo" : "Portfolio / Live Demo",
    placeholder: "https://...",
  },
  {
    value: "other",
    label: isTr ? "Diğer Bağlantı" : "Other Link",
    placeholder: "https://...",
  },
];
