import { apiClient } from "@/api/apiClient";

export class ModelAnalyzer {
  static async detectModel() {
    try {
      const prompt = `Please identify yourself. What AI model are you? Include:
      1. Your model name and version
      2. Your training data cutoff
      3. Your capabilities
      4. Any specific strengths in academic/research tasks`;

      const result = await apiClient.invokeLLM(prompt, {
          type: "object",
          properties: {
            model_name: { type: "string" },
            version: { type: "string" },
            training_cutoff: { type: "string" },
            capabilities: { type: "array", items: { type: "string" } },
            research_strengths: { type: "array", items: { type: "string" } }
          }
      });

      return result;
    } catch (error) {
      console.error("Model detection failed:", error);
      return {
        model_name: "Unknown",
        version: "Unknown",
        training_cutoff: "Unknown",
        capabilities: ["Text generation", "Analysis"],
        research_strengths: ["Academic text processing"]
      };
    }
  }

  static async benchmarkModel() {
    try {
      const testPrompt = `Analyze this abstract for a systematic review about diabetes interventions:

      Title: "Effects of exercise training on glycemic control in type 2 diabetes"
      Abstract: "This randomized controlled trial examined the effects of 12-week aerobic exercise training on HbA1c levels in 120 adults with type 2 diabetes. Participants were randomized to exercise (n=60) or control (n=60) groups. The exercise group showed significant reduction in HbA1c (-0.8%, p<0.001) compared to controls."

      Provide detailed screening analysis.`;

      const startTime = Date.now();
      const result = await apiClient.invokeLLM(testPrompt, {
        type: "object",
        properties: {
          recommendation: { type: "string", enum: ["include", "exclude", "uncertain"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          reasoning: { type: "string" },
          analysis_depth: { type: "string" },
          keywords_identified: { type: "array", items: { type: "string" } }
        }
      });
      const responseTime = Date.now() - startTime;

      return {
        ...result,
        response_time_ms: responseTime,
        reasoning_length: result.reasoning?.length || 0,
        analysis_quality: this.assessAnalysisQuality(result)
      };
    } catch (error) {
      console.error("Model benchmarking failed:", error);
      return null;
    }
  }

  static assessAnalysisQuality(result) {
    let score = 0;
    
    // Check confidence calibration
    if (result.confidence >= 0.7 && result.confidence <= 1.0) score += 25;
    
    // Check reasoning depth
    if (result.reasoning && result.reasoning.length > 100) score += 25;
    
    // Check keyword identification
    if (result.keywords_identified && result.keywords_identified.length >= 3) score += 25;
    
    // Check recommendation consistency
    if (result.recommendation && ["include", "exclude", "uncertain"].includes(result.recommendation)) score += 25;
    
    return score; // 0-100 score
  }
}