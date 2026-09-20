export interface ProfileLinkItem {
  type: string;
  label: string;
  url: string;
}

export interface ProfileFormState {
  displayName: string;
  handle: string;
  about: string;
  avatarUrl: string;
  avatarPreviewError: boolean;
  showLocation: boolean;
  revealPhoneAfterMatch: boolean;
  preferredContactChannel: string;
  timeZone: string;
  links: ProfileLinkItem[];
  newLinkType: string;
  newLinkLabel: string;
  newLinkUrl: string;
  marketingConsent: boolean;
  loadingMarketingConsent: boolean;
  isUpdatingConsent: boolean;
  phoneVerified: boolean;
  showPhoneModal: boolean;
  showPhoneChangeModal: boolean;
  newPhone: string;
  phoneChangeStep: 1 | 2;
  phoneChangeOtp: string;
  isPhoneChanging: boolean;
  phoneChangeError: string | null;
  phoneChangeSuccess: string | null;
  phoneChallengeId: string | null;
  phoneChangeChallengeId: string | null;
  otpCode: string;
  isSubmittingOtp: boolean;
  isResendingEmail: boolean;
  isResendingPhone: boolean;
  cooldownSeconds: number;
  verificationFeedback: { type: "success" | "error"; message: string } | null;
  isLoading: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
}

export type ProfileFormAction =
  | { type: "SET_FIELD"; field: keyof ProfileFormState; value: unknown }
  | { type: "ADD_LINK"; link: ProfileLinkItem }
  | { type: "REMOVE_LINK"; index: number }
  | { type: "SET_FEEDBACK"; feedback: { type: "success" | "error"; message: string } | null }
  | { type: "SET_VERIFICATION_FEEDBACK"; feedback: { type: "success" | "error"; message: string } | null }
  | { type: "RESET_PHONE_CHANGE_MODAL" }
  | { type: "DECREMENT_COOLDOWN" };

export function profileFormReducer(state: ProfileFormState, action: ProfileFormAction): ProfileFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "ADD_LINK":
      return {
        ...state,
        links: [...state.links, action.link],
        newLinkLabel: "",
        newLinkUrl: "",
      };
    case "REMOVE_LINK":
      return {
        ...state,
        links: state.links.filter((_, i) => i !== action.index),
      };
    case "SET_FEEDBACK":
      return { ...state, feedback: action.feedback };
    case "SET_VERIFICATION_FEEDBACK":
      return { ...state, verificationFeedback: action.feedback };
    case "RESET_PHONE_CHANGE_MODAL":
      return {
        ...state,
        showPhoneChangeModal: false,
        phoneChangeStep: 1,
        newPhone: "",
        phoneChangeOtp: "",
        phoneChangeSuccess: null,
        phoneChangeError: null,
      };
    case "DECREMENT_COOLDOWN":
      return {
        ...state,
        cooldownSeconds: Math.max(0, state.cooldownSeconds - 1),
      };
    default:
      return state;
  }
}
