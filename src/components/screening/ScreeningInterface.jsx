import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, HelpCircle, Brain, Loader2 } from "lucide-react";

import AIAnalysisPanel from "./AIAnalysisPanel";

export default function ScreeningInterface({ 
  reference, 
  onDecision, 
  onGetAIRecommendation, 
  isProcessingAI,
  currentIndex,
  totalReferences,
  modelInfo
}) {
  const [notes, setNotes] = useState("");
  const [aiRecommendation, setAIRecommendation] = useState(null);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    // Reset for new reference
    setNotes("");
    setAIRecommendation(null);
    setShowAI(false);
  }, [reference?.id]);

  const handleGetAI = async () => {
    setShowAI(true);
    const result = await onGetAIRecommendation(reference);
    setAIRecommendation(result);
  };

  const handleDecision = (decision) => {
    onDecision(decision, notes);
  };

  const progressPercent = ((currentIndex + 1) / totalReferences) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Reference {currentIndex + 1} of {totalReferences}
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
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl leading-tight mb-3">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reference.abstract ? (
            <div className="prose prose-sm max-w-none">
              <h4 className="font-semibold text-slate-900 mb-2">Abstract</h4>
              <p className="text-slate-700 leading-relaxed">{reference.abstract}</p>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No abstract available for this reference.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendation */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Assistant
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetAI}
              disabled={isProcessingAI || showAI}
            >
              {isProcessingAI ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Get AI Recommendation"
              )}
            </Button>
          </div>
        </CardHeader>
        {(showAI || aiRecommendation) && (
          <CardContent>
            {isProcessingAI ? (
              <div className="text-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                <p className="text-slate-600">AI is analyzing this reference...</p>
              </div>
            ) : (
              <AIAnalysisPanel 
                aiRecommendation={aiRecommendation} 
                modelInfo={modelInfo}
              />
            )}
          </CardContent>
        )}
      </Card>

      {/* Notes */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Reviewer Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about your screening decision..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Decision Buttons */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleDecision("include")}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Include
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => handleDecision("maybe")}
            >
              <HelpCircle className="w-5 h-5 mr-2" />
              Maybe
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => handleDecision("exclude")}
            >
              <XCircle className="w-5 h-5 mr-2" />
              Exclude
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}