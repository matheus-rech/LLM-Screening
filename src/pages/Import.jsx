
import React, { useState, useRef } from "react";
import { Reference, ReviewProject } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { FileParser } from "../components/import/FileParser";
import DemoButton from "../components/demo/DemoButton"; // Added import

export default function ImportPage() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [files, setFiles] = useState([]);
  const [parsedReferences, setParsedReferences] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importFormat, setImportFormat] = useState("auto-detect");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (selectedFiles) => {
    const validFiles = selectedFiles.filter(
      file => file.name.endsWith('.csv') || 
              file.name.endsWith('.ris') || 
              file.name.endsWith('.bib') ||
              file.name.endsWith('.xml')
    );
    
    if (validFiles.length === 0) {
      setError("Please select valid files (CSV, RIS, BibTeX, or XML)");
      return;
    }

    setFiles(validFiles);
    setError(null);
    setParsedReferences([]);

    setIsParsing(true);
    try {
      const allReferences = [];
      for (const file of validFiles) {
        const references = await FileParser.parseFile(file, importFormat === 'auto-detect' ? null : importFormat); // Pass format if not auto-detect
        const referencesWithSource = references.map(ref => ({
          ...ref,
          source_file: file.name
        }));
        allReferences.push(...referencesWithSource);
      }
      setParsedReferences(allReferences);
    } catch (err) {
      setError(err.message);
      console.error("File parsing error:", err);
    } finally {
      setIsParsing(false);
    }
  };

  const processImport = async () => {
    if (!projectName.trim()) {
      setError("Please enter a project name");
      return;
    }

    if (parsedReferences.length === 0) {
      setError("No valid references found in uploaded files");
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Create project
      setProgress(10);
      const project = await ReviewProject.create({
        name: projectName,
        status: "importing",
        total_references: parsedReferences.length
      });

      // Add project_id and screening status to all references
      setProgress(25);
      const referencesToSave = parsedReferences.map(ref => ({
        ...ref,
        project_id: project.id,
        screening_status: "pending"
      }));

      // Save references in batches
      setProgress(50);
      const batchSize = 50;
      for (let i = 0; i < referencesToSave.length; i += batchSize) {
        const batch = referencesToSave.slice(i, i + batchSize);
        await Reference.bulkCreate(batch);
        setProgress(50 + ((i + batch.length) / referencesToSave.length) * 40);
      }

      // Update project status
      setProgress(95);
      await ReviewProject.update(project.id, {
        status: "screening"
      });

      setProgress(100);
      setImportResults({
        projectId: project.id,
        totalReferences: parsedReferences.length,
        sourceFiles: files.length
      });

    } catch (err) {
      console.error("Import error:", err);
      setError(`Failed to import references: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const proceedToScreening = () => {
    navigate(createPageUrl("Criteria", { projectId: importResults.projectId }));
  };

  if (importResults) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white">
            <CardContent className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Import Successful</h1>
              <p className="text-gray-600 mb-8">
                Successfully imported {importResults.totalReferences} references from {importResults.sourceFiles} file(s).
              </p>
              <div className="space-y-4">
                <Button 
                  onClick={proceedToScreening}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  Setup Screening Criteria
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  onClick={() => navigate(createPageUrl("Criteria", { projectId: importResults.projectId }))} // Ensure project ID is passed
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Skip to Criteria Setup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Demo Section */}
        <div className="mb-8">
          <DemoButton 
            setProjectName={setProjectName}
            setFiles={setFiles}
            setParsedReferences={setParsedReferences}
            setIsProcessing={setIsProcessing}
            setIsParsing={setIsParsing}
            setProgress={setProgress}
            setImportResults={setImportResults}
            setError={setError}
          />
        </div>

        <Card className="bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-gray-600" />
              <CardTitle className="text-xl font-semibold text-gray-900">
                Import References
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-sm font-medium text-gray-700">
                Project Name
              </Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full"
              />
            </div>

            {/* Import Format */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Import Format
              </Label>
              <Select value={importFormat} onValueChange={setImportFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto-detect">Auto-detect</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="ris">RIS</SelectItem>
                  <SelectItem value="bibtex">BibTeX</SelectItem>
                  <SelectItem value="xml">PubMed XML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive 
                  ? "border-blue-400 bg-blue-50" 
                  : "border-gray-300"
              }`}
              onDragEnter={handleDrag}
              onDragleave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.ris,.bib,.xml"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag and drop your reference file here
              </p>
              <p className="text-gray-500 mb-4">or</p>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Browse Files
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">
                Supported formats: RIS, BibTeX, PubMed XML, CSV
              </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Processing Status */}
            {isParsing && (
              <div className="text-center py-6">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Parsing files...</p>
              </div>
            )}

            {/* References Preview */}
            {parsedReferences.length > 0 && !isParsing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Found {parsedReferences.length} references
                  </h4>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-3 bg-gray-50">
                  {parsedReferences.slice(0, 5).map((ref, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium text-gray-900">{ref.title}</div>
                      <div className="text-gray-600">{ref.authors}</div>
                    </div>
                  ))}
                  {parsedReferences.length > 5 && (
                    <div className="text-sm text-gray-500">
                      + {parsedReferences.length - 5} more references...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Import Button */}
            {parsedReferences.length > 0 && !isProcessing && !isParsing && (
              <Button 
                onClick={processImport}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!projectName.trim()}
              >
                Import {parsedReferences.length} Reference{parsedReferences.length > 1 ? 's' : ''}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
