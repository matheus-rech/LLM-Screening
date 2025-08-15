
import React, { useState, useEffect } from "react";
import { Reference, ReviewProject } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, Download, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

import StatsOverview from "../components/analytics/StatsOverview";
import ScreeningChart from "../components/analytics/ScreeningChart";
import DecisionBreakdown from "../components/analytics/DecisionBreakdown";
import AIReasoningViewer from "../components/screening/AIReasoningViewer";

export default function AnalyticsPage() {
  const [references, setReferences] = useState([]);
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    screened: 0,
    included: 0,
    excluded: 0,
    maybe: 0,
    pending: 0
  });
  const [realTimeProgress, setRealTimeProgress] = useState({
    isProcessing: false,
    currentlyProcessing: 0,
    completedToday: 0,
    estimatedTimeRemaining: 0,
    processingSpeed: 0
  });

  useEffect(() => {
    loadData();
    // Set up real-time polling for progress updates
    const interval = setInterval(loadData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    // Load project
    const projects = await ReviewProject.list("-created_date", 1);
    if (projects.length > 0) {
      setProject(projects[0]);
    }

    // Load all references
    const refs = await Reference.list();
    setReferences(refs);

    // Calculate comprehensive stats with real-time progress
    const newStats = {
      total: refs.length,
      screened: refs.filter(r => r.screening_status !== "pending").length,
      included: refs.filter(r => r.screening_status === "include").length,
      excluded: refs.filter(r => r.screening_status === "exclude").length,
      maybe: refs.filter(r => r.screening_status === "maybe").length,
      pending: refs.filter(r => r.screening_status === "pending").length
    };
    setStats(newStats);

    // Calculate real-time processing metrics
    const today = new Date().toDateString();
    const processedToday = refs.filter(r => 
      r.screening_date && new Date(r.screening_date).toDateString() === today
    ).length;
    
    const currentlyProcessing = refs.filter(r => r.screening_status === "in_progress").length;
    
    // Estimate processing speed (references per hour based on today's data)
    // Avoid division by zero and provide a meaningful speed.
    // If current hour is 0, set to 1 to avoid division by zero early in the day.
    const currentHour = new Date().getHours();
    const processingSpeed = processedToday > 0 && currentHour > 0 ? Math.round(processedToday / currentHour) : 0;
    
    // Estimate time remaining
    const estimatedHours = processingSpeed > 0 ? Math.ceil(newStats.pending / processingSpeed) : 0;
    
    setRealTimeProgress({
      isProcessing: currentlyProcessing > 0 || newStats.pending > 0, // Considered processing if items are in_progress or still pending
      currentlyProcessing,
      completedToday: processedToday,
      estimatedTimeRemaining: estimatedHours,
      processingSpeed
    });
  };

  const getProcessingStatus = () => {
    if (stats.pending === 0) return "complete";
    if (realTimeProgress.isProcessing) return "processing";
    return "ready";
  };

  const exportResults = () => {
    const exportData = references.map(ref => ({
      Title: ref.title,
      Authors: ref.authors,
      Year: ref.year,
      Journal: ref.journal,
      DOI: ref.doi,
      PMID: ref.pmid,
      'Screening Status': ref.screening_status,
      'Manual Decision': ref.manual_decision || '',
      'AI Reviewer 1': ref.ai_reviewer_1 || '',
      'AI Reviewer 1 Confidence': ref.ai_reviewer_1_confidence ? Math.round(ref.ai_reviewer_1_confidence * 100) + '%' : '',
      'AI Reviewer 1 Reasoning': ref.ai_reviewer_1_reasoning || '',
      'AI Reviewer 2': ref.ai_reviewer_2 || '',
      'AI Reviewer 2 Confidence': ref.ai_reviewer_2_confidence ? Math.round(ref.ai_reviewer_2_confidence * 100) + '%' : '',
      'AI Reviewer 2 Reasoning': ref.ai_reviewer_2_reasoning || '',
      'AI Agreement': ref.dual_ai_agreement ? 'Yes' : 'No',
      'Reviewer Notes': ref.reviewer_notes || '',
      'Screening Date': ref.screening_date || ''
    }));

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `systematic_review_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processingStatus = getProcessingStatus();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Real-time overview of your systematic review progress and AI analysis</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Real-time Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm">
            {processingStatus === "complete" && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 font-medium">Complete</span>
              </>
            )}
            {processingStatus === "processing" && (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-700 font-medium">Processing...</span>
              </>
            )}
            {processingStatus === "ready" && (
              <>
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-amber-700 font-medium">Ready to Process</span>
              </>
            )}
          </div>

          <Button 
            onClick={exportResults}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            disabled={stats.screened === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            {stats.screened === 0 ? "No Results Yet" : `Export Results (${stats.screened})`}
          </Button>
        </div>
      </div>

      {/* Real-time Progress Card */}
      {(stats.pending > 0 || realTimeProgress.isProcessing) && (
        <Card className="border-0 shadow-lg mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Processing Progress</h3>
              <div className="flex items-center gap-2">
                {realTimeProgress.isProcessing && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <span className="text-sm font-medium">Live</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">
                  {stats.screened} of {stats.total} references processed
                </span>
                <span className="text-slate-600">
                  {stats.total > 0 ? Math.round((stats.screened / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.screened / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">{realTimeProgress.completedToday}</div>
                <div className="text-xs text-slate-600">Completed Today</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600">{realTimeProgress.currentlyProcessing}</div>
                <div className="text-xs text-slate-600">Currently Processing</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-amber-600">{stats.pending}</div>
                <div className="text-xs text-slate-600">Remaining</div>
              </div>
              
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-purple-600">
                  {realTimeProgress.estimatedTimeRemaining > 0 
                    ? `${realTimeProgress.estimatedTimeRemaining}h` 
                    : "Complete!"
                  }
                </div>
                <div className="text-xs text-slate-600">Est. Time Left</div>
              </div>
            </div>

            {/* Processing Speed */}
            {realTimeProgress.processingSpeed > 0 && (
              <div className="mt-4 p-3 bg-white rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Processing Speed:</span>
                  <span className="text-sm font-medium text-slate-900">
                    {realTimeProgress.processingSpeed} references/hour
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        <StatsOverview stats={stats} />
        
        <div className="grid lg:grid-cols-2 gap-6">
          <ScreeningChart references={references} />
          <DecisionBreakdown stats={stats} />
        </div>

        {project && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Project Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">PICO Criteria</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Population:</strong> {project.population || "Not specified"}</div>
                    <div><strong>Intervention:</strong> {project.intervention || "Not specified"}</div>
                    <div><strong>Comparator:</strong> {project.comparator || "Not specified"}</div>
                    <div><strong>Outcome:</strong> {project.outcome || "Not specified"}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">AI Processing</h4>
                  <div className="text-sm space-y-1">
                    <div>Advanced AI: {project.use_advanced_ai ? "✅ Enabled" : "❌ Disabled"}</div>
                    <div>Dual Review: {project.use_dual_review ? `✅ ${project.dual_review_mode || 'parallel'} mode` : "❌ Disabled"}</div>
                    <div>Study Designs: {project.study_designs?.length > 0 ? project.study_designs.join(", ") : "Not specified"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis Review Section */}
        {references.some(r => r.dual_ai_completed) && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Reviewer Analysis Details
              </CardTitle>
              <p className="text-slate-600">
                Review the detailed reasoning from both AI reviewers for each reference
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {references
                  .filter(ref => ref.dual_ai_completed)
                  .slice(0, 10) // Show first 10 for performance
                  .map((reference, index) => (
                    <div key={reference.id} className="border-b pb-6 last:border-b-0">
                      <div className="mb-4">
                        <h4 className="font-medium text-slate-900 mb-1">{reference.title}</h4>
                        <div className="flex gap-2 text-xs text-slate-500">
                          <span>{reference.authors}</span>
                          {reference.year && <span>• {reference.year}</span>}
                          {reference.journal && <span>• {reference.journal}</span>}
                        </div>
                      </div>
                      <AIReasoningViewer reference={reference} />
                    </div>
                  ))
                }
                
                {references.filter(ref => ref.dual_ai_completed).length > 10 && (
                  <div className="text-center py-4 text-slate-600">
                    <p>Showing first 10 references with AI analysis.</p>
                    <p className="text-sm">Export full results to see all AI reasoning details.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
