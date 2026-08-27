"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiPlus, 
  FiMinus, 
  FiExternalLink 
} from "react-icons/fi";
import { ImUserTie } from "react-icons/im";

import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";

interface TaskItem {
  task_id: string;
  lead_id: string;
  lead_name: string;
  lead_phone?: string;
  subject?: string;
  location?: string;
  task_type?: string;
  status: string;
  due_date?: string;
  start_at_ca?: string;
  end_at_ca?: string;
}

interface AgentTasksGroup {
  agent_id: string;
  agent_name: string;
  tasks: TaskItem[];
}

export default function AdminDashboardPage() {
  const isChecking = useAuthRedirect();
  const router = useRouter();
  const storage = new StorageManager();
  const userRole = storage.getUserRole();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [cardsData, setCardsData] = useState({
    total_today: 0,
    done_today: 0,
    overdue_all: 0,
    pending_today: 0,
  });
  const [agentStats, setAgentStats] = useState<any[]>([]);
  const [todayTasksByAgent, setTodayTasksByAgent] = useState<AgentTasksGroup[]>([]);
  const [overdueTasksByAgent, setOverdueTasksByAgent] = useState<AgentTasksGroup[]>([]);

  // Accordion open states
  const [openTodayAccordions, setOpenTodayAccordions] = useState<Record<string, boolean>>({});
  const [openOverdueAccordions, setOpenOverdueAccordions] = useState<Record<string, boolean>>({});

  // Role Protection: Redirect Agent to /dashboard-agent
  useEffect(() => {
    if (!isChecking && userRole === "Agent") {
      router.replace("/dashboard-agent");
    }
  }, [isChecking, userRole, router]);

  const toggleTodayAccordion = (agentId: string) => {
    setOpenTodayAccordions((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));
  };

  const toggleOverdueAccordion = (agentId: string) => {
    setOpenOverdueAccordions((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));
  };

  const fetchAdminStats = async () => {
    setIsLoading(true);
    try {
      const statsRes = await AxiosProvider.post("/leads/admin/dashboard");
      const data = statsRes.data?.data;

      if (data) {
        const teamTasks = data.cards?.team_tasks || {};
        setCardsData({
          total_today: Number(teamTasks.total_today || 0),
          done_today: Number(teamTasks.done_today || 0),
          overdue_all: Number(teamTasks.overdue_all || 0),
          pending_today: Number(teamTasks.pending_today || 0),
        });

        setAgentStats(data.tables?.team_tasks_by_agent || []);
        setTodayTasksByAgent(data.lists?.today_tasks_by_agent || []);
        setOverdueTasksByAgent(data.lists?.overdue_tasks_by_agent || []);
      }
    } catch (err) {
      console.error("Error fetching admin dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "Admin") {
      fetchAdminStats();
    }
  }, [userRole]);

  const handleOpenLead = (leadId: string) => {
    if (!leadId) return;
    window.open(`/leadsdetails?id=${leadId}`, "_blank");
  };

  if (isChecking || (isLoading && agentStats.length === 0)) {
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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">
              Live Team Overview, Daily Workload & Task Activity
            </p>
          </div>

          {/* 1. TOP STATS CARDS (Cyan/Teal Theme matching design) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Task Today */}
            <div className="bg-[#138ab6] text-white p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-white/90">
                  Total Task Today
                </span>
                <FiClock className="w-5 h-5 text-white/80" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">
                {cardsData.total_today}
              </p>
            </div>

            {/* Task Done Today */}
            <div className="bg-[#138ab6] text-white p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-white/90">
                  Task Done Today
                </span>
                <FiCheckCircle className="w-5 h-5 text-white/80" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">
                {cardsData.done_today}
              </p>
            </div>

            {/* All Overdue Task */}
            <div className="bg-[#138ab6] text-white p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-white/90">
                  All Overdue Task
                </span>
                <FiAlertCircle className="w-5 h-5 text-white/80" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">
                {cardsData.overdue_all}
              </p>
            </div>

            {/* Pending Task Today */}
            <div className="bg-[#138ab6] text-white p-5 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-start">
                <span className="text-sm font-semibold text-white/90">
                  Pending Task Today
                </span>
                <FiClock className="w-5 h-5 text-white/80" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">
                {cardsData.pending_today}
              </p>
            </div>
          </div>

          {/* 2. TEAM TASKS BY AGENT TABLE */}
          <div className="mb-10">
            <h2 className="text-base font-bold text-white mb-3 tracking-wide">
              Team Tasks by Agent
            </h2>
            <div className="relative overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-xs text-left text-gray-300">
                <thead className="text-xs uppercase bg-[#1e1e1e] text-white border-b border-gray-700">
                  <tr>
                    <th className="py-3 px-4">Agent Name</th>
                    <th className="py-3 px-4 text-center">Total Today</th>
                    <th className="py-3 px-4 text-center">Pending Today</th>
                    <th className="py-3 px-4 text-center">Done Today</th>
                    <th className="py-3 px-4 text-center">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {agentStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                        No agent performance records available.
                      </td>
                    </tr>
                  ) : (
                    agentStats.map((agent) => (
                      <tr
                        key={agent.agent_id}
                        className="bg-[#151515] hover:bg-[#202020] transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-white flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                            <ImUserTie />
                          </div>
                          <span className="text-xs font-semibold text-white">
                            {agent.agent_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white text-xs">
                          {agent.total_today || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-yellow-400 text-xs">
                          {agent.pending_today || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-green-400 text-xs">
                          {agent.done_today || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-red-400 text-xs">
                          {agent.overdue || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. TODAY TASKS BY AGENT (ACCORDION) */}
          <div className="mb-10">
            <h2 className="text-base font-bold text-white mb-3 tracking-wide">
              Today Tasks by Agent
            </h2>

            {todayTasksByAgent.length === 0 ? (
              <div className="p-5 rounded-lg bg-[#141414] border border-gray-800 text-center text-gray-400 text-xs font-medium">
                No tasks scheduled for today.
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasksByAgent.map((grp) => {
                  const isOpen = Boolean(openTodayAccordions[grp.agent_id]);
                  return (
                    <div
                      key={grp.agent_id}
                      className="rounded-lg border border-gray-800 overflow-hidden bg-[#161616]"
                    >
                      {/* Accordion Bar */}
                      <button
                        type="button"
                        onClick={() => toggleTodayAccordion(grp.agent_id)}
                        className="w-full py-3.5 px-4 bg-[#1e1e1e] hover:bg-[#252525] flex justify-between items-center text-white transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-white">
                            {grp.agent_name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-600/30 text-primary-300 border border-primary-500/30">
                            {grp.tasks.length} {grp.tasks.length === 1 ? "Task" : "Tasks"} Today
                          </span>
                        </div>
                        <div className="w-6 h-6 rounded flex items-center justify-center text-gray-300">
                          {isOpen ? <FiMinus className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Expanded Tasks List */}
                      {isOpen && (
                        <div className="p-3 bg-[#121212] border-t border-gray-800">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-gray-300">
                              <thead className="text-[11px] uppercase bg-[#181818] text-gray-400 border-b border-gray-800">
                                <tr>
                                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                                  <th className="py-2.5 px-3">Lead Name</th>
                                  <th className="py-2.5 px-3">Subject</th>
                                  <th className="py-2.5 px-3">Scheduled Time</th>
                                  <th className="py-2.5 px-3 text-center">Status</th>
                                  <th className="py-2.5 px-3 text-center w-24">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800/60">
                                {grp.tasks.map((task, tIdx) => (
                                  <tr
                                    key={task.task_id || tIdx}
                                    className="hover:bg-[#1a1a1a] transition-colors"
                                  >
                                    <td className="py-2 px-3 text-center text-gray-400">
                                      {tIdx + 1}
                                    </td>
                                    <td className="py-2 px-3 font-semibold text-primary-400">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenLead(task.lead_id)}
                                        className="hover:underline text-left cursor-pointer flex items-center gap-1.5"
                                      >
                                        <span>{task.lead_name || "Lead"}</span>
                                        <FiExternalLink className="w-3 h-3 text-primary-400" />
                                      </button>
                                    </td>
                                    <td className="py-2 px-3 text-white">
                                      {task.subject || "Follow-up"}
                                    </td>
                                    <td className="py-2 px-3 text-gray-300">
                                      {task.start_at_ca || task.due_date || "-"}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                          task.status === "done"
                                            ? "bg-green-900/40 text-green-300 border-green-700"
                                            : "bg-yellow-900/40 text-yellow-300 border-yellow-700"
                                        }`}
                                      >
                                        {task.status === "done" ? "Done" : "Pending"}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenLead(task.lead_id)}
                                        className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-[11px] font-medium transition cursor-pointer"
                                      >
                                        View Lead
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. OVERDUE TASKS BY AGENT (ACCORDION) */}
          <div>
            <h2 className="text-base font-bold text-white mb-3 tracking-wide">
              Overdue Tasks by Agent
            </h2>

            {overdueTasksByAgent.length === 0 ? (
              <div className="p-5 rounded-lg bg-[#141414] border border-gray-800 text-center text-gray-400 text-xs font-medium">
                No overdue tasks. All agent activities are on schedule!
              </div>
            ) : (
              <div className="space-y-3">
                {overdueTasksByAgent.map((grp) => {
                  const isOpen = Boolean(openOverdueAccordions[grp.agent_id]);
                  return (
                    <div
                      key={grp.agent_id}
                      className="rounded-lg border border-gray-800 overflow-hidden bg-[#161616]"
                    >
                      {/* Accordion Bar */}
                      <button
                        type="button"
                        onClick={() => toggleOverdueAccordion(grp.agent_id)}
                        className="w-full py-3.5 px-4 bg-[#1e1e1e] hover:bg-[#252525] flex justify-between items-center text-white transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-white">
                            {grp.agent_name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-900/40 text-red-300 border border-red-700/50">
                            {grp.tasks.length} {grp.tasks.length === 1 ? "Task" : "Tasks"} Overdue
                          </span>
                        </div>
                        <div className="w-6 h-6 rounded flex items-center justify-center text-gray-300">
                          {isOpen ? <FiMinus className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Expanded Tasks List */}
                      {isOpen && (
                        <div className="p-3 bg-[#121212] border-t border-gray-800">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-gray-300">
                              <thead className="text-[11px] uppercase bg-[#181818] text-gray-400 border-b border-gray-800">
                                <tr>
                                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                                  <th className="py-2.5 px-3">Lead Name</th>
                                  <th className="py-2.5 px-3">Subject</th>
                                  <th className="py-2.5 px-3">Due Date / Time</th>
                                  <th className="py-2.5 px-3 text-center">Status</th>
                                  <th className="py-2.5 px-3 text-center w-24">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800/60">
                                {grp.tasks.map((task, tIdx) => (
                                  <tr
                                    key={task.task_id || tIdx}
                                    className="hover:bg-[#1a1a1a] transition-colors"
                                  >
                                    <td className="py-2 px-3 text-center text-gray-400">
                                      {tIdx + 1}
                                    </td>
                                    <td className="py-2 px-3 font-semibold text-primary-400">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenLead(task.lead_id)}
                                        className="hover:underline text-left cursor-pointer flex items-center gap-1.5"
                                      >
                                        <span>{task.lead_name || "Lead"}</span>
                                        <FiExternalLink className="w-3 h-3 text-primary-400" />
                                      </button>
                                    </td>
                                    <td className="py-2 px-3 text-white">
                                      {task.subject || "Follow-up"}
                                    </td>
                                    <td className="py-2 px-3 text-red-300 font-medium">
                                      {task.end_at_ca || task.due_date || task.start_at_ca || "-"}
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-900/40 text-red-300 border border-red-700">
                                        Overdue
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenLead(task.lead_id)}
                                        className="px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-[11px] font-medium transition cursor-pointer"
                                      >
                                        View Lead
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
