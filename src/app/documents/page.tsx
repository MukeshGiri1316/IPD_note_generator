"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface DocumentListItem {
  id: string;
  noteType: string;
  status: string;
  createdAt: string;
  template: { name: string };
  admission: {
    ipdNumber: string;
    patient: {
      name: string;
      patientNumber: string;
    };
  };
  createdBy: { name: string };
  approvedBy: { name: string } | null;
}

export default function DocumentsListPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/documents?status=${statusFilter}`
        : "/api/documents";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDownloadPdf = async (docId: string, ipdNumber: string) => {
    try {
      setDownloadingId(docId);
      const res = await fetch("/api/generate-pdf/ipd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Discharge_Summary_${ipdNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error downloading PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IPD Clinical Documents</h1>
            <p className="text-sm text-gray-500 mt-1">
              Generated discharge summaries, progress notes, and clinical document drafts
            </p>
          </div>

          <Link
            href="/documents/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            <span>✨</span> Generate New Note
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-600 uppercase">Status:</span>
            {["", "DRAFT", "GENERATED", "REVIEWED", "APPROVED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {s || "All"}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-500">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-sm mb-3">No documents found.</p>
              <Link
                href="/documents/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              >
                Create your first IPD note
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">Document Type</th>
                    <th className="px-6 py-3 text-left">IPD / Patient</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Created By</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {doc.template?.name || "Discharge Summary"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs font-semibold text-blue-600">
                          {doc.admission.ipdNumber}
                        </div>
                        <div className="text-sm text-gray-800">
                          {doc.admission.patient.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                            doc.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : doc.status === "REVIEWED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {doc.status}
                        </span>
                        {doc.approvedBy && (
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            by Dr. {doc.approvedBy.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {doc.createdBy.name}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Open & Edit
                        </Link>
                        <button
                          onClick={() => handleDownloadPdf(doc.id, doc.admission.ipdNumber)}
                          disabled={downloadingId === doc.id}
                          className="inline-block px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium disabled:opacity-50"
                        >
                          {downloadingId === doc.id ? "PDF..." : "📥 PDF"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
