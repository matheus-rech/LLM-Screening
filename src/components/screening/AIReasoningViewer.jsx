import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ChevronDown, ChevronUp, Zap, Target, Eye } from "lucide-react";

export default function AIReasoningViewer({ reference, compact = false }) {
  const [expandedReviewer, setExpandedReviewer] = useState(null);

  if (!reference.dual_ai_completed) {
    return null;
  }

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case "include": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "exclude": return "bg-red-100 text-red-800 border-red-200";
      case "uncertain": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-blue-600";
    if (confidence >= 0.4) return "text-amber-600";
    return "text-red-600";
  };

  const ReviewerCard = ({ reviewerNum, recommendation, confidence, reasoning, color, title, icon: Icon }) => {
    const isExpanded = expandedReviewer === reviewerNum;
    const reviewerId = `reviewer${reviewerNum}`;

    return (
      <Card className={`border-2 ${color === 'blue' ? 'border-blue-200 bg-blue-50/30' : 'border-purple-200 bg-purple-50/30'}`}>
        <CardHeader 
          className="pb-3 cursor-pointer" 
          onClick={() => setExpandedReviewer(isExpanded ? null : reviewerNum)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 ${color === 'blue' ? 'bg-blue-600' : 'bg-purple-600'} rounded-full flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className={`font-semibold ${color === 'blue' ? 'text-blue-900' : 'text-purple-900'}`}>
                  AI Reviewer {reviewerNum}
                </h3>
                <p className={`text-xs ${color === 'blue' ? 'text-blue-700' : 'text-purple-700'}`}>
                  {title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getRecommendationColor(recommendation)} border font-medium text-xs`}>
                {recommendation?.toUpperCase()}
              </Badge>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-4">
            {/* Confidence */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Confidence Level</span>
                <span className={`font-medium ${getConfidenceColor(confidence)}`}>
                  {Math.round((confidence || 0) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${color === 'blue' ? 'bg-blue-600' : 'bg-purple-600'} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${(confidence || 0) * 100}%` }}
                />
              </div>
            </div>

            {/* Reasoning */}
            <div>
              <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Detailed Analysis:
              </h5>
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {reasoning}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium">Dual AI Analysis</span>
            </div>
            <Badge variant={reference.dual_ai_agreement ? "default" : "destructive"} className="text-xs">
              {reference.dual_ai_agreement ? "Agreement" : "Conflict"}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between">
              <span>Reviewer 1:</span>
              <Badge className={getRecommendationColor(reference.ai_reviewer_1)} size="sm">
                {reference.ai_reviewer_1}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Reviewer 2:</span>
              <Badge className={getRecommendationColor(reference.ai_reviewer_2)} size="sm">
                {reference.ai_reviewer_2}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-slate-700" />
          Dual AI Reviewer Analysis
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={reference.dual_ai_agreement ? "default" : "destructive"}>
            {reference.dual_ai_agreement ? "✅ Reviewers Agree" : "⚠️ Reviewers Disagree"}
          </Badge>
          <span className="text-sm text-slate-500">
            Click to expand detailed reasoning
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid lg:grid-cols-2 gap-4">
          <ReviewerCard
            reviewerNum={1}
            recommendation={reference.ai_reviewer_1}
            confidence={reference.ai_reviewer_1_confidence}
            reasoning={reference.ai_reviewer_1_reasoning}
            color="blue"
            title="Strict Criteria Focus"
            icon={Target}
          />
          <ReviewerCard
            reviewerNum={2}
            recommendation={reference.ai_reviewer_2}
            confidence={reference.ai_reviewer_2_confidence}
            reasoning={reference.ai_reviewer_2_reasoning}
            color="purple"
            title="Comprehensive Evidence"
            icon={Eye}
          />
        </div>

        {!reference.dual_ai_agreement && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-amber-600" />
              <h4 className="font-medium text-amber-900">Analysis Comparison</h4>
            </div>
            <p className="text-sm text-amber-800">
              The two AI reviewers reached different conclusions. Review their detailed reasoning above to understand their perspectives and make an informed decision.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}