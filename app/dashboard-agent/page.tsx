"use client";

import Image from "next/image";
import Link from "next/link";
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
  FaExclamationTriangle,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";

export default function AgentDashboardPage() {
  const isChecking = useAuthRedirect();
  const router = useRouter();
  const storage = new StorageManager();
  const userRole = storage.getUserRole();

  // 1. Leads Table State (API 7)
  const [assignedLeads, setAssignedLeads] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 2. 6 KPI Metric Card States (APIs 1 to 6)
  const [assignedLeadsCount, setAssignedLeadsCount] = useState<number>(0); // Card 1
  const [convertedDealsCount, setConvertedDealsCount] = useState<number>(0); // Card 2
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0); // Card 3
  const [salesRevenue, setSalesRevenue] = useState<{ inr: number; usd: number; gbp: number }>({
    inr: 0,
    usd: 0,
    gbp: 0,
  }); // Card 4
  const [tasksToday, setTasksToday] = useState<{ total_today: number; pending_today: number }>({
    total_today: 0,
    pending_today: 0,
  }); // Card 5
  const [overdueTasksCount, setOverdueTasksCount] = useState<number>(0); // Card 6

  // 3. Agent Tasks State (API 8)
  const [agentTasks, setAgentTasks] = useState<{
    pending_today: any[];
    overdue: any[];
    upcoming: any[];
    done_today: any[];
  }>({
    pending_today: [],
    overdue: [],
    upcoming: [],
    done_today: [],
  });
  const [selectedTaskTab, setSelectedTaskTab] = useState<"pending" | "overdue" | "upcoming" | "done">("pending");

  // Role Protection: Redirect Admin to /dashboard-admin
  useEffect(() => {
    if (!isChecking && userRole === "Admin") {
      router.replace("/dashboard-admin");
    }
  }, [isChecking, userRole, router]);

  // ---------------- Fetch Data via 7 Dedicated APIs ----------------
  const fetchAgentDashboardData = async () => {
    setIsLoading(true);
    try {
      // API 1: Assigned Leads Count (Card 1)
      const api1 = AxiosProvider.get("/leads/agent/dashboard/assigned-leads-count")
        .then((res) => {
          if (res.data?.success) setAssignedLeadsCount(Number(res.data.data?.count || 0));
        })
        .catch((e) => console.error("Error fetching Card 1:", e));

      // API 2: Converted Deals Count (Card 2)
      const api2 = AxiosProvider.get("/leads/agent/dashboard/converted-deals-count")
        .then((res) => {
          if (res.data?.success) setConvertedDealsCount(Number(res.data.data?.count || 0));
        })
        .catch((e) => console.error("Error fetching Card 2:", e));

      // API 3: Total Orders Count (Card 3)
      const api3 = AxiosProvider.get("/leads/agent/dashboard/total-orders-count")
        .then((res) => {
          if (res.data?.success) setTotalOrdersCount(Number(res.data.data?.count || 0));
        })
        .catch((e) => console.error("Error fetching Card 3:", e));

      // API 4: Sales Revenue Breakdown (Card 4)
      const api4 = AxiosProvider.get("/leads/agent/dashboard/sales-revenue")
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setSalesRevenue({
              inr: Number(res.data.data.inr || 0),
              usd: Number(res.data.data.usd || 0),
              gbp: Number(res.data.data.gbp || 0),
            });
          }
        })
        .catch((e) => console.error("Error fetching Card 4:", e));

      // API 5: Tasks Today Count (Card 5)
      const api5 = AxiosProvider.get("/leads/agent/dashboard/tasks-today")
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setTasksToday({
              total_today: Number(res.data.data.total_today || 0),
              pending_today: Number(res.data.data.pending_today || 0),
            });
          }
        })
        .catch((e) => console.error("Error fetching Card 5:", e));

      // API 6: Overdue Tasks Count (Card 6)
      const api6 = AxiosProvider.get("/leads/agent/dashboard/overdue-tasks")
        .then((res) => {
          if (res.data?.success) setOverdueTasksCount(Number(res.data.data?.count || 0));
        })
        .catch((e) => console.error("Error fetching Card 6:", e));

      // API 7: Assigned Leads Queue Table (Section 7)
      const api7 = AxiosProvider.get(`/leads/agent/dashboard/assigned-leads?page=${page}&pageSize=50`)
        .then((res) => {
          if (res.data?.success) {
            const list = res.data.data?.leads || [];
            const pagination = res.data.data?.pagination;
            setAssignedLeads(list);
            setTotalPages(pagination?.totalPages || 1);
            setTotalLeads(pagination?.total || list.length);
          }
        })
        .catch(async () => {
          // Fallback to /leads/assigned if needed
          const fallbackRes = await AxiosProvider.get(`/leads/assigned?page=${page}&pageSize=50`);
          const list = fallbackRes.data?.data?.data || [];
          setAssignedLeads(list);
          setTotalPages(fallbackRes.data?.data?.pagination?.totalPages || 1);
          setTotalLeads(fallbackRes.data?.data?.pagination?.total || list.length);
        });

      // API 8: Agent Tasks Details & Lists
      const api8 = AxiosProvider.get("/leads/task/agent/dashboard")
        .then((res) => {
          if (res.data?.success && res.data.data) {
            const lists = res.data.data.lists || {};
            setAgentTasks({
              pending_today: lists.pending_today || [],
              overdue: lists.overdue || [],
              upcoming: lists.upcoming || [],
              done_today: lists.done_today || [],
            });
            if (res.data.data.cards?.today) {
              setTasksToday({
                total_today: Number(res.data.data.cards.today.total || 0),
                pending_today: Number(res.data.data.cards.today.pending || 0),
              });
            }
            if (res.data.data.cards?.overdue !== undefined) {
              setOverdueTasksCount(Number(res.data.data.cards.overdue || 0));
            }
          }
        })
        .catch((e) => console.error("Error fetching Agent Tasks:", e));

      // Run all 8 APIs in parallel
      await Promise.allSettled([api1, api2, api3, api4, api5, api6, api7, api8]);
    } catch (error) {
      console.error("Error in dashboard fetch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkTaskDone = async (taskId: string) => {
    try {
      await AxiosProvider.post("/leads/tasks/edit", {
        id: taskId,
        status: "done",
      });
      fetchAgentDashboardData();
    } catch (err) {
      console.error("Error completing task:", err);
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
                My Assigned Leads, Multi-Orders Performance &amp; Daily Tasks
              </p>
            </div>
          </div>

          {/* ==================== 6 KPI METRIC CARDS (APIs 1 to 6) ==================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            {/* 1. Assigned Leads (Card 1) */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
              <p className="text-xs text-gray-400 font-medium uppercase">
                ASSIGNED LEADS
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-blue-400 mt-2">
                {assignedLeadsCount || totalLeads}
              </h3>
              <span className="text-[11px] text-blue-400 mt-1 inline-block">
                My Lead Portfolio
              </span>
            </div>

            {/* 2. Converted Deals (Card 2) */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-purple-900/40 bg-purple-950/10">
              <p className="text-xs text-purple-400 font-medium uppercase">
                CONVERTED DEALS
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-purple-400 mt-2">
                {convertedDealsCount}
              </h3>
              <span className="text-[11px] text-purple-400 mt-1 inline-block">
                Successful Customers
              </span>
            </div>

            {/* 3. Total Orders (Card 3) */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-teal-900/40 bg-teal-950/10">
              <p className="text-xs text-teal-400 font-medium uppercase">
                TOTAL ORDERS
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-teal-400 mt-2">
                {totalOrdersCount}
              </h3>
              <span className="text-[11px] text-teal-400 mt-1 inline-block">
                Orders Generated
              </span>
            </div>

            {/* 4. Sales Revenue (Card 4) */}
            <div className="bg-[#1e1e1e] p-4 rounded-xl border border-yellow-900/40 bg-yellow-950/10">
              <p className="text-xs text-yellow-400 font-medium uppercase">
                SALES REVENUE
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-gray-400 font-medium">🇮🇳 INR:</span>
                  <span className="font-bold text-yellow-300 font-mono">
                    ₹{Number(salesRevenue.inr).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-gray-400 font-medium">🇺🇸 USD:</span>
                  <span className="font-bold text-yellow-300 font-mono">
                    ${Number(salesRevenue.usd).toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-gray-400 font-medium">🇬🇧 GBP:</span>
                  <span className="font-bold text-yellow-300 font-mono">
                    £{Number(salesRevenue.gbp).toLocaleString("en-GB")}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-yellow-400 mt-1.5 inline-block border-t border-yellow-800/30 pt-0.5">
                Revenue across 3 countries
              </span>
            </div>

            {/* 5. Tasks Today (Card 5) */}
            <div
              onClick={() => setSelectedTaskTab("pending")}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedTaskTab === "pending"
                  ? "bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/50"
                  : "bg-[#1e1e1e] border-cyan-900/40 hover:border-cyan-700"
              }`}
            >
              <p className="text-xs text-cyan-400 font-medium uppercase">
                TASKS TODAY
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-cyan-400 mt-2">
                {tasksToday.total_today}
              </h3>
              <span className="text-[11px] text-cyan-400 mt-1 inline-block">
                {tasksToday.pending_today} Pending Follow-up{tasksToday.pending_today === 1 ? '' : 's'}
              </span>
            </div>

            {/* 6. Overdue Tasks (Card 6) */}
            <div
              onClick={() => setSelectedTaskTab("overdue")}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedTaskTab === "overdue"
                  ? "bg-red-950/40 border-red-400 ring-1 ring-red-400/50"
                  : "bg-[#1e1e1e] border-red-900/50 hover:border-red-700"
              }`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs text-red-400 font-medium uppercase">
                  OVERDUE TASKS
                </p>
                {overdueTasksCount > 0 && (
                  <FaExclamationTriangle className="text-red-400 w-3.5 h-3.5 animate-bounce" />
                )}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-red-400 mt-2">
                {overdueTasksCount}
              </h3>
              <span className="text-[11px] text-red-400 mt-1 inline-block font-medium">
                {overdueTasksCount > 0 ? "Requires Immediate Call!" : "All on Track"}
              </span>
            </div>
          </div>

          {/* ==================== 8. MY TASKS & FOLLOW-UPS SECTION ==================== */}
          {(() => {
            const currentTaskList =
              selectedTaskTab === "pending"
                ? agentTasks.pending_today
                : selectedTaskTab === "overdue"
                ? agentTasks.overdue
                : selectedTaskTab === "upcoming"
                ? agentTasks.upcoming
                : agentTasks.done_today;

            return (
              <div className="mb-8 bg-[#181818] border border-gray-800 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 text-sm">
                      <FaCalendarAlt />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-wide">
                        My Tasks &amp; Scheduled Follow-ups
                      </h2>
                      <p className="text-xs text-gray-400">
                        Never miss a follow-up, meeting or call with your assigned leads
                      </p>
                    </div>
                  </div>

                  {/* Task Tabs */}
                  <div className="flex items-center gap-1.5 bg-[#121212] p-1 rounded-xl border border-gray-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedTaskTab("pending")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        selectedTaskTab === "pending"
                          ? "bg-cyan-600 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>Pending Today</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedTaskTab === "pending"
                            ? "bg-cyan-900 text-cyan-200"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {agentTasks.pending_today.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTaskTab("overdue")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        selectedTaskTab === "overdue"
                          ? "bg-red-600 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>Overdue</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          agentTasks.overdue.length > 0
                            ? "bg-red-950 text-red-300 animate-pulse"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {agentTasks.overdue.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTaskTab("upcoming")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        selectedTaskTab === "upcoming"
                          ? "bg-purple-600 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>Upcoming</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedTaskTab === "upcoming"
                            ? "bg-purple-900 text-purple-200"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {agentTasks.upcoming.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTaskTab("done")}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        selectedTaskTab === "done"
                          ? "bg-emerald-600 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>Done Today</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedTaskTab === "done"
                            ? "bg-emerald-900 text-emerald-200"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {agentTasks.done_today.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Task Table */}
                <div className="relative overflow-x-auto rounded-xl border border-gray-800">
                  <table className="w-full text-xs text-left text-gray-300">
                    <thead className="text-[11px] uppercase bg-[#1e1e1e] text-gray-400 border-b border-gray-800">
                      <tr>
                        <th className="py-3 px-4">Task / Subject</th>
                        <th className="py-3 px-4">Lead / Customer</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Scheduled Time</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {currentTaskList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <FaCheckCircle className="text-gray-600 text-2xl mb-1" />
                              <p className="font-medium text-gray-300">
                                {selectedTaskTab === "pending"
                                  ? "No pending tasks for today!"
                                  : selectedTaskTab === "overdue"
                                  ? "No overdue tasks! Everything is on track."
                                  : selectedTaskTab === "upcoming"
                                  ? "No upcoming future tasks scheduled."
                                  : "No tasks marked completed today yet."}
                              </p>
                              <span className="text-[11px] text-gray-500">
                                Tasks created for your assigned leads will appear here automatically.
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentTaskList.map((task: any) => {
                          const isDone = task.status === "done";
                          const isOverdue = selectedTaskTab === "overdue";
                          const typeBadge =
                            task.type === "meeting"
                              ? "bg-purple-950/60 text-purple-300 border-purple-800/40"
                              : task.type === "phonecall"
                              ? "bg-blue-950/60 text-blue-300 border-blue-800/40"
                              : "bg-cyan-950/60 text-cyan-300 border-cyan-800/40";

                          return (
                            <tr
                              key={task.id}
                              className="bg-[#151515] hover:bg-[#1f1f1f] transition-colors"
                            >
                              <td className="py-3 px-4 font-semibold text-white">
                                <div className="flex items-center gap-2">
                                  {task.type === "phonecall" ? (
                                    <FaPhoneAlt className="text-blue-400 text-xs" />
                                  ) : (
                                    <FaCalendarAlt className="text-cyan-400 text-xs" />
                                  )}
                                  <span>{task.subject || "Follow-up Task"}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 font-medium text-gray-200">
                                {task.lead_name || "—"}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${typeBadge}`}
                                >
                                  {task.type || "Followup"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-300 font-mono text-[11px]">
                                {task.start_at || task.due_date || "—"}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isDone ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 inline-flex items-center gap-1">
                                    <FaCheckCircle className="text-[9px]" /> Completed
                                  </span>
                                ) : isOverdue ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/80 text-red-300 border border-red-800/50 inline-flex items-center gap-1">
                                    <FaExclamationTriangle className="text-[9px]" /> Overdue
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 inline-flex items-center gap-1">
                                    <FaClock className="text-[9px]" /> Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {task.lead_id && (
                                    <Link
                                      href={`/leadsdetails?id=${task.lead_id}`}
                                      className="px-2.5 py-1 rounded bg-primary-600 hover:bg-primary-500 text-white font-medium text-[11px] transition-colors inline-flex items-center gap-1"
                                    >
                                      Open Lead &rarr;
                                    </Link>
                                  )}
                                  {!isDone && (
                                    <button
                                      type="button"
                                      onClick={() => handleMarkTaskDone(task.id)}
                                      className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-700/40 text-[11px] font-medium transition-colors"
                                      title="Mark Task Completed"
                                    >
                                      Mark Done
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ==================== 7. MY ASSIGNED LEAD QUEUE (API 7) ==================== */}
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
                              <p className="text-[11px] font-semibold text-yellow-400 mt-1 font-mono">
                                {lead.currency === "GBP" || lead.country === "UK" || (lead.phone && lead.phone.startsWith("+44"))
                                  ? "£"
                                  : lead.currency === "USD" || lead.country === "USA" || (lead.phone && lead.phone.startsWith("+1"))
                                  ? "$"
                                  : "₹"}
                                {Number(lead.total_order_amount || 0).toLocaleString("en-IN")}
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
