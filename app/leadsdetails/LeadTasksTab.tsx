"use client";

import React, { useEffect, useState } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
import { FaRegCheckCircle } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import { FiPlusCircle } from "react-icons/fi";
import { Formik } from "formik";
import * as Yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import StorageManager from "../../provider/StorageManager";

const storage = new StorageManager();

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
  start_at_ca: string;
  end_at: string;
  end_at_ca: string;
  status: string;
  subject: string;
  timer_hours: number;
  timer_minutes: number;
  type: string;
}

type Props = {
  leadId: string;
  leadName?: string;
  agentId?: string;
  agentName?: string;
  hitApi: boolean;
  setHitApi: React.Dispatch<React.SetStateAction<boolean>>;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
};

const formatDateTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${month}-${day}-${year} ${pad(hours)}:${minutes}${ampm}`;
};

export default function LeadTasksTab({
  leadId,
  leadName = "",
  agentId = "",
  agentName = "",
  hitApi,
  setHitApi,
  isCreateOpen = false,
  onCloseCreate,
}: Props) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [isLocalCreateOpen, setIsLocalCreateOpen] = useState(false);

  const isCreateVisible = isCreateOpen || isLocalCreateOpen;

  const fetchTasks = async () => {
    try {
      const res = await AxiosProvider.post("/leads/tasks/list", {
        lead_id: leadId,
      });
      const list = res.data?.data?.task || [];
      setTasks(list);
      const init: Record<string, boolean> = {};
      list.forEach((t: TaskData) => {
        if (isCompletedByStatus(t?.status)) init[t.id] = true;
      });
      setCompletedMap(init);
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  };

  useEffect(() => {
    if (leadId) fetchTasks();
  }, [leadId, hitApi]);

  const isCompletedByStatus = (status?: string): boolean => {
    if (!status) return false;
    const s = status.toLowerCase();
    return s === "completed" || s === "complete" || s === "done";
  };

  const isTaskLocked = (t: TaskData): boolean => {
    return Boolean(completedMap[t.id] || isCompletedByStatus(t.status));
  };

  const completeTask = async (taskId: string) => {
    try {
      await AxiosProvider.post("/leads/tasks/complete", { task_id: taskId, lead_id: leadId });
      setCompletedMap((prev) => ({ ...prev, [taskId]: true }));
      toast.success("Task completed successfully");
      setHitApi((prev) => !prev);
      fetchTasks();
    } catch (e: any) {
      console.error("Error completing task:", e);
      toast.error(e?.response?.data?.message || e?.response?.data?.msg || "Failed to complete task");
    }
  };

  const statusBadge = (status?: string) => {
    if (isCompletedByStatus(status)) {
      return "bg-green-900/40 text-green-300 border-green-700";
    }
    if (status?.toLowerCase() === "cancelled") {
      return "bg-red-900/40 text-red-300 border-red-700";
    }
    return "bg-yellow-900/40 text-yellow-300 border-yellow-700";
  };

  const defaultStart = new Date();
  const defaultEnd = new Date(Date.now() + 30 * 60 * 1000);

  const closeCreateDrawer = () => {
    setIsLocalCreateOpen(false);
    if (onCloseCreate) onCloseCreate();
  };

  const handleDeleteTask = async (taskId: string, subject: string) => {
    const res = await Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete task "${subject || "Task"}"?`,
      icon: "warning",
      background: "#181818",
      color: "#ffffff",
      iconColor: "#eab308",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "border border-gray-700 rounded-2xl shadow-2xl",
      },
    });
    if (res.isConfirmed) {
      try {
        await AxiosProvider.post("/leads/tasks/delete", { id: taskId, lead_id: leadId });
        toast.success("Task deleted successfully");
        setHitApi((prev) => !prev);
        fetchTasks();
      } catch (err: any) {
        console.error("Error deleting task:", err);
        toast.error(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to delete task",
        );
      }
    }
  };

  const userRole = storage.getUserRole();
  const currentOwner = agentName || (userRole === "Agent" ? storage.getUserName() : "") || "Wasique80";

  return (
    <div className="w-full">
      {/* Top Add Task Button */}
      <div className="flex justify-end items-center mb-4">
        <button
          type="button"
          onClick={() => setIsLocalCreateOpen(true)}
          className="flex items-center justify-center gap-2 w-[160px] h-[38px] rounded-[4px] border border-[#E7E7E7] bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold tracking-wide cursor-pointer transition shadow-sm"
        >
          <FiPlusCircle className="w-4 h-4 text-white" />
          <span>Add Task</span>
        </button>
      </div>

      {/* 1. TASKS TABLE */}
      {!tasks || tasks.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-base font-medium">
          No data found
        </p>
      ) : (
        <div className="w-full overflow-x-auto border border-gray-600 rounded-lg">
          <table className="w-full text-left text-xs text-white">
            <thead className="text-[11px] uppercase talbleheaderBg text-white border-b border-gray-600">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Mark Done</th>
                <th className="py-2.5 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {tasks.map((t, idx) => {
                const locked = isTaskLocked(t);
                const dueText = t?.start_at
                  ? new Date(t.start_at).toLocaleString()
                  : t?.start_at_ca || "-";
                return (
                  <tr
                    key={t?.id ?? idx}
                    className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-700/80 transition-colors"
                  >
                    <td className="py-2 px-3 text-center text-gray-300 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-gray-200 whitespace-nowrap">
                      {dueText}
                    </td>
                    <td className="py-2 px-3 font-semibold text-white capitalize text-xs">
                      {t?.subject || "-"}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-200 max-w-xs">
                      {t?.details || "-"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${statusBadge(
                          t?.status,
                        )}`}
                      >
                        {t?.status || "Pending"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => !locked && completeTask(t.id)}
                        disabled={locked}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition ${
                          locked
                            ? "bg-green-800/40 text-green-300 border-green-600 cursor-default"
                            : "bg-primary-600 text-white border-primary-500 hover:bg-primary-700 cursor-pointer"
                        }`}
                      >
                        <FaRegCheckCircle className="w-3 h-3" />
                        {locked ? "Done" : "Mark Done"}
                      </button>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="inline-flex items-center rounded-lg border border-gray-700 bg-black p-1 gap-1 shadow-sm">
                        <button
                          onClick={() => setEditingTask(t)}
                          disabled={locked}
                          className={`p-1 rounded-md text-white transition flex items-center justify-center ${
                            locked
                              ? "opacity-30 cursor-not-allowed"
                              : "hover:bg-primary-700 cursor-pointer"
                          }`}
                          title="Edit Task"
                        >
                          <MdEdit className="w-3.5 h-3.5" />
                        </button>
                        {userRole === "Admin" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id, t.subject)}
                            className="p-1 hover:bg-red-700 rounded-md text-white transition cursor-pointer flex items-center justify-center"
                            title="Delete Task"
                          >
                            <RiDeleteBin6Line className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. CREATE LEAD TASK FLYOUT */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          isCreateVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCreateDrawer}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[500px] md:w-[550px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isCreateVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full min-h-auto p-6 sm:p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <p className="text-primary-500 text-[26px] font-bold leading-9">
              Create Lead Task
            </p>
            <IoCloseOutline
              onClick={closeCreateDrawer}
              className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
            />
          </div>

          <Formik
            key={isCreateVisible ? "create-task-open" : "create-task-closed"}
            initialValues={{
              owner: currentOwner,
              associated_lead: leadName || "Lead",
              subject: `Meeting: ${leadName || "Lead"}`,
              location: "online",
              description: "",
              start_at: null as Date | null,
              end_at: null as Date | null,
            }}
            validationSchema={Yup.object({
              location: Yup.string().trim().required("Location is required"),
              description: Yup.string().trim().optional(),
              start_at: Yup.date().nullable().required("Start date is required"),
              end_at: Yup.date().nullable().required("End date is required"),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              const activeAgentId =
                agentId ||
                (storage.getUserRole() === "Agent" ? storage.getUserId() : "") ||
                null;
              const payload: any = {
                lead_id: leadId,
                details: values.description || "",
                subject: values.subject || "",
                task_type: "followup",
                start_at: values.start_at ? values.start_at.toISOString() : undefined,
                end_at: values.end_at ? values.end_at.toISOString() : undefined,
                start_at_text: values.start_at ? formatDateTime(values.start_at) : "",
                end_at_text: values.end_at ? formatDateTime(values.end_at) : "",
                location: values.location,
              };
              if (activeAgentId) {
                payload.assigned_agent_id = activeAgentId;
              }
              try {
                await AxiosProvider.post("/leads/tasks/create", payload);
                toast.success("Lead task created successfully");
                setHitApi((prev) => !prev);
                closeCreateDrawer();
              } catch (err: any) {
                toast.error(err?.response?.data?.message || err?.response?.data?.msg || "Lead task could not be created");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              values,
              handleChange,
              handleSubmit,
              setFieldValue,
              isSubmitting,
            }) => (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Row 1: Owner & Associated Lead */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white font-medium text-xs mb-1">Owner</p>
                    <input
                      type="text"
                      value={values.owner}
                      readOnly
                      className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium text-xs mb-1">Associated Lead</p>
                    <input
                      type="text"
                      value={values.associated_lead}
                      readOnly
                      className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Row 2: Subject & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white font-medium text-xs mb-1">Subject</p>
                    <input
                      type="text"
                      name="subject"
                      value={values.subject}
                      onChange={handleChange}
                      placeholder="Meeting: Name"
                      className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium text-xs mb-1">Location</p>
                    <input
                      type="text"
                      name="location"
                      value={values.location}
                      onChange={handleChange}
                      placeholder="online"
                      className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                    />
                  </div>
                </div>

                {/* Schedule Header */}
                <div className="pt-1">
                  <p className="text-white font-medium text-sm">Schedule</p>
                </div>

                {/* From Date */}
                <div>
                  <p className="text-white font-medium text-xs mb-1">From</p>
                  <DatePicker
                    selected={values.start_at}
                    placeholderText="Select start date & time"
                    onChange={(date: Date | null) => {
                      if (date) {
                        setFieldValue("start_at", date);
                        const nextEnd = new Date(date.getTime() + 30 * 60 * 1000);
                        setFieldValue("end_at", nextEnd);
                      } else {
                        setFieldValue("start_at", null);
                        setFieldValue("end_at", null);
                      }
                    }}
                    showTimeSelect
                    timeFormat="h:mma"
                    timeIntervals={15}
                    dateFormat="MM-dd-yyyy h:mma"
                    className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                  />
                </div>

                {/* To Date */}
                <div>
                  <p className="text-white font-medium text-xs mb-1">To</p>
                  <DatePicker
                    selected={values.end_at}
                    placeholderText="Select end date & time"
                    onChange={(date: Date | null) => {
                      setFieldValue("end_at", date);
                    }}
                    showTimeSelect
                    timeFormat="h:mma"
                    timeIntervals={15}
                    dateFormat="MM-dd-yyyy h:mma"
                    className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                  />
                </div>

                {/* Description (optional) */}
                <div>
                  <p className="text-white font-medium text-xs mb-1">Description (optional)</p>
                  <textarea
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Add description (optional)"
                    className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white resize-y"
                  />
                </div>

                {/* Single Full-width Blue Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 rounded text-white text-base font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create Task Activity"}
                  </button>
                </div>
              </form>
            )}
          </Formik>
        </div>
      </div>

      {/* 3. EDIT TASK RIGHT-SIDE FLYOUT */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          editingTask ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setEditingTask(null)}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[500px] md:w-[550px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          editingTask ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full min-h-auto p-6 sm:p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <p className="text-primary-500 text-[26px] font-bold leading-9">
              Update Task
            </p>
            <IoCloseOutline
              onClick={() => setEditingTask(null)}
              className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
            />
          </div>

          {editingTask && (
            <Formik
              enableReinitialize
              initialValues={{
                owner: editingTask?.owner_name || currentOwner,
                associated_lead: editingTask?.associated_lead?.full_name || leadName || "Lead",
                subject: editingTask?.subject || `Meeting: ${leadName || "Lead"}`,
                location: editingTask?.location || "online",
                description: editingTask?.details || "",
                start_at: editingTask?.start_at ? new Date(editingTask.start_at) : defaultStart,
                end_at: editingTask?.end_at ? new Date(editingTask.end_at) : defaultEnd,
              }}
              validationSchema={Yup.object({
                location: Yup.string().trim().required("Location is required"),
                description: Yup.string().trim().optional(),
                start_at: Yup.date().required("Start date is required"),
                end_at: Yup.date().required("End date is required"),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                const payload = {
                  task_id: editingTask.id,
                  location: values.location,
                  details: values.description || "",
                  start_at: values.start_at ? values.start_at.toISOString() : undefined,
                  end_at: values.end_at ? values.end_at.toISOString() : undefined,
                  start_at_text: values.start_at ? formatDateTime(values.start_at) : "",
                  end_at_text: values.end_at ? formatDateTime(values.end_at) : "",
                };
                try {
                  await AxiosProvider.post("/leads/tasks/edit", payload);
                  toast.success("Lead task updated successfully");
                  setHitApi((prev) => !prev);
                  setEditingTask(null);
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || err?.response?.data?.msg || "Lead task could not be updated");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({
                values,
                handleChange,
                handleSubmit,
                setFieldValue,
                isSubmitting,
              }) => (
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {/* Row 1: Owner & Associated Lead */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-white font-medium text-xs mb-1">Owner</p>
                      <input
                        type="text"
                        value={values.owner}
                        readOnly
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium text-xs mb-1">Associated Lead</p>
                      <input
                        type="text"
                        value={values.associated_lead}
                        readOnly
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Row 2: Subject & Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-white font-medium text-xs mb-1">Subject</p>
                      <input
                        type="text"
                        name="subject"
                        value={values.subject}
                        onChange={handleChange}
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium text-xs mb-1">Location</p>
                      <input
                        type="text"
                        name="location"
                        value={values.location}
                        onChange={handleChange}
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                      />
                    </div>
                  </div>

                  {/* Schedule Header */}
                  <div className="pt-1">
                    <p className="text-white font-medium text-sm">Schedule</p>
                  </div>

                  {/* From Date */}
                  <div>
                    <p className="text-white font-medium text-xs mb-1">From</p>
                    <DatePicker
                      selected={values.start_at}
                      onChange={(date: Date | null) => {
                        if (date) {
                          setFieldValue("start_at", date);
                          const nextEnd = new Date(date.getTime() + 30 * 60 * 1000);
                          setFieldValue("end_at", nextEnd);
                        }
                      }}
                      showTimeSelect
                      timeFormat="h:mma"
                      timeIntervals={15}
                      dateFormat="MM-dd-yyyy h:mma"
                      className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                    />
                  </div>

                  {/* To Date */}
                  <div>
                    <p className="text-white font-medium text-xs mb-1">To</p>
                    <DatePicker
                      selected={values.end_at}
                      onChange={(date: Date | null) => {
                        if (date) setFieldValue("end_at", date);
                      }}
                      showTimeSelect
                      timeFormat="h:mma"
                      timeIntervals={15}
                      dateFormat="MM-dd-yyyy h:mma"
                      className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                    />
                  </div>

                  {/* Description (optional) */}
                  <div>
                    <p className="text-white font-medium text-xs mb-1">Description (optional)</p>
                    <textarea
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Add description (optional)"
                      className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white resize-y"
                    />
                  </div>

                  {/* Single Full-width Blue Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-primary-600 hover:bg-primary-700 rounded text-white text-base font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? "Updating..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
}
