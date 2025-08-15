import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

export default function ScreeningChart({ references }) {
  // Group references by year for the chart
  const yearData = references.reduce((acc, ref) => {
    const year = ref.year || "Unknown";
    if (!acc[year]) {
      acc[year] = { year, included: 0, excluded: 0, maybe: 0, pending: 0 };
    }
    
    if (ref.screening_status === "include") acc[year].included++;
    else if (ref.screening_status === "exclude") acc[year].excluded++;
    else if (ref.screening_status === "maybe") acc[year].maybe++;
    else acc[year].pending++;
    
    return acc;
  }, {});

  const chartData = Object.values(yearData)
    .sort((a, b) => {
      if (a.year === "Unknown") return 1;
      if (b.year === "Unknown") return -1;
      return parseInt(b.year) - parseInt(a.year);
    })
    .slice(0, 10); // Show top 10 years

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Screening Results by Year
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="year" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar dataKey="included" stackId="a" fill="#059669" name="Included" />
            <Bar dataKey="excluded" stackId="a" fill="#dc2626" name="Excluded" />
            <Bar dataKey="maybe" stackId="a" fill="#d97706" name="Maybe" />
            <Bar dataKey="pending" stackId="a" fill="#6b7280" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}