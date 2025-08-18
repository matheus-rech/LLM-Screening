import { apiClient } from "@/api/apiClient";

export class ProcessingQueue {
  static QUEUE_KEY = "ai_processing_queue";
  static STATUS_KEY = "processing_status";
  static USER_KEY = "session_user";

  // Save user session identifier
  static saveUserSession(username) {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify({
        username,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Failed to save user session:", error);
    }
  }

  // Get current user session
  static getUserSession() {
    try {
      const saved = localStorage.getItem(this.USER_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch (error) {
      console.error("Failed to load user session:", error);
      return null;
    }
  }

  // Save processing state with user identification
  static saveProcessingState(state, username = null) {
    try {
      const userSession = username || this.getUserSession()?.username;
      localStorage.setItem(this.STATUS_KEY, JSON.stringify({
        ...state,
        username: userSession,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error("Failed to save processing state:", error);
    }
  }

  // Load processing state for current user
  static loadProcessingState(username = null) {
    try {
      const saved = localStorage.getItem(this.STATUS_KEY);
      if (!saved) return null;
      
      const state = JSON.parse(saved);
      const currentUser = username || this.getUserSession()?.username;
      
      // Check if this state belongs to current user
      if (state.username && currentUser && state.username !== currentUser) {
        return null; // Different user's session
      }
      
      const hoursSinceLastUpdate = (Date.now() - state.timestamp) / (1000 * 60 * 60);
      
      // If more than 4 hours have passed, consider the session stale
      if (hoursSinceLastUpdate > 4) {
        this.clearProcessingState();
        return null;
      }
      
      return state;
    } catch (error) {
      console.error("Failed to load processing state:", error);
      return null;
    }
  }

  // Clear processing state
  static clearProcessingState() {
    try {
      localStorage.removeItem(this.STATUS_KEY);
      localStorage.removeItem(this.QUEUE_KEY);
    } catch (error) {
      console.error("Failed to clear processing state:", error);
    }
  }

  // Save references queue with user identification
  static saveQueue(references, currentIndex = 0, username = null) {
    try {
      const userSession = username || this.getUserSession()?.username;
      const queueData = {
        references: references.map(ref => ({ id: ref.id, title: ref.title })),
        currentIndex,
        username: userSession,
        timestamp: Date.now()
      };
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queueData));
    } catch (error) {
      console.error("Failed to save queue:", error);
    }
  }

  // Load references queue for current user
  static async loadQueue(username = null) {
    try {
      const saved = localStorage.getItem(this.QUEUE_KEY);
      if (!saved) return null;
      
      const queueData = JSON.parse(saved);
      const currentUser = username || this.getUserSession()?.username;
      
      // Check if this queue belongs to current user
      if (queueData.username && currentUser && queueData.username !== currentUser) {
        return null; // Different user's queue
      }
      
      // Verify references still exist and are pending
      const referenceIds = queueData.references.map(ref => ref.id);
      const currentRefs = await apiClient.filterReferences({
        id: { in: referenceIds },
        screening_status: "pending"
      });
      
      return {
        references: currentRefs,
        currentIndex: queueData.currentIndex,
        username: queueData.username,
        savedAt: new Date(queueData.timestamp)
      };
    } catch (error) {
      console.error("Failed to load queue:", error);
      return null;
    }
  }

  // Check for interrupted processing for current user
  static async checkForInterruption(username = null) {
    const savedState = this.loadProcessingState(username);
    const savedQueue = await this.loadQueue(username);
    
    if (savedState && savedQueue && savedQueue.references.length > 0) {
      return {
        wasInterrupted: true,
        username: savedState.username || savedQueue.username,
        processingMode: savedState.mode,
        remainingReferences: savedQueue.references.length,
        lastProcessedIndex: savedQueue.currentIndex,
        interruptedAt: new Date(savedState.timestamp),
        canResume: true
      };
    }
    
    return { wasInterrupted: false };
  }

  // Mark processing as complete
  static markProcessingComplete() {
    this.clearProcessingState();
  }

  // Update processing progress with user context
  static updateProgress(currentIndex, total, mode, username = null) {
    this.saveProcessingState({
      mode,
      currentIndex,
      total,
      progress: (currentIndex / total) * 100,
      isActive: true
    }, username);
  }
}