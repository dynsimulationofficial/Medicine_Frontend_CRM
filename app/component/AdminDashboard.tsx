"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { FaUserCircle, FaClock, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";

/* ---------- Types ---------- */
type CardCounts = {
  cancelled_today: number;
  done_today: number;
  overdue_all: number;
  pending_today: number;
  today?: string;
  today_ca?: string;
  total_today: number;
};

type CampaignRanking = {
  source_name: string;
  campaign_name: string;
  leads_count: number;
  percentage: number;
  converted_count: number;
  conversion_rate: number;
};

type TaskRow = {
  task_id: string;
  lead_id: string | number;
  lead_name: string;
  lead_phone?: string;
  subject?: string;
  location?: string;
  task_type?: string;
  status?: string;
  due_date?: string;
  start_at?: string;
  end_at?: string;
  start_at_ca?: string;
  end_at_ca?: string;
};

type AgentTasks = {
  agent_id: string;
  agent_name: string;
  total_assigned_leads?: number;
  new_leads?: number;
  converted_leads?: number;
  total_today?: number;
  pending_today?: number;
  done_today?: number;
  overdue?: number;
  tasks?: TaskRow[];
};

const DEFAULT_CARDS: CardCounts = {
  cancelled_today: 0,
  done_today: 0,
  overdue_all: 0,
  pending_today: 0,
  today: "",
  total_today: 0,
};

