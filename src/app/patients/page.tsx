"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface PatientItem {
  id: string;
  patientNumber: string;
  name: string;
  age: number;
  gender: string;
  phone: string | null;
  admissions: {
    id: string;
    ipdNumber: string;
    status: string;
    admissionDate: string;
    primaryDiagnosis: string;
  }[];
  _count: {
    admissions: number;
  };
  createdAt: string;
}

export default function PatientsListPage() {
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patients?q=${encodeURIComponent(query)}&page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patients & Admissions</h1>
            <p className="text-sm text-gray-500 mt-1">
              Search hospital records, register new patients, or create IPD admissions
            </p>
          </div>

          <Link
            href="/patients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
          >
            <span>➕</span> Add New Patient
          </Link>
        </div>

        {/* Search input */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6 shadow-xs">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Patient Name, Reg. Number, or IPD Number..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-sm mb-3">No patients found matching your search.</p>
              <Link
                href="/patients/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
              >
                Register a new patient
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">Reg. No</th>
                    <th className="px-6 py-3 text-left">Patient Name</th>
                    <th className="px-6 py-3 text-left">Age / Gender</th>
                    <th className="px-6 py-3 text-left">Phone</th>
                    <th className="px-6 py-3 text-left">Latest IPD Status</th>
                    <th className="px-6 py-3 text-center">Admissions</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {patients.map((p) => {
                    const latestAdm = p.admissions?.[0];
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-mono font-medium text-gray-900">
                          {p.patientNumber}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/patients/${p.id}`}
                            className="font-semibold text-blue-600 hover:text-blue-800"
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {p.age} yrs / {p.gender}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {p.phone || "—"}
                        </td>
                        <td className="px-6 py-4">
                          {latestAdm ? (
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                  latestAdm.status === "ACTIVE"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {latestAdm.status} ({latestAdm.ipdNumber})
                              </span>
                              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                                {latestAdm.primaryDiagnosis}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No admissions</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-gray-700">
                          {p._count.admissions}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Link
                            href={`/patients/${p.id}`}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admissions/new?patientId=${p.id}`}
                            className="inline-block px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium"
                          >
                            + Admit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-gray-300 rounded text-xs font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
