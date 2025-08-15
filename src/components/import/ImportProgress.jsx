import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export default function ImportProgress({ progress }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          Processing Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="w-full" />
        <div className="text-sm text-slate-600 text-center">
          {progress < 50 ? "Uploading and parsing files..." :
           progress < 75 ? "Extracting reference data..." :
           progress < 100 ? "Saving to database..." :
           "Import complete!"}
        </div>
      </CardContent>
    </Card>
  );
}