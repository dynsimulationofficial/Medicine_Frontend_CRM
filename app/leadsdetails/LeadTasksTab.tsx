"use client";

import React, { useEffect, useState } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
import { FaRegCheckCircle } from "react-icons/fa";

type Props = {
  leadId: string;
  reloadKey?: number;
  hitApi: boolean;
  setHitApi: React.Dispatch<React.SetStateAction<boolean>>;
  openEditTask: (task: TaskData) => void;
  openLeadTaskInFlyout: () => void;
  incomingTasks: TaskData[];
};

export interface TaskData {
  id: string;
  assigned_agent_id: string;
  associated_lead: {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
  details: string;
  location: string;
  organizer_name: string;
  owner_name: string;
  remaining_label: string;
  remaining_minutes: number;
  start_at: string;
  start_at_ist: string;
  end_at: string;
  end_at_ist: string;
  status: string;
  subject: string;
  timer_hours: number;
  timer_minutes: number;
  type: string;
  start_at_ca: string;
}

export default function LeadTasksTab({
  leadId,
  reloadKey = 0,
  hitApi,
  setHitApi,
  openEditTask,
  incomingTasks,
}: Props) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setTasks(incomingTasks || []);
    const init: Record<string, boolean> = {};
    (incomingTasks || []).forEach((t) => {
      if (isCompletedByStatus(t?.status)) init[t.id] = true;
    });
    setCompletedMap(init);
  }, [incomingTasks]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await AxiosProvider.post("/leads/tasks/list", {
          lead_id: leadId,
        });
        setTasks(res.data.data.task || []);
        const init: Record<string, boolean> = {};
        (res.data?.data?.task || []).forEach((t: TaskData) => {
          if (isCompletedByStatus(t?.status)) init[t.id] = true;
        });
        setCompletedMap(init);
      } catch (e) {
        console.error("Error fetching tasks:", e);
      }
    };
    if (leadId) fetchTasks();
  }, [leadId, reloadKey, hitApi]);

  const isCompletedByStatus = (s?: string) => {
    const x = (s || "").toLowerCase();
    return x === "completed" || x === "done";
  };

  const statusBadge = (s?: string) => {
    const x = (s || "").toLowerCase();
    if (x === "completed" || x === "done")
      return "bg-green-700/50 text-green-200 border-green-500";
    if (x === "pending" || x === "due")
      return "bg-yellow-700/50 text-yellow-200 border-yellow-500";
    if (x === "cancelled" || x === "canceled" || x === "failed")
      return "bg-red-700/50 text-red-200 border-red-500";
    return "bg-gray-700 text-gray-200 border-gray-600";
  };

  const isTaskLocked = (t: TaskData) =>
    completedMap[t.id] || isCompletedByStatus(t.status);

  const completeTask = async (id: string) => {
    try {
      await AxiosProvider.post("/leads/tasks/complete", {
        lead_id: leadId,
        task_id: id,
      });
      toast.success("Task marked as completed");
      setCompletedMap((m) => ({ ...m, [id]: true }));
      setHitApi(!hitApi);
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Task not completed");
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12 text-base font-medium">
        No data found
      </p>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-gray-600 rounded-lg">
      <table className="w-full text-left text-sm text-white">
        <thead className="text-xs uppercase talbleheaderBg text-white border-b border-gray-600">
          <tr>
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4">Due Date</th>
            <th className="py-3 px-4">Subject</th>
            <th className="py-3 px-4">Details</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-center">Mark Done</th>
            <th className="py-3 px-4 text-center w-24">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/60">
          {tasks.map((t, idx) => {
            const locked = isTaskLocked(t);
            return (
              <tr
                key={t?.id ?? idx}
                className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-700/80 transition-colors"
              >
                <td className="py-3 px-4 text-center text-gray-300 font-medium">
                  {idx + 1}
                </td>
                <td className="py-3 px-4 text-xs text-gray-200 whitespace-nowrap">
                  {t?.start_at_ca || "-"}
                </td>
                <td className="py-3 px-4 font-semibold text-white capitalize">
                  {t?.subject || "-"}
                </td>
                <td className="py-3 px-4 text-sm text-gray-200 max-w-md">
                  {t?.details || "-"}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-1 rounded text-xs font-semibold border ${statusBadge(
                      t?.status,
                    )}`}
                  >
                    {t?.status || "Pending"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => !locked && completeTask(t.id)}
                    disabled={locked}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition ${
                      locked
                        ? "bg-green-800/40 text-green-300 border-green-600 cursor-default"
                        : "bg-primary-600 text-white border-primary-500 hover:bg-primary-700 cursor-pointer"
                    }`}
                  >
                    <FaRegCheckCircle className="w-3.5 h-3.5" />
                    {locked ? "Done" : "Mark Done"}
                  </button>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => openEditTask(t)}
                    disabled={locked}
                    className="py-1 px-2.5 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Edit Task"
                  >
                    <MdEdit />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
