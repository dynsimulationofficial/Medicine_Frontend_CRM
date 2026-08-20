"use client";

import Image from "next/image";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import AxiosProvider from "../../provider/AxiosProvider";
import { useEffect, useState } from "react";
import StorageManager from "../../provider/StorageManager";
import React from "react";
import { useRouter } from "next/navigation";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";

export default function AgentDashboardPage() {
  const isChecking = useAuthRedirect();
  const router = useRouter();
  const storage = new StorageManager();
  const userRole = storage.getUserRole();

  const [assignedLeads, setAssignedLeads] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Role Protection: Redirect Admin to /dashboard-admin
  useEffect(() => {
    if (!isChecking && userRole === "Admin") {
      router.replace("/dashboard-admin");
    }
  }, [isChecking, userRole, router]);

  const fetchAgentDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch Assigned Leads for logged in agent
      const res = await AxiosProvider.get(
        `/leads/assigned?page=${page}&limit=10`,
      );
      if (res.data?.data) {
        setAssignedLeads(Array.isArray(res.data.data) ? res.data.data : []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalLeads(res.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Error fetching agent dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "Agent") {
      fetchAgentDashboardData();
    }
  }, [page, userRole]);

  if (isChecking || (isLoading && assignedLeads.length === 0)) {
    return (
      <div className="h-screen flex justify-center items-center bg-black">
        <Image
          src="/images/crmlogo.png"
          alt="Loading"
          width={150}
          height={150}
          className="animate-pulse rounded-full"
        />
      </div>
    );
  }

  // Calculate quick stats from assigned leads
  const newLeadsCount = assignedLeads.filter(
    (l) => l.lead_status === "New",
  ).length;
  const inProgressCount = assignedLeads.filter(
    (l) => l.lead_status === "In Progress" || l.lead_status === "Follow-up",
  ).length;
  const convertedCount = assignedLeads.filter(
    (l) => l.lead_status === "Converted",
  ).length;

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <div className="ml-[97px] w-full md:w-[90%] m-auto min-h-[500px] rounded p-4 mt-0">
        <DesktopHeader />

        <div className="rounded-3xl shadow-lastTransaction p-6 relative min-h-[600px] z-10 w-full mainContainerBg mt-4">
          {/* Header Title */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Agent Workstation 🎧
              </h1>
              <p className="text-sm text-gray-400">
                My Assigned Leads & Daily Calling Tasks
              </p>
            </div>
          </div>

          {/* Agent Personal Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium uppercase">
                Total Assigned
              </p>
              <h3 className="text-3xl font-bold text-white mt-2">
                {totalLeads}
              </h3>
              <span className="text-xs text-blue-400 mt-1 inline-block">
                Active Leads Assigned
              </span>
            </div>

            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium uppercase">
                New Leads
              </p>
              <h3 className="text-3xl font-bold text-cyan-400 mt-2">
                {newLeadsCount}
              </h3>
              <span className="text-xs text-cyan-400 mt-1 inline-block">
                Needs Initial Call
              </span>
            </div>

            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium uppercase">
                In Progress / Follow-up
              </p>
              <h3 className="text-3xl font-bold text-yellow-400 mt-2">
                {inProgressCount}
              </h3>
              <span className="text-xs text-yellow-400 mt-1 inline-block">
                Active Call Pipeline
              </span>
            </div>

            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium uppercase">
                Converted Deals
              </p>
              <h3 className="text-3xl font-bold text-green-400 mt-2">
                {convertedCount}
              </h3>
              <span className="text-xs text-green-400 mt-1 inline-block">
                Successful Orders
              </span>
            </div>
          </div>

          {/* Assigned Leads Table */}
          <h2 className="text-lg font-semibold text-white mb-4">
            My Assigned Lead Queue
          </h2>
          <div className="relative overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-[#1e1e1e] border-b border-gray-800">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Lead Status</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {assignedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      No leads assigned to you yet.
                    </td>
                  </tr>
                ) : (
                  assignedLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-800 bg-[#151515] hover:bg-[#1f1f1f]"
                    >
                      <td className="p-4 font-medium text-white">
                        <p className="font-semibold text-white">
                          {lead.full_name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {lead.medicine_name || "No medicine specified"}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-xs space-y-1">
                          <span className="flex items-center gap-1.5 text-gray-300">
                            <FaPhoneAlt className="text-primary-500 w-3 h-3" />{" "}
                            {lead.phone}
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-400">
                            <FaEnvelope className="text-gray-500 w-3 h-3" />{" "}
                            {lead.email}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-900/50 text-blue-400 border border-blue-800">
                          {lead.lead_status || "New"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-yellow-900/50 text-yellow-400 border border-yellow-800">
                          {lead.payment_status || "Pending"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-purple-900/50 text-purple-400 border border-purple-800">
                          {lead.delivery_status || "Pending"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() =>
                            router.push(`/leadsdetails?id=${lead.id}`)
                          }
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center my-8 gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 border rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
              >
                <HiChevronDoubleLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 border rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
              >
                <HiChevronDoubleRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
