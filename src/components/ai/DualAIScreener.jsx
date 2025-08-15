
import { OptimizedScreening } from "./OptimizedScreening";
import { apiClient } from "@/api/apiClient";
import { ProcessingQueue } from "./ProcessingQueue";

export class DualAIScreener {
  // Process a single reference (for parallel mode)
  static async processReference(reference, criteria) {
    try {
      // Get two independent AI reviews
      const reviewer1 = await OptimizedScreening.screenReference(
        reference,
        criteria,
        {
          useAdvanced: true,
          includeAnalysis: true,
          reviewerContext: "AI Reviewer 1 - Focus on strict inclusion criteria adherence"
        }
      );

      const reviewer2 = await OptimizedScreening.screenReference(
        reference,
        criteria,
        {
          useAdvanced: true,
          includeAnalysis: true,
          reviewerContext: "AI Reviewer 2 - Focus on comprehensive evidence evaluation"
        }
      );

      const result = await this.updateReferenceWithResults(reference, reviewer1, reviewer2);

      // Update processing queue progress
      ProcessingQueue.saveProcessingState({
        lastProcessedId: reference.id,
        lastProcessedAt: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Error processing reference ${reference.id}:`, error);
      return this.handleProcessingError(reference, error);
    }
  }

  // Process batch of references (for batch mode)
  static async processBatch(references, criteria) {
    const results = [];

    for (const reference of references) {
      try {
        // Get two independent AI reviews with slight delay between them for batch processing
        const reviewer1 = await OptimizedScreening.screenReference(
          reference,
          criteria,
          {
            useAdvanced: true,
            includeAnalysis: true,
            reviewerContext: "AI Reviewer 1 - Focus on strict inclusion criteria adherence"
          }
        );

        // Small delay for batch processing optimization
        await new Promise(resolve => setTimeout(resolve, 100));

        const reviewer2 = await OptimizedScreening.screenReference(
          reference,
          criteria,
          {
            useAdvanced: true,
            includeAnalysis: true,
            reviewerContext: "AI Reviewer 2 - Focus on comprehensive evidence evaluation"
          }
        );

        const result = await this.updateReferenceWithResults(reference, reviewer1, reviewer2);
        results.push(result);

      } catch (error) {
        console.error(`Error processing reference ${reference.id}:`, error);
        const errorResult = await this.handleProcessingError(reference, error);
        results.push(errorResult);
      }
    }

    return results;
  }

  static async updateReferenceWithResults(reference, reviewer1, reviewer2) {
    // Determine if there's agreement
    const agreement = reviewer1.recommendation === reviewer2.recommendation;

    let finalStatus;
    if (agreement) {
      finalStatus = reviewer1.recommendation === "uncertain" ? "maybe" : reviewer1.recommendation;
    } else {
      finalStatus = "conflict";
    }

    // Update reference with dual AI results
    await apiClient.updateReference(reference.id, {
      ai_reviewer_1: reviewer1.recommendation,
      ai_reviewer_1_confidence: reviewer1.confidence,
      ai_reviewer_1_reasoning: reviewer1.reasoning,
      ai_reviewer_2: reviewer2.recommendation,
      ai_reviewer_2_confidence: reviewer2.confidence,
      ai_reviewer_2_reasoning: reviewer2.reasoning,
      dual_ai_completed: true,
      dual_ai_agreement: agreement,
      screening_status: finalStatus,
      screening_date: agreement ? new Date().toISOString() : null
    });

    return {
      reference,
      reviewer1,
      reviewer2,
      agreement,
      finalStatus
    };
  }

  static async handleProcessingError(reference, error) {
    // Mark as uncertain if processing fails
    await apiClient.updateReference(reference.id, {
      dual_ai_completed: true,
      dual_ai_agreement: false,
      screening_status: "maybe",
      ai_reviewer_1: "uncertain",
      ai_reviewer_2: "uncertain",
      ai_reviewer_1_reasoning: `Processing failed: ${error.message}`,
      ai_reviewer_2_reasoning: `Processing failed: ${error.message}`
    });

    return {
      reference,
      reviewer1: { recommendation: "uncertain", confidence: 0, reasoning: `Processing failed: ${error.message}` },
      reviewer2: { recommendation: "uncertain", confidence: 0, reasoning: `Processing failed: ${error.message}` },
      agreement: true, // Both failed the same way
      finalStatus: "maybe"
    };
  }

  static async getConflictSummary(projectId) {
    const conflicts = await apiClient.filterReferences({
      project_id: projectId,
      screening_status: "conflict",
      dual_ai_completed: true
    });

    return {
      total: conflicts.length,
      includeVsExclude: conflicts.filter(r =>
        (r.ai_reviewer_1 === "include" && r.ai_reviewer_2 === "exclude") ||
        (r.ai_reviewer_1 === "exclude" && r.ai_reviewer_2 === "include")
      ).length,
      includeVsUncertain: conflicts.filter(r =>
        (r.ai_reviewer_1 === "include" && r.ai_reviewer_2 === "uncertain") ||
        (r.ai_reviewer_1 === "uncertain" && r.ai_reviewer_2 === "include")
      ).length,
      excludeVsUncertain: conflicts.filter(r =>
        (r.ai_reviewer_1 === "exclude" && r.ai_reviewer_2 === "uncertain") ||
        (r.ai_reviewer_1 === "uncertain" && r.ai_reviewer_2 === "exclude")
      ).length
    };
  }
}
