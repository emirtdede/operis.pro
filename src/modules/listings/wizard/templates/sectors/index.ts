import type { WizardQuestion } from "../types";
import { softwareItQuestions } from "./software-it";
import { aiDataQuestions } from "./ai-data";
import { designCreativeQuestions } from "./design-creative";
import { marketingGrowthQuestions } from "./marketing-growth";
import { videoAudioQuestions } from "./video-audio";
import { writingTranslationQuestions } from "./writing-translation";
import { businessFinanceQuestions } from "./business-finance";
import { legalComplianceQuestions } from "./legal-compliance";
import { engineering3dQuestions } from "./engineering-3d";
import { operationsSupportQuestions } from "./operations-support";

export * from "./software-it";
export * from "./ai-data";
export * from "./design-creative";
export * from "./marketing-growth";
export * from "./video-audio";
export * from "./writing-translation";
export * from "./business-finance";
export * from "./legal-compliance";
export * from "./engineering-3d";
export * from "./operations-support";

export const SECTOR_WIZARD_TEMPLATES: Record<string, WizardQuestion[]> = {
  "sector-software-it": softwareItQuestions,
  "sector-ai-data": aiDataQuestions,
  "sector-design-creative": designCreativeQuestions,
  "sector-marketing-growth": marketingGrowthQuestions,
  "sector-video-audio": videoAudioQuestions,
  "sector-writing-translation": writingTranslationQuestions,
  "sector-business-finance": businessFinanceQuestions,
  "sector-legal-compliance": legalComplianceQuestions,
  "sector-engineering-3d": engineering3dQuestions,
  "sector-operations-support": operationsSupportQuestions,
};
