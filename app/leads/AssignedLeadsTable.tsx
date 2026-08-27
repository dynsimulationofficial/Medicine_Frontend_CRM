"use client";

import React, { useState, useEffect } from "react";
import { FaRegCheckCircle, FaSearchPlus } from "react-icons/fa";
import { RxAvatar } from "react-icons/rx";
import { IoMailOpenOutline, IoCloseOutline } from "react-icons/io5";
import { MdOutlinePhone, MdOutlineLocationCity, MdOutlineSettings, MdEdit } from "react-icons/md";
import { ImUserTie } from "react-icons/im";
import { RiDeleteBin6Line } from "react-icons/ri";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { FaEllipsisVertical } from "react-icons/fa6";
import { FiFilter } from "react-icons/fi";
import { Tooltip } from "react-tooltip";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";

import AxiosProvider from "../../provider/AxiosProvider";
import { statesByCountry, countryOptions, leadStatusOptions } from "./CreateLead";

const LeadSchema = Yup.object({
  full_name: Yup.string().trim().required("Full name is required"),
  email: Yup.string()
    .trim()
    .email("Enter a valid email")
    .required("Email is required"),
  phone: Yup.string()
    .trim()
    .required("Phone number is required")
    .test(
      "is-valid-phone",
      "Enter a valid phone number (e.g. +919876543210, +447911123456)",
      (val) => {
        if (!val) return false;
        const clean = (val || "").replace(/\s+|[-()]/g, "");
        return /^\+?[0-9]{7,15}$/.test(clean);
      },
    ),
  address_line1: Yup.string().nullable().notRequired(),
  address_line2: Yup.string().nullable().notRequired(),
  city: Yup.string().nullable().notRequired(),
  state: Yup.string().nullable().notRequired(),
  postal_code: Yup.string().nullable().notRequired(),
  country: Yup.string().nullable().notRequired(),
  best_time_to_call: Yup.string().nullable().notRequired(),
  lead_source_id: Yup.string().nullable().notRequired(),
});

