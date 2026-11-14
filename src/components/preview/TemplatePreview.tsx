"use client";

import React from "react";
import DischargeSummaryTemplate from "@/templates/discharge-summary/template";
import { TemplateProps } from "@/templates/registry";
import "@/styles/fonts.css";

interface TemplatePreviewProps {
  props: TemplateProps;
  onDownloadPdf?: () => void;
  isDownloadingPdf?: boolean;
}

export default function TemplatePreview({
  props,
  onDownloadPdf,
  isDownloadingPdf,
}: TemplatePreviewProps) {
  return (
    <div className="flex flex-col items-center">
      {onDownloadPdf && (
        <div className="w-full max-w-[210mm] flex justify-end mb-3">
          <button
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isDownloadingPdf ? "Generating PDF..." : "📥 Download Official PDF"}
          </button>
        </div>
      )}

      {/* A4 Container Preview */}
      <div className="border border-gray-300 shadow-md bg-white overflow-auto max-h-[85vh] w-full max-w-[215mm] p-2 rounded">
        <div className="mx-auto" style={{ width: "210mm" }}>
          <DischargeSummaryTemplate
            patientData={props.patientData}
            generatedContent={props.generatedContent}
          />
        </div>
      </div>
    </div>
  );
}
