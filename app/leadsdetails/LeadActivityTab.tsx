"use client";

import React, { useEffect, useState } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import { FiPlusCircle } from "react-icons/fi";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import StorageManager from "../../provider/StorageManager";

const Select = dynamic(() => import("react-select"), { ssr: false });
const storage = new StorageManager();

export interface ActivityData {
  id: string;
  lead_id: string;
  conversation: string;
  disposition: string;
  disposition_id: string;
  agent_id?: string | null;
  agent_name?: string | null;
  occurred_at?: string | null;
  created_at: string;
  created_at_ca?: string;
  is_edited?: boolean;
}

type Props = {
  leadId: string;
  hitApi?: boolean;
  setHitApi?: React.Dispatch<React.SetStateAction<boolean>>;
};

const activitySchema = Yup.object({
  disposition_id: Yup.string().required("Disposition is required"),
  conversation: Yup.string().trim().required("Conversation note is required"),
  occurred_at: Yup.date().nullable().optional(),
  agent_id: Yup.string().nullable().optional(),
});

export default function LeadActivityTab({ leadId, hitApi, setHitApi }: Props) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [dispositions, setDispositions] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<ActivityData | null>(null);
  const [isExpandedConv, setIsExpandedConv] = useState<Record<string, boolean>>({});

  const userRole = storage.getUserRole();
  const currentUserId = storage.getUserId();
  const currentUserName = storage.getUserName();

  // Fetch Dispositions & Agents
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [dispRes, agentRes] = await Promise.all([
          AxiosProvider.get("/leads/dispositions/all"),
          AxiosProvider.get("/allagents"),
        ]);
        const dispList = dispRes.data?.data?.items || dispRes.data?.data?.data || dispRes.data?.data || [];
        setDispositions(dispList);

        const agentList = agentRes.data?.data?.data || agentRes.data?.data || [];
        setAgents(agentList);
      } catch (err) {
        console.error("Error loading initial data:", err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch Activities
  const fetchActivities = async () => {
    if (!leadId) return;
    setIsLoading(true);
    try {
      const res = await AxiosProvider.post("/leads/activities/list", {
        lead_id: leadId,
        page,
        pageSize: 10,
      });
      const list = res.data?.data?.activities || res.data?.data?.data || [];
      setActivities(list);
      setTotalPages(res.data?.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [leadId, page, hitApi]);

  const handleDelete = (activity: ActivityData) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this activity record?",
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await AxiosProvider.post("/leads/activities/soft-delete", { id: activity.id });
          toast.success("Activity deleted successfully");
          if (setHitApi) setHitApi((prev) => !prev);
          fetchActivities();
        } catch {
          toast.error("Failed to delete activity");
        }
      }
    });
  };

  const handleFormSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const isEdit = Boolean(editingActivity?.id);
      const payload = {
        id: editingActivity?.id,
        lead_id: leadId,
        conversation: values.conversation.trim(),
        disposition_id: values.disposition_id,
        agent_id: values.agent_id || (userRole === "Agent" ? currentUserId : null),
        occurred_at: values.occurred_at ? new Date(values.occurred_at).toISOString() : new Date().toISOString(),
      };

      const url = isEdit ? "/leads/update/activity" : "/leads/activities/create";
      await AxiosProvider.post(url, payload);

      toast.success(isEdit ? "Activity updated successfully" : "Activity created successfully");
      setIsCreateOpen(false);
      setEditingActivity(null);
      if (setHitApi) setHitApi((prev) => !prev);
      fetchActivities();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.msg || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const closeDrawer = () => {
    setIsCreateOpen(false);
    setEditingActivity(null);
  };

  const toggleConversation = (id: string) => {
    setIsExpandedConv((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isDrawerVisible = isCreateOpen || Boolean(editingActivity);

  return (
    <div className="w-full">
      {/* Top Action Button */}
      <div className="flex justify-end items-center mb-4">
        <button
          type="button"
          onClick={() => {
            setEditingActivity(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 py-2 px-4 rounded bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium cursor-pointer transition shadow"
        >
          <FiPlusCircle className="w-4 h-4" /> Add Activity
        </button>
      </div>

      {/* 1. ACTIVITIES TABLE */}
      {activities.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-base font-medium">
          No activity records found
        </p>
      ) : (
        <div className="w-full overflow-x-auto border border-gray-600 rounded-lg">
          <table className="w-full text-left text-sm text-white">
            <thead className="text-xs uppercase talbleheaderBg text-white border-b border-gray-600">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Disposition</th>
                <th className="py-3 px-4">Conversation</th>
                <th className="py-3 px-4">Added By</th>
                <th className="py-3 px-4 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {activities.map((act, idx) => {
                const formattedDate = act.occurred_at
                  ? new Date(act.occurred_at).toLocaleString()
                  : act.created_at
                  ? new Date(act.created_at).toLocaleString()
                  : (act.created_at_ca || "—");
                const isLong = (act.conversation || "").length > 100;
                const isExpanded = Boolean(isExpandedConv[act.id]);

                return (
                  <tr
                    key={act.id || idx}
                    className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-700/80 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-gray-300 font-medium">
                      {(page - 1) * 10 + idx + 1}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-200 whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="py-3 px-4 font-semibold text-primary-300">
                      {act.disposition || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-100 max-w-md">
                      <p>
                        {isLong && !isExpanded
                          ? act.conversation.substring(0, 100) + "..."
                          : act.conversation}
                      </p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleConversation(act.id)}
                          className="text-primary-300 underline text-xs mt-1 cursor-pointer"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-300">
                      {act.agent_name || "—"} {act.is_edited ? "(Edited)" : ""}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingActivity(act);
                          }}
                          className="py-1 px-2.5 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm cursor-pointer transition-colors"
                          title="Edit Activity"
                        >
                          <MdEdit />
                        </button>
                        {userRole === "Admin" && (
                          <button
                            type="button"
                            onClick={() => handleDelete(act)}
                            className="py-1 px-2.5 bg-red-600 hover:bg-red-700 rounded text-white text-sm cursor-pointer transition-colors"
                            title="Delete Activity"
                          >
                            <RiDeleteBin6Line />
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

      {/* Pagination */}
      {activities.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center my-6 gap-3 flex-wrap">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 border border-gray-700 rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 cursor-pointer transition"
          >
            <HiChevronDoubleLeft className="w-5 h-auto" />
          </button>
          <span className="text-sm font-medium text-gray-300 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 border border-gray-700 rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 cursor-pointer transition"
          >
            <HiChevronDoubleRight className="w-5 h-auto" />
          </button>
        </div>
      )}

      {/* 2. CREATE / EDIT ACTIVITY RIGHT-SIDE FLYOUT */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          isDrawerVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[500px] md:w-[600px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isDrawerVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full min-h-auto p-6 sm:p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <p className="text-primary-600 text-2xl font-bold leading-9">
              {editingActivity ? "Edit Activity" : "Add Activity"}
            </p>
            <IoCloseOutline
              onClick={closeDrawer}
              className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
            />
          </div>
          <div className="w-full border-b border-gray-700 mb-6"></div>

          <Formik
            key={editingActivity ? editingActivity.id : isCreateOpen ? "create-open" : "create-closed"}
            enableReinitialize
            initialValues={{
              disposition_id: editingActivity?.disposition_id || "",
              agent_id: editingActivity?.agent_id || (userRole === "Agent" ? currentUserId : ""),
              occurred_at: editingActivity?.occurred_at
                ? new Date(editingActivity.occurred_at)
                : editingActivity?.created_at
                ? new Date(editingActivity.created_at)
                : new Date(),
              conversation: editingActivity?.conversation || "",
            }}
            validationSchema={activitySchema}
            onSubmit={handleFormSubmit}
          >
            {({ isSubmitting, setFieldValue, setFieldTouched, values, errors, touched }) => (
              <Form className="space-y-4">
                {/* 1. Disposition (Searchable Select) */}
                <div>
                  <p className="text-white font-medium text-sm mb-1">
                    Disposition <span className="text-red-500">*</span>
                  </p>
                  <Select
                    value={
                      dispositions.find((d) => d.id === values.disposition_id) || null
                    }
                    onChange={(selected: any) => {
                      const dispId = selected ? selected.id : "";
                      const dispName = selected ? selected.name : "";
                      setFieldValue("disposition_id", dispId);

                      const autoFillList = [
                        "blank call",
                        "not interested",
                        "ringing",
                        "no answer",
                        "busy",
                        "switch off",
                        "not reachable",
                        "out of reach",
                        "wrong number",
                        "call back",
                        "callback",
                      ];
                      const lower = (dispName || "").trim().toLowerCase();
                      const isAutoFill = autoFillList.some(
                        (item) => lower === item || lower.includes(item)
                      );

                      if (isAutoFill && dispName) {
                        setFieldValue("conversation", dispName);
                      } else {
                        // If switching to non-autofill disposition, clear out previous auto-filled value
                        const currentValLower = (values.conversation || "").trim().toLowerCase();
                        const wasAutoFilled = autoFillList.some(
                          (item) => currentValLower === item || currentValLower.includes(item)
                        );
                        if (wasAutoFilled || !values.conversation) {
                          setFieldValue("conversation", "");
                        }
                      }
                    }}
                    onBlur={() => setFieldTouched("disposition_id", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={dispositions}
                    placeholder="Search & Select Disposition..."
                    isSearchable
                    classNames={{
                      control: () =>
                        "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black/60 !border-gray-700 hover:!border-primary-500",
                    }}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        borderRadius: 6,
                        backgroundColor: "#181818",
                        border: "1px solid #374151",
                        zIndex: 9999,
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                          ? "#282828"
                          : "#181818",
                        color: "#fff",
                        cursor: "pointer",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff" }),
                      input: (base) => ({ ...base, color: "#fff" }),
                      placeholder: (base) => ({ ...base, color: "#9ca3af" }),
                    }}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                  />
                  {touched.disposition_id && errors.disposition_id && (
                    <p className="text-red-400 text-xs mt-1">{String(errors.disposition_id)}</p>
                  )}
                </div>

                {/* 2. Agent / Logged By */}
                <div>
                  <p className="text-white font-medium text-sm mb-1">
                    Agent / Logged By
                  </p>
                  {userRole === "Admin" ? (
                    <Select
                      value={
                        agents.find((a) => a.id === values.agent_id) || null
                      }
                      onChange={(selected: any) => {
                        setFieldValue("agent_id", selected ? selected.id : "");
                      }}
                      onBlur={() => setFieldTouched("agent_id", true)}
                      getOptionLabel={(opt: any) => opt.name || opt.email}
                      getOptionValue={(opt: any) => opt.id}
                      options={agents}
                      placeholder="Select Agent..."
                      isSearchable
                      classNames={{
                        control: () =>
                          "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black/60 !border-gray-700 hover:!border-primary-500",
                      }}
                      styles={{
                        menu: (base) => ({
                          ...base,
                          borderRadius: 6,
                          backgroundColor: "#181818",
                          border: "1px solid #374151",
                          zIndex: 9999,
                        }),
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        option: (base, { isFocused, isSelected }) => ({
                          ...base,
                          backgroundColor: isSelected
                            ? "var(--primary-600)"
                            : isFocused
                            ? "#282828"
                            : "#181818",
                          color: "#fff",
                          cursor: "pointer",
                        }),
                        singleValue: (base) => ({ ...base, color: "#fff" }),
                        input: (base) => ({ ...base, color: "#fff" }),
                        placeholder: (base) => ({ ...base, color: "#9ca3af" }),
                      }}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                    />
                  ) : (
                    <input
                      type="text"
                      value={currentUserName || "Current Agent"}
                      readOnly
                      className="w-full border border-gray-700 rounded text-sm p-3 bg-black/60 text-white cursor-not-allowed"
                    />
                  )}
                </div>

                {/* 3. Conversation Notes */}
                <div>
                  <p className="text-white font-medium text-sm mb-1">
                    Conversation Notes <span className="text-red-500">*</span>
                  </p>
                  <Field
                    as="textarea"
                    name="conversation"
                    rows={5}
                    placeholder="Enter conversation notes or details..."
                    className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white outline-none focus:border-primary-500 resize-none"
                  />
                  <ErrorMessage name="conversation" component="div" className="text-red-400 text-xs mt-1" />
                </div>



                {/* Action Buttons */}
                <div className="mt-8 flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-medium transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : editingActivity ? "Update Activity" : "Save Activity"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
