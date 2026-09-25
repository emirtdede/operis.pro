import React from "react";
import { Globe, ExternalLink } from "lucide-react";

export interface PlatformConfig {
  label: string;
  placeholder: string;
  brandColor: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

// -------------------------------------------------------------
// Dedicated, High-Quality Brand SVG Vectors
// -------------------------------------------------------------

const GithubIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const GitlabIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.29-.94l2.42-7.46a.84.84 0 0 1 1.6-.01l1.79 5.51h10.26l1.79-5.51a.84.84 0 0 1 1.6.01l2.42 7.46a.84.84 0 0 1-.29.94z" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.65 1.65 0 1 0 0 3.3 1.65 1.65 0 0 0 0-3.3z" />
  </svg>
);

const BehanceIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.171 3-3.455 0-5.555-2.525-5.555-6.059 0-3.411 2.05-6.027 5.531-6.027 3.528 0 5.253 2.584 5.253 6.027 0 .426-.04.832-.072 1.059h-7.859c.147 1.83 1.488 2.651 2.98 2.651 1.472 0 2.296-.757 2.668-1.651h2.225zm-2.316-3.8c-.065-1.503-1.042-2.35-2.73-2.35-1.597 0-2.613.882-2.784 2.35h5.514zm-14.41 7h-7v-16.118h7.247c3.155 0 5.163 1.488 5.163 4.225 0 1.636-.889 3.033-2.298 3.659 1.899.645 2.888 2.302 2.888 4.258 0 2.859-2.28 3.976-6.002 3.976zm-3.864-13.118v4.118h3.407c1.725 0 2.768-.787 2.768-2.059 0-1.282-1.043-2.059-2.768-2.059h-3.407zm0 6.118v4.471h3.766c1.884 0 3.003-.896 3.003-2.235 0-1.35-1.119-2.236-3.003-2.236h-3.766z" />
  </svg>
);

const DribbbleIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 0 1 1.93 5.312c-.51-.1-2.4-.41-4.73-.41-.58 0-1.18.02-1.78.07-.15-.34-.31-.69-.49-1.03a22.25 22.25 0 0 0 5.07-3.942zM12 3.535c2.11 0 4.04.77 5.53 2.05a20.8 20.8 0 0 1-4.75 3.7c-1.2-2.18-2.52-4.18-3.92-5.32.95-.28 1.97-.43 3.14-.43zm-4.73.91c1.33 1.1 2.6 3 3.75 5.1-2.91.82-5.74 1.25-8.23 1.25-.13 0-.25 0-.37-.01A8.47 8.47 0 0 1 7.27 4.445zM3.535 12c0-.03 0-.07.01-.1 2.69 0 5.7-.46 8.78-1.34.18.35.35.7.5 1.05-3.6 1.07-7.07 3.52-8.91 7.02A8.48 8.48 0 0 1 3.535 12zm8.465 8.465c-2.03 0-3.9-.72-5.37-1.92 1.63-3.23 4.83-5.52 8.23-6.52.92 2.47 1.5 5.09 1.67 7.78-1.37.43-2.91.66-4.53.66zm6.05-1.42a19.78 19.78 0 0 0-1.57-7.23c2.14.03 3.86.32 4.31.41a8.51 8.51 0 0 1-2.74 6.82z"
    />
  </svg>
);

const FigmaIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 2h4v8H8a4 4 0 0 1 0-8zm4 0h4a4 4 0 1 1 0 8h-4V2zm0 8v8H8a4 4 0 1 1 0-8h4zm4 0a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-4 4v4a4 4 0 1 1-4-4h4z" />
  </svg>
);

const ArtStationIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.77 17.51l2.42 4.19c.47.81 1.34 1.3 2.27 1.3h10.97l-3.32-5.49H1.77zm21.65-2.28L15.35 1.76a2.63 2.63 0 0 0-2.27-1.3c-.93 0-1.8.5-2.27 1.3L8.64 5.51l9.74 16.03h.08c.55 0 1.07-.29 1.35-.77l3.61-5.54zm-8.86-.49l-4.7-7.73-4.47 7.73h9.17z" />
  </svg>
);

const SketchfabIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1.6l9.5 5.5v11L12 23.6 2.5 18.1v-11L12 1.6zm0 2.3L4.5 8.2l7.5 4.3 7.5-4.3L12 3.9zm-8 6v7.7l7.5 4.3v-7.7L4 9.9zm16 0l-7.5 4.3v7.7l7.5-4.3V9.9z" />
  </svg>
);

const MediumIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

const SubstackIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
  </svg>
);

const YoutubeIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const VimeoIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.396 7.164c-.093 2.026-1.507 4.799-4.245 8.32C15.323 19.161 12.935 21 10.988 21c-1.207 0-2.228-1.117-3.063-3.35-.558-2.046-1.116-4.091-1.674-6.137-.62-2.324-1.286-3.486-2-3.486-.155 0-.697.325-1.626.976L1.4 7.42c1.022-.898 2.03-1.796 3.02-2.695 1.363-1.177 2.385-1.797 3.066-1.859 1.611-.155 2.602.945 2.974 3.3.372 2.386.65 3.873.836 4.461.558 2.571 1.177 3.857 1.859 3.857.527 0 1.317-.821 2.37-2.463 1.053-1.642 1.611-2.882 1.673-3.718.124-1.425-.403-2.138-1.58-2.138-.557 0-1.146.124-1.765.372 1.146-3.75 3.329-5.546 6.549-5.39 2.385.124 3.516 1.611 3.392 4.46z" />
  </svg>
);

const SoundcloudIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.16 14.5c0 .73.53 1.32 1.18 1.32.65 0 1.18-.59 1.18-1.32V12.1c0-.73-.53-1.32-1.18-1.32-.65 0-1.18.59-1.18 1.32v2.4zm3.12 1.32c.65 0 1.18-.59 1.18-1.32V10.2c0-.73-.53-1.32-1.18-1.32-.65 0-1.18.59-1.18 1.32v4.3c0 .73.53 1.32 1.18 1.32zm3.12 0c.65 0 1.18-.59 1.18-1.32V8.9c0-.73-.53-1.32-1.18-1.32-.65 0-1.18.59-1.18 1.32v5.6c0 .73.53 1.32 1.18 1.32zm3.13 0c.65 0 1.18-.59 1.18-1.32V7.7c0-.73-.53-1.32-1.18-1.32-.65 0-1.18.59-1.18 1.32v6.8c0 .73.53 1.32 1.18 1.32zm7.14-7.44c-.37 0-.72.07-1.05.19-.34-.96-1.25-1.65-2.33-1.65-.24 0-.47.04-.69.1v8.8h8.34c1.86 0 3.37-1.52 3.37-3.39 0-1.87-1.51-3.39-3.37-3.39-.17 0-.33.02-.49.05-.56-1.5-1.99-2.58-3.78-2.58v-.13z" />
  </svg>
);

const SpotifyIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.627.627 0 0 1-.86.208c-2.358-1.44-5.326-1.766-8.823-.967a.625.625 0 1 1-.277-1.22c3.824-.875 7.106-.506 9.752 1.119a.627.627 0 0 1 .208.86zm1.225-2.723a.784.784 0 0 1-1.077.258c-2.698-1.658-6.812-2.139-10.005-1.17a.785.785 0 1 1-.453-1.503c3.644-1.106 8.196-.566 11.277 1.338a.784.784 0 0 1 .258 1.077zm.105-2.834C14.692 8.95 9.375 8.775 6.297 9.71a.942.942 0 1 1-.55-1.802c3.535-1.072 9.404-.866 13.115 1.338a.942.942 0 1 1-.946 1.627z" />
  </svg>
);

const KaggleIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.825 23.859c-.022.046-.054.082-.096.107s-.096.037-.162.037h-3.921c-.087 0-.17-.034-.249-.102l-5.04-6.425-1.637 1.571v4.698c0 .074-.025.137-.074.188s-.112.077-.189.077H4.372c-.074 0-.137-.026-.188-.077s-.077-.114-.077-.188V.263c0-.074.026-.137.077-.188S4.298 0 4.372 0h3.085c.077 0 .14.025.189.075s.074.114.074.188v14.475l6.377-6.284a.43.43 0 0 1 .305-.124h4.086c.062 0 .112.012.15.037s.062.062.074.112c.025.062.025.112 0 .15-.025.037-.062.087-.112.15l-5.694 5.568 6.004 9.489c.046.062.062.112.046.15s-.046.074-.087.074z" />
  </svg>
);

const HuggingFaceIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.93.55 3.73 1.5 5.25A9.97 9.97 0 0 0 12 22a9.97 9.97 0 0 0 8.5-4.75A9.95 9.95 0 0 0 22 12c0-5.523-4.477-10-10-10zm-3.5 7.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-7.6 6.3a.75.75 0 0 1 1.05-.15c.87.65 1.94 1 3.05 1s2.18-.35 3.05-1a.75.75 0 1 1 .9 1.2c-1.12.84-2.48 1.3-3.95 1.3s-2.83-.46-3.95-1.3a.75.75 0 0 1-.15-1.05z" />
  </svg>
);

const StackOverflowIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.986 21.865v-6.404h2.134V24H2.986v-8.539h2.134v6.404h13.866zM6.986 16.326l10.158 2.122.435-2.091-10.158-2.122-.435 2.091zm1.74-5.321l9.167 4.685.964-1.921-9.167-4.685-.964 1.921zm3.432-5.06l7.35 7.195 1.488-1.57-7.35-7.195-1.488 1.57zm5.952-4.945l-1.89 1.055 5.08 9.043 1.89-1.055-5.08-9.043zM6.186 19.73h10.667v-2.134H6.186v2.134z" />
  </svg>
);

const CodePenIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1.5l10.5 7v7L12 22.5 1.5 15.5v-7L12 1.5zm0 2.44L3.6 9.28l3.65 2.43L12 8.51l4.75 3.2 3.65-2.43L12 3.94zM3 10.74v2.52l3-2-3-.52zm18 0l-3 .52 3 2v-2.52zM7.5 12.83l-3.9 2.6L12 20.06l8.4-4.63-3.9-2.6-4.5 3.02-4.5-3.02zm3.5-.83l1 0 .5-1.5.5 1.5 1 0-1 1 .5 1.5-1.5-.75-1.5.75.5-1.5-1-1z" />
  </svg>
);

const DevtoIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.42 10.05c-.18-.12-.46-.17-.84-.17H5.25v4.25h1.33c.38 0 .66-.06.84-.18.19-.12.28-.34.28-.66v-2.58c0-.32-.09-.54-.28-.66zm14.16-6.05H2.42C1.08 4 0 5.08 0 6.42v11.16C0 18.92 1.08 20 2.42 20h19.16c1.34 0 2.42-1.08 2.42-2.42V6.42C24 5.08 22.92 4 21.58 4zM8.9 13.27c0 .73-.24 1.29-.71 1.68-.47.39-1.14.59-2 .59H3.75V8.46h2.44c.86 0 1.53.2 2 .6.47.4.71.97.71 1.71v2.5zm4.85-3.39h-2.5v1.62h1.88v1.36h-1.88v1.88h2.5v1.4h-3.9V8.46h3.9v1.42zm5.75 2.37l-1.35 4.39h-1.5l-1.35-4.39v4.39h-1.4V8.46h2.15l1.35 4.39 1.35-4.39h2.15v7.18h-1.4v-4.39z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const DiscordIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const TelegramIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const WhatsappIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 0C5.394 0 0 5.394 0 12.031c0 2.115.551 4.178 1.597 5.992L0 24l6.177-1.57a11.96 11.96 0 0 0 5.854 1.517h.005c6.632 0 12.025-5.394 12.025-12.031 0-3.213-1.252-6.234-3.525-8.508A11.945 11.945 0 0 0 12.031 0zm0 22.022a9.97 9.97 0 0 1-5.077-1.385l-.364-.216-3.769.957.973-3.673-.238-.378a9.96 9.96 0 0 1-1.536-5.296c0-5.518 4.49-10.008 10.01-10.008 2.673 0 5.187 1.041 7.078 2.932a9.94 9.94 0 0 1 2.93 7.077c0 5.518-4.49 10.008-10.007 10.008zm5.485-7.494c-.3-.15-1.777-.877-2.052-.977-.276-.1-.476-.15-.676.15-.2.3-.776.977-.951 1.177-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.413-1.49-.893-.796-1.496-1.78-1.671-2.08-.175-.3-.019-.462.13-.611.136-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-.926-2.23-.244-.585-.492-.505-.676-.514-.175-.009-.375-.011-.575-.011-.2 0-.525.075-.8.375-.276.3-1.052 1.028-1.052 2.508 0 1.48 1.077 2.91 1.227 3.11.15.2 2.12 3.238 5.137 4.542.717.31 1.277.495 1.713.634.72.229 1.376.197 1.895.12.578-.087 1.777-.726 2.027-1.428.25-.702.25-1.303.175-1.428-.075-.125-.275-.2-.575-.35z" />
  </svg>
);

// -------------------------------------------------------------
// Platform Registry with Brand Palettes and Official Icons
// -------------------------------------------------------------

