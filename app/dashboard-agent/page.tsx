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
import {
  FaPhoneAlt,
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
  FaShoppingBag,
  FaRupeeSign,
  FaBoxes,
} from "react-icons/fa";
import { toast } from "react-toastify";

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

  // Task Stats & Lists
  const [taskStats, setTaskStats] = useState<any>({
    total_today: 0,
    pending_today: 0,
    done_today: 0,
    overdue: 0,
  });
  const [todayTasksList, setTodayTasksList] = useState<any[]>([]);
  const [overdueTasksList, setOverdueTasksList] = useState<any[]>([]);

  // Role Protection: Redirect Admin to /dashboard-admin
  useEffect(() => {
    if (!isChecking && userRole === "Admin") {
      router.replace("/dashboard-admin");
    }
  }, [isChecking, userRole, router]);

  const fetchAgentDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Assigned Leads (with multi-order counts and amounts)
      try {
        const res = await AxiosProvider.get(`/leads/assigned?page=${page}&pageSize=50`);
        const leadsList = res.data?.data?.data || (Array.isArray(res.data?.data) ? res.data.data : []);
        const pagination = res.data?.data?.pagination || res.data?.pagination;
        setAssignedLeads(leadsList);
        setTotalPages(pagination?.totalPages || 1);
        setTotalLeads(pagination?.total || leadsList.length);
      } catch (err) {
        console.error("Error fetching assigned leads:", err);
      }

      // 2. Fetch Agent Task Stats & Lists
      try {
        const taskRes = await AxiosProvider.post("/leads/task/agent/dashboard");
        const taskData = taskRes.data?.data;
        if (taskData) {
          setTaskStats({
            total_today: (taskData.cards?.today?.pending || 0) + (taskData.cards?.today?.completed || 0),
            pending_today: taskData.cards?.today?.pending || 0,
            done_today: taskData.cards?.today?.completed || 0,
            overdue: taskData.cards?.overdue || 0,
          });
          const pending = taskData.lists?.pending_today || [];
          const done = taskData.lists?.done_today || [];
          const overdue = taskData.lists?.overdue || [];
          setTodayTasksList([...pending, ...done]);
          setOverdueTasksList(overdue);
        }
      } catch (err) {
        console.error("Error fetching task dashboard stats:", err);
      }
    } catch (error) {
      console.error("Error in dashboard fetch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "Agent") {
      fetchAgentDashboardData();
    }
  }, [page, userRole]);

  // Mark task as done
  const handleMarkTaskDone = async (taskId: string) => {
    try {
      await AxiosProvider.post("/leads/tasks/complete", { task_id: taskId });
      toast.success("Task marked as completed!");
      fetchAgentDashboardData();
    } catch (err) {
      toast.error("Failed to complete task");
    }
  };

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

  // Multi-Order Metrics Calculation
  const totalOrdersCount = assignedLeads.reduce((acc, l) => acc + (Number(l.order_count) || 0), 0);
  const totalSalesRevenue = assignedLeads.reduce((acc, l) => acc + (Number(l.total_order_amount) || 0), 0);
  const convertedLeadsCount = assignedLeads.filter(
    (l) =>
      (Number(l.order_count) || 0) > 0 ||
      l.lead_status === "Converted" ||
      l.payment_status === "Paid" ||
      l.delivery_status === "Delivered",
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
                Agent Workstation
              </h1>
              <p className="text-sm text-gray-400">
                My Assigned Leads, Multi-Orders Performance & Daily Tasks
              </p>
            </div>
          </div>

          {/* Agent Multi-Order KPI Metric Cards (6 Cards Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {/* 1. Total Assigned Leads */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium uppercase">
                Assigned Leads
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-blue-400 mt-2">
                {totalLeads}
              </h3>
              <span className="text-[11px] text-blue-400 mt-1 inline-block">
                My Lead Portfolio
              </span>
            </div>

            {/* 2. Converted Customers */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-purple-900/40 bg-purple-950/10">
              <p className="text-xs text-purple-400 font-medium uppercase">
                Converted Deals
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-purple-400 mt-2">
                {convertedLeadsCount}
              </h3>
              <span className="text-[11px] text-purple-400 mt-1 inline-block">
                Successful Customers
              </span>
            </div>

            {/* 3. Total Orders Placed */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-teal-900/40 bg-teal-950/10">
              <p className="text-xs text-teal-400 font-medium uppercase">
                Total Orders
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-teal-400 mt-2">
                {totalOrdersCount}
              </h3>
              <span className="text-[11px] text-teal-400 mt-1 inline-block">
                Orders Generated
              </span>
            </div>

            {/* 4. Total Sales Revenue */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-yellow-900/40 bg-yellow-950/10">
              <p className="text-xs text-yellow-400 font-medium uppercase">
                Sales Revenue
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-yellow-300 mt-2 truncate">
                ₹{Number(totalSalesRevenue).toLocaleString("en-IN")}
              </h3>
              <span className="text-[11px] text-yellow-400 mt-1 inline-block">
                Total Revenue
              </span>
            </div>

            {/* 5. Tasks Today */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-cyan-900/40 bg-cyan-950/10">
              <p className="text-xs text-cyan-400 font-medium uppercase">
                Tasks Today
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-cyan-400 mt-2">
                {taskStats.total_today}
              </h3>
              <span className="text-[11px] text-cyan-400 mt-1 inline-block">
                {taskStats.pending_today} Pending Follow-up{taskStats.pending_today === 1 ? '' : 's'}
              </span>
            </div>

            {/* 6. Overdue Tasks */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-red-900/50 bg-red-950/20">
              <div className="flex justify-between items-start">
                <p className="text-xs text-red-400 font-medium uppercase">
                  Overdue Tasks
                </p>
                {taskStats.overdue > 0 && (
                  <FaExclamationTriangle className="text-red-400 w-3.5 h-3.5 animate-bounce" />
                )}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-red-400 mt-2">
                {taskStats.overdue}
              </h3>
              <span className="text-[11px] text-red-400 mt-1 inline-block font-medium">
                {taskStats.overdue > 0 ? "Requires Immediate Call!" : "All on Track"}
              </span>
            </div>
          </div>

          {/* Assigned Leads Queue Table */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              My Assigned Lead Queue
            </h2>
            <span className="text-xs text-gray-400">
              Showing {assignedLeads.length} of {totalLeads} leads
            </span>
          </div>

          <div className="relative overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-[#1e1e1e] border-b border-gray-800">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Lead Status</th>
                  <th className="p-4 text-center">Multi-Orders</th>
                  <th className="p-4 text-center">Latest Status</th>
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
                  assignedLeads.map((lead) => {
                    const hasOrders = (Number(lead.order_count) || 0) > 0;
                    const orderStatus = lead.latest_order_status || lead.delivery_status || "Pending";
                    const isDelivered = orderStatus === "Delivered";
                    const isShipped = orderStatus === "Shipped";
                    const isConfirmed = orderStatus === "Confirmed";
                    const isCancelled = orderStatus === "Cancelled";

                    return (
                      <tr
                        key={lead.id}
                        className="border-b border-gray-800 bg-[#151515] hover:bg-[#1f1f1f] transition"
                      >
                        {/* Customer Name */}
                        <td className="p-4 font-medium text-white">
                          <a
                            href={`/leadsdetails?id=${lead.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-white hover:text-primary-400 transition cursor-pointer"
                          >
                            {lead.full_name}
                          </a>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {lead.lead_number}
                          </p>
                        </td>

                        {/* Contact */}
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

                        {/* Lead Status */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                            lead.lead_status === "Converted" || hasOrders
                              ? "bg-green-950 text-green-400 border-green-800"
                              : "bg-blue-900/50 text-blue-400 border-blue-800"
                          }`}>
                            {hasOrders ? "Converted" : (lead.lead_status || "New")}
                          </span>
                        </td>

                        {/* Multi-Orders Info */}
                        <td className="p-4 text-center">
                          {hasOrders ? (
                            <div>
                              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">
                                {lead.order_count} Order{lead.order_count === 1 ? "" : "s"}
                              </span>
                              <p className="text-[11px] font-semibold text-yellow-400 mt-1">
                                ₹{Number(lead.total_order_amount || 0).toLocaleString("en-IN")}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 italic">No Orders Yet</span>
                          )}
                        </td>

                        {/* Latest Order Status */}
                        <td className="p-4 text-center">
                          {hasOrders ? (
                            <div>
                              <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                                isDelivered
                                  ? "bg-green-950 text-green-400 border-green-800"
                                  : isShipped
                                  ? "bg-blue-950 text-blue-400 border-blue-800"
                                  : isConfirmed
                                  ? "bg-purple-950 text-purple-400 border-purple-800"
                                  : isCancelled
                                  ? "bg-red-950 text-red-400 border-red-800"
                                  : "bg-yellow-950 text-yellow-400 border-yellow-800"
                              }`}>
                                {orderStatus}
                              </span>
                              {lead.latest_order_number && (
                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                  {lead.latest_order_number}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </td>

                        {/* Action: Open in new tab */}
                        <td className="p-4 text-center">
                          <a
                            href={`/leadsdetails?id=${lead.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded text-xs font-medium transition cursor-pointer"
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    );
                  })
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
                className="px-3 py-2 border border-gray-700 rounded bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 cursor-pointer"
              >
                <HiChevronDoubleLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 border border-gray-700 rounded bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50 cursor-pointer"
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
