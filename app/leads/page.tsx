"use client";
import { statesByCountry, countryOptions, leadStatusOptions, paymentStatusOptions, deliveryStatusOptions, currencyOptions } from "./CreateLead";

import Image from "next/image";
import { SetStateAction, useContext, useEffect, useState } from "react";
import { CiSettings } from "react-icons/ci";
import {
  IoIosCloseCircleOutline,
  IoIosNotificationsOutline,
} from "react-icons/io";
import { FaCalendarCheck, FaGreaterThan } from "react-icons/fa6";
import { FiFilter, FiPlusCircle } from "react-icons/fi";
import { HiOutlineBookOpen, HiOutlineDownload } from "react-icons/hi";
import { SiHomeassistantcommunitystore } from "react-icons/si";
import {
  MdEdit,
  MdOutlineCall,
  MdOutlineDriveFolderUpload,
  MdOutlineLocationCity,
  MdOutlinePhone,
  MdOutlineSettings,
} from "react-icons/md";
import { LiaArrowCircleDownSolid } from "react-icons/lia";
import { MdRemoveRedEye } from "react-icons/md";
import { IoCloseOutline, IoMailOpenOutline } from "react-icons/io5";
import { RxAvatar } from "react-icons/rx";
import AxiosProvider, { getBaseURL } from "../../provider/AxiosProvider";
import { RiAccountCircleLine, RiDeleteBin6Line } from "react-icons/ri";
import { RxCross2 } from "react-icons/rx";
import StorageManager from "../../provider/StorageManager";
import { AppContext } from "../AppContext";
import LeftSideBar from "../component/LeftSideBar";
import { HiChevronDoubleLeft } from "react-icons/hi";
import { HiChevronDoubleRight } from "react-icons/hi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DesktopHeader from "../component/DesktopHeader";
import { FaEllipsisVertical } from "react-icons/fa6";
import { strict } from "assert";
import { Tooltip } from "react-tooltip";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import Select from "react-select";
import Swal from "sweetalert2";
import CreateLead from "./CreateLead";
import Tabs from "../component/Tabs";
import { BiUserPin } from "react-icons/bi";
import { FaRegCheckCircle, FaSearchPlus } from "react-icons/fa";
import { ImUserTie } from "react-icons/im";
import { GoCalendar } from "react-icons/go";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const axiosProvider = new AxiosProvider();

