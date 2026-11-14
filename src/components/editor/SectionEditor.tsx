"use client";

import React, { useState } from "react";

interface SectionEditorProps {
  sectionKey: string;
  label: string;
  value: string;
  onChange: (newValue: string) => void;
  onRegenerate: () => Promise<void>;
  isRegenerating: boolean;
  rows?: number;
}

export default function SectionEditor({
  sectionKey,
  label,
  value,
  onChange,
  onRegenerate,
  isRegenerating,
  rows = 4,
}: SectionEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-blue-100 rounded-lg p-4 bg-white shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={sectionKey}
          className="text-sm font-semibold text-gray-800 flex items-center gap-2"
        >
          <span>{label}</span>
          <span className="text-xs font-normal text-gray-400">
            ({value?.trim()?.length || 0} chars)
          </span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 disabled:opacity-50 transition-colors"
          >
            {isRegenerating ? (
              <>
                <span className="animate-spin text-[10px]">⏳</span> Regenerating...
              </>
            ) : (
              <>
                <span>🔄</span> Regenerate Section
              </>
            )}
          </button>
        </div>
      </div>
      <textarea
        id={sectionKey}
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter or generate ${label.toLowerCase()}...`}
        style={{ color: "#084298" }}
        className="w-full text-sm font-sans font-medium bg-blue-50/20 border border-blue-200 rounded p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
      />
    </div>
  );
}
