import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, HelpCircle, Users, AlertTriangle, Brain, Zap } from "lucide-react";

export default function ConflictResolver({ 
  reference, 
  onResolve, 
  conflictIndex, 
  totalConflicts 
}) {
  const [notes, setNotes] = useState("");
  const [selectedDecision, setSelectedDecision] = useState(null);

  const handleResolve = (decision) => {
    onResolve(reference, decision, notes);
    setNotes("");
    setSelectedDecision(null);
  };

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case "include": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "exclude": return "bg-red-100 text-red-800 border-red-200";
      case "uncertain": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    if (confidence >= 0.4) return "Low";
    return "Very Low";
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-blue-600";
    if (confidence >= 0.4) return "text-amber-600";
    return "text-red-600";
  };

  const progressPercent = ((conflictIndex + 1) / totalConflicts) * 100;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Conflict {conflictIndex + 1} of {totalConflicts}
            </span>
            <span className="text-sm text-slate-500">
              {progressPercent.toFixed(1)}% complete
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Reference Details */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl leading-tight">
            {reference.title}
          </CardTitle>
          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            {reference.authors && (
              <Badge variant="outline">{reference.authors}</Badge>
            )}
            {reference.year && (
              <Badge variant="outline">{reference.year}</Badge>
            )}
            {reference.journal && (
              <Badge variant="outline">{reference.journal}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {reference.abstract && (
            <div className="prose prose-sm max-w-none">
              <h4 className="font-semibold text-slate-900 mb-2">Abstract</h4>
              <p className="text-slate-700 leading-relaxed">{reference.abstract}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Reviewer Conflict - Enhanced Version */}
      <Card className="border-0 shadow-lg border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-5 h-5" />
            AI Reviewer Disagreement
          </CardTitle>
          <div className="text-sm text-amber-700">
            Two independent AI reviewers analyzed this reference and reached different conclusions.
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI Reviewer 1 */}
            <Card className="border-2 border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">AI Reviewer 1</h3>
                    <p className="text-xs text-blue-700">Strict Criteria Focus</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Decision & Confidence */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getRecommendationColor(reference.ai_reviewer_1)} border font-medium`}>
                    {reference.ai_reviewer_1?.toUpperCase()}
                  </Badge>
                  <div className={`text-sm font-medium ${getConfidenceColor(reference.ai_reviewer_1_confidence)}`}>
                    {getConfidenceText(reference.ai_reviewer_1_confidence)} confidence
                    <div className="text-xs text-slate-600">
                      ({Math.round((reference.ai_reviewer_1_confidence || 0) * 100)}%)
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Confidence Level</span>
                    <span>{Math.round((reference.ai_reviewer_1_confidence || 0) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(reference.ai_reviewer_1_confidence || 0) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Detailed Reasoning:
                  </h5>
                  <div className="bg-white border rounded-lg p-3">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {reference.ai_reviewer_1_reasoning}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Reviewer 2 */}
            <Card className="border-2 border-purple-200 bg-purple-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900">AI Reviewer 2</h3>
                    <p className="text-xs text-purple-700">Comprehensive Evidence Focus</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Decision & Confidence */}
                <div className="flex items-center justify-between">
                  <Badge className={`${getRecommendationColor(reference.ai_reviewer_2)} border font-medium`}>
                    {reference.ai_reviewer_2?.toUpperCase()}
                  </Badge>
                  <div className={`text-sm font-medium ${getConfidenceColor(reference.ai_reviewer_2_confidence)}`}>
                    {getConfidenceText(reference.ai_reviewer_2_confidence)} confidence
                    <div className="text-xs text-slate-600">
                      ({Math.round((reference.ai_reviewer_2_confidence || 0) * 100)}%)
                    </div>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Confidence Level</span>
                    <span>{Math.round((reference.ai_reviewer_2_confidence || 0) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(reference.ai_reviewer_2_confidence || 0) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Detailed Reasoning:
                  </h5>
                  <div className="bg-white border rounded-lg p-3">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {reference.ai_reviewer_2_reasoning}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conflict Analysis */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Why Do They Disagree?</h4>
                  <p className="text-sm text-amber-800">
                    {reference.ai_reviewer_1 === "include" && reference.ai_reviewer_2 === "exclude" && 
                      "One reviewer found the study meets inclusion criteria while the other identified exclusion factors."
                    }
                    {reference.ai_reviewer_1 === "exclude" && reference.ai_reviewer_2 === "include" && 
                      "One reviewer identified exclusion factors while the other found the study meets inclusion criteria."
                    }
                    {(reference.ai_reviewer_1 === "uncertain" || reference.ai_reviewer_2 === "uncertain") && 
                      "One reviewer was uncertain about the study's eligibility while the other had a clear decision."
                    }
                    {" "}Review both reasoning processes to make an informed final decision.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Resolution Notes */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Your Resolution Notes</CardTitle>
          <p className="text-sm text-slate-600">
            Document your reasoning for the final decision based on the AI reviewers' analysis
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Example: 'After reviewing both AI analyses, I agree with Reviewer 1 because the population clearly matches our inclusion criteria, despite the intervention being slightly different than specified...'"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Decision Buttons */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h4 className="font-medium text-slate-900 mb-4">Your Final Decision:</h4>
          <div className="grid grid-cols-3 gap-4">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-16 flex flex-col gap-1"
              onClick={() => handleResolve("include")}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Include</span>
              <span className="text-xs opacity-90">Meets criteria</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50 h-16 flex flex-col gap-1"
              onClick={() => handleResolve("maybe")}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Maybe</span>
              <span className="text-xs">Needs full-text review</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 h-16 flex flex-col gap-1"
              onClick={() => handleResolve("exclude")}
            >
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Exclude</span>
              <span className="text-xs opacity-90">Doesn't meet criteria</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}