export const PLATFORM_REGISTRY: Record<string, PlatformConfig> = {
  github: {
    label: "GitHub",
    placeholder: "https://github.com/kullaniciadi",
    brandColor: "#24292e",
    badgeClass: "border-neutral-500/30 bg-neutral-500/10 text-neutral-200 hover:border-neutral-400",
    icon: GithubIcon,
  },
  gitlab: {
    label: "GitLab",
    placeholder: "https://gitlab.com/kullaniciadi",
    brandColor: "#fc6d26",
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:border-orange-400",
    icon: GitlabIcon,
  },
  linkedin: {
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/kullaniciadi",
    brandColor: "#0a66c2",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:border-sky-400",
    icon: LinkedinIcon,
  },
  behance: {
    label: "Behance",
    placeholder: "https://behance.net/kullaniciadi",
    brandColor: "#1769ff",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:border-blue-400",
    icon: BehanceIcon,
  },
  dribbble: {
    label: "Dribbble",
    placeholder: "https://dribbble.com/kullaniciadi",
    brandColor: "#ea4c89",
    badgeClass: "border-pink-500/30 bg-pink-500/10 text-pink-400 hover:border-pink-400",
    icon: DribbbleIcon,
  },
  figma: {
    label: "Figma",
    placeholder: "https://figma.com/@kullaniciadi",
    brandColor: "#f24e1e",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-400 hover:border-purple-400",
    icon: FigmaIcon,
  },
  artstation: {
    label: "ArtStation",
    placeholder: "https://artstation.com/kullaniciadi",
    brandColor: "#13aff0",
    badgeClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:border-cyan-400",
    icon: ArtStationIcon,
  },
  sketchfab: {
    label: "Sketchfab (3D)",
    placeholder: "https://sketchfab.com/kullaniciadi",
    brandColor: "#1caad9",
    badgeClass: "border-teal-500/30 bg-teal-500/10 text-teal-400 hover:border-teal-400",
    icon: SketchfabIcon,
  },
  medium: {
    label: "Medium",
    placeholder: "https://medium.com/@kullaniciadi",
    brandColor: "#00ab6c",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400",
    icon: MediumIcon,
  },
  substack: {
    label: "Substack",
    placeholder: "https://kullaniciadi.substack.com",
    brandColor: "#ff6719",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:border-amber-400",
    icon: SubstackIcon,
  },
  youtube: {
    label: "YouTube",
    placeholder: "https://youtube.com/@kanal",
    brandColor: "#ff0000",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-400",
    icon: YoutubeIcon,
  },
  vimeo: {
    label: "Vimeo",
    placeholder: "https://vimeo.com/kullaniciadi",
    brandColor: "#1ab7ea",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:border-sky-400",
    icon: VimeoIcon,
  },
  soundcloud: {
    label: "SoundCloud",
    placeholder: "https://soundcloud.com/kullaniciadi",
    brandColor: "#ff5500",
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:border-orange-400",
    icon: SoundcloudIcon,
  },
  spotify: {
    label: "Spotify",
    placeholder: "https://open.spotify.com/artist/...",
    brandColor: "#1db954",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400",
    icon: SpotifyIcon,
  },
  kaggle: {
    label: "Kaggle",
    placeholder: "https://kaggle.com/kullaniciadi",
    brandColor: "#20beff",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:border-sky-400",
    icon: KaggleIcon,
  },
  huggingface: {
    label: "Hugging Face",
    placeholder: "https://huggingface.co/kullaniciadi",
    brandColor: "#ffcc4d",
    badgeClass: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:border-yellow-400",
    icon: HuggingFaceIcon,
  },
  stackoverflow: {
    label: "Stack Overflow",
    placeholder: "https://stackoverflow.com/users/...",
    brandColor: "#f48024",
    badgeClass: "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:border-orange-400",
    icon: StackOverflowIcon,
  },
  codepen: {
    label: "CodePen",
    placeholder: "https://codepen.io/kullaniciadi",
    brandColor: "#000000",
    badgeClass: "border-neutral-500/30 bg-neutral-500/10 text-neutral-300 hover:border-neutral-400",
    icon: CodePenIcon,
  },
  devto: {
    label: "Dev.to",
    placeholder: "https://dev.to/kullaniciadi",
    brandColor: "#0a0a0a",
    badgeClass: "border-neutral-500/30 bg-neutral-500/10 text-neutral-300 hover:border-neutral-400",
    icon: DevtoIcon,
  },
  twitter: {
    label: "X (Twitter)",
    placeholder: "https://x.com/kullaniciadi",
    brandColor: "#000000",
    badgeClass: "border-neutral-500/30 bg-neutral-500/10 text-neutral-200 hover:border-neutral-400",
    icon: XIcon,
  },
  x: {
    label: "X (Twitter)",
    placeholder: "https://x.com/kullaniciadi",
    brandColor: "#000000",
    badgeClass: "border-neutral-500/30 bg-neutral-500/10 text-neutral-200 hover:border-neutral-400",
    icon: XIcon,
  },
  website: {
    label: "Web Sitesi",
    placeholder: "https://websiteniz.com",
    brandColor: "#6366f1",
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:border-indigo-400",
    icon: Globe,
  },
  portfolio: {
    label: "Portfolyo / Demo",
    placeholder: "https://portfolyonuz.com",
    brandColor: "#8b5cf6",
    badgeClass: "border-violet-500/30 bg-violet-500/10 text-violet-400 hover:border-violet-400",
    icon: ExternalLink,
  },
  discord: {
    label: "Discord",
    placeholder: "https://discord.gg/davet veya kullanıcı adı",
    brandColor: "#5865f2",
    badgeClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:border-indigo-400",
    icon: DiscordIcon,
  },
  telegram: {
    label: "Telegram",
    placeholder: "https://t.me/kullaniciadi",
    brandColor: "#229ed9",
    badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:border-sky-400",
    icon: TelegramIcon,
  },
  instagram: {
    label: "Instagram",
    placeholder: "https://instagram.com/kullaniciadi",
    brandColor: "#e4405f",
    badgeClass: "border-pink-500/30 bg-pink-500/10 text-pink-400 hover:border-pink-400",
    icon: InstagramIcon,
  },
  whatsapp: {
    label: "WhatsApp",
    placeholder: "https://wa.me/905xxxxxxxxx",
    brandColor: "#25d366",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400",
    icon: WhatsappIcon,
  },
  custom: {
    label: "Özel Bağlantı",
    placeholder: "https://...",
    brandColor: "#3b82f6",
    badgeClass:
      "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:border-blue-400",
    icon: ExternalLink,
  },
  other: {
    label: "Diğer Bağlantı",
    placeholder: "https://...",
    brandColor: "#71717a",
    badgeClass:
      "border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]",
    icon: Globe,
  },
};

