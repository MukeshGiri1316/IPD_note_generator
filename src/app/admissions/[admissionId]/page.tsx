import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ admissionId: string }>;
}

export default async function AdmissionDetailPage({ params }: PageProps) {
  try {
    await requireSession();
  } catch {
    redirect("/login");
  }

  const { admissionId } = await params;

  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
    include: {
      patient: true,
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!admission) {
    notFound();
  }

  const p = admission.patient;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/patients" className="hover:text-blue-600">
              Patients
            </Link>
            <span>/</span>
            <Link href={`/patients/${p.id}`} className="hover:text-blue-600">
              {p.name}
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-800">{admission.ipdNumber}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/documents/create?admissionId=${admission.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              <span>✨</span> Generate Discharge Summary
            </Link>
          </div>
        </div>

        {/* Admission Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-gray-900 font-mono">
                  {admission.ipdNumber}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                    admission.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {admission.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Patient:{" "}
                <Link
                  href={`/patients/${p.id}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {p.name}
                </Link>{" "}
                ({p.age}y / {p.gender}) • Reg: {p.patientNumber}
              </p>
            </div>

            <div className="text-right text-xs text-gray-500 mt-3 sm:mt-0">
              <p>
                Admitted:{" "}
                <span className="font-semibold text-gray-800">
                  {new Date(admission.admissionDate).toLocaleDateString()}
                </span>
              </p>
              <p className="mt-0.5">
                Discharged:{" "}
                <span className="font-semibold text-gray-800">
                  {admission.dischargeDate
                    ? new Date(admission.dischargeDate).toLocaleDateString()
                    : "Still admitted"}
                </span>
              </p>
            </div>
          </div>

          {/* Clinical info grid */}
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Primary Diagnosis
              </span>
              <p className="text-gray-900 font-medium text-base mt-0.5">
                {admission.primaryDiagnosis}
              </p>
            </div>

            {admission.secondaryDiagnosis && (
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Secondary Diagnosis
                </span>
                <p className="text-gray-800 mt-0.5">{admission.secondaryDiagnosis}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              {admission.symptoms && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Presenting Symptoms
                  </span>
                  <p className="text-gray-700 mt-0.5">{admission.symptoms}</p>
                </div>
              )}

              {admission.clinicalHistory && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Clinical History
                  </span>
                  <p className="text-gray-700 mt-0.5">{admission.clinicalHistory}</p>
                </div>
              )}

              {admission.examinationFindings && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Examination Findings
                  </span>
                  <p className="text-gray-700 mt-0.5">{admission.examinationFindings}</p>
                </div>
              )}

              {admission.treatmentDetails && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Treatment Given
                  </span>
                  <p className="text-gray-700 mt-0.5">{admission.treatmentDetails}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Generated Documents List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">
              IPD Documents ({admission.documents.length})
            </h2>
            <Link
              href={`/documents/create?admissionId=${admission.id}`}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              + Generate new document
            </Link>
          </div>

          {admission.documents.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No clinical notes generated yet for this admission.{" "}
              <Link
                href={`/documents/create?admissionId=${admission.id}`}
                className="text-blue-600 underline font-medium"
              >
                Click here to generate one with AI
              </Link>
              .
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {admission.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        Discharge Summary
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          doc.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : doc.status === "REVIEWED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Created by {doc.createdBy.name} on{" "}
                      {new Date(doc.createdAt).toLocaleString()}
                      {doc.approvedBy && ` • Approved by Dr. ${doc.approvedBy.name}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium"
                    >
                      View / Edit →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
