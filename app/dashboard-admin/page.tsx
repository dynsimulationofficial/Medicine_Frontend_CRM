"use client";

import Image from "next/image";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import AxiosProvider from "../../provider/AxiosProvider";
import { useEffect, useState } from "react";
import StorageManager from "../../provider/StorageManager";
import React from "react";
import CreateLead from "../leads/CreateLead";
import { IoCloseOutline } from "react-icons/io5";
import { ImUserTie } from "react-icons/im";
import { RxAvatar } from "react-icons/rx";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const isChecking = useAuthRedirect();
  const router = useRouter();
  const storage = new StorageManager();
  const userRole = storage.getUserRole();

  const [agentStats, setAgentStats] = useState<any[]>([]);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [unassignedLeads, setUnassignedLeads] = useState<number>(0);
  const [assignedLeads, setAssignedLeads] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isCreateLead, setIsCreateLead] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Role Protection: Redirect Agent to /dashboard-agent
  useEffect(() => {
    if (!isChecking && userRole === "Agent") {
      router.replace("/dashboard-agent");
    }
  }, [isChecking, userRole, router]);

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      // Fetch Agents Overview / Stats
      const statsRes = await AxiosProvider.get("/agents/stats");
      if (statsRes.data?.data) {
        setAgentStats(Array.isArray(statsRes.data.data) ? statsRes.data.data : []);
      }

      // Fetch Total Leads Count
      const leadsRes = await AxiosProvider.get(`/leads?page=${page}&limit=10`);
      if (leadsRes.data?.pagination) {
        setTotalLeads(leadsRes.data.pagination.total || 0);
        setTotalPages(leadsRes.data.pagination.totalPages || 1);
      }

      // Fetch Unassigned Leads Count
      const unassignedRes = await AxiosProvider.get("/leads/unassigned?page=1&limit=10");
      if (unassignedRes.data?.pagination) {
        setUnassignedLeads(unassignedRes.data.pagination.total || 0);
      }

      // Fetch Assigned Leads Count
      const assignedRes = await AxiosProvider.get("/leads/assigned?page=1&limit=10");
      if (assignedRes.data?.pagination) {
        setAssignedLeads(assignedRes.data.pagination.total || 0);
      }
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "Admin") {
      fetchAdminStats();
    }
  }, [page, userRole]);

  const closeFlyOut = () => {
    setIsCreateLead(false);
    fetchAdminStats();
  };

  if (isChecking || (isLoading && agentStats.length === 0)) {
    return (
      <div className="h-screen flex justify-center items-center bg-black">
        <Image
          src="/images/crmlogo.jpg"
          alt="Loading"
          width={150}
          height={150}
          className="animate-pulse rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex justify-end min-h-screen">
      <LeftSideBar />
      <div className="ml-[97px] w-full md:w-[90%] m-auto min-h-[500px] rounded p-4 mt-0">
        <DesktopHeader />

        <div className="rounded-3xl shadow-lastTransaction p-6 relative min-h-[600px] z-10 w-full mainContainerBg mt-4">
            
            {/* Header Title & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard 👑</h1>
                <p className="text-sm text-gray-400">System Overview & Agent Team Management</p>
              </div>
            </div>

            {/* Overview Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                <p className="text-sm text-gray-400 font-medium">Total System Leads</p>
                <h3 className="text-3xl font-bold text-white mt-2">{totalLeads}</h3>
                <span className="text-xs text-blue-400 mt-1 inline-block">All Registered Leads</span>
              </div>

              <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                <p className="text-sm text-gray-400 font-medium">Unassigned Leads</p>
                <h3 className="text-3xl font-bold text-yellow-400 mt-2">{unassignedLeads}</h3>
                <span className="text-xs text-yellow-400 mt-1 inline-block">Ready for Agent Assignment</span>
              </div>

              <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                <p className="text-sm text-gray-400 font-medium">Assigned Leads</p>
                <h3 className="text-3xl font-bold text-green-400 mt-2">{assignedLeads}</h3>
                <span className="text-xs text-green-400 mt-1 inline-block">Active with Agents</span>
              </div>
            </div>

            {/* Agent Performance Table */}
            <h2 className="text-lg font-semibold text-white mb-4">Agent Team Overview & Workload</h2>
            <div className="relative overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-[#1e1e1e] border-b border-gray-800">
                  <tr>
                    <th className="p-4">Agent Name</th>
                    <th className="p-4 text-center">Total Today</th>
                    <th className="p-4 text-center">Done Today</th>
                    <th className="p-4 text-center">Pending Today</th>
                    <th className="p-4 text-center">Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {agentStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500">
                        No agent performance statistics available.
                      </td>
                    </tr>
                  ) : (
                    agentStats.map((agent) => (
                      <tr key={agent.agent_id} className="border-b border-gray-800 bg-[#151515] hover:bg-[#1f1f1f]">
                        <td className="p-4 font-medium text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
                            <ImUserTie />
                          </div>
                          {agent.agent_name}
                        </td>
                        <td className="p-4 text-center font-semibold text-white">{agent.total_today}</td>
                        <td className="p-4 text-center font-semibold text-green-400">{agent.done_today}</td>
                        <td className="p-4 text-center font-semibold text-yellow-400">{agent.pending_today}</td>
                        <td className="p-4 text-center font-semibold text-red-400">{agent.overdue}</td>
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
