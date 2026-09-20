import type { WizardQuestion, WizardQuestionOption } from "./templates/types";
import { SECTOR_WIZARD_TEMPLATES } from "./templates/sectors";
import { CATEGORY_WIZARD_TEMPLATES, DEFAULT_QUESTIONS } from "./templates/category-overrides";

export type { WizardQuestion, WizardQuestionOption };
export { SECTOR_WIZARD_TEMPLATES, CATEGORY_WIZARD_TEMPLATES, DEFAULT_QUESTIONS };

/**
 * Resolves questions by category slug or sector key.
 */
export function getTemplateQuestions(
  categorySlugOrKey?: string,
  sectorKey?: string
): WizardQuestion[] {
  if (categorySlugOrKey && CATEGORY_WIZARD_TEMPLATES[categorySlugOrKey]) {
    return CATEGORY_WIZARD_TEMPLATES[categorySlugOrKey];
  }
  if (sectorKey && SECTOR_WIZARD_TEMPLATES[sectorKey]) {
    return SECTOR_WIZARD_TEMPLATES[sectorKey];
  }
  return DEFAULT_QUESTIONS;
}

/**
 * Backward compatibility wrapper for older callers.
 */
export function getTemplateQuestionsForCategory(categoryKey: string): WizardQuestion[] {
  return getTemplateQuestions(categoryKey);
}
