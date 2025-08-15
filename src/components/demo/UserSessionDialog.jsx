import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, LogIn } from "lucide-react";

export default function UserSessionDialog({ onUserSet, existingUsername = null }) {
  const [username, setUsername] = useState(existingUsername || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (username.trim().length < 2) {
      setError("Username must be at least 2 characters long");
      return;
    }
    onUserSet(username.trim());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Session Identification
          </CardTitle>
          <p className="text-sm text-slate-600">
            {existingUsername 
              ? "Continue your existing session or start a new one"
              : "Enter your name to save progress and resume sessions"
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Your Name/Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="e.g., Dr. Smith, researcher123, etc."
                className="mt-1"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Why do we need this?</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Save your progress during AI processing</li>
                    <li>• Resume interrupted sessions</li>
                    <li>• Prevent conflicts with other users</li>
                    <li>• Track your personal review history</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              <LogIn className="w-4 h-4 mr-2" />
              {existingUsername ? "Continue Session" : "Start Session"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}