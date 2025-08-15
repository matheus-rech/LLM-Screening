export default class ScreeningAPI {
  constructor(baseURL = "http://localhost:8000") {
    this.baseURL = baseURL.replace(/\/$/, "");
    this.sessionId = null;
    this.ws = null;
    this.onProgressUpdate = () => {};
  }

  async importReferences(references, criteria) {
    // Normalize payload to backend shape
    const refs = references.map(r => ({
      id: r.id,
      title: r.title || "",
      abstract: r.abstract || "",
      authors: r.authors || "",
      year: r.year || "",
      journal: r.journal || "",
      doi: r.doi || "",
      pmid: r.pmid || "",
      status: r.screening_status || r.status || "pending"
    }));

    const crit = {
      population: criteria.population || "",
      intervention: criteria.intervention || "",
      comparator: criteria.comparator || "",
      outcome: criteria.outcome || "",
      study_designs: criteria.study_designs || [],
      additional_criteria: criteria.additional_criteria || {}
    };

    const response = await fetch(`${this.baseURL}/api/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ references: refs, criteria: crit })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Import failed: ${response.status} ${text}`);
    }

    const data = await response.json();
    this.sessionId = data.session_id;
    this.connectWebSocket();
    return data;
  }

  async screenSingle(reference, criteria, useAI = true) {
    const refPayload = {
      id: reference.id,
      title: reference.title || "",
      abstract: reference.abstract || "",
      authors: reference.authors || "",
      year: reference.year || "",
      journal: reference.journal || "",
      doi: reference.doi || "",
      pmid: reference.pmid || "",
      status: reference.screening_status || reference.status || "pending"
    };

    const crit = {
      population: criteria.population || "",
      intervention: criteria.intervention || "",
      comparator: criteria.comparator || "",
      outcome: criteria.outcome || "",
      study_designs: criteria.study_designs || [],
      additional_criteria: criteria.additional_criteria || {}
    };

    const response = await fetch(`${this.baseURL}/api/screen/single`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: refPayload,
        criteria: crit,
        use_ai: useAI,
        require_dual_screening: false
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`screenSingle failed: ${response.status} ${text}`);
    }

    return await response.json();
  }

  async getNextReference() {
    if (!this.sessionId) throw new Error("No active session");
    const response = await fetch(`${this.baseURL}/api/screen/next/${this.sessionId}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`getNextReference failed: ${response.status} ${text}`);
    }
    return await response.json();
  }

  async resolveConflict(result1, result2, paper, criteria) {
    const response = await fetch(`${this.baseURL}/api/conflict/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result1, result2, paper, criteria })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`resolveConflict failed: ${response.status} ${text}`);
    }

    return await response.json();
  }

  async exportResults(format = "csv") {
    if (!this.sessionId) throw new Error("No active session");
    const response = await fetch(`${this.baseURL}/api/export/${this.sessionId}?format=${format}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`exportResults failed: ${response.status} ${text}`);
    }
    const data = await response.json();

    const blob = new Blob([data.content], {
      type: format === "csv" ? "text/csv;charset=utf-8;" : "application/json;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = data.filename || `screening_results.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  connectWebSocket() {
    if (!this.sessionId) return;

    const wsUrl = this.baseURL.replace(/^http/, "ws");
    this.ws = new WebSocket(`${wsUrl}/ws/${this.sessionId}`);

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "progress") {
          this.onProgressUpdate(message.data);
        }
      } catch {
        // ignore malformed messages
      }
    };
  }
}