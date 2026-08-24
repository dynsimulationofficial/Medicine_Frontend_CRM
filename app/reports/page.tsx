"use client";
import React, { useState, useEffect } from "react";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import LeftSideBarMobile from "../component/LeftSideBarMobile";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import { useRouter } from "next/navigation";
import { isTokenExpired } from "../component/utils/authUtils";
import { toast } from "react-toastify";
import {
  FiUsers,
  FiTrendingUp,
  FiShoppingBag,
  FiDollarSign,
  FiCheckCircle,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
  FiAward,
} from "react-icons/fi";
import { TbReportAnalytics } from "react-icons/tb";
import { FaBoxes, FaTruck, FaClock, FaTimesCircle } from "react-icons/fa";

export default function ReportsPage() {
  const router = useRouter();
  const storage = new StorageManager();

  // Filter States
  const [datePreset, setDatePreset] = useState<string>("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Data States
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Authentication check
  useEffect(() => {
    const token = storage.getAccessToken();
    if (!token || isTokenExpired(token)) {
      router.replace("/");
      return;
    }
  }, [router]);

  // Fetch all agents for dropdown
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await AxiosProvider.get("/allagents");
        setAgentsList(res.data?.data?.data || []);
      } catch (err) {
        console.error("Error fetching agents:", err);
      }
    };
    fetchAgents();
  }, []);

  // Helper to compute date strings based on preset
  const computeDatesFromPreset = (preset: string) => {
    const now = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    let start = "";
    let end = formatDate(now);

    if (preset === "today") {
      start = formatDate(now);
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      start = formatDate(y);
      end = formatDate(y);
    } else if (preset === "this_week") {
      const w = new Date(now);
      const day = w.getDay() || 7; // get current day of week (1=Mon ... 7=Sun)
      w.setDate(w.getDate() - day + 1); // Monday
      start = formatDate(w);
    } else if (preset === "this_month") {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      start = formatDate(m);
    } else if (preset === "last_30_days") {
      const l = new Date(now);
      l.setDate(l.getDate() - 30);
      start = formatDate(l);
    }

    return { start, end };
  };

  // Initialize date range on mount or preset change
  useEffect(() => {
    if (datePreset !== "custom") {
      const { start, end } = computeDatesFromPreset(datePreset);
      setStartDate(start);
      setEndDate(end);
    }
  }, [datePreset]);

  // Fetch KPI Report Data
  const fetchReport = async () => {
    setLoading(true);
    try {
      const payload: any = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        agent_id: selectedAgent || undefined,
        order_status: selectedStatus !== "All" ? selectedStatus : undefined,
      };

      const res = await AxiosProvider.post("/reports/kpi", payload);
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching KPI report:", err);
      toast.error(err.response?.data?.msg || "Failed to load KPI reports");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch report when filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [startDate, endDate, selectedAgent, selectedStatus]);

  // Export to Excel / CSV Handler
  const handleExportCSV = () => {
    if (!reportData) return;

    const summary = reportData.summary || {};
    const leaderboard = reportData.agent_leaderboard || [];
    const statusBreakdown = reportData.status_breakdown || [];
    const recentOrders = reportData.recent_orders || [];

    let csv = "KPI & SALES PERFORMANCE REPORT\n";
    csv += `Generated Date Range:,${startDate} to ${endDate}\n\n`;

    csv += "--- EXECUTIVE KPI SUMMARY ---\n";
    csv += `Total Leads Received,${summary.total_leads || 0}\n`;
    csv += `Converted Leads,${summary.converted_leads || 0}\n`;
    csv += `Lead Conversion Rate,${summary.conversion_rate || 0}%\n`;
    csv += `Total Orders Placed,${summary.total_orders || 0}\n`;
    csv += `Total Revenue (INR),₹${summary.total_revenue || 0}\n`;
    csv += `Delivered Orders,${summary.delivered_orders || 0}\n`;
    csv += `Delivered Revenue (INR),₹${summary.delivered_revenue || 0}\n`;
    csv += `Average Order Value (INR),₹${summary.avg_order_value || 0}\n\n`;

    csv += "--- ORDER STATUS BREAKDOWN ---\n";
    csv += "Status,Count,Total Amount (INR),Percentage\n";
    statusBreakdown.forEach((s: any) => {
      csv += `"${s.status}",${s.count},₹${s.total_amount},${s.percentage}%\n`;
    });
    csv += "\n";

    csv += "--- AGENT PERFORMANCE LEADERBOARD ---\n";
    csv += "Rank,Agent Name,Agent Email,Assigned Leads,Converted Deals,Orders Closed,Revenue (INR),Conversion Rate\n";
    leaderboard.forEach((a: any) => {
      csv += `${a.rank},"${a.agent_name}","${a.agent_email}",${a.assigned_leads},${a.converted_leads},${a.total_orders},₹${a.total_revenue},${a.conversion_rate}%\n`;
    });
    csv += "\n";

    csv += "--- RECENT ORDERS BREAKDOWN ---\n";
    csv += "Order Number,Customer Name,Phone,Items,Grand Total,Order Status,Payment Status,Payment Mode,Agent,Date\n";
    recentOrders.forEach((o: any) => {
      csv += `"${o.order_number}","${o.customer_name}","${o.customer_phone}",${o.total_items},₹${o.grand_total},"${o.order_status}","${o.payment_status}","${o.payment_mode}","${o.agent_name || "-"}",${new Date(o.created_at).toLocaleDateString()}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `kpi_report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("KPI Report exported successfully!");
  };

  const summary = reportData?.summary || {};
  const statusBreakdown = reportData?.status_breakdown || [];
  const paymentBreakdown = reportData?.payment_breakdown || [];
  const sourceBreakdown = reportData?.source_breakdown || [];
  const leaderboard = reportData?.agent_leaderboard || [];
  const recentOrders = reportData?.recent_orders || [];

  return (
    <div className="w-full min-h-screen bg-[#121212] text-white flex">
      {/* Sidebar for Desktop */}
      <LeftSideBar />

      {/* Main Container */}
      <div className="ml-0 md:ml-[57px] w-full min-h-screen p-4 md:p-6 transition-all duration-200">
        {/* Mobile Sidebar */}
        <LeftSideBarMobile />

        {/* Top Header */}
        <DesktopHeader />

        {/* Reports Content Card */}
        <div className="w-full mt-4 bg-[#1b1b1b] border border-gray-800 rounded-3xl p-5 md:p-8 shadow-2xl">
          {/* Title and Top Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-gray-800">
            <div>
              <div className="flex items-center gap-2.5">
                <TbReportAnalytics className="w-7 h-7 text-primary-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">
                  KPI & Performance Analytics
                </h1>
              </div>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                Real-time sales revenue, lead conversion rates, and agent performance reports.
              </p>
            </div>

            {/* Actions: Export & Refresh */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg flex items-center gap-2 border border-gray-700 transition cursor-pointer"
                title="Refresh Report Data"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary-400" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                disabled={loading || !reportData}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-primary-900/30 transition cursor-pointer"
              >
                <FiDownload className="w-4 h-4" />
                <span>Export Report (Excel/CSV)</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="my-6 p-4 bg-[#141414] border border-gray-800 rounded-2xl flex flex-col gap-4">
            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1 mr-2">
                <FiCalendar className="w-3.5 h-3.5" /> Date Preset:
              </span>
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "this_week", label: "This Week" },
                { id: "this_month", label: "This Month" },
                { id: "last_30_days", label: "Last 30 Days" },
                { id: "custom", label: "Custom Range" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDatePreset(preset.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    datePreset === preset.id
                      ? "bg-primary-600 text-white shadow-md shadow-primary-900/40"
                      : "bg-[#222222] text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Filters (Dates, Agent, Status) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-800/80">
              {/* Start Date */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setStartDate(e.target.value);
                  }}
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setDatePreset("custom");
                    setEndDate(e.target.value);
                  }}
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              {/* Agent Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Filter by Agent
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="">All Agents</option>
                  {agentsList.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name || ag.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Status Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  Filter by Order Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="All">All Order Statuses</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* KPI Summary Metric Cards (4 Essential Cards Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* 1. Total Leads */}
            <div className="bg-[#1e1e1e] border border-gray-800 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Total Leads</span>
                <div className="p-2 bg-gray-800/80 rounded-lg text-gray-300">
                  <FiUsers className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mt-3">
                {summary.total_leads || 0}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Assigned: <span className="text-gray-200 font-medium">{summary.assigned_leads || 0}</span> | Unassigned: <span className="text-gray-200 font-medium">{summary.unassigned_leads || 0}</span>
              </p>
            </div>

            {/* 2. Total Orders */}
            <div className="bg-[#1e1e1e] border border-gray-800 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Total Orders</span>
                <div className="p-2 bg-gray-800/80 rounded-lg text-gray-300">
                  <FiShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mt-3">
                {summary.total_orders || 0}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Active: <span className="text-gray-200 font-medium">{(summary.total_orders || 0) - (summary.cancelled_orders || 0)}</span> | Cancelled: <span className="text-red-400 font-medium">{summary.cancelled_orders || 0}</span>
              </p>
            </div>

            {/* 3. Total Sales Revenue (Multi-Currency Direct Display) */}
            <div className="bg-[#1e1e1e] border border-gray-800 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Total Sales Revenue</span>
                <div className="p-2 bg-gray-800/80 rounded-lg text-gray-300">
                  <FiDollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-400 font-medium">🇮🇳 INR:</span>
                  <span className="text-sm font-bold text-white font-mono">
                    ₹{Number(summary.revenue_inr || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-400 font-medium">🇺🇸 USD:</span>
                  <span className="text-sm font-bold text-white font-mono">
                    ${Number(summary.revenue_usd || 0).toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-400 font-medium">🇬🇧 GBP:</span>
                  <span className="text-sm font-bold text-white font-mono">
                    £{Number(summary.revenue_gbp || 0).toLocaleString("en-GB")}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 border-t border-gray-800/80 pt-1.5">
                Gross revenue across 3 countries
              </p>
            </div>

            {/* 4. Delivered Orders */}
            <div className="bg-[#1e1e1e] border border-gray-800 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">Delivered Orders</span>
                <div className="p-2 bg-gray-800/80 rounded-lg text-gray-300">
                  <FiCheckCircle className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mt-3">
                {summary.delivered_orders || 0}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1">
                Success Rate: <span className="text-green-400 font-medium">{summary.delivery_success_rate || 0}%</span>
              </p>
            </div>
          </div>

          {/* Agent Performance Table */}
          <div className="mb-8 bg-[#1e1e1e] border border-gray-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FiTrendingUp className="text-primary-400 w-5 h-5" /> Agent Performance & Sales Overview
              </h3>
              <span className="text-xs text-gray-400">Ranked by Total Revenue Generated</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f1f1f] text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4"># Rank</th>
                    <th className="py-3 px-4">Agent Name</th>
                    <th className="py-3 px-4 text-center">Assigned Leads</th>
                    <th className="py-3 px-4 text-center">Converted Leads</th>
                    <th className="py-3 px-4 text-center">Orders Closed</th>
                    <th className="py-3 px-4 text-right">Revenue Generated (₹)</th>
                    <th className="py-3 px-4 text-center">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {leaderboard.length > 0 ? (
                    leaderboard.map((ag: any) => {
                      return (
                        <tr key={ag.agent_id} className="hover:bg-[#1a1a1a] transition">
                          <td className="py-3.5 px-4 font-bold text-white">
                            <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded bg-[#202020] border border-gray-700 text-xs font-semibold text-gray-200">
                              #{ag.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">{ag.agent_name}</p>
                            <p className="text-[11px] text-gray-500">{ag.agent_email}</p>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-gray-300">
                            {ag.assigned_leads}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-green-400">
                            {ag.converted_leads}
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-purple-400">
                            {ag.total_orders}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-yellow-400 text-sm">
                            ₹{Number(ag.total_revenue || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-950/80 text-green-400 border border-green-800">
                              {ag.conversion_rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                        No agent performance data available for this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Orders in Period Table */}
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <FaClock className="text-primary-400 w-4 h-4" /> Recent Customer Orders in Period
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f1f1f] text-gray-400 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Order Number</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">Items</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-center">Order Status</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                    <th className="py-3 px-4">Assigned Agent</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-[#1a1a1a] transition">
                        <td className="py-3 px-4 font-bold text-primary-400">
                          {ord.order_number}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {ord.customer_name}
                        </td>
                        <td className="py-3 px-4 text-gray-300 font-mono">
                          {ord.customer_phone}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-gray-300">
                          {ord.total_items}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white font-mono">
                          {ord.currency === "USD" ? "$" : ord.currency === "GBP" ? "£" : "₹"}
                          {Number(ord.grand_total).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            ord.order_status === "Delivered"
                              ? "bg-green-950 text-green-400 border-green-800"
                              : ord.order_status === "Shipped"
                              ? "bg-blue-950 text-blue-400 border-blue-800"
                              : ord.order_status === "Confirmed"
                              ? "bg-purple-950 text-purple-400 border-purple-800"
                              : ord.order_status === "Cancelled"
                              ? "bg-red-950 text-red-400 border-red-800"
                              : "bg-yellow-950 text-yellow-400 border-yellow-800"
                          }`}>
                            {ord.order_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] text-gray-300">
                            {ord.payment_mode} • <span className={ord.payment_status === "Paid" ? "text-green-400" : "text-yellow-400"}>{ord.payment_status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300 font-medium">
                          {ord.agent_name || "-"}
                        </td>
                        <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500 text-xs">
                        No orders recorded in this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
