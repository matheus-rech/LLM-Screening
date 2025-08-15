export async function screenSingle(baseUrl, reference, criteria) {
  if (!baseUrl) throw new Error("Backend base URL is not set");
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/screen/single`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: {
        id: reference.id,
        title: reference.title || "",
        abstract: reference.abstract || "",
        authors: reference.authors || "",
        year: reference.year || "",
        journal: reference.journal || "",
        doi: reference.doi || "",
        pmid: reference.pmid || "",
        status: "pending"
      },
      criteria: {
        population: criteria.population || "",
        intervention: criteria.intervention || "",
        comparator: criteria.comparator || "",
        outcome: criteria.outcome || "",
        study_designs: criteria.study_designs || [],
        additional_criteria: criteria.additional_criteria || {}
      },
      use_ai: true,
      require_dual_screening: false
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return {
    recommendation: data.decision || "uncertain",
    confidence: typeof data.confidence === "number" ? data.confidence : 0,
    reasoning: data.reasons ? (Array.isArray(data.reasons) ? data.reasons.join("; ") : data.reasons) : data.reasoning || ""
  };
}

export async function importReferences(baseUrl, references, criteria) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      references: references.map(r => ({
        id: r.id,
        title: r.title || "",
        abstract: r.abstract || "",
        authors: r.authors || "",
        year: r.year || "",
        journal: r.journal || "",
        doi: r.doi || "",
        pmid: r.pmid || "",
        status: r.screening_status || "pending"
      })),
      criteria: {
        population: criteria.population || "",
        intervention: criteria.intervention || "",
        comparator: criteria.comparator || "",
        outcome: criteria.outcome || "",
        study_designs: criteria.study_designs || [],
        additional_criteria: criteria.additional_criteria || {}
      }
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend import error: ${res.status} ${text}`);
  }
  return res.json();
}