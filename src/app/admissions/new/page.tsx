"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdmissionCreateSchema, AdmissionCreateInput } from "@/lib/validation/admission";

function NewAdmissionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get("patientId") || "";

  const [patient, setPatient] = useState<{ id: string; name: string; patientNumber: string } | null>(null);
  const [allPatients, setAllPatients] = useState<{ id: string; name: string; patientNumber: string }[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AdmissionCreateInput>({
    resolver: zodResolver(AdmissionCreateSchema),
    defaultValues: {
      patientId: initialPatientId,
      admissionDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedPatientId = watch("patientId");

  // Load patients list for dropdown
  useEffect(() => {
    fetch("/api/patients?limit=100")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.patients) {
          setAllPatients(data.patients);
        }
      });
  }, []);

  // Update selected patient info
  useEffect(() => {
    if (selectedPatientId) {
      const p = allPatients.find((item) => item.id === selectedPatientId);
      if (p) setPatient(p);
      else {
        fetch(`/api/patients/${selectedPatientId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.patient) setPatient(data.patient);
          });
      }
    }
  }, [selectedPatientId, allPatients]);

  const onSubmit = async (data: AdmissionCreateInput) => {
    try {
      setServerError(null);
      setLoading(true);

      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create admission");
      }

      router.push(`/admissions/${json.admission.id}`);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error creating admission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New IPD Admission</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create an Inpatient admission record and enter clinical history
            </p>
          </div>
          <Link
            href={patient ? `/patients/${patient.id}` : "/patients"}
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5"
          >
            ← Back
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                {serverError}
              </div>
            )}

            {/* Patient Selector */}
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <label className="block text-sm font-semibold text-gray-800 mb-1">
                Select Patient *
              </label>
              <select
                {...register("patientId")}
                onChange={(e) => setValue("patientId", e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- Choose a patient --</option>
                {allPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patientNumber})
                  </option>
                ))}
              </select>
              {errors.patientId && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.patientId.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  IPD Number *
                </label>
                <input
                  type="text"
                  {...register("ipdNumber")}
                  placeholder="e.g. IPD-2025-101"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.ipdNumber && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.ipdNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Admission Date *
                </label>
                <input
                  type="date"
                  {...register("admissionDate")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.admissionDate && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.admissionDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discharge Date (Optional)
                </label>
                <input
                  type="date"
                  {...register("dischargeDate")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Diagnosis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Primary Diagnosis *
                </label>
                <input
                  type="text"
                  {...register("primaryDiagnosis")}
                  placeholder="e.g. Acute Gastroenteritis with Moderate Dehydration"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.primaryDiagnosis && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.primaryDiagnosis.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Secondary Diagnosis (Optional)
                </label>
                <input
                  type="text"
                  {...register("secondaryDiagnosis")}
                  placeholder="e.g. Type 2 Diabetes Mellitus"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Clinical Details */}
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Clinical Information (Used by AI for note generation)
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Presenting Symptoms
                </label>
                <textarea
                  rows={2}
                  {...register("symptoms")}
                  placeholder="e.g. Loose stools x 2 days, vomiting x 1 day, low grade fever..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Clinical History & Comorbidities
                </label>
                <textarea
                  rows={2}
                  {...register("clinicalHistory")}
                  placeholder="e.g. Known hypertensive on medication, no known drug allergies..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Physical Examination Findings
                </label>
                <textarea
                  rows={2}
                  {...register("examinationFindings")}
                  placeholder="e.g. BP 110/70, PR 88/min, mild epigastric tenderness, chest clear..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Treatment Provided
                </label>
                <textarea
                  rows={2}
                  {...register("treatmentDetails")}
                  placeholder="e.g. IV Fluids (RL/DNS), IV Ondansetron, IV Pantoprazole, Oral probiotics..."
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? "Admitting..." : "Admit Patient"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function NewAdmissionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading admission form...</div>}>
      <NewAdmissionContent />
    </Suspense>
  );
}
