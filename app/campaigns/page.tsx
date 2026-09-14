"use client";

import Image from "next/image";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import { useEffect, useState } from "react";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { IoCloseOutline } from "react-icons/io5";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { FaEdit, FaEye, FaPhoneAlt } from "react-icons/fa";
import { FiPlusCircle } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { RxAvatar } from "react-icons/rx";
import { MdOutlineSettings, MdDateRange, MdShareLocation } from "react-icons/md";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import Swal from "sweetalert2";
import Select from "react-select";
import { useAutoDialer } from "../../provider/AutoDialerContext";

const customSelectStyles = {
  control: (base: any, { isFocused }: any) => ({
    ...base,
    height: "38px",
    minHeight: "38px",
    backgroundColor: "#000",
    borderColor: isFocused ? "var(--primary-500, #0284c7)" : "#374151",
    borderRadius: 4,
    fontSize: "12px",
    boxShadow: "none",
    "&:hover": {
      borderColor: isFocused ? "var(--primary-500, #0284c7)" : "#4b5563",
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: "38px",
    padding: "0 8px",
  }),
  input: (base: any) => ({
    ...base,
    margin: "0px",
    padding: "0px",
    color: "#fff",
    fontSize: "12px",
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: "38px",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "#fff",
    fontSize: "12px",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#aaa",
    fontSize: "12px",
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: 4,
    backgroundColor: "#000",
    border: "1px solid #374151",
    zIndex: 9999,
  }),
  option: (base: any, { isFocused, isSelected }: any) => ({
    ...base,
    backgroundColor: isSelected
      ? "var(--primary-600, #0284c7)"
      : isFocused
      ? "#222"
      : "#000",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    padding: "8px 12px",
  }),
};

const campaignSchema = Yup.object({
  name: Yup.string().trim().required("Campaign name is required").max(255),
  lead_source_id: Yup.string().required("Lead source is required"),
});

export default function CampaignsPage() {
  const {
    startCampaignDialer,
    stopAutoDialer,
    activeCampaignId,
    activeCampaignName,
    campaignQueue,
    campaignIndex,
    currentLead,
    callDuration,
    status: dialerStatus,
  } = useAutoDialer();
  const [data, setData] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [liveActiveCall, setLiveActiveCall] = useState<any | null>(null);
  const [manuallyStoppedCampaigns, setManuallyStoppedCampaigns] = useState<string[]>([]);

  const handleStopCampaign = async (campaignId: string) => {
    setManuallyStoppedCampaigns((prev) => (prev.includes(campaignId) ? prev : [...prev, campaignId]));
    setLiveActiveCall(null);
    try {
      await AxiosProvider.post("/leads/dialer/stop", { campaign_id: campaignId });
    } catch {}
    stopAutoDialer();
    await fetchData(true);
  };

  const handleStartCampaign = async (campaignId: string, campaignName?: string) => {
    setManuallyStoppedCampaigns((prev) => prev.filter((id) => id !== campaignId));
    await startCampaignDialer(campaignId, campaignName);
  };

  const [flyout, setFlyout] = useState<"add" | "edit" | "view" | "">("");
  const [selectedData, setSelectedData] = useState<any | null>(null);

  // Format call duration MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const fetchLeadSources = async () => {
    try {
      const res = await AxiosProvider.get("/lead-sources?limit=100");
      if (res.data?.success) {
        setLeadSources(
          (res.data.data || []).map((s: any) => ({
            value: s.id,
            label: s.name,
          }))
        );
      }
    } catch {
      // ignore
    }
  };

  const fetchData = async (isSilent: boolean = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [res, activeRes] = await Promise.all([
        AxiosProvider.get(`/campaigns?page=${page}&limit=20`),
        AxiosProvider.get(`/leads/dialer/active-call`).catch(() => ({ data: { data: null } })),
      ]);

      if (res.data?.success) {
        const campaignsList = Array.isArray(res.data.data) ? res.data.data : [];
        setData(campaignsList);
        setTotalPages(res.data.pagination?.totalPages || 1);

        const currentActive = activeRes.data?.data;
        setLiveActiveCall(currentActive || null);

        // If local activeCampaignId has 0 pending leads and no active call, auto-clear local dialer session
        if (activeCampaignId) {
          const matchedCampaign = campaignsList.find((c: any) => c.id === activeCampaignId);
          const pending = Number(
            matchedCampaign?.pending_leads ??
              (matchedCampaign ? matchedCampaign.total_leads - (matchedCampaign.dialed_leads || 0) : 0)
          );
          if (
            matchedCampaign &&
            pending <= 0 &&
            (!currentActive || currentActive.campaign_id !== matchedCampaign.id)
          ) {
            stopAutoDialer();
          }
        }
      }
    } catch {
      if (!isSilent) toast.error("Failed to load campaigns");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadSources();
  }, []);

  // Real-time live auto-sync (polls every 3s silently so dialed & pending counts update dynamically without page refresh)
  useEffect(() => {
    fetchData(false);

    const interval = setInterval(() => {
      fetchData(true);
    }, 3000);

    const handleFocus = () => {
      fetchData(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
      }
    };
  }, [page]);

  // Immediate table refresh on local dialer events
  useEffect(() => {
    const handleDialerFinished = () => {
      fetchData(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("campaign-dialer-finished", handleDialerFinished);
      window.addEventListener("lead-activity-updated", handleDialerFinished);
      return () => {
        window.removeEventListener("campaign-dialer-finished", handleDialerFinished);
        window.removeEventListener("lead-activity-updated", handleDialerFinished);
      };
    }
  }, []);

  const handleResetDialer = async (campaignId: string, campaignName: string) => {
    const confirm = await Swal.fire({
      title: "Re-dial Campaign?",
      text: `Do you want to reset unanswered leads in "${campaignName}" so they can be dialed again?`,
      icon: "question",
      background: "#181818",
      color: "#ffffff",
      showCancelButton: true,
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#374151",
      confirmButtonText: "Yes, Reset & Allow Re-dial",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "border border-gray-700 rounded-2xl shadow-2xl",
      },
    });

    if (confirm.isConfirmed) {
      try {
        await AxiosProvider.post(`/campaigns/${campaignId}/reset-dialer`);
        toast.success("Campaign leads reset for re-dialing!");
        fetchData();
      } catch (e) {
        toast.error("Failed to reset campaign dialer");
      }
    }
  };

  const closeFlyout = () => {
    setFlyout("");
    setSelectedData(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: "Are you sure?",
      text: `Delete campaign "${name}"?`,
      icon: "warning",
      background: "#181818",
      color: "#ffffff",
      iconColor: "#eab308",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });
    if (res.isConfirmed) {
      try {
        await AxiosProvider.delete(`/campaigns/${id}`);
        toast.success("Campaign deleted successfully");
        fetchData();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Delete failed");
      }
    }
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const isEdit = flyout === "edit" && selectedData?.id;
      const res = isEdit
        ? await AxiosProvider.put(`/campaigns/${selectedData.id}`, values)
        : await AxiosProvider.post("/campaigns", values);

      if (res.data?.success) {
        toast.success(isEdit ? "Campaign updated successfully" : "Campaign created successfully");
        closeFlyout();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0] || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const isChecking = useAuthRedirect();
  if (isChecking || (isLoading && data.length === 0)) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center bg-black">
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
    <>
      <LeftSideBar />
      <div className="flex justify-end min-h-screen">
        <div className="ml-[97px] w-full md:w-[90%] m-auto min-h-[500px] rounded p-4 mt-0">
          <DesktopHeader />

          {/* ---------------- Main Container ----------------------- */}
          <div className="relative overflow-x-auto shadow-lastTransaction rounded-xl sm:rounded-3xl px-1 py-6 md:p-6 z-10 mainContainerBg">
            {/* Top Action Button (Create Campaign) */}
            <div className="flex justify-end items-center mb-6 w-full mx-auto gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 h-[38px] px-4 rounded-[4px] border border-[#E7E7E7] bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold tracking-wide cursor-pointer transition shadow-sm"
                onClick={() => {
                  setSelectedData(null);
                  setFlyout("add");
                }}
              >
                <FiPlusCircle className="w-4 h-4 text-white" />
                <span>Add Campaign</span>
              </button>
            </div>

            {/* Table */}
            <table className="w-full text-xs text-left text-white whitespace-nowrap">
              <thead className="text-xs text-[#999999] talbleheaderBg">
                <tr>
                  <th scope="col" className="px-3 py-2.5 w-14 text-center">
                    <span className="font-bold text-white text-xs tracking-wide">
                      #
                    </span>
                  </th>

                  <th scope="col" className="px-3 py-2 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <MdShareLocation className="w-4 h-4 text-white" />
                      <span className="font-bold text-white text-xs tracking-wide">
                        Lead Source
                      </span>
                    </div>
                  </th>

                  <th scope="col" className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <RxAvatar className="w-4 h-4 text-white" />
                      <span className="font-bold text-white text-xs tracking-wide">
                        Campaign Name
                      </span>
                    </div>
                  </th>

                  <th scope="col" className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-bold text-white text-xs tracking-wide">
                        Total Leads
                      </span>
                    </div>
                  </th>

                  <th scope="col" className="px-3 py-2 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <MdDateRange className="w-4 h-4 text-white" />
                      <span className="font-bold text-white text-xs tracking-wide">
                        Created Date
                      </span>
                    </div>
                  </th>

                  <th scope="col" className="px-3 py-2 md:table-cell">
                    <div className="flex items-center gap-2">
                      <MdOutlineSettings className="w-4 h-4 text-white" />
                      <span className="font-bold text-white text-xs tracking-wide">
                        Action
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-white">
                      <div className="animate-pulse">Loading campaigns...</div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-xl py-8 text-white">
                      <div>Data not found</div>
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => {
                    const isManuallyStopped = manuallyStoppedCampaigns.includes(row.id);
                    const isLive =
                      !isManuallyStopped &&
                      ((liveActiveCall && liveActiveCall.campaign_id === row.id) ||
                        (activeCampaignId === row.id &&
                          dialerStatus !== "idle" &&
                          dialerStatus !== "completed" &&
                          Number(row.pending_leads ?? (row.total_leads - (row.dialed_leads || 0))) > 0));

                    const isAllCompleted =
                      Number(row.total_leads || 0) > 0 &&
                      Number(row.pending_leads ?? (row.total_leads - (row.dialed_leads || 0))) <= 0 &&
                      (!liveActiveCall || liveActiveCall.campaign_id !== row.id);

                    const liveCallNum = Math.min(
                      Number(row.dialed_leads || 0) + (isLive ? 1 : 0),
                      Number(row.total_leads || 1)
                    );

                    return (
                      <tr
                        key={row.id || idx}
                        className="hover:bg-primary-700 border-b border-[#E7E7E7] odd:bg-[#404040]"
                      >
                        <td className="px-3 py-2 text-center text-gray-300 font-medium w-14">
                          {(page - 1) * 20 + idx + 1}
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-white font-medium">
                          {row.lead_source_name || "-"}
                        </td>
                        <td className="px-3 py-2 font-semibold text-white">
                          {row.name}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800">
                              {Number(row.total_leads || 0)} Total
                            </span>
                            {/* Dialed vs Pending Badges */}
                            {Number(row.total_leads || 0) > 0 && (
                              isAllCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  ✅ {Number(row.dialed_leads || row.total_leads)}/{Number(row.total_leads)} Dialed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-800 text-gray-300 border border-gray-700">
                                  {Number(row.dialed_leads || 0)}/{Number(row.total_leads)} Dialed ({Number(row.pending_leads ?? (row.total_leads - (row.dialed_leads || 0)))} Pending)
                                </span>
                              )
                            )}
                            {/* Live Calling Indicator */}
                            {isLive && !isAllCompleted && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Calling: {liveCallNum}/{Number(row.total_leads)}
                                {liveActiveCall?.full_name ? ` (${liveActiveCall.full_name})` : ""}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-white">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-3 py-2 md:table-cell">
                          <div className="inline-flex items-center rounded-lg border border-gray-700 bg-black p-1 gap-1.5 shadow-sm">
                            {/* 📞 Start / Stop / Completed Campaign Calling Button */}
                            {isLive && !isAllCompleted ? (
                              <button
                                type="button"
                                onClick={() => handleStopCampaign(row.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-600 hover:bg-red-700 text-white animate-pulse shadow transition cursor-pointer"
                                title="Stop Calling"
                              >
                                <FaPhoneAlt className="w-2.5 h-2.5" />
                                <span>Stop ({liveCallNum}/{Number(row.total_leads)})</span>
                              </button>
                            ) : isAllCompleted ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800 cursor-not-allowed opacity-90"
                                  title="All leads in this campaign have already been dialed"
                                >
                                  <span>✅ All Dialed</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetDialer(row.id, row.name)}
                                  className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition cursor-pointer"
                                  title="Re-dial Campaign (Reset unanswered leads)"
                                >
                                  🔄
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartCampaign(row.id, row.name)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition cursor-pointer"
                                title="Start Calling Pending Leads"
                              >
                                <FaPhoneAlt className="w-2.5 h-2.5" />
                                <span>Start ({Number(row.pending_leads ?? (row.total_leads || 0))})</span>
                              </button>
                            )}

                          <button
                            onClick={() => {
                              setSelectedData(row);
                              setFlyout("view");
                            }}
                            className="p-1 hover:bg-primary-700 rounded-md text-white transition cursor-pointer"
                            title="View Details"
                          >
                            <FaEye className="text-white w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedData(row);
                              setFlyout("edit");
                            }}
                            className="p-1 hover:bg-primary-700 rounded-md text-white transition cursor-pointer"
                            title="Edit Campaign"
                          >
                            <FaEdit className="text-white w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id, row.name)}
                            className="p-1 hover:bg-red-700 rounded-md text-white transition cursor-pointer"
                            title="Delete Campaign"
                          >
                            <RiDeleteBin6Line className="text-white w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>

            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="flex justify-center items-center my-10 relative gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-2 mx-2 border rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <HiChevronDoubleLeft className="w-6 h-auto" />
                </button>
                <span className="text-white text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-2 mx-2 border rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <HiChevronDoubleRight className="w-6 h-auto" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flyout Overlay */}
      {flyout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 cursor-pointer" onClick={closeFlyout} />
      )}

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[500px] md:w-[550px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          flyout ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ADD / EDIT FORM */}
        {(flyout === "add" || flyout === "edit") && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-500 text-[26px] font-bold leading-9">
                {flyout === "edit" ? "Edit Campaign" : "Create Campaign"}
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
              />
            </div>

            <Formik
              initialValues={{
                name: selectedData?.name || "",
                lead_source_id: selectedData?.lead_source_id || "",
              }}
              validationSchema={campaignSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-4">
                  <div>
                    <p className="text-white text-xs mb-1.5 font-medium">
                      Lead Source (Platform) <span className="text-red-500">*</span>
                    </p>
                    <Select
                      options={leadSources}
                      value={leadSources.find((s) => s.value === values.lead_source_id) || null}
                      onChange={(opt: any) => setFieldValue("lead_source_id", opt ? opt.value : "")}
                      isClearable
                      placeholder="Select Lead Source"
                      styles={customSelectStyles}
                    />
                    <ErrorMessage name="lead_source_id" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <p className="text-white text-xs mb-1.5 font-medium">
                      Campaign Name <span className="text-red-500">*</span>
                    </p>
                    <Field
                      name="name"
                      placeholder="e.g. Diabetes Care Aug Promo"
                      className="hover:shadow-hoverInputShadow focus:border-primary-600 w-full h-[38px] border border-gray-700 rounded-[4px] text-white text-xs placeholder-gray-400 px-3 bg-black outline-none"
                    />
                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-[38px] bg-primary-600 hover:bg-primary-700 rounded-[4px] text-white text-xs font-semibold cursor-pointer transition flex items-center justify-center disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : flyout === "edit" ? "Update Campaign" : "Create Campaign"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}

        {/* VIEW DETAILS */}
        {flyout === "view" && selectedData && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-500 text-[26px] font-bold leading-9">
                Campaign Details
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary-400 border-b border-gray-800 pb-2">Campaign Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Linked Lead Source</p>
                  <p className="text-sm font-medium text-gray-200 mt-0.5">{selectedData.lead_source_name || "None"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Campaign Name</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{selectedData.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Created At</p>
                  <p className="text-sm font-medium text-gray-200 mt-0.5">
                    {selectedData.created_at ? new Date(selectedData.created_at).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-8">
              <button
                onClick={closeFlyout}
                className="w-full h-[38px] bg-primary-600 hover:bg-primary-700 rounded-[4px] text-white text-xs font-semibold cursor-pointer transition flex items-center justify-center"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
