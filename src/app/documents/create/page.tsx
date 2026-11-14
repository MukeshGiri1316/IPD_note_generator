"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import NoteEditorForm from "@/components/editor/NoteEditorForm";
import TemplatePreview from "@/components/preview/TemplatePreview";
import { TemplateProps } from "@/templates/registry";

interface AdmissionDetail {
  id: string;
  ipdNumber: string;
  admissionDate: string;
  dischargeDate?: string | null;
  primaryDiagnosis: string;
  secondaryDiagnosis?: string | null;
  clinicalHistory?: string | null;
  symptoms?: string | null;
  examinationFindings?: string | null;
  treatmentDetails?: string | null;
  patient: {
    id: string;
    name: string;
    patientNumber: string;
    age: number;
    gender: string;
  };
}

function CreateDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAdmissionId = searchParams.get("admissionId") || "";

  const [admissions, setAdmissions] = useState<AdmissionDetail[]>([]);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState(initialAdmissionId);
  const [admission, setAdmission] = useState<AdmissionDetail | null>(null);

  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Content state for the note
  const [aiContent, setAiContent] = useState<Record<string, string>>({
    clinicalHistory: "",
    examination: "",
    investigationSummary: "",
    hospitalCourse: "",
    conditionAtDischarge: "",
    dischargeAdvice: "",
  });

  const [hasGenerated, setHasGenerated] = useState(false);

  // Load recent admissions for selection
  useEffect(() => {
    fetch("/api/patients?limit=50")
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (data?.patients) {
          const admList: AdmissionDetail[] = [];
          for (const p of data.patients) {
            if (p.admissions) {
              for (const adm of p.admissions) {
                admList.push({
                  ...adm,
                  patient: {
                    id: p.id,
                    name: p.name,
                    patientNumber: p.patientNumber,
                    age: p.age,
                    gender: p.gender,
                  },
                });
              }
            }
          }
          setAdmissions(admList);
        }
      });
  }, []);

  // Fetch complete admission details when selected
  useEffect(() => {
    if (selectedAdmissionId) {
      fetch(`/api/admissions/${selectedAdmissionId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.admission) {
            setAdmission(data.admission);
            // Pre-fill initial clinical history / exam from admission if available
            setAiContent((prev) => ({
              ...prev,
              clinicalHistory: prev.clinicalHistory || data.admission.clinicalHistory || "",
              examination: prev.examination || data.admission.examinationFindings || "",
            }));
          }
        });
    }
  }, [selectedAdmissionId]);

  // Generate full note using AI
  const handleGenerateNote = async () => {
    if (!selectedAdmissionId) return;

    try {
      setIsGenerating(true);
      setGenerationError(null);

      const res = await fetch("/api/generate-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admissionId: selectedAdmissionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate note");
      }

      setAiContent(data.content);
      setHasGenerated(true);
      setSuccessBanner(
        "✨ Discharge summary generated successfully! Review the populated sections below, edit any section, or click 'Live Preview'."
      );
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : "Error during AI note generation"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Save document draft
  const handleSaveDraft = async (updatedContent: Record<string, string>) => {
    if (!admission) throw new Error("No admission selected");

    setIsSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admissionId: admission.id,
          templateSlug: "discharge-summary",
          generatedContent: aiContent,
          finalContent: updatedContent,
          status: "DRAFT",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save draft");
      }

      router.push(`/documents/${data.document.id}`);
    } finally {
      setIsSaving(false);
    }
  };

  const templateProps: TemplateProps | null = admission
    ? {
        patientData: {
          name: admission.patient.name,
          age: admission.patient.age,
          gender: admission.patient.gender,
          patientNumber: admission.patient.patientNumber,
          ipdNumber: admission.ipdNumber,
          admissionDate: new Date(admission.admissionDate).toISOString().split("T")[0],
          dischargeDate: admission.dischargeDate
            ? new Date(admission.dischargeDate).toISOString().split("T")[0]
            : undefined,
          primaryDiagnosis: admission.primaryDiagnosis,
          secondaryDiagnosis: admission.secondaryDiagnosis || undefined,
        },
        generatedContent: aiContent,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Generate IPD Clinical Note
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Select admission → Generate AI draft → Review & Edit → Preview & Save
            </p>
          </div>

          <Link
            href="/documents"
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5"
          >
            ← Back to Documents
          </Link>
        </div>

        {/* Step 1: Select Admission & Template */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                1. Select IPD Admission *
              </label>
              <select
                value={selectedAdmissionId}
                onChange={(e) => setSelectedAdmissionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- Choose IPD Admission --</option>
                {admissions.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.ipdNumber} — {adm.patient.name} ({adm.primaryDiagnosis})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                2. Note Template *
              </label>
              <select
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-700"
              >
                <option>Discharge Summary (Standard Inpatient Template v1.0)</option>
              </select>
            </div>
          </div>

          {/* Admission summary card */}
          {admission && (
            <div className="mt-4 pt-4 border-t border-gray-100 bg-blue-50/40 p-4 rounded-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {admission.patient.name}
                  </span>{" "}
                  <span className="text-xs text-gray-600">
                    ({admission.patient.age}y / {admission.patient.gender} • Reg:{" "}
                    {admission.patient.patientNumber})
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-blue-700">
                  IPD: {admission.ipdNumber}
                </span>
              </div>
              <p className="text-xs text-gray-700">
                <span className="font-semibold">Primary Diagnosis:</span>{" "}
                {admission.primaryDiagnosis}
              </p>
              {admission.treatmentDetails && (
                <p className="text-xs text-gray-600 mt-1 truncate">
                  <span className="font-semibold">Treatment recorded:</span>{" "}
                  {admission.treatmentDetails}
                </p>
              )}

              {/* Generate button */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateNote}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin">⏳</span> Generating Note with AI...
                    </>
                  ) : (
                    <>
                      <span>✨</span>{" "}
                      {hasGenerated ? "Regenerate Full Note" : "Generate Draft with AI"}
                    </>
                  )}
                </button>
                <span className="text-xs text-gray-500">
                  Synthesizes patient diagnosis, symptoms, and treatment into structured clinical sections.
                </span>
              </div>
            </div>
          )}
        </div>

        {generationError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            ❌ {generationError}
          </div>
        )}

        {successBanner && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-800 text-sm rounded-lg flex items-center justify-between shadow-xs">
            <span>{successBanner}</span>
            <button
              onClick={() => setActiveTab("preview")}
              className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
            >
              View Document Preview →
            </button>
          </div>
        )}

        {/* Step 2: Editor and Preview Tabs */}
        {admission && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("editor")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "editor"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                ✏️ Edit Sections ({Object.keys(aiContent).length} fields)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "preview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                📄 A4 Document Preview
              </button>
            </div>

            <div className="p-6">
              {activeTab === "editor" ? (
                <NoteEditorForm
                  key={hasGenerated ? "has-gen" : "initial"}
                  admissionId={admission.id}
                  initialContent={aiContent}
                  onChangeContent={(updated) => setAiContent(updated)}
                  onSaveDraft={handleSaveDraft}
                  onPreview={(updated) => {
                    setAiContent(updated);
                    setActiveTab("preview");
                  }}
                  isSaving={isSaving}
                />
              ) : (
                templateProps && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Rendered with the Kalam handwriting font for clinical sections and fixed hospital layout.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab("editor")}
                        className="px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        ← Back to Editing
                      </button>
                    </div>

                    <TemplatePreview props={templateProps} />

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveDraft(aiContent)}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "💾 Save and Finalize Draft"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CreateDocumentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading document generator...</div>}>
      <CreateDocumentContent />
    </Suspense>
  );
}
