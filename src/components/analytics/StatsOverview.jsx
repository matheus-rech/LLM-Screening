
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, HelpCircle, Clock, BarChart3, TrendingUp } from "lucide-react";

export default function StatsOverview({ stats }) {
  const completionRate = stats.total > 0 ? Math.round((stats.screened / stats.total) * 100) : 0;
  const inclusionRate = stats.screened > 0 ? Math.round((stats.included / stats.screened) * 100) : 0;

  const statCards = [
    {
      title: "Total References",
      value: stats.total,
      icon: BarChart3,
      color: "bg-blue-500"
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: "bg-indigo-500"
    },
    {
      title: "Included",
      value: stats.included,
      icon: CheckCircle,
      color: "bg-emerald-500"
    },
    {
      title: "Excluded", 
      value: stats.excluded,
      icon: XCircle,
      color: "bg-red-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-0 shadow-lg relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${stat.color} rounded-full opacity-10`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.color} bg-opacity-20`}>
              <stat.icon className={`w-4 h-4 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stat.value}
            </div>
            {stat.title === "Included" && stats.screened > 0 && (
              <p className="text-sm text-slate-600">
                {inclusionRate}% inclusion rate
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
