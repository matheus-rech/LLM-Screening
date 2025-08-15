import { InvokeLLM } from "@/api/integrations";

export class AdvancedScreening {
  static async screenReference(reference, criteria) {
    if (!reference.abstract && !reference.title) {
      return {
        recommendation: "uncertain",
        confidence: 0,
        reasoning: "No abstract or title available for screening"
      };
    }

    const prompt = `
You are an expert systematic reviewer with extensive experience in evidence-based medicine. 

SCREENING CRITERIA:
Population: ${criteria.population || "Not specified"}
Intervention: ${criteria.intervention || "Not specified"}
Comparator: ${criteria.comparator || "Not specified"}  
Outcome: ${criteria.outcome || "Not specified"}
Study Designs: ${criteria.study_designs?.join(", ") || "All designs"}

REFERENCE TO SCREEN:
Title: ${reference.title || "No title"}
Abstract: ${reference.abstract || "No abstract"}
Authors: ${reference.authors || "No authors"}
Year: ${reference.year || "No year"}
Journal: ${reference.journal || "No journal"}

Please provide a detailed screening decision based on the PICO criteria. Consider:
1. Does the study population match the target population?
2. Does it evaluate the specified intervention?
3. Does it use appropriate comparators?
4. Does it measure relevant outcomes?
5. Is the study design appropriate?

Be thorough in your analysis and provide specific reasoning for your decision.
    `;

    try {
      const result = await InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            recommendation: {
              type: "string",
              enum: ["include", "exclude", "uncertain"],
              description: "Screening recommendation"
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Confidence score"
            },
            reasoning: {
              type: "string",
              description: "Detailed reasoning for the decision"
            },
            population_match: {
              type: "boolean",
              description: "Does the population match criteria"
            },
            intervention_match: {
              type: "boolean", 
              description: "Does the intervention match criteria"
            },
            outcome_relevance: {
              type: "boolean",
              description: "Are the outcomes relevant"
            }
          },
          required: ["recommendation", "confidence", "reasoning"]
        }
      });

      return result;
    } catch (error) {
      console.error("Advanced AI screening error:", error);
      return {
        recommendation: "uncertain",
        confidence: 0,
        reasoning: "AI screening failed - manual review required"
      };
    }
  }

  static async batchScreen(references, criteria, onProgress) {
    const results = [];
    const total = references.length;

    for (let i = 0; i < references.length; i++) {
      const reference = references[i];
      
      try {
        const result = await this.screenReference(reference, criteria);
        results.push({
          reference_id: reference.id,
          ...result
        });
        
        if (onProgress) {
          onProgress({
            completed: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            current_reference: reference.title
          });
        }
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error screening reference ${reference.id}:`, error);
        results.push({
          reference_id: reference.id,
          recommendation: "uncertain",
          confidence: 0,
          reasoning: "Processing error occurred"
        });
      }
    }

    return results;
  }
}