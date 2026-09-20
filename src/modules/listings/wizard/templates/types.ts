export interface WizardQuestionOption {
  value: string;
  label: string;
  labelEn?: string;
  description?: string;
  descriptionEn?: string;
}

export interface WizardQuestion {
  key: string;
  type: "single" | "multi" | "shortText" | "longText" | "boolean";
  required: boolean;
  labelKey: string;
  labelEn?: string;
  options?: WizardQuestionOption[];
  clarityWeight?: number;
  helpTip?: string;
  helpTipEn?: string;
}
