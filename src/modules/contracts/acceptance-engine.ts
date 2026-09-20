import {
  getInterviewQuestions,
} from "./acceptance/archetype-templates";
import { AcceptanceRulesEvaluator } from "./acceptance/acceptance-rules-evaluator";
import { AcceptanceSignoffService } from "./acceptance/acceptance-signoff.service";
import type {
  ScopeArchetype,
  ArchetypeProfile,
  ScopeInterviewQuestion,
  ScopeInterviewAnswers,
  ContractAcceptanceCriterion,
  SynthesizedScopePackage,
  EvaluateRevisionCriteriaInput,
  EvaluateRevisionCriteriaResult,
} from "./acceptance-types";

export * from "./acceptance/archetype-templates";
export * from "./acceptance/acceptance-rules-evaluator";
export * from "./acceptance/acceptance-signoff.service";

/**
 * Unified Acceptance Engine Facade
 * Delegates domain responsibilities to specialized evaluator, template, and signoff modules.
 */
export class AcceptanceEngine {
  /**
   * Normalizes Turkish text to lowercase ASCII-compatible tokens for robust keyword matching.
   */
  static normalizeText(text: string): string {
    return AcceptanceRulesEvaluator.normalizeText(text);
  }

  /**
   * Detects the project archetype from title, summary, category, and tags using token-weighted scoring.
   */
  static detectArchetype(
    title: string,
    summary: string = "",
    categorySlug: string = "",
    tags: string[] = []
  ): { archetype: ScopeArchetype; confidence: number; profile: ArchetypeProfile } {
    return AcceptanceRulesEvaluator.detectArchetype(title, summary, categorySlug, tags);
  }

  /**
   * Returns human-friendly, 3-to-4 interactive scope questions for the given archetype.
   */
  static getInterviewQuestions(archetype: ScopeArchetype): ScopeInterviewQuestion[] {
    return getInterviewQuestions(archetype);
  }

  /**
   * Synthesizes a comprehensive, dual-layer scope package based on the user's answers.
   */
  static synthesizeScopePackage(input: {
    archetype?: ScopeArchetype;
    title: string;
    summary?: string;
    answers?: ScopeInterviewAnswers;
    categorySlug?: string;
    tags?: string[];
  }): SynthesizedScopePackage {
    return AcceptanceRulesEvaluator.synthesizeScopePackage(input);
  }

  /**
   * Builds statutory markdown annex for TBK 470 / 474 contracts.
   */
  static generateContractAnnexMarkdown(
    criteria: ContractAcceptanceCriterion[],
    locale: "tr" | "en" = "tr"
  ): string {
    return AcceptanceRulesEvaluator.generateContractAnnexMarkdown(criteria, locale);
  }

  /**
   * Evaluates revision request inputs against defined criteria to prevent subjective rejections.
   */
  static evaluateRevisionCriteria(
    input: EvaluateRevisionCriteriaInput
  ): EvaluateRevisionCriteriaResult {
    return AcceptanceRulesEvaluator.evaluateRevisionCriteria(input);
  }

  /**
   * Computes statutory inspection deadline for deliverables under TBK m. 474.
   */
  static calculateInspectionDeadline(submittedAt: Date, windowDays?: number): Date {
    return AcceptanceSignoffService.calculateInspectionDeadline(submittedAt, windowDays);
  }

  /**
   * Evaluates whether tacit acceptance has occurred under TBK m. 477.
   */
  static evaluateTacitAcceptance(input: {
    status: string;
    inspectionExpiresAt: Date;
    hasRevisionRequest: boolean;
    now?: Date;
  }): { isTacitAccepted: boolean; reason?: string } {
    return AcceptanceSignoffService.evaluateTacitAcceptance(input);
  }
}
