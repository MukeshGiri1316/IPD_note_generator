"use client";

import React, { useState, useEffect } from "react";
import SectionEditor from "./SectionEditor";
import { SECTION_LABELS } from "@/templates/registry";

interface NoteEditorFormProps {
  admissionId: string;
  initialContent: Record<string, string>;
  onSaveDraft: (content: Record<string, string>) => Promise<void>;
  onPreview: (content: Record<string, string>) => void;
  isSaving: boolean;
  onChangeContent?: (content: Record<string, string>) => void;
}

export default function NoteEditorForm({
  admissionId,
  initialContent,
  onSaveDraft,
  onPreview,
  isSaving,
  onChangeContent,
}: NoteEditorFormProps) {
  const [content, setContent] = useState<Record<string, string>>(initialContent || {});
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state whenever initialContent changes (e.g., when AI generation finishes)
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleFieldChange = (key: string, value: string) => {
    setContent((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };
      onChangeContent?.(next);
      return next;
    });
  };

  const handleRegenerateSection = async (sectionKey: string, label: string) => {
    try {
      setError(null);
      setRegeneratingKey(sectionKey);
      const res = await fetch("/api/generate-note/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admissionId,
          sectionKey,
          sectionLabel: label,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to regenerate section");
      }

      setContent((prev) => {
        const next = {
          ...prev,
          [sectionKey]: data.content,
        };
        onChangeContent?.(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error regenerating section");
    } finally {
      setRegeneratingKey(null);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      await onSaveDraft(content);
      setSuccessMessage("Draft saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    }
  };

  const sectionKeys = [
    "clinicalHistory",
    "examination",
    "investigationSummary",
    "hospitalCourse",
    "conditionAtDischarge",
    "dischargeAdvice",
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">
          {successMessage}
        </div>
      )}

      <div className="space-y-4">
        {sectionKeys.map((key) => (
          <SectionEditor
            key={key}
            sectionKey={key}
            label={SECTION_LABELS[key] || key}
            value={content[key] || ""}
            onChange={(val) => handleFieldChange(key, val)}
            onRegenerate={() =>
              handleRegenerateSection(key, SECTION_LABELS[key] || key)
            }
            isRegenerating={regeneratingKey === key}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onPreview(content)}
          className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded text-sm font-medium transition-colors"
        >
          👁 Live Preview
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "💾 Save Changes"}
        </button>
      </div>
    </div>
  );
}