export default function Home() {
  const checking = useAuthRedirect();
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);
  const [notAssignData, setNotAssignData] = useState<any[]>([]);
  const [assignLeadData, setAssignLeadData] = useState<any[]>([]);

  // PAGINATION USE STATES
  const [globalPageSize] = useState<number>(50);
  const [unAssignPage, setUnAssignPage] = useState<number>(1);
  const [unAssignTotalPages, setUsAssignTotalPages] = useState<number>(1);

  const [assignPage, setAssignPage] = useState<number>(1);
  const [assignTotalPages, setassignTotalPages] = useState<number>(1);

  const [UnAssignPageFilter, setUnAssignPageFilter] = useState<number>(1);
  const [UnAssignTotalPagesFilter, setUnAssignTotalPagesFilter] =
    useState<number>(1);

  const [assignPageFilter, setAssignPageFilter] = useState<number>(1);
  const [assignTotalPagesFilter, setAssignTotalPagesFilter] =
    useState<number>(1);

  const [unAssignFilterPagination, setUnAssignFilterPagination] =
    useState<boolean>(false);
  const [assignFilterPagination, setAssignFilterPagination] =
    useState<boolean>(false);

  // END PAGINATION USE STATES

  const [filterPage, setFilterPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalPagesFilter, setTotalPagesFilter] = useState<number>(1);
  const [filterData, setFilterData] = useState<any>({
    name: "",
    mobilephonenumber: "",
  });
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isCreateLeads, setIsCreateLeads] = useState<boolean>(false);
  const [isBulkLeads, setIsBulkLeads] = useState<boolean>(false);
  const [isFilter, setIsFilter] = useState<boolean>(false);
  const [isEditLead, setIsEditLead] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [hitApi, setHitApi] = useState<boolean>(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [editLeadData, setEditLeadData] = useState(null);
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  const [consolidationData, setConsolidationData] = useState<any[]>([]);
  const [debtConsolidation, setDebtConsolidation] = useState<any[]>([]);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  const [isAgentBulkCheckAssign, setIsagentBulkCehckAssign] =
    useState<boolean>(false);
  const [agentList, setAgentList] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [currentLeadId, setCurrentLeadId] = useState<string>(null);
  const [leadSourceDisplay, setLeadSourceDisplay] = useState<any>(null);
  const [agentDisplay, setAgentDisplay] = useState<any>(null);
  const [debtConsolidationDisplay, setDebtConsolidationDisplay] =
    useState<any>(null);
  const [clearFilter, setClearFilter] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignFilteredData, setAssignFilteredData] = useState({});
  const [unAssignFilteredData, setUnAssignFilteredData] = useState({});

  // Export state
  
  const [exportFilters, setExportFilters] = useState({
    q: "",
    full_name: "",
    email: "",
    phone: "",
    lead_number: "",
    city: "",
    state: "",
    agent_ids: [] as string[],
    lead_source_id: "",
    
    
    created_from: "",
    created_to: "",
    lead_score: "",
    lead_quality: "",
    best_time_to_call: "",
    status: "",
    company: "",
    activity_summary: "",
    note: "",
  });

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  const toggleAll = (checked: boolean) => {
    if (!notAssignData || notAssignData.length === 0) return;
    setSelectedIds(checked ? notAssignData.map((i: any) => i.id) : []);
  };

  const areAllSelected =
    !!notAssignData?.length &&
    notAssignData.every((i: any) => selectedIds.includes(i.id));

  // keep selection clean if the data changes
  useEffect(() => {
    if (!notAssignData?.length) {
      setSelectedIds([]);
      return;
    }
    const valid = new Set(notAssignData.map((x: any) => x.id));
    setSelectedIds((prev) => prev.filter((id) => valid.has(id)));
  }, [notAssignData]);

  // --- action click ---
  const handleBulkAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) {
      toast.error("Please select an agent");
      return;
    }
    setFlyoutOpen(false);

    try {
      await AxiosProvider.post("/leads/assigned/bulk", {
        lead_ids: selectedIds,
        agent_id: selectedAgent.id,
      });
      toast.success("Lead is assigned");
      setHitApi(!hitApi);
      setSelectedAgent(null);
    } catch (error: any) {
      toast.error("Lead is not Updated");
    }
  };

  const storage = new StorageManager();
  const userRole = storage.getUserRole();
  const accessToken = storage.getAccessToken();

  const router = useRouter();

  const handleClick = async (customer: any) => {
    router.push(`/leadsdetails?id=${customer.id}`);
  };

  // ✅ Phone helpers
  const normalizePhone = (raw?: string) =>
    (raw ?? "").replace(/\s+|[-()]/g, ""); // remove spaces, dashes, parentheses

  // Accepts: international phone numbers with optional + and 7 to 15 digits
  const INTL_PHONE_RX = /^\+?[0-9]{7,15}$/;

  // ✅ Validation schema (with transform to strip spaces etc.)
  const LeadSchema = Yup.object({
    full_name: Yup.string().trim().required("Full name is required"),
    email: Yup.string()
      .trim()
      .email("Enter a valid email")
      .required("Email is required"),

    phone: Yup.string()
      .transform((v, o) => normalizePhone(o)) // strip spaces/dashes/()
      .trim()
      .required("Phone number is required")
      .test(
        "is-valid-phone",
        "Enter a valid phone number (e.g. +919876543210, +447911123456)",
        (val) => {
          if (!val) return false;
          const clean = (val || "").replace(/\s+|[-()]/g, "");
          return /^\+?[0-9]{7,15}$/.test(clean);
        }
      ),

    address_line1: Yup.string().nullable().notRequired(),
    address_line2: Yup.string().nullable().notRequired(),
    city: Yup.string().nullable().notRequired(),
    state: Yup.string().nullable().notRequired(),
    postal_code: Yup.string().nullable().notRequired(),
    country: Yup.string().nullable().notRequired(),

    lead_score: Yup.number()
      .transform((v, o) => (o === "" ? undefined : v))
      .typeError("Lead score must be a number")
      .nullable()
      .notRequired(),

    lead_quality: Yup.string().nullable().notRequired(),
    best_time_to_call: Yup.string().nullable().notRequired(),

    // optional dropdowns
    lead_source_id: Yup.string().nullable().notRequired(),
    

    // If you want to validate WhatsApp similarly, add this (optional)
    whatsapp_number: Yup.string()
      .transform((v, o) => (o ? normalizePhone(o) : o))
      .nullable()
      .test(
        "is-wa",
        "Enter a valid WhatsApp number (with or without +91)",
        (val) => {
          if (!val) return true; // optional
          return IN_PHONE_RX.test(val);
        },
      ),
  });

  const handleCreateLead = async (value: any) => {
    setIsLoading(true);
    setFlyoutOpen(false);

    try {
      await AxiosProvider.post("/leads", value);
      toast.success("Lead is Created");
      setHitApi(!hitApi);
    } catch (error: any) {
      toast.error(error.response.data.msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLead = async (value: any) => {
    setIsLoading(true);
    setFlyoutOpen(false);

    try {
      await AxiosProvider.post("/leads/update", value);
      toast.success("Lead is Updated");
      setHitApi(!hitApi);
    } catch (error: any) {
      toast.error("Lead is not Updated");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!excelFile) {
      toast.error("Please select a file");
      return;
    }

    const formEl = e.currentTarget;

    try {
      setIsLoading(true);
      setFlyoutOpen(false);

      const fd = new FormData();
      fd.append("file", excelFile as File);

      // ✅ Append only if values are defined (avoid sending "undefined")
      if (leadSourceDisplay?.id) {
        fd.append("lead_source_id", String(leadSourceDisplay.id));
      }

      if (agentDisplay?.id) {
        fd.append("agent_id", String(agentDisplay.id));
      }

      

      // ✅ Perform the upload
      const res = await fetch(
        `${getBaseURL()}/leads/bulk/upload`,
        {
          method: "POST",
          body: fd,
        },
      );

      // ✅ Try to parse response safely
      let payload: any;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        payload = await res.json();
      } else {
        payload = await res.text();
      }

      // ✅ Handle success/error cases based on status
      if (!res.ok) {
        const errorMessage =
          payload?.message ||
          payload?.error ||
          `Bulk upload failed (HTTP ${res.status})`;

        throw new Error(errorMessage);
      }

      // ✅ Success message from backend (show dynamic message if available)
      const successMessage = payload?.message || "Bulk upload successful!";

      toast.success(successMessage);

      // ✅ Reset states after successful upload
      setHitApi(!hitApi);
      setExcelFile(null);
      setLeadSourceDisplay(null);
      setAgentDisplay(null);
      setDebtConsolidationDisplay(null);
      formEl.reset();
    } catch (err: any) {
      console.error("Bulk upload error:", err);

      // ✅ Show backend error if available
      if (err.message?.includes("invalid")) {
        toast.error("Bulk upload failed - all rows invalid");
      } else {
        toast.error(err.message || "Bulk upload failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilterData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const filterDataValue = () => {
    const filters: string[] = [];
    if (filterData.name) filters.push(`Name: ${filterData.name}`);
    if (filterData.mobilephonenumber)
      filters.push(`Phone: ${filterData.mobilephonenumber}`);
    setAppliedFilters(filters);
  };

  const createLeads = () => {
    setFlyoutOpen(true);
    setIsCreateLeads(true);
    setIsBulkLeads(false);
    setIsFilter(false);
    setIsEditLead(false);
    setIsAgent(false);
    setIsagentBulkCehckAssign(false);
  };

  const bulkLeads = () => {
    setFlyoutOpen(true);
    setIsCreateLeads(false);
    setIsBulkLeads(true);
    setIsFilter(false);
    setIsEditLead(false);
    setIsAgent(false);
    setIsagentBulkCehckAssign(false);
  };

  const filterLeads = () => {
    setFlyoutOpen(true);
    setIsCreateLeads(false);
    setIsBulkLeads(false);
    setIsFilter(true);
    setIsEditLead(false);
    setIsAgent(false);
    setIsagentBulkCehckAssign(false);
  };

  ;

  const editLead = (editData: any) => {
    setEditLeadData(editData);
    setFlyoutOpen(true);
    setIsEditLead(true);
    setIsCreateLeads(false);
    setIsBulkLeads(false);
    setIsFilter(false);
    setIsAgent(false);
    setIsagentBulkCehckAssign(false);
  };

  const assignAgent = (leadId: string) => {
    setCurrentLeadId(leadId);
    setFlyoutOpen(true);
    setIsCreateLeads(false);
    setIsBulkLeads(false);
    setIsFilter(false);
    setIsEditLead(false);
    setIsAgent(true);
    setIsagentBulkCehckAssign(false);
  };

  const assignCheckBulklead = () => {
    setFlyoutOpen(true);
    setIsCreateLeads(false);
    setIsBulkLeads(false);
    setIsFilter(false);
    setIsEditLead(false);
    setIsAgent(false);
    setIsagentBulkCehckAssign(true);
  };

  const unAssignfetchData = async () => {
    try {
      const response = await AxiosProvider.get(
        `/leads/notassigned?page=${unAssignPage}&pageSize=${globalPageSize}`,
      );
      setUsAssignTotalPages(response.data.data.pagination.totalPages);
      const result = response.data.data.data;
      setNotAssignData(result);
    } catch (error: any) {
      setIsError(true);
    }
  };

  useEffect(() => {
    unAssignfetchData();
  }, [unAssignPage, hitApi]);

  const assignfetchData = async () => {
    try {
      const response = await AxiosProvider.get(
        `/leads/assigned?page=${assignPage}&pageSize=${globalPageSize}`,
      );
      setassignTotalPages(response.data.data.pagination.totalPages);
      const result = response.data.data.data;
      setAssignLeadData(result);
    } catch (error: any) {
      setIsError(true);
    }
  };

  useEffect(() => {
    assignfetchData();
  }, [assignPage, hitApi]);

  const leadSource = async () => {
    try {
      const response = await AxiosProvider.get("/leadsources");
      setLeadSourceData(response.data.data.data);
    } catch (error: any) {
      console.log(error);
    }
  };

  useEffect(() => {
    leadSource();
  }, []);

  const consolidationStatus = async () => {
    try {
      const response = await AxiosProvider.get("/getconsolidation");
      setConsolidationData(response.data.data.data);
    } catch (error: any) {
      console.log(error);
    }
  };

  useEffect(() => {
    consolidationStatus();
  }, []);

  const debtConsolidationStatus = async () => {
    try {
      const response = await AxiosProvider.get("/leaddebtstatuses");
      setDebtConsolidation(response.data.data.data);
    } catch (error: any) {
      console.log(error);
    }
  };

  useEffect(() => {
    debtConsolidationStatus();
  }, []);

  const hadleClear = () => {
    setFilterData({ ...filterData, name: "", mobilephonenumber: "" });
  };

  const test = (id: string) => {
    window.open(`/leadsdetails?id=${id}`, "_blank");
  };

  // fetch agents
  const fetchAgent = async () => {
    try {
      const res = await AxiosProvider.get("/allagents");
      const list: any[] = res.data?.data?.data ?? [];
      setAgentList(list);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      setAgentList([]);
    }
  };

  useEffect(() => {
    fetchAgent();
  }, []);

  const handleSubmitAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) {
      toast.error("Please select an agent");
      return;
    }
    setFlyoutOpen(false);

    try {
      await AxiosProvider.post("/assignlead", {
        lead_id: currentLeadId,
        agent_id: selectedAgent.id,
      });
      toast.success("Lead is assigned");
      setHitApi(!hitApi);
      setSelectedAgent(null);
    } catch (error: any) {
      toast.error("Lead is not Updated");
    }
  };

  const deleteUserLead = async (leadId: string) => {
    const userID = leadId;

    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this Lead?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await AxiosProvider.post("/leads/soft-delete", { id: userID });
          toast.success("Successfully Deleted");
          setHitApi((prev) => !prev);
        } catch (error) {
          console.error("Error deleting user:", error);
          toast.error("Failed to delete user");
        }
      }
    });
  };

  const toCleanFilter = (raw: any) => {
    const out: Record<string, any> = {};
    Object.entries(raw).forEach(([k, v]) => {
      const t = String(v ?? "").trim();
      if (t !== "") out[k] = t;
    });
    return out;
  };

  const clickedFilterClear = () => {
    setClearFilter(false);
    setHitApi(!hitApi);
    setUnAssignFilterPagination(false);
    setAssignFilterPagination(false);
  };

  // HANDLE API TO UPDATE PAGINATION
  const handleAssignFilter = async () => {
    if (!assignFilteredData || Object.keys(assignFilteredData).length === 0)
      return;

    try {
      const response = await AxiosProvider.post(
        `/leads/filter?page=${assignPageFilter}&pageSize=${globalPageSize}`,
        assignFilteredData,
      );
      setAssignLeadData(response.data.data.data);
      setFlyoutOpen(false);
      setClearFilter(true);
      setAssignTotalPagesFilter(response.data.data.pagination.totalPages);
      setAssignFilterPagination(true);
    } catch (error: any) {
      console.log("assign filter error", error);
      toast.error("Lead is not Created");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleAssignFilter();
  }, [assignPageFilter]);

  const handleUnassignFilter = async () => {
    if (!unAssignFilteredData || Object.keys(unAssignFilteredData).length === 0)
      return;

    try {
      const response = await AxiosProvider.post(
        `/notassignedleads/filter?page=${assignPageFilter}&pageSize=${globalPageSize}`,
        unAssignFilteredData,
      );
      setUnAssignTotalPagesFilter(response.data.data.pagination.totalPages);
      setNotAssignData(response.data.data.data);
      setFlyoutOpen(false);
      setClearFilter(true);
      setUnAssignFilterPagination(true);
    } catch (error: any) {
      toast.error("Lead is not Created");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleUnassignFilter();
  }, [UnAssignPageFilter]);

  // HANDLE API TO UPDATE PAGINATION

  // PAGINATION HANDLE CHANGES
  const handleUnAssignPagination = (newPage: number) => {
    if (newPage > 0 && newPage <= unAssignTotalPages) {
      setUnAssignPage(newPage);
    }
  };

  const handleUnAssignPaginationFilter = (newPage: number) => {
    if (newPage > 0 && newPage <= UnAssignTotalPagesFilter) {
      setUnAssignPageFilter(newPage);
    }
  };

  const handleAssignPagination = (newPage: number) => {
    if (newPage > 0 && newPage <= assignTotalPages) {
      setAssignPage(newPage);
    }
  };

  const handleAssignPaginationFilter = (newPage: number) => {
    if (newPage > 0 && newPage <= assignTotalPagesFilter) {
      setAssignPageFilter(newPage);
    }
  };
  // END PAGINATION HANDLE CHANGES

  

  // Export handler function
  ;

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center">
        <Image
          src="/images/crmlogo.png"
          alt="Table image"
          width={500}
          height={500}
          style={{ width: "150px", height: "auto" }}
          className="animate-pulse rounded"
        />
      </div>
    );
  }

  const tabs = [
    {
      label: "Unassign Leads",
      content: (
        <>
          {/* Tab content 3 */}
          <table className="w-full text-sm text-left text-white  whitespace-nowrap">
            <thead className="text-xs text-[#999999] talbleheaderBg">
              <tr className=" ">
                <th scope="col" className="px-3 py-3 md:p-3  ">
                  <div className="flex items-center gap-2">
                    <FaRegCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Select
                    </span>
                    {/* Select All */}
                    <input
                      type="checkbox"
                      className="accent-primary-600"
                      checked={areAllSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </div>
                </th>
                {/* Name - Birth Date: Always Visible */}
                <th scope="col" className="px-3 py-3 md:p-3  ">
                  <div className="flex items-center gap-2">
                    <RxAvatar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Full Name
                    </span>
                  </div>
                </th>

                {/* Other columns: Hidden on mobile, visible from md: */}
                <th scope="col" className="px-3 py-2   hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <IoMailOpenOutline className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Email
                    </span>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2   hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <MdOutlinePhone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Phone
                    </span>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2   hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <MdOutlineLocationCity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Address
                    </span>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2   md:table-cell">
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
              {!notAssignData || notAssignData.length === 0 || isError ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-xl mt-5 text-white"
                  >
                    <div className="mt-5">Data not found</div>
                  </td>
                </tr>
              ) : (
                notAssignData.map((item: any, index: number) => (
                  <tr
                    key={item?.id ?? index}
                    className="  hover:bg-primary-700 border-b border-[#E7E7E7] odd:bg-[#404040]"
                  >
                    <td className="px-3 py-2   text-center">
                      <input
                        type="checkbox"
                        className="accent-primary-600"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => toggleRow(item.id, e.target.checked)}
                      />
                    </td>

                    {/* Full name */}
                    <td
                      onClick={() => test(item.id)}
                      className="px-1 py-2 md:px-3 md:py-3  flex items-center gap-2 text-primary-600 underline cursor-pointer"
                    >
                      <div className="flex gap-2">
                        <div className="md:hidden">
                          <FaEllipsisVertical
                            data-tooltip-id="my-tooltip"
                            data-tooltip-html={`<div>
                      <strong>Name:</strong> <span style="text-transform: capitalize;">${
                        item?.full_name ?? "-"
                      }</span><br/>
                      <strong>Email:</strong> ${item?.email ?? "-"}<br/>
                      <strong>Phone:</strong> ${item?.phone ?? "-"}<br/>
                      <strong>Owner:</strong> ${item?.owner_name ?? "-"}<br/>
                      <strong>Account Manager:</strong> ${
                        item?.account_manager ?? "-"
                      }
                    </div>`}
                            className="text-white leading-normal relative top-[5.3px] capitalize"
                          />
                          <Tooltip
                            id="my-tooltip"
                            place="right"
                            float
                            className="box"
                          />
                        </div>
                        <div>
                          <p className=" text-sm sm:text-base font-medium leading-normal capitalize">
                            {item?.full_name ?? "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-3 py-2   hidden md:table-cell">
                      <span className="text-white text-sm sm:text-base">
                        {item?.email ?? "-"}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2   hidden md:table-cell">
                      <span className="text-white text-sm sm:text-base">
                        {item?.phone ?? "-"}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="px-3 py-2   hidden md:table-cell">
                      <span className="text-white text-sm sm:text-base capitalize">
                        {item?.address.line1 ?? "-"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2   md:table-cell">
                      <div className="flex gap-1 md:gap-2 justify-center md:justify-start">
                        <button
                          onClick={() => editLead(item)}
                          className="py-1 px-3 bg-black hover:bg-primary-800 active:bg-primary-800 flex gap-2 items-center rounded-xl"
                        >
                          <MdEdit className="text-white w-4 h-4 hover:text-white" />
                        </button>
                        {userRole === "Admin" && (
                          <button
                            onClick={() => assignAgent(item.id)}
                            className="py-1 px-3 bg-black hover:bg-primary-800 active:bg-primary-800 flex gap-2 items-center rounded-xl"
                          >
                            <BiUserPin className="text-white w-4 h-4 hover:text-white" />
                          </button>
                        )}
                        {userRole === "Admin" && (
                          <button
                            onClick={() => deleteUserLead(item.id)}
                            className="py-1 px-3 bg-black hover:bg-primary-800 active:bg-primary-800 flex gap-2 items-center rounded-xl"
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

          {/* UNASSIGN PAGINATION */}
          {notAssignData && notAssignData.length > 0 && (
            <>
              {unAssignFilterPagination ? (
            <div className="flex justify-center items-center my-10 relative">
              <button
                onClick={() =>
                  handleUnAssignPaginationFilter(UnAssignPageFilter - 1)
                }
                disabled={UnAssignPageFilter === 1}
                className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleLeft className="w-6 h-auto" />
              </button>
              <span className="text-white text-sm">
                Page {UnAssignPageFilter} of {UnAssignTotalPagesFilter}
              </span>
              <button
                onClick={() =>
                  handleUnAssignPaginationFilter(UnAssignPageFilter + 1)
                }
                disabled={UnAssignPageFilter === UnAssignTotalPagesFilter}
                className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleRight className="w-6 h-auto" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center my-10 relative">
              <button
                onClick={() => handleUnAssignPagination(unAssignPage - 1)}
                disabled={unAssignPage === 1}
                className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleLeft className="w-6 h-auto" />
              </button>
              <span className="text-white text-sm">
                Page {unAssignPage} of {unAssignTotalPages}
              </span>
              <button
                onClick={() => handleUnAssignPagination(unAssignPage + 1)}
                disabled={unAssignPage === unAssignTotalPages}
                className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleRight className="w-6 h-auto" />
              </button>
            </div>
          )}
            </>
          )}
          {/* END PAGINATION */}
        </>
      ),
      // End Tab content 2
    },
    {
      label: "Assign Leads",
      content: (
        <>
          {/* Tab content 3 */}
          <table className="w-full text-sm text-left text-white  whitespace-nowrap">
            <thead className="text-xs text-[#999999] talbleheaderBg">
              <tr className=" ">
                {/* Name - Birth Date: Always Visible */}
                <th scope="col" className="px-3 py-3 md:p-3  ">
                  <div className="flex items-center gap-2">
                    <RxAvatar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Full Name
                    </span>
                  </div>
                </th>

                {/* Other columns: Hidden on mobile, visible from md: */}
                <th scope="col" className="px-3 py-2   hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <IoMailOpenOutline className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Email
                    </span>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2   hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <MdOutlinePhone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Phone
                    </span>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2   hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <MdOutlineLocationCity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Address
                    </span>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2   hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <ImUserTie className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    <span className="font-semibold text-white text-lg sm:text-base">
                      Agent
                    </span>
                  </div>
                </th>
                <th scope="col" className="px-3 py-2   md:table-cell">
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
              {!assignLeadData || assignLeadData.length === 0 || isError ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center text-xl mt-5 text-white"
                  >
                    <div className="mt-5">Data not found</div>
                  </td>
                </tr>
              ) : (
                assignLeadData.map((item: any, index: number) => (
                  <tr
                    key={item?.id ?? index}
                    className="  odd:bg-[#404040] hover:bg-primary-700 py-3 border-b border-[#E7E7E7]"
                  >
                    {/* Full name */}
                    <td
                      onClick={() => test(item.id)}
                      className="px-1 py-2 md:px-3 md:py-3 flex items-center gap-2 text-primary-600 underline cursor-pointer"
                    >
                      <div className="flex gap-2">
                        <div className="md:hidden">
                          <FaEllipsisVertical
                            data-tooltip-id="my-tooltip"
                            data-tooltip-html={`<div>
                      <strong>Name:</strong> <span style="text-transform: capitalize;">${
                        item?.full_name ?? "-"
                      }</span><br/>
                      <strong>Email:</strong> ${item?.email ?? "-"}<br/>
                      <strong>Phone:</strong> ${item?.phone ?? "-"}<br/>
                      <strong>Owner:</strong> ${item?.owner_name ?? "-"}<br/>
                      <strong>Account Manager:</strong> ${
                        item?.account_manager ?? "-"
                      }
                    </div>`}
                            className="text-white leading-normal relative top-[5.3px] capitalize"
                          />
                          <Tooltip
                            id="my-tooltip"
                            place="right"
                            float
                            className="box"
                          />
                        </div>
                        <div className="cursor-pointer">
                          <p className="text-primary-600 text-sm sm:text-base font-medium leading-normal capitalize">
                            {item?.full_name ?? "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-3 py-2   hidden md:table-cell">
                      <span className="text-white text-sm sm:text-base">
                        {item?.email ?? "-"}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2   hidden md:table-cell">
                      <span className="text-white text-sm sm:text-base">
                        {item?.phone ?? "-"}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="px-3 py-2   hidden md:table-cell">
                      <span className="text-white text-sm sm:text-base capitalize">
                        {item?.address.line1 ?? "-"}
                      </span>
                    </td>

                    {/* Agent */}
                    <td className="px-3 py-2   hidden md:table-cell">
                      <span className="text-white text-sm sm:text-base capitalize">
                        {item?.agent.name ?? "-"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2   md:table-cell">
                      <div className="flex gap-1 md:gap-2 justify-center md:justify-start">
                        <button
                          onClick={() => editLead(item)}
                          className="py-1 px-3 bg-black hover:bg-primary-800 active:bg-primary-800 flex gap-2 items-center rounded-xl"
                        >
                          <MdEdit className="text-white w-4 h-4 hover:text-white" />
                        </button>

                        {userRole === "Admin" && (
                          <button
                            onClick={() => deleteUserLead(item.id)}
                            className="py-1 px-3 bg-black hover:bg-primary-800 active:bg-primary-800 flex gap-2 items-center rounded-xl"
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

          {/* ASSIGN PAGINATION */}
          {assignLeadData && assignLeadData.length > 0 && (
            <>
              {assignFilterPagination ? (
            <div className="flex justify-center items-center my-10 relative">
              <button
                onClick={() =>
                  handleAssignPaginationFilter(assignPageFilter - 1)
                }
                disabled={assignPageFilter === 1}
                className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleLeft className="w-6 h-auto" />
              </button>
              <span className="text-white text-sm">
                Assign leads filter pagination Page {assignPageFilter} of{" "}
                {assignTotalPagesFilter}
              </span>
              <button
                onClick={() =>
                  handleAssignPaginationFilter(assignPageFilter + 1)
                }
                disabled={assignPageFilter === assignTotalPagesFilter}
                className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleRight className="w-6 h-auto" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center my-10 relative">
              <button
                onClick={() => handleAssignPagination(assignPage - 1)}
                disabled={assignPage === 1}
                className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleLeft className="w-6 h-auto" />
              </button>
              <span className="text-white text-sm">
                Assign leads pagination Page {assignPage} of {assignTotalPages}
              </span>
              <button
                onClick={() => handleAssignPagination(assignPage + 1)}
                disabled={assignPage === assignTotalPages}
                className="px-2 py-2 mx-2 border rounded bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiChevronDoubleRight className="w-6 h-auto" />
              </button>
            </div>
          )}
            </>
          )}
          {/* END PAGINATION */}
        </>
      ),
    },
  ];

  if (checking) {
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
      <div className=" flex justify-end  min-h-screen">
        {/* Main content right section */}
        <div className=" ml-[97px] w-full md:w-[90%] m-auto  min-h-[500px]  rounded p-4 mt-0 ">
          {/* left section top row */}
          <DesktopHeader />
          {/* Main content middle section */}
          {/* ----------------Table----------------------- */}
          <div className="relative overflow-x-auto shadow-lastTransaction rounded-xl sm:rounded-3xl px-1 py-6 md:p-6   z-10 mainContainerBg">
            {/* Search and filter table row */}
            <div className=" flex justify-between items-center mb-6  w-full mx-auto">
              <div>
                {selectedIds.length > 0 && (
                  <div className=" flex items-center ">
                    <div
                      className=" flex justify-center gap-2 py-3 px-6 rounded-[12px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-800 group"
                      onClick={() => assignCheckBulklead()}
                    >
                      <FiFilter className=" w-5 h-5 text-white group-hover:text-white" />
                      <p className=" text-white text-base font-medium group-hover:text-white">
                        Assign Agent Bulk ({selectedIds.length})
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className=" flex justify-center items-center gap-4">
                <div
                  className=" flex justify-center gap-2 py-3 px-6 rounded-[12px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-700 group"
                  onClick={() => createLeads()}
                >
                  <FiPlusCircle className=" w-5 h-5 text-white group-hover:text-white" />
                  <p className=" text-white text-base font-medium group-hover:text-white">
                    Create Leads
                  </p>
                </div>

                {userRole === "Admin" && (
                  <div
                    className=" flex justify-center  gap-2 py-3 px-6 rounded-[12px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-700 group"
                    onClick={() => bulkLeads()}
                  >
                    <MdOutlineDriveFolderUpload className=" w-5 h-5 text-white group-hover:text-white" />
                    <p className=" text-white text-base font-medium group-hover:text-white">
                      Bulk Leads
                    </p>
                  </div>
                )}

                

                <div
                  className=" flex justify-center  gap-2 py-3 px-6 rounded-[12px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-700 group"
                  onClick={() => filterLeads()}
                >
                  <FaSearchPlus className=" w-5 h-5 text-white group-hover:text-white" />
                  <p className=" text-white text-base font-medium group-hover:text-white">
                    Search Leads
                  </p>
                </div>
              </div>
            </div>
            {/* End search and filter row */}
            <div className="w-full overflow-x-auto custom-scrollbar">
              {clearFilter && (
                <button
                  type="button"
                  onClick={() => clickedFilterClear()}
                  className="flex items-center gap-2 text-primary-600 text-sm font-medium transition-colors p-1 border border-primary-500 rounded mb-2"
                >
                  <span>Clear Filter</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {/* Show Applied Filters */}
            {userRole === "Admin" && <Tabs tabs={tabs} />}

            {userRole === "Agent" && (
              <table className="w-full text-sm text-left text-white bg-black whitespace-nowrap">
                <thead className="text-xs bg-primary-500 text-white">
                  <tr className=" ">
                    {/* Full Name */}
                    <th className="px-3 py-3 md:p-3  ">
                      <div className="flex items-center gap-2">
                        <RxAvatar className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="font-semibold text-white text-lg sm:text-base">
                          Full Name
                        </span>
                      </div>
                    </th>

                    {/* Email */}
                    <th className="px-3 py-2   hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <IoMailOpenOutline className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <span className="font-semibold text-white text-lg sm:text-base">
                          Email
                        </span>
                      </div>
                    </th>

                    {/* Phone */}
                    <th className="px-3 py-2   hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MdOutlinePhone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <span className="font-semibold text-white text-lg sm:text-base">
                          Phone
                        </span>
                      </div>
                    </th>

                    {/* Address */}
                    <th className="px-3 py-2   hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MdOutlineLocationCity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <span className="font-semibold text-white text-lg sm:text-base">
                          Address
                        </span>
                      </div>
                    </th>

                    {/* Agent */}
                    <th className="px-3 py-2   hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <ImUserTie className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <span className="font-semibold text-white text-lg sm:text-base">
                          Agent
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {!assignLeadData || assignLeadData.length === 0 || isError ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-white">
                        Data not found
                      </td>
                    </tr>
                  ) : (
                    assignLeadData.map((item: any, index: number) => (
                      <tr
                        key={item?.id ?? index}
                        className="  bg-black hover:bg-primary-600"
                      >
                        {/* Full Name */}
                        <td
                          className="px-3 py-2   flex items-center gap-2 bg-primary-500 cursor-pointer"
                          onClick={() => test(item.id)}
                        >
                          <p className="text-white font-medium capitalize">
                            {item?.full_name ?? "-"}
                          </p>
                        </td>

                        {/* Email */}
                        <td className="px-3 py-2   hidden md:table-cell">
                          <span className="text-white">
                            {item?.email ?? "-"}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="px-3 py-2   hidden md:table-cell">
                          <span className="text-white">
                            {item?.phone ?? "-"}
                          </span>
                        </td>

                        {/* Address */}
                        <td className="px-3 py-2   hidden md:table-cell">
                          <span className="text-white capitalize">
                            {item?.address.country ?? "-"}
                          </span>
                        </td>

                        {/* Agent */}
                        <td className="px-3 py-2   hidden md:table-cell">
                          <span className="text-white capitalize">
                            {item?.agent.name ?? "-"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            {userRole === "Agent" && (
              <>
                {assignFilterPagination ? (
                  <div className="flex justify-center items-center my-10 relative gap-2">
                    <button
                      onClick={() =>
                        handleAssignPaginationFilter(assignPageFilter - 1)
                      }
                      disabled={assignPageFilter === 1}
                      className="px-3 py-2 rounded bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiChevronDoubleLeft className="w-6 h-auto" />
                    </button>
                    <span className="text-white text-sm">
                      Page {assignPageFilter} of {assignTotalPagesFilter}
                    </span>
                    <button
                      onClick={() =>
                        handleAssignPaginationFilter(assignPageFilter + 1)
                      }
                      disabled={assignPageFilter === assignTotalPagesFilter}
                      className="px-3 py-2 rounded bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiChevronDoubleRight className="w-6 h-auto" />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center items-center my-10 relative gap-2">
                    <button
                      onClick={() => handleAssignPagination(assignPage - 1)}
                      disabled={assignPage === 1}
                      className="px-3 py-2 rounded bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiChevronDoubleLeft className="w-6 h-auto" />
                    </button>
                    <span className="text-white text-sm">
                      Page {assignPage} of {assignTotalPages}
                    </span>
                    <button
                      onClick={() => handleAssignPagination(assignPage + 1)}
                      disabled={assignPage === assignTotalPages}
                      className="px-3 py-2 rounded bg-primary-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiChevronDoubleRight className="w-6 h-auto" />
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ---------------- Table--------------------------- */}

            {/* ----------------End table------------------------ */}
          </div>
          {/* Pagination Controls */}

          {/* ----------------End prgination--------------------------- */}

          {/* <div className="w-full h-24 bg-header-gradient opacity-20 absolute top-0 left-0 right-0 "></div> */}
        </div>
      </div>
      {/* START FLYOUT */}
      {/*  FLYOUT */}
      {isFlyoutOpen && (
        <div
          className=" min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
          onClick={() => {
            setFlyoutOpen(!isFlyoutOpen);
          }}
        ></div>
      )}

      <>
        <div className={`flyout ${isFlyoutOpen ? "open" : ""}`}>
          

          {/* Other Flyout Components (Create Leads, Bulk Leads, Filter, Edit, Agent, Bulk Assign) */}
          {isCreateLeads && (
            <div className="w-full min-h-auto p-4 text-white">
              {/* Flyout header */}
              <div className="flex justify-between mb-4">
                <p className="text-primary-500 text-2xl font-bold leading-9">
                  Create Leads
                </p>
                <IoCloseOutline
                  onClick={() => setFlyoutOpen(false)}
                  className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
                />
              </div>
              <div className="w-full border-b border-gray-700 mb-4"></div>

              <CreateLead
                closeFlyOut={() => {
                  setFlyoutOpen(false);
                  if (unAssignfetchData) unAssignfetchData();
                }}
              />
            </div>
          )}

          {/* Bulk Leads Flyout */}
          {isBulkLeads && (
            <div className="w-full min-h-auto p-4  text-white">
              {/* Flyout header */}
              <div className="flex justify-between mb-4">
                <p className="text-primary-500 text-2xl font-bold leading-9">
                  Bulk Leads
                </p>
                <IoCloseOutline
                  onClick={() => setFlyoutOpen(false)}
                  className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
                />
              </div>
              <div className="w-full border-b border-gray-700 mb-4"></div>

              {/* Download Sample Template Banner */}
              <div className="mb-4 p-3.5 bg-[#141414] border border-gray-700 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Need sample format?</p>
                  <p className="text-[11px] text-gray-400">Download ready-to-use template with required columns</p>
                </div>
                <a
                  href="/samples/lead_bulk_upload_sample.xlsx"
                  download="lead_bulk_upload_sample.xlsx"
                  className="px-3 py-1.5 bg-primary-950/70 hover:bg-primary-900 border border-primary-700 text-primary-400 text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Download .XLSX
                </a>
              </div>

              {/* FORM */}
              <form onSubmit={handleUploadFile}>
                <div className="w-full">
                  {/* File Upload Input */}
                  <div className="w-full mb-4">
                    <p className="text-white font-medium text-base leading-6 mb-2">
                      Upload Excel File
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      name="file"
                      onChange={(e) =>
                        setExcelFile(e.target.files?.[0] ?? null)
                      }
                      className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 text-white !bg-black"
                    />
                  </div>

                  {/* Lead Source */}
                  <div className="w-full mb-4">
                    <p className="text-white text-base leading-6 mb-2">
                      Lead Source
                    </p>
                    <Select
                      value={leadSourceDisplay}
                      onChange={(selected: any) =>
                        setLeadSourceDisplay(selected)
                      }
                      getOptionLabel={(opt: any) => opt.name}
                      getOptionValue={(opt: any) => String(opt.id)}
                      options={leadSourceData}
                      placeholder="Select Lead Source"
                      isClearable
                      classNames={{
                        control: ({ isFocused }: any) =>
                          `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                            isFocused
                              ? "!border-primary-500"
                              : "!border-gray-700"
                          }`,
                      }}
                      styles={{
                        menu: (base) => ({
                          ...base,
                          borderRadius: 4,
                          backgroundColor: "#000",
                        }),
                        option: (base, { isFocused, isSelected }) => ({
                          ...base,
                          backgroundColor: isSelected
                            ? "var(--primary-600)"
                            : isFocused
                              ? "#222"
                              : "#000",
                          color: "#fff",
                          cursor: "pointer",
                        }),
                        singleValue: (base) => ({ ...base, color: "#fff" }),
                        input: (base) => ({ ...base, color: "#fff" }),
                        placeholder: (base) => ({ ...base, color: "#aaa" }),
                      }}
                    />
                  </div>

                  {/* Agent (Required) */}
                  <div className="w-full mb-4">
                    <p className="text-white text-base leading-6 mb-2">Agent</p>
                    <Select
                      value={agentDisplay}
                      onChange={(selected: any) => setAgentDisplay(selected)}
                      getOptionLabel={(opt: any) => opt.name}
                      getOptionValue={(opt: any) => String(opt.id)}
                      options={agentList}
                      placeholder="Select Agent"
                      isClearable
                      classNames={{
                        control: ({ isFocused }: any) =>
                          `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                            isFocused
                              ? "!border-primary-500"
                              : "!border-gray-700"
                          }`,
                      }}
                      styles={{
                        menu: (base) => ({
                          ...base,
                          borderRadius: 4,
                          backgroundColor: "#000",
                        }),
                        option: (base, { isFocused, isSelected }) => ({
                          ...base,
                          backgroundColor: isSelected
                            ? "var(--primary-600)"
                            : isFocused
                              ? "#222"
                              : "#000",
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
                  className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:bg-primary-700 w-full"
                >
                  Upload File
                </button>
              </form>
            </div>
          )}

          {/* Filter Leads Flyout */}
          {isFilter && (
            <div className="w-full min-h-auto p-4  text-white">
              {/* Flyout header */}
              <div className="flex justify-between mb-4">
                <p className="text-primary-600 text-2xl font-bold leading-9">
                  Search Leads
                </p>
                <IoCloseOutline
                  onClick={() => setFlyoutOpen(false)}
                  className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
                />
              </div>
              <div className="w-full border-b border-gray-700 mb-4"></div>

              <Formik
                enableReinitialize
                initialValues={{
                  full_name: "",
                  email: "",
                  phone: "",
                  lead_number: "",
                  state: "", // province value stored here
                  agent_ids: [] as string[],
                  lead_source_id: "",
                  debt_consolidation_status_id: "",
                  consolidated_credit_status_id: "",
                  created_from: "", // Added date from
                  created_to: "", // Added date to
                }}
                onSubmit={() => {
                  /* no-op */
                }}
              >
                {({
                  handleSubmit,
                  values,
                  setFieldValue,
                  setFieldTouched,
                  isSubmitting,
                  resetForm,
                }) => {
                  const norm = (v: any) => String(v ?? "").toLowerCase();

                  const leadSourceDisplay = values.lead_source_id
                    ? (leadSourceData || []).find(
                        (o: any) => norm(o.id) === norm(values.lead_source_id),
                      ) || null
                    : null;

                  

                  const agentDisplay =
                    (values.agent_ids || [])
                      .map((id: any) =>
                        (agentList || []).find(
                          (o: any) => norm(o.id) === norm(id),
                        ),
                      )
                      .filter(Boolean) || [];

                  

                  // State dropdown
const allStates = Object.values(statesByCountry).flat();
const stateDisplay = values.state ? allStates.find((o: any) => norm(o.id) === norm(values.state)) || null : null;

                  // Date formatting helper
                  const fmt = (d: Date) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    return `${y}-${m}-${day}`;
                  };

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

                  const buildCleanPayload = (v: typeof values) => {
                    const base = {
                      ...v,
                      agent_ids: (v.agent_ids || []).filter(Boolean),
                    };
                    return pruneEmpty(base);
                  };

                  const hasAnyField = (payload: Record<string, any>) =>
                    Object.keys(payload).length > 0;

                  const handleUnassignFilter = async () => {
                    const clean = buildCleanPayload(values);
                    if (!hasAnyField(clean)) {
                      toast.error(
                        "Please fill at least one field before submitting.",
                      );
                      return;
                    }
                    setUnAssignFilteredData(clean);
                    try {
                      const response = await AxiosProvider.post(
                        `/notassignedleads/filter?page=${assignPageFilter}&pageSize=${globalPageSize}`,
                        clean,
                      );
                      setUnAssignTotalPagesFilter(
                        response.data.data.pagination.totalPages,
                      );
                      setNotAssignData(response.data.data.data);
                      setFlyoutOpen(false);
                      setClearFilter(true);
                      setUnAssignFilterPagination(true);
                      toast.success("Filtered Unassigned Leads");
                      resetForm();
                    } catch (error: any) {
                      toast.error("Failed to filter unassigned leads");
                    } finally {
                      setIsLoading(false);
                    }
                  };

                  const handleAssignFilter = async () => {
                    const clean = buildCleanPayload(values);
                    if (!hasAnyField(clean)) {
                      toast.error(
                        "Please fill at least one field before submitting.",
                      );
                      return;
                    }
                    setAssignFilteredData(clean);
                    try {
                      const response = await AxiosProvider.post(
                        `/leads/filter?page=${assignPageFilter}&pageSize=${globalPageSize}`,
                        clean,
                      );
                      setAssignLeadData(response.data.data.data);
                      setFlyoutOpen(false);
                      setClearFilter(true);
                      setAssignTotalPagesFilter(
                        response.data.data.pagination.totalPages,
                      );
                      setAssignFilterPagination(true);
                      toast.success("Filtered Assigned Leads");
                      resetForm();
                    } catch (error: any) {
                      toast.error("Failed to filter assigned leads");
                    } finally {
                      setIsLoading(false);
                    }
                  };

                  return (
                    <form onSubmit={handleSubmit}>
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Full Name */}
                        <div className="w-full">
                          <p className="text-white text-base leading-6 mb-2">
                            Full Name
                          </p>
                          <Field
                            type="text"
                            name="full_name"
                            placeholder="Alexandre Dumas"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400"
                          />
                        </div>

                        {/* Email */}
                        <div className="w-full">
                          <p className="text-white text-base leading-6 mb-2">
                            Email
                          </p>
                          <Field
                            type="email"
                            name="email"
                            placeholder="alexandre@example.com"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400"
                          />
                        </div>

                        {/* Phone */}
                        <div className="w-full">
                          <p className="text-white text-base leading-6 mb-2">
                            Phone
                          </p>
                          <Field
                            type="text"
                            name="phone"
                            placeholder="+91 9XXXXXXXXX"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400"
                          />
                        </div>

                        {/* Lead Number */}
                        <div className="w-full">
                          <p className="text-white text-base leading-6 mb-2">
                            Lead Number
                          </p>
                          <Field
                            type="text"
                            name="lead_number"
                            placeholder="LN-000123"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400"
                          />
                        </div>

                        {/* City */}
                        <div className="w-full">
                          <p className="text-white text-base leading-6 mb-2">
                            City
                          </p>
                          <Field
                            type="text"
                            name="city"
                            placeholder="Enter city"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-4 placeholder-gray-400"
                          />
                        </div>

                        {/* State / Region (Dropdown) */}
<div className="w-full">
  <p className="text-white text-base leading-6 mb-2">State / Region</p>
  <Select
    value={stateDisplay}
    onChange={(selected: any) => setFieldValue("state", selected ? selected.id : "")}
    onBlur={() => setFieldTouched("state", true)}
    getOptionLabel={(opt: any) => opt.name}
    getOptionValue={(opt: any) => String(opt.id)}
    options={allStates}
    placeholder="Select State / Region"
                            isClearable
                            classNames={{
                              control: ({ isFocused }: any) =>
                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                                  isFocused
                                    ? "!border-primary-500"
                                    : "!border-gray-700"
                                }`,
                            }}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                borderRadius: 4,
                                backgroundColor: "#000",
                              }),
                              option: (base, { isFocused, isSelected }) => ({
                                ...base,
                                backgroundColor: isSelected
                                  ? "var(--primary-600)"
                                  : isFocused
                                    ? "#222"
                                    : "#000",
                                color: "#fff",
                                cursor: "pointer",
                              }),
                              singleValue: (base) => ({
                                ...base,
                                color: "#fff",
                              }),
                              input: (base) => ({ ...base, color: "#fff" }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#aaa",
                              }),
                            }}
                          />
                        </div>

                        {/* Date Range - Created From */}
                        <div className="w-full">
                          <p className="text-white text-base leading-6 mb-2">
                            Created From
                          </p>
                          <DatePicker
                            selected={
                              values.created_from
                                ? new Date(values.created_from)
                                : null
                            }
                            onChange={(date: Date | null) =>
                              setFieldValue(
                                "created_from",
                                date ? fmt(date) : "",
                              )
                            }
                            onBlur={() => setFieldTouched("created_from", true)}
                            name="created_from"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="yyyy-mm-dd"
                            className="w-full border border-gray-700 rounded-[4px] text-sm px-4 py-4 bg-black text-white placeholder-gray-400"
                            popperClassName="custom-datepicker"
                            dayClassName={(date) => {
                              const today = new Date().toDateString();
                              const selectedDate = values.created_from
                                ? new Date(values.created_from).toDateString()
                                : null;
                              if (today === date.toDateString())
                                return "bg-[#FFF0F1] text-[#A3000E]";
                              if (selectedDate === date.toDateString())
                                return "bg-[#A3000E] text-white";
                              return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
                            }}
                            maxDate={
                              values.created_to
                                ? new Date(values.created_to)
                                : undefined
                            }
                            isClearable
                          />
                        </div>

                        {/* Date Range - Created To */}
                        <div className="w-full">
                          <p className="text-white text-base leading-6 mb-2">
                            Created To
                          </p>
                          <DatePicker
                            selected={
                              values.created_to
                                ? new Date(values.created_to)
                                : null
                            }
                            onChange={(date: Date | null) =>
                              setFieldValue("created_to", date ? fmt(date) : "")
                            }
                            onBlur={() => setFieldTouched("created_to", true)}
                            name="created_to"
                            dateFormat="yyyy-MM-dd"
                            placeholderText="yyyy-mm-dd"
                            className="w-full border border-gray-700 rounded-[4px] text-sm px-4 py-4 bg-black text-white placeholder-gray-400"
                            popperClassName="custom-datepicker"
                            dayClassName={(date) => {
                              const today = new Date().toDateString();
                              const selectedDate = values.created_to
                                ? new Date(values.created_to).toDateString()
                                : null;
                              if (today === date.toDateString())
                                return "bg-[#FFF0F1] text-[#A3000E]";
                              if (selectedDate === date.toDateString())
                                return "bg-[#A3000E] text-white";
                              return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
                            }}
                            minDate={
                              values.created_from
                                ? new Date(values.created_from)
                                : undefined
                            }
                            isClearable
                          />
                        </div>

                        {/* Agents Multi-Select */}
                        <div className="w-full">
                          <p className="text-white text-base leading-6 mb-2">
                            Agent
                          </p>
                          <Select
                            value={agentDisplay}
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
                                  isFocused
                                    ? "!border-primary-500"
                                    : "!border-gray-700"
                                }`,
                            }}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                borderRadius: 4,
                                backgroundColor: "#000",
                              }),
                              option: (base, { isFocused, isSelected }) => ({
                                ...base,
                                backgroundColor: isSelected
                                  ? "var(--primary-600)"
                                  : isFocused
                                    ? "#222"
                                    : "#000",
                                color: "#fff",
                                cursor: "pointer",
                              }),
                              singleValue: (base) => ({
                                ...base,
                                color: "#fff",
                              }),
                              input: (base) => ({ ...base, color: "#fff" }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#aaa",
                              }),
                            }}
                          />
                        </div>

                        {/* Lead Source */}
                        <div className="w-full">
                          <p className="text-white text-base leading-6 mb-2">
                            Lead Source
                          </p>
                          <Select
                            value={leadSourceDisplay}
                            onChange={(selected: any) =>
                              setFieldValue(
                                "lead_source_id",
                                selected ? selected.id : "",
                              )
                            }
                            onBlur={() =>
                              setFieldTouched("lead_source_id", true)
                            }
                            getOptionLabel={(opt: any) => opt.name}
                            getOptionValue={(opt: any) => String(opt.id)}
                            options={leadSourceData}
                            placeholder="Select Lead Source"
                            isClearable
                            classNames={{
                              control: ({ isFocused }: any) =>
                                `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                                  isFocused
                                    ? "!border-primary-500"
                                    : "!border-gray-700"
                                }`,
                            }}
                            styles={{
                              menu: (base) => ({
                                ...base,
                                borderRadius: 4,
                                backgroundColor: "#000",
                              }),
                              option: (base, { isFocused, isSelected }) => ({
                                ...base,
                                backgroundColor: isSelected
                                  ? "var(--primary-600)"
                                  : isFocused
                                    ? "#222"
                                    : "#000",
                                color: "#fff",
                                cursor: "pointer",
                              }),
                              singleValue: (base) => ({
                                ...base,
                                color: "#fff",
                              }),
                              input: (base) => ({ ...base, color: "#fff" }),
                              placeholder: (base) => ({
                                ...base,
                                color: "#aaa",
                              }),
                            }}
                          />
                        </div>

                        

                        
                      </div>

                      <div className="flex gap-4">
                        {userRole === "Admin" && (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleUnassignFilter}
                            className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-white text-base font-medium hover:bg-primary-700 w-full"
                          >
                            Filter UnAssign leads
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleAssignFilter}
                          className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-white text-base font-medium hover:bg-primary-700 w-full"
                        >
                          Filter Assign leads
                        </button>
                      </div>
                    </form>
                  );
                }}
              </Formik>
            </div>
          )}

          {/* Edit Lead Flyout */}
          {isEditLead && (
            <div className="w-full min-h-auto p-4 text-white">
              {/* Flyout header */}
              <div className="flex justify-between mb-4">
                <p className="text-primary-500 text-2xl font-bold leading-9">
                  Edit Leads
                </p>
                <IoCloseOutline
                  onClick={() => setFlyoutOpen(false)}
                  className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
                />
              </div>
              <div className="w-full border-b border-gray-700 mb-4"></div>

              <Formik
                enableReinitialize
                initialValues={{
                  id: editLeadData?.id ?? "",
                  full_name: editLeadData?.full_name ?? "",
                  email: editLeadData?.email ?? "",
                  phone: editLeadData?.phone ?? "",
                  address_line1: editLeadData?.address?.line1 ?? editLeadData?.address_line1 ?? "",
                  address_line2: editLeadData?.address?.line2 ?? editLeadData?.address_line2 ?? "",
                  city: editLeadData?.address?.city ?? editLeadData?.city ?? "",
                  country: editLeadData?.address?.country ?? editLeadData?.country ?? "India",
                  state: editLeadData?.address?.state ?? editLeadData?.state ?? "",
                  postal_code: editLeadData?.address?.postal_code ?? editLeadData?.postal_code ?? "",
                  best_time_to_call: editLeadData?.best_time_to_call ?? "",
                  lead_source_id: editLeadData?.lead_source_id || editLeadData?.lead_source?.id || (leadSourceData.find((s) => s.name?.toLowerCase() === (typeof editLeadData?.lead_source === 'string' ? editLeadData?.lead_source?.toLowerCase() : ''))?.id) || "",
                  whatsapp_number: editLeadData?.whatsapp_number ?? "",
                  agent_id: editLeadData?.agent?.id || editLeadData?.agent_id || "",
                  lead_status: editLeadData?.lead_status ?? "New",
                }}
                validationSchema={LeadSchema}
                onSubmit={(values, { setSubmitting, resetForm }) => {
                  const value: any = {
                    id: values.id,
                    full_name: values.full_name,
                    email: values.email,
                    phone: values.phone || undefined,
                    address_line1: values.address_line1 || undefined,
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
                  resetForm();
                }}
              >
                {({
                  handleSubmit,
                  values,
                  setFieldValue,
                  setFieldTouched,
                  isSubmitting,
                }) => {
                  const currentStates = statesByCountry[values.country] || Object.values(statesByCountry).flat();

                  return (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div>
                          <p className="text-white mb-2">Full Name <span className="text-red-500">*</span></p>
                          <Field
                            type="text"
                            name="full_name"
                            placeholder="Alexandre Dumas"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                          />
                          <ErrorMessage name="full_name" component="div" className="text-red-500 text-xs mt-1" />
                        </div>

                        {/* Email */}
                        <div>
                          <p className="text-white mb-2">Email <span className="text-red-500">*</span></p>
                          <Field
                            type="email"
                            name="email"
                            placeholder="alexandre@example.com"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                          />
                          <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                        </div>

                        {/* Phone */}
                        <div>
                          <p className="text-white mb-2">Phone <span className="text-red-500">*</span></p>
                          <div className="flex w-full border border-gray-700 rounded-[4px] bg-black overflow-hidden hover:shadow-hoverInputShadow focus-within:border-primary-600">
                            <select 
                              className="bg-black text-white text-sm border-r border-gray-700 px-2 py-3 outline-none cursor-pointer"
                              value={values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91"}
                              onChange={(e) => {
                                const currentCode = values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91";
                                const numberPart = (values.phone || "").replace(currentCode, "");
                                setFieldValue("phone", numberPart ? e.target.value + numberPart : "");
                              }}
                            >
                              <option value="+91">+91</option>
                              <option value="+1">+1</option>
                              <option value="+44">+44</option>
                            </select>
                            <input
                              type="text"
                              maxLength={10}
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

                        {/* Address Line 1 */}
                        <div>
                          <p className="text-white mb-2">Address Line 1</p>
                          <Field
                            type="text"
                            name="address_line1"
                            placeholder="Street, House no."
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                          />
                        </div>

                        {/* Address Line 2 */}
                        <div>
                          <p className="text-white mb-2">Address Line 2</p>
                          <Field
                            type="text"
                            name="address_line2"
                            placeholder="Apartment, suite, unit, etc."
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                          />
                        </div>

                        {/* City */}
                        <div>
                          <p className="text-white mb-2">City</p>
                          <Field
                            type="text"
                            name="city"
                            placeholder="City / Town"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                          />
                        </div>

                        {/* Country */}
                        <div>
                          <p className="text-white mb-2">Country</p>
                          <Select
                            value={countryOptions.find((opt) => opt.id === values.country) || null}
                            onChange={(selected: any) => {
                              const countryId = selected ? selected.id : "";
                              setFieldValue("country", countryId);
                              setFieldValue("state", ""); // reset state when country changes
                              if (countryId === "India") setFieldValue("currency", "INR");
                              else if (countryId === "USA") setFieldValue("currency", "USD");
                              else if (countryId === "UK") setFieldValue("currency", "GBP");
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

                        {/* State / Region */}
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

                        {/* Postal Code */}
                        <div>
                          <p className="text-white mb-2">Postal Code</p>
                          <Field
                            type="text"
                            name="postal_code"
                            placeholder="400071"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                          />
                        </div>

                        {/* Best Time to Call */}
                        <div>
                          <p className="text-white mb-2">Best Time to Call</p>
                          <Field
                            type="text"
                            name="best_time_to_call"
                            placeholder="e.g., 3–5 PM"
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                          />
                        </div>

                        {/* Lead Source */}
                        <div>
                          <p className="text-white mb-2">Lead Source</p>
                          <Select
                            value={leadSourceData.find((opt) => opt.id === values.lead_source_id || opt.name?.toLowerCase() === values.lead_source_id?.toLowerCase() || (editLeadData?.lead_source && opt.name?.toLowerCase() === (typeof editLeadData.lead_source === 'string' ? editLeadData.lead_source.toLowerCase() : ''))) || null}
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
                          <div className="flex w-full border border-gray-700 rounded-[4px] bg-black overflow-hidden hover:shadow-hoverInputShadow focus-within:border-primary-600">
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
                              <option value="+1">+1</option>
                              <option value="+44">+44</option>
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
                          <ErrorMessage name="whatsapp_number" component="div" className="text-red-500 text-xs mt-1" />
                        </div>

                        {/* Assign to Agent */}
                        <div>
                          <p className="text-white mb-2">Assign to Agent</p>
                          <Select
                            value={agentList.find((opt) => opt.id === values.agent_id) || null}
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

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-primary-600 rounded-[4px] text-white text-base font-medium hover:bg-primary-700"
                      >
                        {isSubmitting ? "Updating..." : "Update Leads"}
                      </button>
                    </form>
                  );
                }}
              </Formik>
            </div>
          )}

          {/* Assign Agent Flyout */}
          {isAgent && (
            <div className="w-full min-h-auto p-4  text-white">
              {/* Flyout header */}
              <div className="flex justify-between mb-4">
                <p className="text-primary-600 text-2xl font-bold leading-9">
                  Assign to Agent
                </p>
                <IoCloseOutline
                  onClick={() => setFlyoutOpen(false)}
                  className="h-8 w-8 border border-white text-white rounded cursor-pointer"
                />
              </div>
              <div className="w-full border-b border-gray-700 mb-4"></div>

              {/* FORM */}
              <form onSubmit={handleSubmitAgent} className="w-full space-y-4">
                {/* Agent Dropdown */}
                <div className="w-full">
                  <p className="text-white text-base leading-6 mb-2">
                    Assign to Agent
                  </p>
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
                      menu: (base) => ({
                        ...base,
                        borderRadius: 4,
                        backgroundColor: "#000",
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                            ? "#222"
                            : "#000",
                        color: "#fff",
                        cursor: "pointer",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff" }),
                      input: (base) => ({ ...base, color: "#fff" }),
                      placeholder: (base) => ({ ...base, color: "#aaa" }),
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700 hover:text-white"
                >
                  Assign to Agent
                </button>
              </form>
            </div>
          )}

          {/* Bulk Assign Agent Flyout */}
          {isAgentBulkCheckAssign && (
            <div className=" w-full min-h-auto">
              {/* Flyout content here */}
              <div className=" flex justify-between mb-4">
                <p className=" text-primary-600 text-[26px] font-bold leading-9">
                  Assign to Agent
                </p>
                <IoCloseOutline
                  onClick={() => setFlyoutOpen(false)}
                  className=" h-8 w-8 border border-[#E7E7E7]  rounded cursor-pointer"
                />
              </div>
              <div className=" w-full border-b border-[#E7E7E7] mb-4"></div>
              {/* FORM */}
              <form onSubmit={handleBulkAction} className="w-full space-y-4">
                {/* Agent Dropdown */}
                <div className="w-full">
                  <p className=" text-base leading-6 mb-2">Assign to Agent</p>
                  <Select
                    value={selectedAgent} // show selected agent
                    onChange={(selected: any) => setSelectedAgent(selected)}
                    options={agentList} // list from API
                    getOptionLabel={(opt: any) => opt.name} // show agent name
                    getOptionValue={(opt: any) => String(opt.id)} // use id as value
                    placeholder="Select Agent"
                    isClearable
                    classNames={{
                      control: ({ isFocused }: any) =>
                        `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                          isFocused ? "!border-primary-500" : "!border-gray-700"
                        }`,
                    }}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        borderRadius: 4,
                        backgroundColor: "#000",
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                            ? "#222"
                            : "#000",
                        color: "#fff",
                        cursor: "pointer",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff" }),
                      input: (base) => ({ ...base, color: "#fff" }),
                      placeholder: (base) => ({ ...base, color: "#aaa" }),
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="py-[13px] px-[26px] bg-primary-500 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700 hover:text-white"
                >
                  Assign to Agent Check Bulk
                </button>
              </form>
              {/* END FORM */}
            </div>
          )}
        </div>
      </>

      {/* FITLER FLYOUT END */}
    </>
  );
}