const AssignedLeadsTable = ({
  userRole = "",
  refreshKey = 0,
  onViewLead,
}: any) => {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter state inside Assigned
  const [filterData, setFilterData] = useState<any | null>(null);

  // Local dropdown states
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  const [agentList, setAgentList] = useState<any[]>([]);

  // ✅ Exact sample code formula: single flyout state
  const [flyout, setFlyout] = useState<"edit" | "search" | "bulk_assign" | "">("");
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  const closeFlyout = () => {
    setFlyout("");
    setSelectedData(null);
    setSelectedAgent(null);
  };

  // Fetch dropdowns on mount
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [srcRes, agentRes] = await Promise.all([
          AxiosProvider.get("/leadsources"),
          AxiosProvider.get("/allagents"),
        ]);
        setLeadSourceData(srcRes.data?.data?.data ?? []);
        setAgentList(agentRes.data?.data?.data ?? []);
      } catch (err) {
        console.error("Error fetching dropdowns in AssignedLeadsTable:", err);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch Assigned Leads API (Standard or Filtered)
  const fetchLeads = async (targetPage: number = page, appliedFilter: any = filterData) => {
    setIsLoading(true);
    setIsError(false);
    try {
      let response;
      if (appliedFilter && Object.keys(appliedFilter).length > 0) {
        response = await AxiosProvider.post(
          `/leads/filter?page=${targetPage}&pageSize=${pageSize}`,
          appliedFilter,
        );
      } else {
        response = await AxiosProvider.get(
          `/leads/assigned?page=${targetPage}&pageSize=${pageSize}`,
        );
      }

      if (response.data?.success) {
        const leadList = response.data.data?.data ?? (Array.isArray(response.data.data) ? response.data.data : []);
        setData(leadList);
        setTotalPages(response.data.data?.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching assigned leads:", error);
      setIsError(true);
      toast.error("Failed to load assigned leads");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(page, filterData);
  }, [page, refreshKey, filterData]);

  // Clear selection on refreshKey change
  useEffect(() => {
    setSelectedIds([]);
  }, [refreshKey]);

  // Sync checkboxes with current page data
  useEffect(() => {
    if (!data?.length) {
      setSelectedIds([]);
      return;
    }
    const valid = new Set(data.map((x: any) => x.id));
    setSelectedIds((prev) => prev.filter((id) => valid.has(id)));
  }, [data]);

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? data.map((i: any) => i.id) : []);
  };

  const areAllSelected = !!data?.length && data.every((i: any) => selectedIds.includes(i.id));

  // --- Edit Lead Submit ---
  const handleUpdateLead = async (values: any) => {
    try {
      await AxiosProvider.post("/leads/update", values);
      toast.success("Lead is Updated");
      closeFlyout();
      fetchLeads(page, filterData);
    } catch (error: any) {
      toast.error(
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Lead is not Updated",
      );
    }
  };

  // --- Bulk Assign Agent Submit ---
  const handleBulkAssignAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) {
      toast.error("Please select an agent");
      return;
    }
    try {
      await AxiosProvider.post("/leads/assigned/bulk", {
        lead_ids: selectedIds,
        agent_id: selectedAgent.id,
      });
      toast.success("Leads assigned successfully");
      setSelectedIds([]);
      setSelectedAgent(null);
      closeFlyout();
      fetchLeads(page, filterData);
    } catch (error: any) {
      toast.error("Failed to assign leads");
    }
  };

  // --- Delete Lead ---
  const handleDeleteLead = async (leadId: string) => {
    const res = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this Lead?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (res.isConfirmed) {
      try {
        await AxiosProvider.post("/leads/soft-delete", { lead_id: leadId });
        toast.success("Successfully Deleted");
        fetchLeads(page, filterData);
      } catch (error: any) {
        toast.error(error.response?.data?.msg || "Failed to delete lead");
      }
    }
  };

  // --- Clear Filter ---
  const handleClearFilter = () => {
    setFilterData(null);
    setPage(1);
    fetchLeads(1, null);
  };

  return (
    <>
      {/* Table Toolbar (Bulk Action on Left, Search & Filter on Right) */}
      <div className="flex justify-between items-center gap-3 mb-4">
        <div>
          {selectedIds.length > 0 && userRole === "Admin" && (
            <button
              onClick={() => setFlyout("bulk_assign")}
              className="flex items-center gap-2 py-2 px-4 rounded-[12px] border border-[#E7E7E7] bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition cursor-pointer"
            >
              <FiFilter className="w-4 h-4 text-white" />
              <span>Assign Agent Bulk ({selectedIds.length})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {filterData && (
            <button
              onClick={handleClearFilter}
              className="flex items-center gap-2 py-2 px-4 rounded-[12px] border border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-sm font-medium transition cursor-pointer"
            >
              <IoCloseOutline className="w-4 h-4" />
              <span>Clear Filter</span>
            </button>
          )}
          <button
            onClick={() => setFlyout("search")}
            className="flex items-center gap-2 py-2 px-4 rounded-[12px] border border-[#E7E7E7] bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition cursor-pointer"
          >
            <FaSearchPlus className="w-4 h-4" />
            <span>Search Assigned Leads</span>
          </button>
        </div>
      </div>

      <table className="w-full text-sm text-left text-white whitespace-nowrap">
        <thead className="text-xs text-[#999999] talbleheaderBg">
          <tr>
            <th scope="col" className="px-3 py-3 md:p-3">
              <div className="flex items-center gap-2">
                <FaRegCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="font-semibold text-white text-lg sm:text-base">
                  Select
                </span>
                <input
                  type="checkbox"
                  className="accent-primary-600"
                  checked={areAllSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </div>
            </th>

            <th scope="col" className="px-3 py-3 md:p-3">
              <div className="flex items-center gap-2">
                <RxAvatar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="font-semibold text-white text-lg sm:text-base">
                  Full Name
                </span>
              </div>
            </th>

            <th scope="col" className="px-3 py-2 hidden md:table-cell">
              <div className="flex items-center gap-2">
                <IoMailOpenOutline className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="font-semibold text-white text-lg sm:text-base">
                  Email
                </span>
              </div>
            </th>

            <th scope="col" className="px-3 py-2 hidden md:table-cell">
              <div className="flex items-center gap-2">
                <MdOutlinePhone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="font-semibold text-white text-lg sm:text-base">
                  Phone
                </span>
              </div>
            </th>

            <th scope="col" className="px-3 py-2 hidden md:table-cell">
              <div className="flex items-center gap-2">
                <MdOutlineLocationCity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="font-semibold text-white text-lg sm:text-base">
                  Address
                </span>
              </div>
            </th>

            <th scope="col" className="px-3 py-2 hidden md:table-cell">
              <div className="flex items-center gap-2">
                <ImUserTie className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="font-semibold text-white text-lg sm:text-base">
                  Agent
                </span>
              </div>
            </th>

            <th scope="col" className="px-3 py-2 md:table-cell">
              <div className="flex items-center gap-2">
                <MdOutlineSettings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="font-semibold text-white text-lg sm:text-base">
                  Action
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-white">
                <div className="animate-pulse">Loading leads...</div>
              </td>
            </tr>
          ) : !data || data.length === 0 || isError ? (
            <tr>
              <td colSpan={7} className="text-center text-xl py-8 text-white">
                <div>Data not found</div>
              </td>
            </tr>
          ) : (
            data.map((item: any, index: number) => (
              <tr
                key={item?.id ?? index}
                className="odd:bg-[#404040] hover:bg-primary-700 py-3 border-b border-[#E7E7E7]"
              >
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    className="accent-primary-600"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => toggleRow(item.id, e.target.checked)}
                  />
                </td>

                {/* Full name */}
                <td
                  onClick={() => onViewLead && onViewLead(item.id)}
                  className="px-1 py-2 md:px-3 md:py-3 flex items-center gap-2 text-primary-600 underline cursor-pointer"
                >
                  <div className="flex gap-2">
                    <div className="md:hidden">
                      <FaEllipsisVertical
                        data-tooltip-id="my-tooltip"
                        data-tooltip-html={`<div>
                          <strong>Name:</strong> <span style="text-transform: capitalize;">${item?.full_name ?? "-"}</span><br/>
                          <strong>Email:</strong> ${item?.email ?? "-"}<br/>
                          <strong>Phone:</strong> ${item?.phone ?? "-"}<br/>
                          <strong>Owner:</strong> ${item?.owner_name ?? "-"}
                        </div>`}
                        className="text-white leading-normal relative top-[5.3px] capitalize"
                      />
                      <Tooltip id="my-tooltip" place="right" float className="box" />
                    </div>
                    <div className="cursor-pointer">
                      <p className="text-primary-600 text-sm sm:text-base font-medium leading-normal capitalize">
                        {item?.full_name ?? "-"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td className="px-3 py-2 hidden md:table-cell">
                  <span className="text-white text-sm sm:text-base">
                    {item?.email ?? "-"}
                  </span>
                </td>

                {/* Phone */}
                <td className="px-3 py-2 hidden md:table-cell">
                  <span className="text-white text-sm sm:text-base">
                    {item?.phone ?? "-"}
                  </span>
                </td>

                {/* Address */}
                <td className="px-3 py-2 hidden md:table-cell">
                  <span className="text-white text-sm sm:text-base capitalize">
                    {item?.address?.line1 ?? "-"}
                  </span>
                </td>

                {/* Agent */}
                <td className="px-3 py-2 hidden md:table-cell">
                  <span className="text-white text-sm sm:text-base capitalize">
                    {item?.agent?.name ?? item?.owner_name ?? "-"}
                  </span>
                </td>

                {/* Action */}
                <td className="px-3 py-2 md:table-cell">
                  <div className="flex gap-1 md:gap-2 justify-center md:justify-start">
                    <button
                      onClick={() => {
                        setSelectedData(item);
                        setFlyout("edit");
                      }}
                      className="py-1 px-3 bg-black hover:bg-primary-800 active:bg-primary-800 flex gap-2 items-center rounded-xl"
                      title="Edit Lead"
                    >
                      <MdEdit className="text-white w-4 h-4 hover:text-white" />
                    </button>

                    {userRole === "Admin" && (
                      <button
                        onClick={() => handleDeleteLead(item.id)}
                        className="py-1 px-3 bg-black hover:bg-primary-800 active:bg-primary-800 flex gap-2 items-center rounded-xl"
                        title="Delete Lead"
                      >
                        <RiDeleteBin6Line className="text-white w-4 h-4 hover:text-white" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {data && data.length > 0 && (
        <div className="flex justify-center items-center my-10 relative">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiChevronDoubleLeft className="w-6 h-auto" />
          </button>
          <span className="text-white text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiChevronDoubleRight className="w-6 h-auto" />
          </button>
        </div>
      )}

      {/* Overlay Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          flyout ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeFlyout}
      />

      {/* Sidebar Drawer Container */}
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[600px] md:w-[700px] xl:w-[800px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          flyout ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* --- BULK ASSIGN AGENT FORM --- */}
        {flyout === "bulk_assign" && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-600 text-2xl font-bold leading-9">
                Assign to Agent Bulk ({selectedIds.length})
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-[#E7E7E7] text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>

            <form onSubmit={handleBulkAssignAgent} className="w-full space-y-6">
              <div className="w-full">
                <p className="text-white text-base leading-6 mb-2">Select Agent *</p>
                <Select
                  value={selectedAgent}
                  onChange={(selected: any) => setSelectedAgent(selected)}
                  options={agentList}
                  getOptionLabel={(opt: any) => opt.name}
                  getOptionValue={(opt: any) => String(opt.id)}
                  placeholder="Select Agent"
                  isClearable
                  classNames={{
                    control: ({ isFocused }: any) =>
                      `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                        isFocused ? "!border-primary-500" : "!border-gray-700"
                      }`,
                  }}
                  styles={{
                    menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                    option: (base, { isFocused, isSelected }) => ({
                      ...base,
                      backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                      color: "#fff",
                      cursor: "pointer",
                    }),
                    singleValue: (base) => ({ ...base, color: "#fff" }),
                    input: (base) => ({ ...base, color: "#fff" }),
                    placeholder: (base) => ({ ...base, color: "#aaa" }),
                  }}
                />
              </div>

              <button
                type="submit"
                className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:bg-primary-700 w-full cursor-pointer"
              >
                Assign Selected Leads ({selectedIds.length})
              </button>
            </form>
          </div>
        )}

        {/* --- EDIT LEAD FORM (ASSIGNED) --- */}
        {flyout === "edit" && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-500 text-2xl font-bold leading-9">
                Edit Lead (Assigned)
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>

            <Formik
              enableReinitialize
              initialValues={{
                id: selectedData?.id ?? "",
                full_name: selectedData?.full_name ?? "",
                email: selectedData?.email ?? "",
                phone: selectedData?.phone ?? "",
                address_line1: selectedData?.address?.line1 ?? selectedData?.address_line1 ?? "",
                address_line2: selectedData?.address?.line2 ?? selectedData?.address_line2 ?? "",
                city: selectedData?.address?.city ?? selectedData?.city ?? "",
                country: selectedData?.address?.country ?? selectedData?.country ?? "India",
                state: selectedData?.address?.state ?? selectedData?.state ?? "",
                postal_code: selectedData?.address?.postal_code ?? selectedData?.postal_code ?? "",
                best_time_to_call: selectedData?.best_time_to_call ?? "",
                lead_source_id:
                  selectedData?.lead_source_id ||
                  selectedData?.lead_source?.id ||
                  leadSourceData.find(
                    (s: any) =>
                      s.name?.toLowerCase() ===
                      (typeof selectedData?.lead_source === "string"
                        ? selectedData?.lead_source?.toLowerCase()
                        : ""),
                  )?.id ||
                  "",
                whatsapp_number: selectedData?.whatsapp_number ?? "",
                agent_id: selectedData?.agent?.id || selectedData?.agent_id || "",
                lead_status: selectedData?.lead_status ?? "New",
              }}
              validationSchema={LeadSchema}
              onSubmit={(values, { setSubmitting }) => {
                const value = {
                  id: values.id,
                  full_name: values.full_name,
                  email: values.email,
                  phone: values.phone || undefined,
                  address_line1: values.address_line1 || undefined,
                  address_line2: values.address_line2 || undefined,
                  city: values.city || undefined,
                  country: values.country || undefined,
                  state: values.state || undefined,
                  postal_code: values.postal_code || undefined,
                  best_time_to_call: values.best_time_to_call || undefined,
                  lead_source_id: values.lead_source_id || undefined,
                  whatsapp_number: values.whatsapp_number || undefined,
                  agent_id: values.agent_id || undefined,
                  lead_status: values.lead_status || undefined,
                };
                handleUpdateLead(value);
                setSubmitting(false);
              }}
            >
              {({ handleSubmit, isSubmitting, values, setFieldValue, setFieldTouched }) => {
                const currentStates =
                  statesByCountry[values.country] || Object.values(statesByCountry).flat();

                return (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Full Name */}
                      <div>
                        <p className="text-white mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </p>
                        <Field
                          type="text"
                          name="full_name"
                          className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                        />
                        <ErrorMessage name="full_name" component="div" className="text-red-500 text-xs mt-1" />
                      </div>

                      {/* Email */}
                      <div>
                        <p className="text-white mb-2">
                          Email <span className="text-red-500">*</span>
                        </p>
                        <Field
                          type="email"
                          name="email"
                          className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                        />
                        <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                      </div>

                      {/* Phone */}
                      <div>
                        <p className="text-white mb-2">
                          Phone <span className="text-red-500">*</span>
                        </p>
                        <div className="flex w-full border border-gray-700 rounded-[4px] bg-black overflow-hidden focus-within:border-primary-600">
                          <select
                            className="bg-black text-white text-sm border-r border-gray-700 px-2 py-3 outline-none cursor-pointer"
                            value={values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91"}
                            onChange={(e) => {
                              const newPrefix = e.target.value;
                              const currentCode = values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91";
                              const numberPart = (values.phone || "").replace(currentCode, "");
                              setFieldValue("phone", numberPart ? newPrefix + numberPart : newPrefix);
                            }}
                          >
                            <option value="+91">+91</option>
                            <option value="+44">+44</option>
                            <option value="+1">+1</option>
                          </select>
                          <input
                            type="text"
                            maxLength={15}
                            className="w-full bg-transparent text-white text-sm px-3 py-3 outline-none placeholder-gray-400"
                            placeholder="Enter phone number"
                            value={(() => {
                              const code = values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91";
                              return (values.phone || "").substring(code.length);
                            })()}
                            onChange={(e) => {
                              const code = values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91";
                              const digitsOnly = e.target.value.replace(/\D/g, "");
                              setFieldValue("phone", digitsOnly ? code + digitsOnly : "");
                            }}
                            onBlur={() => setFieldTouched("phone", true)}
                          />
                        </div>
                        <ErrorMessage name="phone" component="div" className="text-red-500 text-xs mt-1" />
                      </div>

                      {/* Country */}
                      <div>
                        <p className="text-white mb-2">Country</p>
                        <Select
                          value={countryOptions.find((opt) => opt.id === values.country) || null}
                          onChange={(selected: any) => {
                            const countryId = selected ? selected.id : "";
                            setFieldValue("country", countryId);
                            setFieldValue("state", "");
                          }}
                          onBlur={() => setFieldTouched("country", true)}
                          getOptionLabel={(opt: any) => opt.name}
                          getOptionValue={(opt: any) => opt.id}
                          options={countryOptions}
                          placeholder="Select Country"
                          classNames={{
                            control: ({ isFocused }: any) =>
                              `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                                isFocused ? "!border-primary-500" : "!border-gray-700"
                              }`,
                          }}
                          styles={{
                            menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                            option: (base, { isFocused, isSelected }) => ({
                              ...base,
                              backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                              color: "#fff",
                              cursor: "pointer",
                            }),
                            singleValue: (base) => ({ ...base, color: "#fff" }),
                            input: (base) => ({ ...base, color: "#fff" }),
                            placeholder: (base) => ({ ...base, color: "#aaa" }),
                          }}
                        />
                      </div>

                      {/* State */}
                      <div>
                        <p className="text-white mb-2">State / Region</p>
                        <Select
                          value={currentStates.find((opt) => opt.id === values.state) || null}
                          onChange={(selected: any) => setFieldValue("state", selected ? selected.id : "")}
                          onBlur={() => setFieldTouched("state", true)}
                          getOptionLabel={(opt: any) => opt.name}
                          getOptionValue={(opt: any) => opt.id}
                          options={currentStates}
                          placeholder="Select State / Region"
                          isClearable
                          classNames={{
                            control: ({ isFocused }: any) =>
                              `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                                isFocused ? "!border-primary-500" : "!border-gray-700"
                              }`,
                          }}
                          styles={{
                            menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                            option: (base, { isFocused, isSelected }) => ({
                              ...base,
                              backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                              color: "#fff",
                              cursor: "pointer",
                            }),
                            singleValue: (base) => ({ ...base, color: "#fff" }),
                            input: (base) => ({ ...base, color: "#fff" }),
                            placeholder: (base) => ({ ...base, color: "#aaa" }),
                          }}
                        />
                      </div>

                      {/* City */}
                      <div>
                        <p className="text-white mb-2">City</p>
                        <Field
                          type="text"
                          name="city"
                          placeholder="City / Town"
                          className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                        />
                      </div>

                      {/* Address Line 1 */}
                      <div>
                        <p className="text-white mb-2">Address Line 1</p>
                        <Field
                          type="text"
                          name="address_line1"
                          placeholder="Street, House no."
                          className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                        />
                      </div>

                      {/* Address Line 2 */}
                      <div>
                        <p className="text-white mb-2">Address Line 2</p>
                        <Field
                          type="text"
                          name="address_line2"
                          placeholder="Apartment, suite, unit, etc."
                          className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                        />
                      </div>

                      {/* Postal Code */}
                      <div>
                        <p className="text-white mb-2">Postal Code</p>
                        <Field
                          type="text"
                          name="postal_code"
                          placeholder="400071"
                          className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                        />
                      </div>

                      {/* Best Time to Call */}
                      <div>
                        <p className="text-white mb-2">Best Time to Call</p>
                        <Field
                          type="text"
                          name="best_time_to_call"
                          placeholder="e.g., 3–5 PM"
                          className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                        />
                      </div>

                      {/* Lead Source */}
                      <div>
                        <p className="text-white mb-2">Lead Source</p>
                        <Select
                          value={leadSourceData.find((opt: any) => opt.id === values.lead_source_id) || null}
                          onChange={(selected: any) => setFieldValue("lead_source_id", selected ? selected.id : "")}
                          onBlur={() => setFieldTouched("lead_source_id", true)}
                          getOptionLabel={(opt: any) => opt.name}
                          getOptionValue={(opt: any) => opt.id}
                          options={leadSourceData}
                          placeholder="Select Lead Source"
                          isClearable
                          classNames={{
                            control: ({ isFocused }: any) =>
                              `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                                isFocused ? "!border-primary-500" : "!border-gray-700"
                              }`,
                          }}
                          styles={{
                            menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                            option: (base, { isFocused, isSelected }) => ({
                              ...base,
                              backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                              color: "#fff",
                              cursor: "pointer",
                            }),
                            singleValue: (base) => ({ ...base, color: "#fff" }),
                            input: (base) => ({ ...base, color: "#fff" }),
                            placeholder: (base) => ({ ...base, color: "#aaa" }),
                          }}
                        />
                      </div>

                      {/* WhatsApp Number */}
                      <div>
                        <p className="text-white mb-2">WhatsApp Number</p>
                        <div className="flex w-full border border-gray-700 rounded-[4px] bg-black overflow-hidden focus-within:border-primary-600">
                          <select
                            className="bg-black text-white text-sm border-r border-gray-700 px-2 py-3 outline-none cursor-pointer"
                            value={values.whatsapp_number?.startsWith("+1") ? "+1" : values.whatsapp_number?.startsWith("+44") ? "+44" : "+91"}
                            onChange={(e) => {
                              const currentCode = values.whatsapp_number?.startsWith("+1") ? "+1" : values.whatsapp_number?.startsWith("+44") ? "+44" : "+91";
                              const numberPart = (values.whatsapp_number || "").replace(currentCode, "");
                              setFieldValue("whatsapp_number", e.target.value + numberPart);
                            }}
                          >
                            <option value="+91">+91</option>
                            <option value="+44">+44</option>
                            <option value="+1">+1</option>
                          </select>
                          <input
                            type="text"
                            maxLength={10}
                            className="w-full bg-transparent text-white text-sm px-3 py-3 outline-none placeholder-gray-400"
                            placeholder="Enter whatsapp number"
                            value={(() => {
                              const code = values.whatsapp_number?.startsWith("+1") ? "+1" : values.whatsapp_number?.startsWith("+44") ? "+44" : "+91";
                              return (values.whatsapp_number || "").substring(code.length);
                            })()}
                            onChange={(e) => {
                              const code = values.whatsapp_number?.startsWith("+1") ? "+1" : values.whatsapp_number?.startsWith("+44") ? "+44" : "+91";
                              const digitsOnly = e.target.value.replace(/\D/g, "");
                              setFieldValue("whatsapp_number", code + digitsOnly);
                            }}
                          />
                        </div>
                      </div>

                      {/* Assign to Agent */}
                      <div>
                        <p className="text-white mb-2">Assign to Agent</p>
                        <Select
                          value={agentList.find((opt: any) => opt.id === values.agent_id) || null}
                          onChange={(selected: any) => setFieldValue("agent_id", selected ? selected.id : "")}
                          onBlur={() => setFieldTouched("agent_id", true)}
                          getOptionLabel={(opt: any) => opt.name}
                          getOptionValue={(opt: any) => opt.id}
                          options={agentList}
                          placeholder="Select Agent"
                          isClearable
                          classNames={{
                            control: ({ isFocused }: any) =>
                              `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                                isFocused ? "!border-primary-500" : "!border-gray-700"
                              }`,
                          }}
                          styles={{
                            menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                            option: (base, { isFocused, isSelected }) => ({
                              ...base,
                              backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                              color: "#fff",
                              cursor: "pointer",
                            }),
                            singleValue: (base) => ({ ...base, color: "#fff" }),
                            input: (base) => ({ ...base, color: "#fff" }),
                            placeholder: (base) => ({ ...base, color: "#aaa" }),
                          }}
                        />
                      </div>

                      {/* Lead Status */}
                      <div>
                        <p className="text-white mb-2">Lead Status</p>
                        <Select
                          value={leadStatusOptions.find((opt) => opt.id === values.lead_status) || null}
                          onChange={(selected: any) =>
                            setFieldValue("lead_status", selected ? selected.id : "New")
                          }
                          onBlur={() => setFieldTouched("lead_status", true)}
                          getOptionLabel={(opt: any) => opt.name}
                          getOptionValue={(opt: any) => opt.id}
                          options={leadStatusOptions}
                          placeholder="Select Lead Status"
                          classNames={{
                            control: ({ isFocused }: any) =>
                              `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                                isFocused ? "!border-primary-500" : "!border-gray-700"
                              }`,
                          }}
                          styles={{
                            menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                            option: (base, { isFocused, isSelected }) => ({
                              ...base,
                              backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                              color: "#fff",
                              cursor: "pointer",
                            }),
                            singleValue: (base) => ({ ...base, color: "#fff" }),
                            input: (base) => ({ ...base, color: "#fff" }),
                            placeholder: (base) => ({ ...base, color: "#aaa" }),
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-primary-600 rounded-[4px] text-white text-base font-medium hover:bg-primary-700"
                    >
                      {isSubmitting ? "Updating..." : "Update Lead"}
                    </button>
                  </form>
                );
              }}
            </Formik>
          </div>
        )}

        {/* --- SEARCH / FILTER FORM (ASSIGNED) --- */}
        {flyout === "search" && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-600 text-2xl font-bold leading-9">
                Search Assigned Leads
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>

            <Formik
              enableReinitialize
              initialValues={{
                full_name: filterData?.full_name || "",
                email: filterData?.email || "",
                phone: filterData?.phone || "",
                lead_number: filterData?.lead_number || "",
                city: filterData?.city || "",
                agent_ids: filterData?.agent_ids || ([] as string[]),
                lead_source_id: filterData?.lead_source_id || "",
              }}
              onSubmit={(values, { setSubmitting }) => {
                const pruneEmpty = (obj: Record<string, any>) => {
                  const out: Record<string, any> = {};
                  Object.entries(obj).forEach(([k, v]) => {
                    if (Array.isArray(v)) {
                      const arr = v.filter((x) => x !== "" && x != null);
                      if (arr.length) out[k] = arr;
                    } else if (v !== "" && v != null) {
                      out[k] = v;
                    }
                  });
                  return out;
                };

                const clean = pruneEmpty({
                  ...values,
                  agent_ids: (values.agent_ids || []).filter(Boolean),
                });

                if (Object.keys(clean).length === 0) {
                  toast.error("Please fill at least one field before submitting.");
                  setSubmitting(false);
                  return;
                }

                setFilterData(clean);
                setPage(1);
                closeFlyout();
                fetchLeads(1, clean);
                toast.success("Filtered Assigned Leads");
                setSubmitting(false);
              }}
            >
              {({ handleSubmit, isSubmitting, values, setFieldValue, setFieldTouched }) => (
                <form onSubmit={handleSubmit}>
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    {/* Full Name */}
                    <div className="w-full">
                      <p className="text-white text-base leading-6 mb-2">Full Name</p>
                      <Field
                        type="text"
                        name="full_name"
                        placeholder="Alexandre Dumas"
                        className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                      />
                    </div>

                    {/* Email */}
                    <div className="w-full">
                      <p className="text-white text-base leading-6 mb-2">Email</p>
                      <Field
                        type="email"
                        name="email"
                        placeholder="alexandre@example.com"
                        className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                      />
                    </div>

                    {/* Phone */}
                    <div className="w-full">
                      <p className="text-white text-base leading-6 mb-2">Phone</p>
                      <Field
                        type="text"
                        name="phone"
                        placeholder="+91 9XXXXXXXXX"
                        className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                      />
                    </div>

                    {/* Lead Number */}
                    <div className="w-full">
                      <p className="text-white text-base leading-6 mb-2">Lead Number</p>
                      <Field
                        type="text"
                        name="lead_number"
                        placeholder="L000001"
                        className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                      />
                    </div>

                    {/* City */}
                    <div className="w-full">
                      <p className="text-white text-base leading-6 mb-2">City</p>
                      <Field
                        type="text"
                        name="city"
                        placeholder="Enter city"
                        className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400 outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
                      />
                    </div>

                    {/* Agents */}
                    <div className="w-full">
                      <p className="text-white text-base leading-6 mb-2">Agent</p>
                      <Select
                        value={(agentList || []).filter((opt: any) => values.agent_ids.includes(opt.id))}
                        onChange={(selected: any) =>
                          setFieldValue(
                            "agent_ids",
                            selected ? selected.map((s: any) => s.id) : [],
                          )
                        }
                        onBlur={() => setFieldTouched("agent_ids", true)}
                        getOptionLabel={(opt: any) => opt.name}
                        getOptionValue={(opt: any) => String(opt.id)}
                        options={agentList}
                        placeholder="Select Agent"
                        isMulti
                        isClearable
                        classNames={{
                          control: ({ isFocused }: any) =>
                            `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                              isFocused ? "!border-primary-500" : "!border-gray-700"
                            }`,
                        }}
                        styles={{
                          menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                          option: (base, { isFocused, isSelected }) => ({
                            ...base,
                            backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                            color: "#fff",
                            cursor: "pointer",
                          }),
                          singleValue: (base) => ({ ...base, color: "#fff" }),
                          input: (base) => ({ ...base, color: "#fff" }),
                          placeholder: (base) => ({ ...base, color: "#aaa" }),
                        }}
                      />
                    </div>

                    {/* Lead Source */}
                    <div className="w-full">
                      <p className="text-white text-base leading-6 mb-2">Lead Source</p>
                      <Select
                        value={(leadSourceData || []).find((opt: any) => opt.id === values.lead_source_id) || null}
                        onChange={(selected: any) =>
                          setFieldValue("lead_source_id", selected ? selected.id : "")
                        }
                        onBlur={() => setFieldTouched("lead_source_id", true)}
                        getOptionLabel={(opt: any) => opt.name}
                        getOptionValue={(opt: any) => String(opt.id)}
                        options={leadSourceData}
                        placeholder="Select Lead Source"
                        isClearable
                        classNames={{
                          control: ({ isFocused }: any) =>
                            `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                              isFocused ? "!border-primary-500" : "!border-gray-700"
                            }`,
                        }}
                        styles={{
                          menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                          option: (base, { isFocused, isSelected }) => ({
                            ...base,
                            backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                            color: "#fff",
                            cursor: "pointer",
                          }),
                          singleValue: (base) => ({ ...base, color: "#fff" }),
                          input: (base) => ({ ...base, color: "#fff" }),
                          placeholder: (base) => ({ ...base, color: "#aaa" }),
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-white text-base font-medium hover:bg-primary-700 w-full cursor-pointer"
                    >
                      {isSubmitting ? "Filtering..." : "Filter Assigned Leads"}
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          </div>
        )}
      </div>
    </>
  );
};

export default AssignedLeadsTable;
