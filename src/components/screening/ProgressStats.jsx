import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, HelpCircle, Clock } from "lucide-react";

export default function ProgressStats({ stats }) {
  const completionPercent = stats.total > 0 ? (stats.screened / stats.total) * 100 : 0;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Screening Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-slate-900">
            {Math.round(completionPercent)}%
          </div>
          <div className="text-sm text-slate-600">Complete</div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-sm">Included</span>
            </div>
            <span className="text-sm font-medium">{stats.included}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">Excluded</span>
            </div>
            <span className="text-sm font-medium">{stats.excluded}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm">Maybe</span>
            </div>
            <span className="text-sm font-medium">{stats.maybe}</span>
          </div>
          
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-sm">Remaining</span>
            </div>
            <span className="text-sm font-medium">{stats.total - stats.screened}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}