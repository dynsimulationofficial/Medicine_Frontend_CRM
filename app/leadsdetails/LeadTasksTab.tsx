"use client";

import React, { useEffect, useState } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
import { FaRegCheckCircle } from "react-icons/fa";
import { IoCloseOutline } from "react-icons/io5";
import { Formik } from "formik";
import * as Yup from "yup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  const ampm = hours >= 12 ? "pm" : "am";
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
      setHitApi((prev) => !prev);
    } catch (error) {
      console.error("Error completing task:", error);
      toast.error("Task not completed");
    }
  };

  const defaultStart = new Date();
  const defaultEnd = new Date(defaultStart.getTime() + 15 * 60000);

  return (
    <div className="w-full">
      {/* 1. TABLE VIEW */}
      {!tasks || tasks.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-base font-medium">
          No data found
        </p>
      ) : (
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
                const dueText = t?.start_at
                  ? new Date(t.start_at).toLocaleString()
                  : t?.start_at_ca || "-";
                return (
                  <tr
                    key={t?.id ?? idx}
                    className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-700/80 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-gray-300 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-200 whitespace-nowrap">
                      {dueText}
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
                        onClick={() => setEditingTask(t)}
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
      )}

      {/* 2. CREATE TASK MODAL / FLYOUT */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg max-w-2xl w-full p-6 text-white shadow-2xl relative my-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-primary-500 text-2xl font-bold">
                Create Lead Task
              </p>
              <IoCloseOutline
                onClick={onCloseCreate}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>

            <Formik
              initialValues={{
                owner: agentId || (storage.getUserRole() === "Agent" ? storage.getUserId() : "") || "",
                associated_lead: leadName || "",
                subject: `Follow Up: ${leadName}`,
                location: "online",
                description: "",
                start_at: defaultStart,
                end_at: defaultEnd,
              }}
              validationSchema={Yup.object({
                location: Yup.string().trim().required("Location is required"),
                description: Yup.string().trim().optional(),
                start_at: Yup.date().required("Start date is required"),
                end_at: Yup.date().required("End date is required"),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                const activeAgentId =
                  agentId ||
                  (storage.getUserRole() === "Agent" ? storage.getUserId() : "") ||
                  "";
                const payload = {
                  lead_id: leadId,
                  assigned_agent_id: activeAgentId,
                  details: values.description || "",
                  subject: values.subject || "",
                  task_type: "followup",
                  start_at_text: values.start_at ? formatDateTime(values.start_at) : "",
                  end_at_text: values.end_at ? formatDateTime(values.end_at) : "",
                  location: values.location,
                };
                try {
                  await AxiosProvider.post("/leads/tasks/create", payload);
                  toast.success("Lead task created successfully");
                  setHitApi((prev) => !prev);
                  if (onCloseCreate) onCloseCreate();
                } catch (error: any) {
                  toast.error("Lead task could not be created");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
                setFieldTouched,
                setFieldValue,
                isSubmitting,
              }) => (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-white font-medium text-sm mb-1">Owner</p>
                      <input
                        type="text"
                        value={agentName || (storage.getUserRole() === "Agent" ? storage.getUserName() : "") || "Unassigned"}
                        readOnly
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black/60 text-white cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-1">Associated Lead</p>
                      <input
                        type="text"
                        value={values.associated_lead}
                        readOnly
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black/60 text-white cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-1">Subject</p>
                      <input
                        type="text"
                        name="subject"
                        value={values.subject}
                        onChange={handleChange}
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-1">Location</p>
                      <input
                        type="text"
                        name="location"
                        value={values.location}
                        onChange={handleChange}
                        onBlur={() => setFieldTouched("location", true)}
                        placeholder="Enter location"
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                      />
                      {touched.location && errors.location && (
                        <p className="text-red-400 text-xs mt-1">{String(errors.location)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-1">From Date & Time</p>
                      <DatePicker
                        selected={values.start_at}
                        onChange={(date: Date | null) => {
                          if (date) {
                            setFieldValue("start_at", date);
                            setFieldValue("end_at", new Date(date.getTime() + 15 * 60000));
                          }
                        }}
                        showTimeSelect
                        timeFormat="h:mma"
                        timeIntervals={15}
                        dateFormat="MM-dd-yyyy h:mma"
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-1">To Date & Time</p>
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
                    <div className="md:col-span-2">
                      <p className="text-white font-medium text-sm mb-1">Description (Optional)</p>
                      <textarea
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Add task details..."
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white resize-y"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onCloseCreate}
                      className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? "Creating..." : "Create Task"}
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* 3. EDIT TASK MODAL / FLYOUT */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg max-w-2xl w-full p-6 text-white shadow-2xl relative my-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-primary-500 text-2xl font-bold">
                Update Task
              </p>
              <IoCloseOutline
                onClick={() => setEditingTask(null)}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>

            <Formik
              enableReinitialize
              initialValues={{
                location: editingTask?.location || "",
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
                  start_at_text: values.start_at ? formatDateTime(values.start_at) : "",
                  end_at_text: values.end_at ? formatDateTime(values.end_at) : "",
                };
                try {
                  await AxiosProvider.post("/leads/tasks/edit", payload);
                  toast.success("Lead task updated successfully");
                  setHitApi((prev) => !prev);
                  setEditingTask(null);
                } catch (error: any) {
                  toast.error("Lead task could not be updated");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
                setFieldTouched,
                setFieldValue,
                isSubmitting,
              }) => (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-white font-medium text-sm mb-1">Location</p>
                      <input
                        type="text"
                        name="location"
                        value={values.location}
                        onChange={handleChange}
                        onBlur={() => setFieldTouched("location", true)}
                        placeholder="Enter location"
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                      />
                      {touched.location && errors.location && (
                        <p className="text-red-400 text-xs mt-1">{String(errors.location)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-1">Start Date & Time</p>
                      <DatePicker
                        selected={values.start_at}
                        onChange={(date: Date | null) => {
                          if (date) setFieldValue("start_at", date);
                        }}
                        showTimeSelect
                        timeFormat="h:mma"
                        timeIntervals={15}
                        dateFormat="MM-dd-yyyy h:mma"
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white"
                      />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm mb-1">End Date & Time</p>
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
                    <div className="md:col-span-2">
                      <p className="text-white font-medium text-sm mb-1">Details (Optional)</p>
                      <textarea
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Add task details..."
                        className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white resize-y"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? "Updating..." : "Update Task"}
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
}
