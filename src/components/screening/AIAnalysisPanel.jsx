import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  BarChart3, 
  CheckCircle, 
  AlertCircle, 
  Info,
  TrendingUp,
  Eye,
  EyeOff
} from "lucide-react";

export default function AIAnalysisPanel({ aiRecommendation, modelInfo }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!aiRecommendation) return null;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-100";
    if (confidence >= 0.6) return "text-blue-600 bg-blue-100";
    if (confidence >= 0.4) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case "include":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "exclude":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-yellow-600" />;
    }
  };

  const metrics = aiRecommendation.analysis_metrics || {};

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Analysis
            {modelInfo && (
              <Badge variant="outline" className="text-xs">
                {modelInfo.model_name || "AI Model"}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showDetails ? 'Less' : 'Details'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Recommendation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {getRecommendationIcon(aiRecommendation.recommendation)}
            <div>
              <div className="font-semibold text-gray-900 capitalize">
                {aiRecommendation.recommendation}
              </div>
              <div className="text-sm text-gray-600">
                AI Recommendation
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold px-3 py-1 rounded-full ${getConfidenceColor(aiRecommendation.confidence)}`}>
              {Math.round(aiRecommendation.confidence * 100)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Confidence</div>
          </div>
        </div>

        {/* Key Evidence */}
        {aiRecommendation.key_evidence && aiRecommendation.key_evidence.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Key Evidence</h5>
            <div className="space-y-1">
              {aiRecommendation.key_evidence.slice(0, 3).map((evidence, idx) => (
                <div key={idx} className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                  • {evidence}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Quality Metrics */}
        {showDetails && (
          <div className="space-y-4 border-t pt-4">
            <h5 className="font-medium text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analysis Quality
            </h5>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Reasoning Depth</span>
                  <span>{metrics.reasoning_depth || 0}/3</span>
                </div>
                <Progress value={(metrics.reasoning_depth || 0) * 33.33} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Evidence Count</span>
                  <span>{metrics.evidence_specificity || 0}</span>
                </div>
                <Progress value={Math.min((metrics.evidence_specificity || 0) * 25, 100)} className="h-2" />
              </div>
            </div>

            {/* PICO Analysis */}
            {aiRecommendation.population_match !== undefined && (
              <div>
                <h6 className="font-medium text-gray-900 mb-2">PICO Analysis</h6>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    {aiRecommendation.population_match ? 
                      <CheckCircle className="w-3 h-3 text-green-500" /> : 
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    }
                    <span>Population</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {aiRecommendation.intervention_relevant ? 
                      <CheckCircle className="w-3 h-3 text-green-500" /> : 
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    }
                    <span>Intervention</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {aiRecommendation.comparator_appropriate ? 
                      <CheckCircle className="w-3 h-3 text-green-500" /> : 
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    }
                    <span>Comparator</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {aiRecommendation.outcomes_relevant ? 
                      <CheckCircle className="w-3 h-3 text-green-500" /> : 
                      <AlertCircle className="w-3 h-3 text-red-500" />
                    }
                    <span>Outcomes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Potential Concerns */}
            {aiRecommendation.potential_concerns && aiRecommendation.potential_concerns.length > 0 && (
              <div>
                <h6 className="font-medium text-gray-900 mb-2">Potential Concerns</h6>
                <div className="space-y-1">
                  {aiRecommendation.potential_concerns.map((concern, idx) => (
                    <div key={idx} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                      ⚠ {concern}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div className="text-xs text-gray-500 space-y-1">
              <div>Prompt Version: {aiRecommendation.prompt_version || "v1"}</div>
              <div>Confidence Calibration: {metrics.confidence_calibration || "Unknown"}</div>
              {aiRecommendation.processing_timestamp && (
                <div>Processed: {new Date(aiRecommendation.processing_timestamp).toLocaleTimeString()}</div>
              )}
            </div>
          </div>
        )}

        {/* Main Reasoning */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">AI Reasoning</h5>
          <p className="text-sm text-gray-700 leading-relaxed">
            {aiRecommendation.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}