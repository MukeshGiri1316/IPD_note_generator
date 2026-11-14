import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ patientId: string }>;
}

export default async function PatientDetailPage({ params }: PageProps) {
  try {
    await requireSession();
  } catch {
    redirect("/login");
  }

  const { patientId } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      admissions: {
        orderBy: { admissionDate: "desc" },
        include: {
          documents: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              status: true,
              noteType: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

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
            <span className="font-semibold text-gray-800">{patient.name}</span>
          </div>

          <Link
            href={`/admissions/new?patientId=${patient.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
          >
            <span>➕</span> New Admission
          </Link>
        </div>

        {/* Patient Demographic Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-xs font-mono text-gray-500 mt-0.5">
                Reg: {patient.patientNumber}
              </p>
            </div>
            <div className="mt-2 sm:mt-0">
              <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-800 rounded text-xs font-semibold">
                {patient.age} Years • {patient.gender}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs font-medium text-gray-400 block">Phone</span>
              <span className="text-gray-800">{patient.phone || "Not recorded"}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 block">Date of Birth</span>
              <span className="text-gray-800">
                {patient.dateOfBirth
                  ? new Date(patient.dateOfBirth).toLocaleDateString()
                  : "Not recorded"}
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 block">Address</span>
              <span className="text-gray-800">{patient.address || "Not recorded"}</span>
            </div>
          </div>
        </div>

        {/* Admissions History */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-base font-semibold text-gray-900">
              IPD Admission History ({patient.admissions.length})
            </h2>
            <Link
              href={`/admissions/new?patientId=${patient.id}`}
              className="text-xs font-medium text-green-700 hover:text-green-900"
            >
              + Create admission
            </Link>
          </div>

          {patient.admissions.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No IPD admissions recorded for this patient yet.{" "}
              <Link
                href={`/admissions/new?patientId=${patient.id}`}
                className="text-blue-600 underline font-medium"
              >
                Create the first admission
              </Link>
              .
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {patient.admissions.map((adm) => (
                <div key={adm.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-700">
                        {adm.ipdNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          adm.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {adm.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/documents/create?admissionId=${adm.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                      >
                        <span>✨</span> Generate Note
                      </Link>
                      <Link
                        href={`/admissions/${adm.id}`}
                        className="px-3 py-1 border border-gray-300 hover:bg-gray-100 rounded text-xs font-medium text-gray-700"
                      >
                        Admission Details →
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-600 mb-4">
                    <div>
                      <span className="font-semibold text-gray-500 block">Admitted</span>
                      <span>{new Date(adm.admissionDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-500 block">Discharged</span>
                      <span>
                        {adm.dischargeDate
                          ? new Date(adm.dischargeDate).toLocaleDateString()
                          : "Still admitted"}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-semibold text-gray-500 block">
                        Primary Diagnosis
                      </span>
                      <span className="text-gray-900 font-medium">
                        {adm.primaryDiagnosis}
                      </span>
                    </div>
                  </div>

                  {/* Documents generated for this admission */}
                  {adm.documents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs font-semibold text-gray-500 block mb-2">
                        Clinical Documents ({adm.documents.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {adm.documents.map((doc) => (
                          <Link
                            key={doc.id}
                            href={`/documents/${doc.id}`}
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-gray-200 bg-white hover:border-blue-300 text-xs"
                          >
                            <span>📄</span>
                            <span className="font-medium text-gray-800">
                              Discharge Summary
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                doc.status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
