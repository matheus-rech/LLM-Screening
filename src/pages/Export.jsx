import React, { useState, useEffect } from "react";
import { Reference, ReviewProject } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, CheckCircle } from "lucide-react";

export default function ExportPage() {
  const [references, setReferences] = useState([]);
  const [project, setProject] = useState(null);
  const [exportOptions, setExportOptions] = useState({
    includeAll: true,
    includeIncluded: true,
    includeExcluded: false,
    includeMaybe: true,
    includePending: false,
    includeAIData: true,
    includeNotes: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const projects = await ReviewProject.list("-created_date", 1);
    if (projects.length > 0) {
      setProject(projects[0]);
    }

    const refs = await Reference.list();
    setReferences(refs);
  };

  const handleOptionChange = (option, checked) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  const getFilteredReferences = () => {
    if (exportOptions.includeAll) return references;

    return references.filter(ref => {
      if (exportOptions.includeIncluded && ref.screening_status === "include") return true;
      if (exportOptions.includeExcluded && ref.screening_status === "exclude") return true;
      if (exportOptions.includeMaybe && ref.screening_status === "maybe") return true;
      if (exportOptions.includePending && ref.screening_status === "pending") return true;
      return false;
    });
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    
    const filteredRefs = getFilteredReferences();
    const exportData = filteredRefs.map(ref => {
      const baseData = {
        Title: ref.title || '',
        Authors: ref.authors || '',
        Year: ref.year || '',
        Journal: ref.journal || '',
        DOI: ref.doi || '',
        PMID: ref.pmid || '',
        'Screening Status': ref.screening_status || '',
        'Manual Decision': ref.manual_decision || '',
        'Screening Date': ref.screening_date ? new Date(ref.screening_date).toLocaleDateString() : ''
      };

      if (exportOptions.includeAIData) {
        baseData['AI Recommendation'] = ref.ai_recommendation || '';
        baseData['AI Confidence'] = ref.ai_confidence ? Math.round(ref.ai_confidence * 100) + '%' : '';
        baseData['AI Reasoning'] = ref.ai_reasoning || '';
      }

      if (exportOptions.includeNotes) {
        baseData['Reviewer Notes'] = ref.reviewer_notes || '';
      }

      return baseData;
    });

    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `systematic_review_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    }, 1000);
  };

  const filteredCount = getFilteredReferences().length;
  const stats = {
    included: references.filter(r => r.screening_status === "include").length,
    excluded: references.filter(r => r.screening_status === "exclude").length,
    maybe: references.filter(r => r.screening_status === "maybe").length,
    pending: references.filter(r => r.screening_status === "pending").length
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Export Results</h1>
        <p className="text-slate-600">Download your systematic review screening results</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Include References</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAll"
                      checked={exportOptions.includeAll}
                      onCheckedChange={(checked) => handleOptionChange("includeAll", checked)}
                    />
                    <label htmlFor="includeAll" className="text-sm font-medium">
                      All References ({references.length})
                    </label>
                  </div>
                  
                  {!exportOptions.includeAll && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeIncluded"
                          checked={exportOptions.includeIncluded}
                          onCheckedChange={(checked) => handleOptionChange("includeIncluded", checked)}
                        />
                        <label htmlFor="includeIncluded" className="text-sm">
                          Included ({stats.included})
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeExcluded"
                          checked={exportOptions.includeExcluded}
                          onCheckedChange={(checked) => handleOptionChange("includeExcluded", checked)}
                        />
                        <label htmlFor="includeExcluded" className="text-sm">
                          Excluded ({stats.excluded})
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeMaybe"
                          checked={exportOptions.includeMaybe}
                          onCheckedChange={(checked) => handleOptionChange("includeMaybe", checked)}
                        />
                        <label htmlFor="includeMaybe" className="text-sm">
                          Maybe ({stats.maybe})
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includePending"
                          checked={exportOptions.includePending}
                          onCheckedChange={(checked) => handleOptionChange("includePending", checked)}
                        />
                        <label htmlFor="includePending" className="text-sm">
                          Pending ({stats.pending})
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium text-slate-900">Additional Data</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAIData"
                      checked={exportOptions.includeAIData}
                      onCheckedChange={(checked) => handleOptionChange("includeAIData", checked)}
                    />
                    <label htmlFor="includeAIData" className="text-sm">
                      AI Recommendations & Confidence
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeNotes"
                      checked={exportOptions.includeNotes}
                      onCheckedChange={(checked) => handleOptionChange("includeNotes", checked)}
                    />
                    <label htmlFor="includeNotes" className="text-sm">
                      Reviewer Notes
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Export Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {filteredCount}
                </div>
                <div className="text-sm text-slate-600">References to Export</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Format:</span>
                  <Badge variant="outline">CSV</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>AI Data:</span>
                  <Badge variant={exportOptions.includeAIData ? "default" : "secondary"}>
                    {exportOptions.includeAIData ? "Included" : "Excluded"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Notes:</span>
                  <Badge variant={exportOptions.includeNotes ? "default" : "secondary"}>
                    {exportOptions.includeNotes ? "Included" : "Excluded"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {exportComplete ? (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-emerald-900 mb-1">Export Complete!</h3>
                <p className="text-sm text-emerald-700">Your file has been downloaded</p>
              </CardContent>
            </Card>
          ) : (
            <Button
              onClick={exportToCSV}
              disabled={isExporting || filteredCount === 0}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export to CSV
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}