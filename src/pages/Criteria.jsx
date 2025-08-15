
import React, { useState, useEffect } from "react";
import { ReviewProject } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Settings, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CriteriaPage() {
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [criteria, setCriteria] = useState({
    population: "",
    intervention: "",
    comparator: "",
    outcome: "",
    study_designs: [],
    additional_criteria: {}
  });
  const [useAdvancedAI, setUseAdvancedAI] = useState(false);
  const [useDualReview, setUseDualReview] = useState(false);
  const [dualReviewMode, setDualReviewMode] = useState("parallel"); // "parallel" or "batch"
  const [isLoading, setIsLoading] = useState(true);

  const studyDesignOptions = [
    "Randomized Controlled Trial",
    "Systematic Review",
    "Meta-Analysis", 
    "Cohort Study",
    "Case-Control Study",
    "Cross-sectional Study",
    "Case Series",
    "Case Report",
    "Review",
    "Editorial"
  ];

  useEffect(() => {
    loadProject();
  }, []);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const projects = await ReviewProject.list("-created_date", 1);
      if (projects.length > 0) {
        const loadedProject = projects[0];
        setProject(loadedProject);
        
        // Load criteria from project
        setCriteria({
          population: loadedProject.population || "",
          intervention: loadedProject.intervention || "",
          comparator: loadedProject.comparator || "",
          outcome: loadedProject.outcome || "",
          study_designs: loadedProject.study_designs || [],
          additional_criteria: loadedProject.additional_criteria || {}
        });
        
        setUseAdvancedAI(loadedProject.use_advanced_ai || false);
        setUseDualReview(loadedProject.use_dual_review || false);
        setDualReviewMode(loadedProject.dual_review_mode || "parallel");
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudyDesignChange = (design, checked) => {
    setCriteria(prev => ({
      ...prev,
      study_designs: checked 
        ? [...prev.study_designs, design]
        : prev.study_designs.filter(d => d !== design)
    }));
  };

  const saveCriteria = async () => {
    try {
      if (project) {
        await ReviewProject.update(project.id, {
          ...criteria,
          use_advanced_ai: useAdvancedAI,
          use_dual_review: useDualReview,
          dual_review_mode: dualReviewMode,
          status: "screening"
        });
        if (useDualReview) {
          navigate(createPageUrl("DualReview"));
        } else {
          navigate(createPageUrl("Screening"));
        }
      } else {
        // Create a new project if none exists
        const newProject = await ReviewProject.create({
          name: "New Review Project",
          ...criteria,
          use_advanced_ai: useAdvancedAI,
          use_dual_review: useDualReview,
          dual_review_mode: dualReviewMode,
          status: "screening"
        });
        if (useDualReview) {
          navigate(createPageUrl("DualReview"));
        } else {
          navigate(createPageUrl("Screening"));
        }
      }
    } catch (error) {
      console.error("Error saving criteria:", error);
      alert("Failed to save criteria. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Screening Criteria</h1>
          <p className="text-gray-600">Define your inclusion and exclusion criteria using the PICO framework</p>
        </div>

        <div className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                PICO Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="population">Population</Label>
                  <Textarea
                    id="population"
                    value={criteria.population}
                    onChange={(e) => setCriteria(prev => ({...prev, population: e.target.value}))}
                    placeholder="Describe the target population (e.g., adults with diabetes)"
                    className="mt-1 h-24"
                  />
                </div>
                
                <div>
                  <Label htmlFor="intervention">Intervention</Label>
                  <Textarea
                    id="intervention"
                    value={criteria.intervention}
                    onChange={(e) => setCriteria(prev => ({...prev, intervention: e.target.value}))}
                    placeholder="Describe the intervention being studied"
                    className="mt-1 h-24"
                  />
                </div>
                
                <div>
                  <Label htmlFor="comparator">Comparator</Label>
                  <Textarea
                    id="comparator"
                    value={criteria.comparator}
                    onChange={(e) => setCriteria(prev => ({...prev, comparator: e.target.value}))}
                    placeholder="Describe the control or comparison group"
                    className="mt-1 h-24"
                  />
                </div>
                
                <div>
                  <Label htmlFor="outcome">Outcome</Label>
                  <Textarea
                    id="outcome"
                    value={criteria.outcome}
                    onChange={(e) => setCriteria(prev => ({...prev, outcome: e.target.value}))}
                    placeholder="Describe the primary outcomes of interest"
                    className="mt-1 h-24"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Study Design Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {studyDesignOptions.map((design) => (
                  <div key={design} className="flex items-center space-x-2">
                    <Checkbox
                      id={design}
                      checked={criteria.study_designs.includes(design)}
                      onCheckedChange={(checked) => handleStudyDesignChange(design, checked)}
                    />
                    <Label htmlFor={design} className="text-sm font-normal">
                      {design}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                AI Processing Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Advanced AI Processing</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Enable enhanced AI recommendations with more sophisticated screening algorithms
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Better accuracy
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Detailed analysis
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAdvancedAI}
                      onChange={(e) => setUseAdvancedAI(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Dual AI Review</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Use two independent AI reviewers to screen all references automatically. You only need to resolve disagreements.
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Automated screening
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Conflict resolution
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      Time-saving
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDualReview}
                      onChange={(e) => setUseDualReview(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>

              {useDualReview && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-semibold text-purple-900 mb-3">Dual Review Mode</h5>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id="parallel"
                        name="dualMode"
                        value="parallel"
                        checked={dualReviewMode === "parallel"}
                        onChange={(e) => setDualReviewMode(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="parallel" className="font-medium text-purple-900 cursor-pointer">
                          Parallel Processing ⚡
                        </label>
                        <p className="text-sm text-purple-700 mt-1">
                          Two AI reviewers work simultaneously for each reference. Faster results but higher cost.
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-purple-600">
                          <span>⚡ Fast (real-time)</span>
                          <span>💰 Higher cost</span>
                          <span>🎯 Immediate conflicts</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id="batch"
                        name="dualMode"
                        value="batch"
                        checked={dualReviewMode === "batch"}
                        onChange={(e) => setDualReviewMode(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="batch" className="font-medium text-purple-900 cursor-pointer">
                          Batch Processing 💰
                        </label>
                        <p className="text-sm text-purple-700 mt-1">
                          Process all references in large batches. Takes longer but significantly cheaper.
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-purple-600">
                          <span>🐌 Slower (5-10 min)</span>
                          <span>💰 Lower cost</span>
                          <span>📊 Bulk analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {(useAdvancedAI || useDualReview) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-semibold text-blue-900">
                        {useDualReview ? `Dual AI Review Enabled (${dualReviewMode === "parallel" ? "Parallel" : "Batch"} Mode)` : "Advanced AI Enabled"}
                      </h5>
                      <p className="text-sm text-blue-700 mt-1">
                        {useDualReview 
                          ? dualReviewMode === "parallel" 
                            ? "Two AI reviewers will process references simultaneously. Faster results, you'll see conflicts in real-time."
                            : "Two AI reviewers will process all references in batches. Takes longer but is more cost-effective for large datasets."
                          : "Your screening process will use enhanced AI models for more accurate reference evaluation."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button 
              onClick={() => navigate(createPageUrl("Import"))}
              variant="outline"
              size="lg"
            >
              Back to Import
            </Button>
            <Button 
              onClick={saveCriteria}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {useDualReview ? `Start ${dualReviewMode === "parallel" ? "Parallel" : "Batch"} AI Review` : "Start Screening Process"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