const AdminDashboard: React.FC = () => {
  // ---------------- State Management ----------------
  const [cardsAdminData, setCardsAdminData] = useState<CardCounts>(DEFAULT_CARDS);
  const [campaignRankings, setCampaignRankings] = useState<CampaignRanking[]>([]);
  const [campaignTotalLeads, setCampaignTotalLeads] = useState<number>(0);
  const [teamTasksByAgent, setTeamTasksByAgent] = useState<AgentTasks[]>([]);
  const [todayTasksByAgent, setTodayTasksByAgent] = useState<AgentTasks[]>([]);
  const [overdueTasksByAgent, setOverdueTasksByAgent] = useState<AgentTasks[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<string | null>(null);

  // Accordion open/close state
  const [activeTodayAgent, setActiveTodayAgent] = useState<string | null>(null);
  const [activeOverdueAgent, setActiveOverdueAgent] = useState<string | null>(null);

  const mountedRef = useRef(true);

  // ---------------- Separate & Fallback API Calls ----------------
  const fetchAllDashboardData = async () => {
    setIsLoading(true);
    setIsError(null);

    try {
      let anySuccess = false;

      // 1. Fetch KPI Cards API
      const cardsPromise = AxiosProvider.post("/leads/admin/dashboard/cards", {})
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setCardsAdminData({ ...DEFAULT_CARDS, ...res.data.data });
            anySuccess = true;
          }
        })
        .catch(() => {});

      // 2. Fetch Campaign Performance API
      const campaignPromise = AxiosProvider.post("/leads/admin/dashboard/campaigns", {})
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setCampaignRankings(res.data.data.rankings || []);
            setCampaignTotalLeads(res.data.data.total_leads || 0);
            anySuccess = true;
          }
        })
        .catch(() => {});

      // 3. Fetch Team Tasks Table API
      const teamTasksPromise = AxiosProvider.post("/leads/admin/dashboard/team-tasks", {})
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setTeamTasksByAgent(res.data.data || []);
            anySuccess = true;
          }
        })
        .catch(() => {});

      // 4. Fetch Detailed Tasks List API
      const tasksListPromise = AxiosProvider.post("/leads/admin/dashboard/tasks-list", {})
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setTodayTasksByAgent(res.data.data.today_tasks_by_agent || []);
            setOverdueTasksByAgent(res.data.data.overdue_tasks_by_agent || []);
            anySuccess = true;
          }
        })
        .catch(() => {});

      await Promise.allSettled([cardsPromise, campaignPromise, teamTasksPromise, tasksListPromise]);

      // If separate endpoints did not return data (e.g. older backend deployment), fallback to unified endpoint
      if (!anySuccess) {
        const unifiedRes = await AxiosProvider.post("/leads/admin/dashboard", {});
        if (unifiedRes.data?.success && unifiedRes.data?.data) {
          const d = unifiedRes.data.data;
          if (d.cards?.team_tasks) {
            setCardsAdminData({ ...DEFAULT_CARDS, ...d.cards.team_tasks });
          }
          if (d.campaign_performance) {
            setCampaignRankings(d.campaign_performance.rankings || []);
            setCampaignTotalLeads(d.campaign_performance.total_leads || 0);
          }
          if (d.tables?.team_tasks_by_agent) {
            setTeamTasksByAgent(d.tables.team_tasks_by_agent || []);
          }
          if (d.lists?.today_tasks_by_agent) {
            setTodayTasksByAgent(d.lists.today_tasks_by_agent || []);
          }
          if (d.lists?.overdue_tasks_by_agent) {
            setOverdueTasksByAgent(d.lists.overdue_tasks_by_agent || []);
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        setIsError(err?.message || "Failed to load dashboard data");
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchAllDashboardData();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const openLead = (id: string | number) => {
    const url = `/leadsdetails?id=${encodeURIComponent(String(id))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const cards = useMemo(
    () => [
      {
        label: "Total Task Today",
        value: cardsAdminData.total_today,
        icon: <FaClock className="w-5 h-5 text-white" />,
      },
      {
        label: "Task Done Today",
        value: cardsAdminData.done_today,
        icon: <FaCheckCircle className="w-5 h-5 text-white" />,
      },
      {
        label: "All Overdue Task",
        value: cardsAdminData.overdue_all,
        icon: <FaInfoCircle className="w-5 h-5 text-white" />,
      },
      {
        label: "Pending Task Today",
        value: cardsAdminData.pending_today,
        icon: <FaClock className="w-5 h-5 text-white" />,
      },
    ],
    [cardsAdminData]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-gray-300 font-medium">Loading Admin Dashboard...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400 font-medium mb-3">Error loading dashboard: {isError}</p>
        <button
          onClick={fetchAllDashboardData}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 text-white max-w-7xl">
      {/* ==================== 1. HEADER ==================== */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">Live Team Overview, Daily Workload &amp; Task Activity</p>
      </div>

      {/* ==================== 2. 4 TOP KPI CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => (
          <div
            key={i}
            className="bg-[#008db9] hover:bg-[#007da4] transition-colors p-4 rounded-xl shadow-md flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold text-cyan-100 uppercase tracking-wider">{c.label}</p>
              <p className="text-3xl font-extrabold text-white mt-1">{c.value}</p>
            </div>
            <div className="bg-white/20 p-2.5 rounded-full flex items-center justify-center">
              {c.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ==================== 3. CAMPAIGN RANKING & LEAD SOURCE PERFORMANCE ==================== */}
      <div className="bg-[#1f242d] border border-gray-800 rounded-xl p-5 mb-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">
              Campaign Ranking &amp; Lead Source Performance (This Month)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Campaign-wise lead count aur percentage contribution
            </p>
          </div>
          <div className="self-start sm:self-auto bg-[#2b313c] px-3 py-1 rounded-full text-xs font-medium text-gray-200 border border-gray-700">
            Total Leads: <span className="font-bold text-cyan-400">{campaignTotalLeads}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead>
              <tr className="bg-[#2b313c] text-xs uppercase font-semibold text-gray-300 tracking-wider">
                <th className="px-4 py-3 rounded-l-lg">#</th>
                <th className="px-4 py-3">LEAD SOURCE</th>
                <th className="px-4 py-3">CAMPAIGN NAME</th>
                <th className="px-4 py-3 text-center">LEADS</th>
                <th className="px-4 py-3 min-w-[200px]">SHARE (%)</th>
                <th className="px-4 py-3 text-right rounded-r-lg">CONVERTED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {campaignRankings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No campaign data found for this month.
                  </td>
                </tr>
              ) : (
                campaignRankings.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#282e3a] transition-colors">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{row.source_name}</td>
                    <td className="px-4 py-3 text-gray-300">{row.campaign_name}</td>
                    <td className="px-4 py-3 text-center font-semibold text-white">{row.leads_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-cyan-400 w-10">{row.percentage}%</span>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden flex-1">
                          <div
                            className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(row.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {row.leads_count}/{campaignTotalLeads}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-white">
                        {row.converted_count}{" "}
                        <span className="text-xs text-gray-400 font-normal">({row.conversion_rate}%)</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== 4. TEAM TASKS BY AGENT ==================== */}
      <div className="bg-[#1f242d] border border-gray-800 rounded-xl p-5 mb-6 shadow-lg">
        <h3 className="text-base font-semibold text-white mb-4">Team Tasks by Agent</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead>
              <tr className="bg-[#2b313c] text-xs uppercase font-semibold text-gray-300 tracking-wider">
                <th className="px-4 py-3 rounded-l-lg">AGENT NAME</th>
                <th className="px-4 py-3 text-center">TOTAL TODAY</th>
                <th className="px-4 py-3 text-center">PENDING TODAY</th>
                <th className="px-4 py-3 text-center">DONE TODAY</th>
                <th className="px-4 py-3 text-center rounded-r-lg">OVERDUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {teamTasksByAgent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No agent data available.
                  </td>
                </tr>
              ) : (
                teamTasksByAgent.map((agent) => (
                  <tr key={agent.agent_id} className="hover:bg-[#282e3a] transition-colors">
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2.5">
                      <FaUserCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                      <span>{agent.agent_name}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-white">{agent.total_today ?? 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-amber-400">{agent.pending_today ?? 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-400">{agent.done_today ?? 0}</td>
                    <td className="px-4 py-3 text-center font-semibold text-rose-400">{agent.overdue ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== 5. TODAY TASKS BY AGENT (ACCORDION) ==================== */}
      <div className="bg-[#1f242d] border border-gray-800 rounded-xl p-5 mb-6 shadow-lg">
        <h3 className="text-base font-semibold text-white mb-4">Today Tasks by Agent</h3>
        <div className="space-y-3">
          {todayTasksByAgent.length === 0 ? (
            <div className="text-sm text-gray-400 py-3">No tasks scheduled for today.</div>
          ) : (
            todayTasksByAgent.map((agent) => {
              const isOpen = activeTodayAgent === agent.agent_id;
              const tasks = agent.tasks ?? [];
              return (
                <div
                  key={`today-${agent.agent_id}`}
                  className="overflow-hidden rounded-lg border border-gray-800 bg-[#171b22]"
                >
                  <button
                    className="w-full flex justify-between items-center bg-[#252b37] hover:bg-[#2e3644] px-4 py-3 text-left transition-colors"
                    onClick={() => setActiveTodayAgent(isOpen ? null : agent.agent_id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white text-sm">{agent.agent_name}</span>
                      <span className="bg-cyan-900/60 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-cyan-700/50">
                        {tasks.length} Task{tasks.length === 1 ? "" : "s"} Today
                      </span>
                    </div>
                    <span className="text-xl font-bold text-gray-400">{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && (
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-300">
                        <thead>
                          <tr className="bg-[#2b313c] text-xs uppercase font-semibold text-gray-300">
                            <th className="px-4 py-2 rounded-l">Lead Name</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Due Date</th>
                            <th className="px-4 py-2">Start Time</th>
                            <th className="px-4 py-2 rounded-r">End Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {tasks.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                                No tasks.
                              </td>
                            </tr>
                          ) : (
                            tasks.map((task, idx) => (
                              <tr key={`${agent.agent_id}-today-${task.lead_id}-${idx}`} className="hover:bg-[#202632]">
                                <td
                                  onClick={() => openLead(task.lead_id)}
                                  className="px-4 py-2.5 text-cyan-400 hover:text-cyan-300 underline cursor-pointer font-medium"
                                  title="Open lead in new tab"
                                >
                                  {task.lead_name}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                                      task.status === "done"
                                        ? "bg-emerald-900/60 text-emerald-300"
                                        : "bg-amber-900/60 text-amber-300"
                                    }`}
                                  >
                                    {task.status ?? "pending"}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-gray-300">{task.due_date ?? "-"}</td>
                                <td className="px-4 py-2.5 text-gray-400">{task.start_at || task.start_at_ca || "-"}</td>
                                <td className="px-4 py-2.5 text-gray-400">{task.end_at || task.end_at_ca || "-"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ==================== 6. OVERDUE TASKS BY AGENT (ACCORDION) ==================== */}
      <div className="bg-[#1f242d] border border-gray-800 rounded-xl p-5 shadow-lg">
        <h3 className="text-base font-semibold text-white mb-4">Overdue Tasks by Agent</h3>
        <div className="space-y-3">
          {overdueTasksByAgent.length === 0 ? (
            <div className="text-sm text-emerald-400 py-3">No overdue tasks 🎉 All tasks are on schedule!</div>
          ) : (
            overdueTasksByAgent.map((agent) => {
              const isOpen = activeOverdueAgent === agent.agent_id;
              const tasks = agent.tasks ?? [];
              return (
                <div
                  key={`overdue-${agent.agent_id}`}
                  className="overflow-hidden rounded-lg border border-gray-800 bg-[#171b22]"
                >
                  <button
                    className="w-full flex justify-between items-center bg-[#252b37] hover:bg-[#2e3644] px-4 py-3 text-left transition-colors"
                    onClick={() => setActiveOverdueAgent(isOpen ? null : agent.agent_id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white text-sm">{agent.agent_name}</span>
                      <span className="bg-rose-900/60 text-rose-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-rose-700/50">
                        {tasks.length} Task{tasks.length === 1 ? "" : "s"} Overdue
                      </span>
                    </div>
                    <span className="text-xl font-bold text-gray-400">{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && (
                    <div className="p-4 overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-300">
                        <thead>
                          <tr className="bg-[#2b313c] text-xs uppercase font-semibold text-gray-300">
                            <th className="px-4 py-2 rounded-l">Lead Name</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Due Date</th>
                            <th className="px-4 py-2">Start Time</th>
                            <th className="px-4 py-2 rounded-r">End Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {tasks.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                                No overdue tasks.
                              </td>
                            </tr>
                          ) : (
                            tasks.map((task, idx) => (
                              <tr
                                key={`${agent.agent_id}-overdue-${task.lead_id}-${idx}`}
                                className="hover:bg-[#202632]"
                              >
                                <td
                                  onClick={() => openLead(task.lead_id)}
                                  className="px-4 py-2.5 text-cyan-400 hover:text-cyan-300 underline cursor-pointer font-medium"
                                  title="Open lead in new tab"
                                >
                                  {task.lead_name}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-rose-900/60 text-rose-300">
                                    overdue
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-gray-300">{task.due_date ?? "-"}</td>
                                <td className="px-4 py-2.5 text-gray-400">{task.start_at || task.start_at_ca || "-"}</td>
                                <td className="px-4 py-2.5 text-gray-400">{task.end_at || task.end_at_ca || "-"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
