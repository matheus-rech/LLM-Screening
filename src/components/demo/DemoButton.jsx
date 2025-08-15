import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlayCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { DemoDataLoader } from "./DemoDataLoader";

export default function DemoButton() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const loadDemoData = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const demoResult = await DemoDataLoader.loadIntracranialPressureDemoData();
      setResult(demoResult);
      
      // Auto-navigate to criteria page after 2 seconds
      setTimeout(() => {
        navigate(createPageUrl("Criteria"));
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="text-center py-6">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          <h3 className="font-semibold text-emerald-900 mb-2">Demo Data Loaded!</h3>
          <p className="text-sm text-emerald-700 mb-3">
            Created systematic review project with {result.referencesCount} real PubMed references and evidence-based PICO criteria
          </p>
          <p className="text-xs text-emerald-600">Redirecting to criteria setup...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-900 flex items-center gap-2">
          <PlayCircle className="w-5 h-5" />
          Try the Demo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-blue-700 mb-4">
          Load a complete systematic review demo with real PubMed references about intracranial pressure monitoring and pre-configured PICO criteria derived from the literature.
        </p>
        
        <div className="space-y-3 text-xs text-blue-600 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>3 real PubMed references with full abstracts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Evidence-based PICO criteria from the papers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Inclusion/exclusion criteria for ICP monitoring studies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Ready for advanced AI-powered screening</span>
          </div>
        </div>

        <Button 
          onClick={loadDemoData}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading Demo...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" />
              Load Demo Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}