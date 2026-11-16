"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import NoteEditorForm from "@/components/editor/NoteEditorForm";
import TemplatePreview from "@/components/preview/TemplatePreview";
import { TemplateProps } from "@/templates/registry";

interface DocumentDetail {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  templateVersion: number;
  template?: {
    id: string;
    name: string;
    slug: string;
  };
  noteType: string;
  generatedContent: Record<string, string>;
  finalContent: Record<string, string>;
  admission: {
    id: string;
    ipdNumber: string;
    admissionDate: string;
    dischargeDate?: string | null;
    primaryDiagnosis: string;
    secondaryDiagnosis?: string | null;
    patient: {
      id: string;
      name: string;
      patientNumber: string;
      age: number;
      gender: string;
    };
  };
  createdBy: { name: string; email: string };
  approvedBy?: { name: string; email: string } | null;
  approvedAt?: string | null;
  versions: {
    id: string;
    versionNumber: number;
    createdAt: string;
    changeDescription?: string | null;
    modifiedBy: { name: string };
    content: Record<string, string>;
  }[];
}

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { documentId } = use(params);

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "editor" | "versions">("preview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Fetch document details
  const fetchDoc = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) throw new Error("Document not found");
      const data = await res.json();
      setDoc(data.document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading document");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  // Fetch current user info
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      });
    fetchDoc();
  }, [fetchDoc]);

  // Save changes & create new version
  const handleSaveDraft = async (updatedContent: Record<string, string>) => {
    if (!doc) return;
    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalContent: updatedContent,
          changeDescription: `Edited by ${currentUser?.name || "clinician"}`,
          status: "REVIEWED",
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update document");
      }

      await fetchDoc();
      setActiveTab("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving document");
    } finally {
      setIsSaving(false);
    }
  };

  // Clinician approval workflow
  const handleApprove = async () => {
    if (!doc) return;
    if (!confirm("Are you sure you want to approve this clinical document? Approved documents cannot be further edited.")) {
      return;
    }

    try {
      setIsApproving(true);
      setError(null);

      const res = await fetch(`/api/documents/${doc.id}/approve`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to approve document");
      }

      await fetchDoc();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error approving document");
    } finally {
      setIsApproving(false);
    }
  };

  // Official PDF download via Playwright API
  const handleDownloadPdf = async () => {
    if (!doc) return;
    try {
      setIsDownloadingPdf(true);
      const res = await fetch("/api/generate-pdf/ipd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const isDoctorAssessment =
        doc.template?.slug === "doctor-initial-assessment" ||
        doc.noteType === "DOCTOR_INITIAL_ASSESSMENT";
      const prefix = isDoctorAssessment ? "Doctor_Initial_Assessment" : "Discharge_Summary";

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${prefix}_${doc.admission.ipdNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error generating PDF");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="p-12 text-center text-sm text-gray-500">
          Loading document...
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="p-12 text-center text-sm text-red-600">
          {error || "Document not found."}
        </div>
      </div>
    );
  }

  const p = doc.admission.patient;
  const isApproved = doc.status === "APPROVED";
  const canApprove =
    !isApproved &&
    (currentUser?.role === "DOCTOR" || currentUser?.role === "ADMIN");

  const templateSlug = doc.template?.slug || (doc.noteType === "DOCTOR_INITIAL_ASSESSMENT" ? "doctor-initial-assessment" : "discharge-summary");
  const docTitle = doc.template?.name || (templateSlug === "doctor-initial-assessment" ? "Doctor Initial Assessment" : "Discharge Summary");

  const templateProps: TemplateProps = {
    patientData: {
      name: p.name,
      age: p.age,
      gender: p.gender,
      patientNumber: p.patientNumber,
      ipdNumber: doc.admission.ipdNumber,
      admissionDate: new Date(doc.admission.admissionDate).toISOString().split("T")[0],
      dischargeDate: doc.admission.dischargeDate
        ? new Date(doc.admission.dischargeDate).toISOString().split("T")[0]
        : undefined,
      primaryDiagnosis: doc.admission.primaryDiagnosis,
      secondaryDiagnosis: doc.admission.secondaryDiagnosis || undefined,
    },
    generatedContent: (doc.finalContent as Record<string, string>) || {},
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/documents" className="hover:text-blue-600">
              Documents
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-800">
              {docTitle} ({doc.admission.ipdNumber})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              {isDownloadingPdf ? "Generating PDF..." : "📥 Download PDF"}
            </button>

            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {isApproving ? "Approving..." : "✅ Approve Document"}
              </button>
            )}
          </div>
        </div>

        {/* Status Header Banner */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900">
                  {docTitle}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                    doc.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : doc.status === "REVIEWED"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {doc.status}
                </span>
                <span className="text-xs text-gray-500">
                  v{doc.versions.length}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Patient: <span className="font-semibold">{p.name}</span> ({p.patientNumber}) • IPD:{" "}
                <span className="font-mono font-semibold">{doc.admission.ipdNumber}</span>
              </p>
            </div>

            <div className="text-right text-xs text-gray-500">
              <p>
                Author: <span className="font-medium text-gray-800">{doc.createdBy.name}</span>
              </p>
              {doc.approvedBy && (
                <p className="mt-0.5 text-green-700 font-medium">
                  Approved by Dr. {doc.approvedBy.name} on{" "}
                  {new Date(doc.approvedAt!).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Preview / Edit / Version History */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("preview")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "preview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📄 Document Preview
            </button>

            {!isApproved && (
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "editor"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                ✏️ Edit Content
              </button>
            )}

            <button
              onClick={() => setActiveTab("versions")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "versions"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🕒 Revisions ({doc.versions.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === "preview" && (
              <TemplatePreview
                props={templateProps}
                templateSlug={templateSlug}
                onDownloadPdf={handleDownloadPdf}
                isDownloadingPdf={isDownloadingPdf}
              />
            )}

            {activeTab === "editor" && !isApproved && (
              <NoteEditorForm
                admissionId={doc.admission.id}
                templateSlug={templateSlug}
                initialContent={(doc.finalContent as Record<string, string>) || {}}
                onChangeContent={(updated) => {
                  setDoc((prev) =>
                    prev ? { ...prev, finalContent: updated } : null
                  );
                }}
                onSaveDraft={handleSaveDraft}
                onPreview={(updated) => {
                  setDoc((prev) =>
                    prev ? { ...prev, finalContent: updated } : null
                  );
                  setActiveTab("preview");
                }}
                isSaving={isSaving}
              />
            )}

            {activeTab === "versions" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Document Revision History
                </h3>
                <div className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                  {doc.versions.map((ver) => (
                    <div key={ver.id} className="p-4 flex justify-between items-center text-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            Version {ver.versionNumber}
                          </span>
                          {ver.versionNumber === doc.versions[0]?.versionNumber && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {ver.changeDescription || "Updated clinical content"} • by{" "}
                          {ver.modifiedBy.name} on{" "}
                          {new Date(ver.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setDoc((prev) =>
                            prev ? { ...prev, finalContent: ver.content } : null
                          );
                          setActiveTab("preview");
                        }}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Inspect Version →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
