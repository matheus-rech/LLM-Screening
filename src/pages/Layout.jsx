
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Download } from "lucide-react";

const navigationItems = [
  {
    title: "Import",
    url: createPageUrl("Import")
  },
  {
    title: "Criteria",
    url: createPageUrl("Criteria")
  },
  {
    title: "Screening",
    url: createPageUrl("Screening")
  },
  {
    title: "Dual Review",
    url: createPageUrl("DualReview")
  },
  {
    title: "Results",
    url: createPageUrl("Analytics")
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <Download className="w-4 h-4 text-white rotate-180" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  AI-Powered Systematic Review Screening
                </h1>
                <p className="text-sm text-gray-500">Intelligent Abstract Screening Assistant</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    location.pathname === item.url
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
