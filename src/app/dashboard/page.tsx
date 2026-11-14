import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect("/login");
  }

  // Fetch summary counts
  const [patientCount, activeAdmissionCount, documentCount] = await Promise.all([
    prisma.patient.count(),
    prisma.admission.count({ where: { status: "ACTIVE" } }),
    prisma.document.count(),
  ]);

  const recentAdmissions = await prisma.admission.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      patient: true,
      documents: {
        select: { id: true, status: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Role: <span className="font-semibold text-blue-600">{session.role}</span> | Inpatient Clinical Documentation Portal
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Patients
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{patientCount}</p>
              </div>
              <span className="text-3xl">👥</span>
            </div>
            <div className="mt-4">
              <Link
                href="/patients"
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                View all patients →
              </Link>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active IPD Admissions
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {activeAdmissionCount}
                </p>
              </div>
              <span className="text-3xl">🛏️</span>
            </div>
            <div className="mt-4">
              <Link
                href="/patients"
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Manage admissions →
              </Link>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated Documents
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {documentCount}
                </p>
              </div>
              <span className="text-3xl">📋</span>
            </div>
            <div className="mt-4">
              <Link
                href="/documents"
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                View clinical notes →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/patients/new"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <span className="text-2xl mr-3">➕</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Add New Patient</p>
                <p className="text-xs text-gray-500">Register demographic info</p>
              </div>
            </Link>

            <Link
              href="/documents/create"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <span className="text-2xl mr-3">✨</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Generate IPD Note</p>
                <p className="text-xs text-gray-500">AI-assisted Discharge Summary</p>
              </div>
            </Link>

            <Link
              href="/"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <span className="text-2xl mr-3">🧪</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Lab Report Batch</p>
                <p className="text-xs text-gray-500">Excel upload & ZIP generator</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Admissions Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900">
              Recent IPD Admissions
            </h2>
            <Link
              href="/patients"
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>

          {recentAdmissions.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No admissions recorded yet.{" "}
              <Link href="/patients/new" className="text-blue-600 underline">
                Add a patient first
              </Link>
              .
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">IPD Number</th>
                    <th className="px-6 py-3 text-left">Patient</th>
                    <th className="px-6 py-3 text-left">Diagnosis</th>
                    <th className="px-6 py-3 text-left">Admission Date</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {recentAdmissions.map((adm) => (
                    <tr key={adm.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono font-medium text-blue-600">
                        {adm.ipdNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{adm.patient.name}</div>
                        <div className="text-xs text-gray-500">
                          {adm.patient.patientNumber} ({adm.patient.age}y / {adm.patient.gender})
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{adm.primaryDiagnosis}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(adm.admissionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            adm.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {adm.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/admissions/${adm.id}`}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/documents/create?admissionId=${adm.id}`}
                          className="inline-block px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium"
                        >
                          + Note
                        </Link>
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