/**
 * Detects platform config either by explicit type or by parsing the URL
 */
export function getPlatformConfig(type?: string, url?: string): PlatformConfig {
  const fallback = PLATFORM_REGISTRY.custom ?? PLATFORM_REGISTRY.other ?? {
    label: "Özel Bağlantı",
    placeholder: "https://...",
    brandColor: "#3b82f6",
    badgeClass:
      "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:border-blue-400",
    icon: ExternalLink,
  };

  if (type) {
    const fromType = PLATFORM_REGISTRY[type.toLowerCase()];
    if (fromType) return fromType;
  }

  if (url) {
    const u = url.toLowerCase();
    if (u.includes("github.com")) return PLATFORM_REGISTRY.github ?? fallback;
    if (u.includes("gitlab.com")) return PLATFORM_REGISTRY.gitlab ?? fallback;
    if (u.includes("linkedin.com")) return PLATFORM_REGISTRY.linkedin ?? fallback;
    if (u.includes("discord.gg") || u.includes("discord.com")) return PLATFORM_REGISTRY.discord ?? fallback;
    if (u.includes("t.me") || u.includes("telegram.me")) return PLATFORM_REGISTRY.telegram ?? fallback;
    if (u.includes("instagram.com")) return PLATFORM_REGISTRY.instagram ?? fallback;
    if (u.includes("wa.me") || u.includes("whatsapp.com")) return PLATFORM_REGISTRY.whatsapp ?? fallback;
    if (u.includes("behance.net")) return PLATFORM_REGISTRY.behance ?? fallback;
    if (u.includes("dribbble.com")) return PLATFORM_REGISTRY.dribbble ?? fallback;
    if (u.includes("figma.com")) return PLATFORM_REGISTRY.figma ?? fallback;
    if (u.includes("artstation.com")) return PLATFORM_REGISTRY.artstation ?? fallback;
    if (u.includes("sketchfab.com")) return PLATFORM_REGISTRY.sketchfab ?? fallback;
    if (u.includes("medium.com")) return PLATFORM_REGISTRY.medium ?? fallback;
    if (u.includes("substack.com")) return PLATFORM_REGISTRY.substack ?? fallback;
    if (u.includes("youtube.com") || u.includes("youtu.be")) return PLATFORM_REGISTRY.youtube ?? fallback;
    if (u.includes("vimeo.com")) return PLATFORM_REGISTRY.vimeo ?? fallback;
    if (u.includes("soundcloud.com")) return PLATFORM_REGISTRY.soundcloud ?? fallback;
    if (u.includes("spotify.com")) return PLATFORM_REGISTRY.spotify ?? fallback;
    if (u.includes("kaggle.com")) return PLATFORM_REGISTRY.kaggle ?? fallback;
    if (u.includes("huggingface.co")) return PLATFORM_REGISTRY.huggingface ?? fallback;
    if (u.includes("stackoverflow.com")) return PLATFORM_REGISTRY.stackoverflow ?? fallback;
    if (u.includes("codepen.io")) return PLATFORM_REGISTRY.codepen ?? fallback;
    if (u.includes("dev.to")) return PLATFORM_REGISTRY.devto ?? fallback;
    if (u.includes("x.com") || u.includes("twitter.com")) return PLATFORM_REGISTRY.x ?? fallback;
  }

  return fallback;
}
