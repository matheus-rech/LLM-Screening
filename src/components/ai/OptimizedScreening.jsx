import { InvokeLLM } from "@/api/integrations";

export class OptimizedScreening {
  static async screenReference(reference, criteria, options = {}) {
    const { useAdvanced = false, includeAnalysis = true } = options;

    if (!reference.abstract && !reference.title) {
      return {
        recommendation: "uncertain",
        confidence: 0,
        reasoning: "No abstract or title available for screening",
        analysis_metrics: {
          content_quality: "insufficient",
          reasoning_depth: 0,
          confidence_calibration: "poor"
        }
      };
    }

    const prompt = this.buildOptimizedPrompt(reference, criteria, useAdvanced);

    try {
      const result = await InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: this.getResponseSchema(includeAnalysis)
      });

      // Add analysis metrics
      const analysisMetrics = this.analyzeResponse(result, reference, criteria);
      
      return {
        ...result,
        analysis_metrics: analysisMetrics,
        prompt_version: useAdvanced ? "v2_advanced" : "v2_standard",
        processing_timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error("Optimized AI screening error:", error);
      return {
        recommendation: "uncertain",
        confidence: 0,
        reasoning: `AI screening failed: ${error.message}`,
        analysis_metrics: {
          content_quality: "error",
          reasoning_depth: 0,
          confidence_calibration: "poor"
        }
      };
    }
  }

  static buildOptimizedPrompt(reference, criteria, useAdvanced) {
    const basePrompt = `
You are an expert systematic reviewer with 15+ years of experience in evidence-based medicine and meta-analysis.

SCREENING TASK: Determine if this reference should be INCLUDED, EXCLUDED, or marked as UNCERTAIN for a systematic review.

INCLUSION CRITERIA (PICO Framework):
• Population: ${criteria.population || "Not specified"}
• Intervention: ${criteria.intervention || "Not specified"}
• Comparator: ${criteria.comparator || "Not specified"}
• Outcome: ${criteria.outcome || "Not specified"}
• Study Designs: ${criteria.study_designs?.join(", ") || "All designs accepted"}

REFERENCE TO SCREEN:
Title: "${reference.title || "No title provided"}"
Abstract: "${reference.abstract || "No abstract provided"}"
Authors: ${reference.authors || "Not specified"}
Publication Year: ${reference.year || "Not specified"}
Journal: ${reference.journal || "Not specified"}
`;

    if (useAdvanced) {
      return basePrompt + `
ADVANCED ANALYSIS REQUIRED:
1. Population Analysis: Analyze if the study population matches the target criteria. Consider demographics, conditions, settings.
2. Intervention Fidelity: Assess if the intervention aligns with research objectives. Look for dose, duration, delivery method.
3. Comparator Validity: Evaluate if comparators are appropriate (placebo, standard care, active controls).
4. Outcome Relevance: Determine if outcomes are clinically meaningful and align with review objectives.
5. Study Design Quality: Assess methodological rigor and appropriateness for the research question.
6. Risk of Bias Indicators: Identify potential sources of bias from the abstract alone.

Provide detailed reasoning with specific evidence from the abstract. Rate your confidence based on available information quality.
`;
    }

    return basePrompt + `
SCREENING CHECKLIST:
□ Does the population match the inclusion criteria?
□ Is the intervention relevant to the research question?
□ Are appropriate comparators used?
□ Are relevant outcomes measured?
□ Is the study design appropriate?

Provide clear reasoning for your decision with specific references to the abstract content.
`;
  }

  static getResponseSchema(includeAnalysis) {
    const baseSchema = {
      type: "object",
      properties: {
        recommendation: {
          type: "string",
          enum: ["include", "exclude", "uncertain"],
          description: "Final screening decision"
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence in recommendation (0-1)"
        },
        reasoning: {
          type: "string",
          description: "Detailed explanation for the decision"
        }
      },
      required: ["recommendation", "confidence", "reasoning"]
    };

    if (includeAnalysis) {
      baseSchema.properties = {
        ...baseSchema.properties,
        population_match: {
          type: "boolean",
          description: "Does population match criteria"
        },
        intervention_relevant: {
          type: "boolean",
          description: "Is intervention relevant"
        },
        comparator_appropriate: {
          type: "boolean",
          description: "Are comparators appropriate"
        },
        outcomes_relevant: {
          type: "boolean",
          description: "Are outcomes relevant"
        },
        study_design_appropriate: {
          type: "boolean",
          description: "Is study design appropriate"
        },
        key_evidence: {
          type: "array",
          items: { type: "string" },
          description: "Key pieces of evidence from abstract"
        },
        potential_concerns: {
          type: "array",
          items: { type: "string" },
          description: "Potential methodological concerns"
        }
      };
    }

    return baseSchema;
  }

  static analyzeResponse(result, reference, criteria) {
    const metrics = {
      content_quality: "good",
      reasoning_depth: 0,
      confidence_calibration: "good",
      evidence_specificity: 0,
      consistency_score: 0
    };

    // Analyze reasoning depth
    if (result.reasoning) {
      const wordCount = result.reasoning.split(' ').length;
      if (wordCount > 100) metrics.reasoning_depth = 3;
      else if (wordCount > 50) metrics.reasoning_depth = 2;
      else if (wordCount > 20) metrics.reasoning_depth = 1;
    }

    // Analyze confidence calibration
    if (result.confidence >= 0.8 && result.reasoning && result.reasoning.length > 80) {
      metrics.confidence_calibration = "excellent";
    } else if (result.confidence >= 0.6) {
      metrics.confidence_calibration = "good";
    } else if (result.confidence >= 0.4) {
      metrics.confidence_calibration = "moderate";
    } else {
      metrics.confidence_calibration = "poor";
    }

    // Analyze evidence specificity
    if (result.key_evidence && result.key_evidence.length > 0) {
      metrics.evidence_specificity = result.key_evidence.length;
    }

    // Check consistency between confidence and recommendation
    const isConsistent = (
      (result.recommendation === "include" && result.confidence > 0.6) ||
      (result.recommendation === "exclude" && result.confidence > 0.6) ||
      (result.recommendation === "uncertain" && result.confidence <= 0.6)
    );
    metrics.consistency_score = isConsistent ? 100 : 0;

    return metrics;
  }
}