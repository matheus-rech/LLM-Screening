import { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

import ScreeningInterface from "../components/screening/ScreeningInterface";
import ProgressStats from "../components/screening/ProgressStats";
import { OptimizedScreening } from "../components/ai/OptimizedScreening";
import { ModelAnalyzer } from "../components/ai/ModelAnalyzer";

export default function ScreeningPage() {
  const [references, setReferences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [project, setProject] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    screened: 0,
    included: 0,
    excluded: 0,
    maybe: 0
  });

  useEffect(() => {
    loadData();
    detectAIModel();
  }, []);

  const detectAIModel = async () => {
    try {
      const info = await ModelAnalyzer.detectModel();
      setModelInfo(info);
      console.log("AI Model detected:", info);
    } catch (error) {
      console.error("Failed to detect AI model:", error);
    }
  };

  const loadData = async () => {
    // Load project
    const projects = await apiClient.listProjects("-created_date", 1);
    if (projects.length > 0) {
      setProject(projects[0]);
    }

    // Load references
    const refs = await apiClient.filterReferences(
      { screening_status: "pending" },
      "created_date",
      100
    );
    setReferences(refs);

    // Calculate stats
    const allRefs = await apiClient.listReferences();
    const newStats = {
      total: allRefs.length,
      screened: allRefs.filter(r => r.screening_status !== "pending").length,
      included: allRefs.filter(r => r.screening_status === "include").length,
      excluded: allRefs.filter(r => r.screening_status === "exclude").length,
      maybe: allRefs.filter(r => r.screening_status === "maybe").length
    };
    setStats(newStats);
  };

  const getAIRecommendation = async (reference) => {
    if (!project || (!reference.abstract && !reference.title)) return null;
    
    setIsProcessingAI(true);
    try {
      const criteria = {
        population: project.population,
        intervention: project.intervention,
        comparator: project.comparator,
        outcome: project.outcome,
        study_designs: project.study_designs,
        additional_criteria: project.additional_criteria
      };

      const result = await OptimizedScreening.screenReference(
        reference, 
        criteria, 
        { 
          useAdvanced: project.use_advanced_ai,
          includeAnalysis: true
        }
      );

      // Save AI recommendation to database
      await apiClient.updateReference(reference.id, {
        ai_recommendation: result.recommendation,
        ai_confidence: result.confidence,
        ai_reasoning: result.reasoning
      });

      return result;
    } catch (error) {
      console.error("AI recommendation error:", error);
      return {
        recommendation: "uncertain",
        confidence: 0,
        reasoning: `AI analysis failed: ${error.message}`,
        analysis_metrics: {
          content_quality: "error",
          reasoning_depth: 0,
          confidence_calibration: "poor"
        }
      };
    } finally {
      setIsProcessingAI(false);
    }
  };

  const makeDecision = async (decision, notes = "") => {
    const reference = references[currentIndex];
    if (!reference) return;

    await apiClient.updateReference(reference.id, {
      screening_status: decision,
      manual_decision: decision,
      reviewer_notes: notes,
      screening_date: new Date().toISOString()
    });

    // Move to next reference
    if (currentIndex < references.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Reload to get more pending references
      await loadData();
      setCurrentIndex(0);
    }
  };

  const currentReference = references[currentIndex];

  if (!currentReference) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Screening Complete!</h2>
            <p className="text-slate-600">All references have been screened.</p>
            <div className="mt-6">
              <a 
                href={createPageUrl("Analytics")} 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Results
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Screen References</h1>
            <p className="text-slate-600">Review each reference against your inclusion criteria</p>
          </div>
          {modelInfo && (
            <div className="text-right">
              <div className="text-sm text-slate-600">AI Model</div>
              <div className="font-medium text-slate-900">{modelInfo.model_name || "Unknown"}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ScreeningInterface
            reference={currentReference}
            onDecision={makeDecision}
            onGetAIRecommendation={getAIRecommendation}
            isProcessingAI={isProcessingAI}
            currentIndex={currentIndex}
            totalReferences={references.length}
            modelInfo={modelInfo}
          />
        </div>
        
        <div className="space-y-6">
          <ProgressStats stats={stats} />
        </div>
      </div>
    </div>
  );
}