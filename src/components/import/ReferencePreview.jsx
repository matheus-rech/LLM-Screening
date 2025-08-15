import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, FileText } from "lucide-react";

export default function ReferencePreview({ references = [] }) {
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState({});

  if (!references || references.length === 0) {
    return null;
  }

  const displayReferences = showAll ? references : references.slice(0, 5);
  const stats = {
    withTitle: references.filter(ref => ref.title).length,
    withAbstract: references.filter(ref => ref.abstract).length,
    withAuthors: references.filter(ref => ref.authors).length,
    withYear: references.filter(ref => ref.year).length
  };

  const toggleExpanded = (index) => {
    setExpanded(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Reference Preview ({references.length} total)
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAll ? 'Show Less' : 'Show All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.withTitle}</div>
            <div className="text-xs text-gray-600">With Title</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.withAbstract}</div>
            <div className="text-xs text-gray-600">With Abstract</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{stats.withAuthors}</div>
            <div className="text-xs text-gray-600">With Authors</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{stats.withYear}</div>
            <div className="text-xs text-gray-600">With Year</div>
          </div>
        </div>

        {/* Reference List */}
        <div className="space-y-3 max-h-96 overflow-auto">
          {displayReferences.map((ref, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 line-clamp-2">
                    {ref.title || "Untitled Reference"}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ref.authors && (
                      <Badge variant="outline" className="text-xs">
                        {ref.authors.split(';')[0]}
                        {ref.authors.includes(';') && ' et al.'}
                      </Badge>
                    )}
                    {ref.year && (
                      <Badge variant="outline" className="text-xs">{ref.year}</Badge>
                    )}
                    {ref.journal && (
                      <Badge variant="outline" className="text-xs">{ref.journal}</Badge>
                    )}
                    {ref.source_file && (
                      <Badge variant="secondary" className="text-xs">{ref.source_file}</Badge>
                    )}
                  </div>
                </div>
                {ref.abstract && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(idx)}
                    className="text-xs"
                  >
                    {expanded[idx] ? 'Less' : 'Abstract'}
                  </Button>
                )}
              </div>
              
              {expanded[idx] && ref.abstract && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                  <strong>Abstract:</strong> {ref.abstract}
                </div>
              )}
              
              {ref.doi && (
                <div className="mt-2 text-xs text-gray-500">
                  DOI: {ref.doi}
                </div>
              )}
            </div>
          ))}
        </div>

        {!showAll && references.length > 5 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600">
              + {references.length - 5} more references...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}