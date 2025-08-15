
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Brain, Users, Zap, DollarSign, User } from "lucide-react";
import { createPageUrl } from "@/utils";

import { DualAIScreener } from "../components/ai/DualAIScreener";
import ConflictResolver from "../components/screening/ConflictResolver";
import { ProcessingQueue } from "../components/ai/ProcessingQueue";
import UserSessionDialog from "../components/demo/UserSessionDialog"; // New import

export default function DualReviewPage() {
  const [references, setReferences] = useState([]);
  const [project, setProject] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [progress, setProgress] = useState(0);
  const [conflicts, setConflicts] = useState([]);
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0);
  const [processingMode, setProcessingMode] = useState("parallel");
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState({
    processed: 0,
    agreements: 0,
    conflicts: 0,
    processingSpeed: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    agreements: 0,
    conflicts: 0,
    resolved: 0
  });
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false); // New state
  const [interruptionInfo, setInterruptionInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // New state

  // Use useRef for processing start time to persist across renders without causing re-renders
  const processingStartTime = useRef(null);

  useEffect(() => {
    initializeSession();

    let interval;
    if (isProcessing) {
      interval = setInterval(updateRealTimeStats, 2000); // Update every 2 seconds during processing
    }
    // Cleanup function to clear interval when component unmounts or isProcessing changes
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isProcessing, currentUser]); // Dependency on isProcessing and currentUser to start/stop interval

  const initializeSession = async () => {
    // Check for existing user session
    const userSession = await ProcessingQueue.getUserSession();
    if (userSession && userSession.username) {
      setCurrentUser(userSession.username);
      // Data loading and interruption check will happen after currentUser is set
      // (due to useEffect dependency or explicit call below if no useEffect dep)
      await loadData();
      await checkForInterruption(userSession.username);
    } else {
      setShowUserDialog(true);
    }
  };

  const handleUserSet = async (username) => {
    ProcessingQueue.saveUserSession(username);
    setCurrentUser(username);
    setShowUserDialog(false);
    await loadData(); // Load data for the newly set user
    await checkForInterruption(username); // Check for interruptions for this user
  };

  const checkForInterruption = async (username) => {
    const interruption = await ProcessingQueue.checkForInterruption(username);
    if (interruption.wasInterrupted) {
      setInterruptionInfo(interruption);
      setShowResumeDialog(true);
    }
  };

  const resumeProcessing = async () => {
    setShowResumeDialog(false);
    
    // Load saved queue and resume from where we left off
    const queueData = await ProcessingQueue.loadQueue(currentUser);
    if (queueData && project) { // Ensure project is loaded for criteria
      setReferences(queueData.references);
      setCurrentBatch(queueData.currentIndex); // This might be batch index or ref index

      setIsProcessing(true);
      processingStartTime.current = Date.now(); // Set start time for resumed process
      
      // Reset real-time stats at the start of processing
      setRealTimeStats({
        processed: 0,
        agreements: 0,
        conflicts: 0,
        processingSpeed: 0
      });

      try {
        if (interruptionInfo.processingMode === "parallel") {
          await continueParallelProcessing(queueData.references, queueData.currentIndex);
        } else {
          await continueBatchProcessing(queueData.references, queueData.currentIndex);
        }
        await loadData(); // Reload data to show final results and update general stats
        ProcessingQueue.markProcessingComplete(currentUser); // Mark complete after successful resume
      } catch (error) {
        console.error("Dual review resume error:", error);
        alert("Failed to resume dual review. Please try again.");
      } finally {
        setIsProcessing(false);
        processingStartTime.current = null; // Clear start time
      }
    } else if (!project) {
        alert("Project data not loaded. Please try again or start fresh.");
        setShowResumeDialog(false);
        ProcessingQueue.clearProcessingState(currentUser); // Clear state if project not ready
    }
  };

  const startFreshProcessing = () => {
    setShowResumeDialog(false);
    ProcessingQueue.clearProcessingState(currentUser);
    // No need to reload data explicitly here, as loadData is called in useEffect on mount,
    // which effectively resets the view to a fresh state.
    loadData(); // Ensure UI reflects a fresh state with up-to-date stats
  };

  const updateRealTimeStats = async () => {
    // Only update if processing has actually started
    if (!processingStartTime.current) return;

    const allRefs = await apiClient.listReferences(); // Fetch all references to get latest state
    const processed = allRefs.filter(r => r.dual_ai_completed).length;
    const agreements = allRefs.filter(r => r.ai_reviewer_1 === r.ai_reviewer_2 && r.dual_ai_completed).length;
    const conflicts = allRefs.filter(r => r.ai_reviewer_1 !== r.ai_reviewer_2 && r.dual_ai_completed).length;
    
    // Calculate processing speed: processed references per minute
    const elapsedTimeInMinutes = (Date.now() - processingStartTime.current) / 1000 / 60;
    const processingSpeed = elapsedTimeInMinutes > 0 ? Math.round(processed / elapsedTimeInMinutes) : 0;
    
    setRealTimeStats({
      processed,
      agreements,
      conflicts,
      processingSpeed
    });
  };

  const loadData = async () => {
    // Load project
    const projects = await apiClient.listProjects("-created_date", 1);
    if (projects.length > 0) {
      const loadedProject = projects[0];
      setProject(loadedProject);
      setProcessingMode(loadedProject.dual_review_mode || "parallel");
    }

    // Load references that are still pending for processing
    const refs = await apiClient.filterReferences(
      { screening_status: "pending" }, 
      "created_date",
      1000
    );
    setReferences(refs);

    // Calculate estimated time (based on initial pending refs)
    // Note: This calculation is for the initial estimate before starting processing.
    const timeEstimate = processingMode === "parallel" 
      ? Math.ceil(refs.length * 15 / 60) // 15 seconds per reference in parallel
      : Math.ceil(refs.length * 3 / 60) + 5; // 3 seconds per reference + 5 min batch processing
    setEstimatedTime(timeEstimate);

    // Update general stats based on ALL references, regardless of status
    const allRefs = await apiClient.listReferences();
    const newStats = {
      total: allRefs.length,
      processed: allRefs.filter(r => r.dual_ai_completed).length,
      agreements: allRefs.filter(r => r.ai_reviewer_1 === r.ai_reviewer_2 && r.dual_ai_completed).length,
      conflicts: allRefs.filter(r => r.ai_reviewer_1 !== r.ai_reviewer_2 && r.dual_ai_completed).length,
      resolved: allRefs.filter(r => r.screening_status !== "pending" && r.dual_ai_completed).length // Includes accepted, rejected, and manually resolved conflicts
    };
    setStats(newStats);

    // Load unresolved conflicts
    const conflictRefs = await apiClient.filterReferences(
      { dual_ai_completed: true, screening_status: "conflict" }
    );
    setConflicts(conflictRefs);
  };

  const startDualReview = async () => {
    if (!project || !currentUser) return; // Ensure currentUser is set

    setIsProcessing(true);
    setProgress(0);
    processingStartTime.current = Date.now(); // Set the start time

    // Save initial processing state
    ProcessingQueue.saveProcessingState({
      mode: processingMode,
      projectId: project.id,
      totalReferences: references.length,
      startedAt: Date.now(),
      isActive: true, // Mark as active process
    }, currentUser); // Pass currentUser

    // Save references queue (start from 0 for fresh processing)
    ProcessingQueue.saveQueue(references, 0, currentUser); // Pass currentUser

    // Reset real-time stats at the start of processing
    setRealTimeStats({
      processed: 0,
      agreements: 0,
      conflicts: 0,
      processingSpeed: 0
    });

    try {
      const criteria = {
        population: project.population,
        intervention: project.intervention,
        comparator: project.comparator,
        outcome: project.outcome,
        study_designs: project.study_designs,
        additional_criteria: project.additional_criteria
      };

      if (processingMode === "parallel") {
        await startParallelProcessing(criteria);
      } else {
        await startBatchProcessing(criteria);
      }

      await loadData();
      ProcessingQueue.markProcessingComplete(currentUser); // Mark processing as successfully completed

    } catch (error) {
      console.error("Dual review error:", error);
      alert("Failed to complete dual review. Please try again.");
      ProcessingQueue.markProcessingInterrupted(currentUser); // Mark as interrupted if an error occurs
    } finally {
      setIsProcessing(false);
      processingStartTime.current = null; // Clear start time
    }
  };

  const startParallelProcessing = async (criteria) => {
    // Process references one by one with real-time updates
    for (let i = 0; i < references.length; i++) {
      setCurrentBatch(i + 1); // For display purposes, showing current reference number
      const reference = references[i];
      
      // Update processing state for persistence
      ProcessingQueue.updateProgress(i, references.length, "parallel", currentUser); // Store 0-indexed current reference
      
      // Update status to show current processing
      await apiClient.updateReference(reference.id, { screening_status: "in_progress" });
      
      await DualAIScreener.processReference(reference, criteria);
      
      setProgress(((i + 1) / references.length) * 100);
      
      // Update real-time stats immediately after processing a reference
      await updateRealTimeStats();
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const continueParallelProcessing = async (allReferences, startIndex) => {
    if (!project) return; // Ensure project is available for criteria

    const criteria = {
      population: project.population,
      intervention: project.intervention,
      comparator: project.comparator,
      outcome: project.outcome,
      study_designs: project.study_designs,
      additional_criteria: project.additional_criteria
    };

    for (let i = startIndex; i < allReferences.length; i++) {
      setCurrentBatch(i + 1);
      const reference = allReferences[i];
      
      ProcessingQueue.updateProgress(i, allReferences.length, "parallel", currentUser);
      
      await apiClient.updateReference(reference.id, { screening_status: "in_progress" });
      await DualAIScreener.processReference(reference, criteria);
      
      setProgress(((i + 1) / allReferences.length) * 100);
      await updateRealTimeStats();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // The `finally` block in `resumeProcessing` handles `setIsProcessing(false)` and `markProcessingComplete()`
  };

  const startBatchProcessing = async (criteria) => {
    // Process in larger batches with progress updates
    const batchSize = 10;
    const totalBatches = Math.ceil(references.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      setCurrentBatch(i + 1); // For display purposes, showing current batch number
      const batch = references.slice(i * batchSize, (i + 1) * batchSize);
      
      // Update processing state for persistence
      ProcessingQueue.updateProgress(i, totalBatches, "batch", currentUser); // Store 0-indexed current batch
      
      // Mark batch references as in progress
      const updatePromises = batch.map(ref => 
        apiClient.updateReference(ref.id, { screening_status: "in_progress" })
      );
      await Promise.all(updatePromises); // Wait for all updates in batch
      
      await DualAIScreener.processBatch(batch, criteria);
      
      setProgress(((i + 1) / totalBatches) * 100);
      
      // Update real-time stats immediately after processing a batch
      await updateRealTimeStats();
      
      // Longer delay for batch processing
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const continueBatchProcessing = async (allReferences, startBatchIndex) => {
    if (!project) return; // Ensure project is available for criteria

    const criteria = {
      population: project.population,
      intervention: project.intervention,
      comparator: project.comparator,
      outcome: project.outcome,
      study_designs: project.study_designs,
      additional_criteria: project.additional_criteria
    };

    const batchSize = 10;
    const totalBatches = Math.ceil(allReferences.length / batchSize);

    for (let i = startBatchIndex; i < totalBatches; i++) {
      setCurrentBatch(i + 1);
      const batch = allReferences.slice(i * batchSize, (i + 1) * batchSize);
      
      ProcessingQueue.updateProgress(i, totalBatches, "batch", currentUser);
      
      const updatePromises = batch.map(ref => 
        apiClient.updateReference(ref.id, { screening_status: "in_progress" })
      );
      await Promise.all(updatePromises);
      
      await DualAIScreener.processBatch(batch, criteria);
      
      setProgress(((i + 1) / totalBatches) * 100);
      await updateRealTimeStats();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    // The `finally` block in `resumeProcessing` handles `setIsProcessing(false)` and `markProcessingComplete()`
  };

  const resolveConflict = async (reference, decision, notes = "") => {
    await apiClient.updateReference(reference.id, {
      screening_status: decision,
      manual_decision: decision,
      reviewer_notes: notes,
      screening_date: new Date().toISOString(),
      conflict_resolved: true
    });

    // Move to next conflict
    if (currentConflictIndex < conflicts.length - 1) {
      setCurrentConflictIndex(currentConflictIndex + 1);
    } else {
      // All conflicts resolved, reload data
      await loadData();
      setCurrentConflictIndex(0);
    }
  };

  const currentConflict = conflicts[currentConflictIndex];

  // User Session Dialog
  if (showUserDialog) {
    return <UserSessionDialog onUserSet={handleUserSet} />;
  }

  // Resume Dialog
  if (showResumeDialog && interruptionInfo) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-5 h-5" />
              Welcome back, {interruptionInfo.username || "User"}!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-2">Previous Processing Session Found</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">User:</span>
                  <span className="ml-2 font-medium">{interruptionInfo.username || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-600">Mode:</span>
                  <span className="ml-2 font-medium capitalize">{interruptionInfo.processingMode}</span>
                </div>
                <div>
                  <span className="text-slate-600">Remaining:</span>
                  <span className="ml-2 font-medium">{interruptionInfo.remainingReferences} references</span>
                </div>
                <div>
                  <span className="text-slate-600">Interrupted:</span>
                  <span className="ml-2 font-medium">{new Date(interruptionInfo.interruptedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <p className="text-amber-800">
              We found your unfinished AI review session. You can resume where you left off or start fresh.
            </p>
            
            <div className="flex gap-4">
              <Button
                onClick={resumeProcessing}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                Resume Processing ({interruptionInfo.remainingReferences} remaining)
              </Button>
              <Button
                onClick={startFreshProcessing}
                variant="outline"
                className="flex-1"
              >
                Start Fresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (conflicts.length > 0 && currentConflict) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Resolve AI Conflicts</h1>
          <p className="text-slate-600">
            Review disagreements between AI reviewers and make final decisions
          </p>
        </div>

        <ConflictResolver
          reference={currentConflict}
          onResolve={resolveConflict}
          conflictIndex={currentConflictIndex}
          totalConflicts={conflicts.length}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Dual AI Review 
              <Badge className="ml-3" variant={processingMode === "parallel" ? "default" : "secondary"}>
                {processingMode === "parallel" ? "⚡ Parallel" : "💰 Batch"} Mode
              </Badge>
            </h1>
            <p className="text-slate-600">
              {processingMode === "parallel" 
                ? "Two AI reviewers working simultaneously for real-time results"
                : "Two AI reviewers processing references in cost-effective batches"
              }
            </p>
          </div>
          
          {/* User indicator */}
          <div className="text-right">
            <div className="text-sm text-slate-600">Current User</div>
            <div className="font-medium text-slate-900 flex items-center gap-1">
              <User className="w-4 h-4" />
              {currentUser || "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">
              {isProcessing ? realTimeStats.processed : stats.total}
            </div>
            <div className="text-sm text-slate-600">
              {isProcessing ? "Processed (live)" : "Total References"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">
              {isProcessing ? realTimeStats.agreements : stats.agreements}
            </div>
            <div className="text-sm text-slate-600">AI Agreements</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">
              {isProcessing ? realTimeStats.conflicts : stats.conflicts}
            </div>
            <div className="text-sm text-slate-600">Conflicts</div>
            {isProcessing && realTimeStats.conflicts > 0 && (
              <div className="text-xs text-amber-600 mt-1">Need Review</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-900">{stats.resolved}</div>
            <div className="text-sm text-slate-600">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {isProcessing ? (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600 animate-pulse" />
              {processingMode === "parallel" ? "Parallel Processing" : "Batch Processing"} Dual AI Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium text-slate-700">
                {processingMode === "parallel" 
                  ? `Processing reference ${currentBatch} of ${references.length}...`
                  : `Processing batch ${currentBatch}...`
                }
              </div>
              <div className="text-sm text-slate-500">
                {processingMode === "parallel"
                  ? "Two AI reviewers analyzing each reference simultaneously"
                  : "Processing references in cost-effective batches"
                }
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="w-full h-3" />
            </div>
            
            {/* Real-time Processing Info */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="font-bold text-green-700">{realTimeStats.agreements}</div>
                <div className="text-xs text-green-600">Agreements</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="font-bold text-amber-700">{realTimeStats.conflicts}</div>
                <div className="text-xs text-amber-600">Conflicts</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="font-bold text-blue-700">
                  {realTimeStats.processingSpeed || "-"}
                </div>
                <div className="text-xs text-blue-600">Refs/min</div>
              </div>
            </div>

            {/* Processing Mode Info */}
            {processingMode === "batch" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-700">
                  Batch processing saves costs by processing multiple references together
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : stats.processed === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Start {processingMode === "parallel" ? "Parallel" : "Batch"} AI Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">
                    {processingMode === "parallel" ? "Parallel Mode" : "Batch Mode"}
                  </h3>
                </div>
                <div className="space-y-2 text-sm text-blue-800">
                  {processingMode === "parallel" ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Real-time processing of each reference</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Immediate conflict detection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Faster results (~{estimatedTime} minutes)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span>Higher processing cost</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Cost-effective batch processing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Bulk analysis optimization</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Takes longer (~{estimatedTime} minutes)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Significantly lower cost</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">How It Works:</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>Two independent AI reviewers analyze each reference</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>References with AI agreement are automatically processed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>Only disagreements require your manual review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>Saves 70-90% of manual screening time</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={startDualReview}
              size="lg"
              className={`w-full ${
                processingMode === "parallel" 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              }`}
              disabled={references.length === 0 || !currentUser} // Disabled if no references or no user
            >
              {processingMode === "parallel" ? <Zap className="w-5 h-5 mr-2" /> : <DollarSign className="w-5 h-5 mr-2" />}
              Start {processingMode === "parallel" ? "Parallel" : "Batch"} AI Review ({references.length} references)
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Review Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Agreements</span>
                </div>
                <div className="text-2xl font-bold text-green-900">{stats.agreements}</div>
                <div className="text-sm text-green-700">Automatically processed</div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-900">Conflicts</span>
                </div>
                <div className="text-2xl font-bold text-amber-900">{stats.conflicts}</div>
                <div className="text-sm text-amber-700">Need manual review</div>
              </div>
            </div>

            <div className="flex gap-4">
              {stats.conflicts > stats.resolved ? ( // Only show if there are unresolved conflicts
                <Button
                  onClick={() => {
                    loadData(); // Reload data to ensure conflict list is fresh
                    setCurrentConflictIndex(0); // Reset to first conflict
                  }}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Review Conflicts ({stats.conflicts - stats.resolved})
                </Button>
              ) : ( // All conflicts resolved or no conflicts initially
                <>
                  <Button
                    onClick={() => window.location.href = createPageUrl("Analytics")}
                    variant="default" // Changed to default variant for primary action
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    View Results
                  </Button>
                  {/* Export button shown when all conflicts are resolved and there's data */}
                  {(stats.agreements > 0 || stats.resolved > 0) && (
                    <Button
                      onClick={() => alert("Export functionality coming soon!")} // Placeholder for actual export logic
                      variant="outline"
                    >
                      Export Data
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
