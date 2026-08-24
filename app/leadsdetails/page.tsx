"use client";
import React from "react";
import Image from "next/image";
import Tabs from "../component/Tabs";
import { CiSettings } from "react-icons/ci";
import {
  IoIosCall,
  IoIosMail,
  IoIosNotificationsOutline,
  IoMdClose,
} from "react-icons/io";
import { SetStateAction, useEffect, useRef, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useContext } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  FaPills,
  FaEye,
  FaCalendarAlt,
  FaCity,
  FaNotesMedical,
  FaRegEye,
  FaStar,
  FaTasks,
} from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import LeftSideBar from "../component/LeftSideBar";
import UserActivityLogger from "../../provider/UserActivityLogger";
import { MdEdit, MdLocationPin, MdVerified } from "react-icons/md";
import { TbActivity, TbTopologyStarRing2 } from "react-icons/tb";
import { PiMapPinLight, PiNotepadLight } from "react-icons/pi";
import { HiChevronDoubleLeft } from "react-icons/hi";
import { HiChevronDoubleRight } from "react-icons/hi";
import AxiosProvider from "../../provider/AxiosProvider";
//import CustomerViewDetails from "../component/CustomerViewDetails";
import { statesByCountry, countryOptions, leadStatusOptions, paymentStatusOptions, deliveryStatusOptions, currencyOptions } from "../leads/CreateLead";
import ReactPlayer from "react-player";
import DesktopHeader from "../component/DesktopHeader";
import { Tooltip } from "react-tooltip";
import { FaEllipsisVertical } from "react-icons/fa6";
import { AppContext } from "../AppContext";
import { GrPowerReset } from "react-icons/gr";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import dynamic from "next/dynamic";
const Select = dynamic(() => import("react-select"), { ssr: false });
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import StorageManager from "../../provider/StorageManager";
import OtpInput from "react-otp-input";
import { FiFilter } from "react-icons/fi";
import { LuSquareActivity } from "react-icons/lu";
import { IoCloseOutline } from "react-icons/io5";
import AppCalendar, { TaskData } from "../component/AppCalendar";
import { useSearchParams } from "next/navigation";
import { AiOutlineSearch } from "react-icons/ai";
import { tasks } from "firebase-functions/v2";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addMinutes,
  isValid as isValidDate,
  startOfToday,
  isToday,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
} from "date-fns";
import { compressIfImage } from "../component/imageCompression";
import Swal from "sweetalert2";
import {
  toZonedTime as utcToZonedTime,
  fromZonedTime as zonedTimeToUtc,
} from "date-fns-tz";
import { BiSkipNextCircle } from "react-icons/bi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useRouter } from "next/navigation";
const UPDATE_ACTIVITY_URL = "/leads/update/activity";

const DISPO_AUTOFILL = new Set([
  "Blank Call",
  "Left A Voice Mail",
  "Voice Mail Full",
  "Voice Mail Not Set",
  "No Answer",
]);
const storage = new StorageManager();
const loggedInUserName = storage.getUserName();
const loggedInUserRole = storage.getUserRole();
const loggedInUserId = storage.getUserId();

export default function Home() {
  const router = useRouter();
  const [isFlyoutFilterOpen, setFlyoutFilterOpen] = useState<boolean>(false);
  const checking = useAuthRedirect();

  const [isCustomerViewDetailOpen, setIsCustomerViewDetailOpen] =
    useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [hitApi, setHitApi] = useState<boolean>(true);
  const [isOrderFlyout, setIsOrderFlyout] = useState<boolean>(false);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [allOrdersGrandTotal, setAllOrdersGrandTotal] = useState<number>(0);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderNumber, setEditingOrderNumber] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("Pending");
  const [paymentStatus, setOrderPaymentStatus] = useState<string>("Pending");
  const [paymentMode, setPaymentMode] = useState<string>("COD");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [courierName, setCourierName] = useState<string>("");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isViewOrderFlyout, setIsViewOrderFlyout] = useState<boolean>(false);
  const [selectedViewingOrder, setSelectedViewingOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<Array<{ id?: string; medicine_name: string; unit: string; quantity: number | string; rate: number | string }>>([
    { medicine_name: "", unit: "Strip", quantity: 1, rate: "" },
  ]);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);
  const [modalImage, setModalImage] = useState<string>("");
  //const [isLoading, setIsLoading] = useState<boolean>(false);

  const [imageKey, setImageKey] = useState(Date.now());
  const [editInfo, setEditInfo] = useState<boolean>(true);
  const [secretKey, setSecretKey] = useState<string | null>(
    storage.getDecryptedUserSecretKey(),
  );
  const searchParams = useSearchParams();
  const [leadId, setLeadId] = useState<string | undefined>(
    searchParams.get("id") ?? undefined,
  );

  // console.log("LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL", leadId);
  const [totp, setTotp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lead, setLead] = useState<any | null>(null);
  const [isTotpPopupOpen, setIsTotpPopupOpen] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  // 2️⃣ run useEffect when id changes in URL
  useEffect(() => {
    const newId = searchParams.get("id") ?? undefined;

    // only update if changed
    if (newId !== leadId) {
      setLeadId(newId);

      // call API or refresh data
      // if (newId) {
      //   fetchLeadDetails(newId);
      // }
    }
  }, [searchParams]); // runs whenever URL search params change
  useEffect(() => {
    if (data?.agent) {
      console.log("Agent ID:", data.agent.id);
      console.log("Agent Name:", data.agent.name);
    }
  }, [data]);
  //console.log("LEAD SINGLE DATA", data.agent.name);
  const [leadActivityData, setLeadActivityData] = useState<any>();
  const [disposition, setDisposition] = useState<any[]>([]);
  useEffect(() => {
    console.log("DISOSIOT NAME:", disposition);
  }, [disposition]);

  const [agent, setAgent] = useState<any[]>([]);;
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  console.log("AGWNTTTTTTTTTTTTTTT", agent);
  const [consolidationData, setConsolidationData] = useState<any[]>(
    [],
  );
  const [debtConsolidation, setDebtConsolidation] = useState<any[]>([]);;

  const [activity, setActivity] = useState<boolean>(false);
  const [task, setTask] = useState<boolean>(false);
  const [document, setDocument] = useState<boolean>(false);
  const [updateAcitivityHistory, setUpdateActivityHistory] =
    useState<boolean>(false);
  const toggleFilterFlyout = () => setFlyoutFilterOpen(!isFlyoutFilterOpen);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [fetchLeadActivityData, setFetchLeadaActivityData] = useState<
    any[]
  >([]);
  //console.log("fetched single lead data 111111111111111111", fetchLeadActivityData);
  const [reloadKey, setReloadKey] = useState(0);
  const [docs, setDocs] = useState<any[]>([]); // start empty
  //console.log("DDDDDDDDDDDDOOOOOOOOOOOOOOCCCCCCCCSSSSSS",docs)
  const [activityHistoryData, setActivityHistoryData] =
    useState<any>(null);
  const [isEditFirstLead, setIsEditFirstLead] = useState<boolean>(true);
  const [documentName, setDocumentName] = useState<string>("");
  const [selectedDropDownTaskValue, setSelectedDropDownTaskValue] =
    useState("");
  // console.log("VVVVVVVVVVVVVVVVVVVVVVVVVV", selectedDropDownTaskValue);
  const hiddenLinkRef = useRef<HTMLAnchorElement | null>(null);
  const [isActivityFilter, setIsActvityFilter] = useState<boolean>(false);
  const [isTaskFilter, setIsTaskFilter] = useState<boolean>(false);
  const [isDocumentFilter, setIsDocumentFilter] = useState<boolean>(false);
  const [fileteredTaskData, setFilteredTasKData] = useState<[]>([]);
  // console.log("DDDDDDDDDDDDDDDDDDLLLLLLLLLLLLLLLL", fileteredTaskData);
  const [isleadPropertyEdit, setIsLeadPropertyEdit] = useState<boolean>(true);
  const [isDocumentEdit, setIsDocumentEdit] = useState<boolean>(false);
  const [documentEditObjectData, setDocumentEditObjectData] =
    useState<any>(null);
  const [isTaskEdit, setIsTaskEdit] = useState<boolean>(false);
  const [taskEditObject, setTaskEditObject] = useState<any>(null);
  const [userRole, setUserRole] = useState(storage.getUserRole());
  const [isConversationExpanded, setIsConversationExpanded] = useState(false);
  const [isActivityHistoryPagination, setIsActivityHistoryPaination] =
    useState<boolean>(true);

  //console.log("", documentName);
  // console.log("lead activity edit data", activityHistoryData);
  // console.log("lead activity",fetchLeadActivityData)
  //  FOR CREATE ACTIVITY LEAD
  // ✅ Validation
  const CreateTaskSchema = Yup.object({
    lead_id: Yup.string().trim().required("Lead is required."),
    assigned_agent_id: Yup.string().trim().required("Agent is required."),
    details: Yup.string()
      .trim()
      .min(3, "Details must be at least 3 characters.")
      .required("Details are required."),
    due_at_text: Yup.string().trim().required("Due date is required."),
  });
  const CreateLeadsActivitySchema = Yup.object({
    conversation: Yup.string().required("Conversation is required"),
    createdAt: Yup.string().nullable().optional(),
    disposition_id: Yup.string().required("Disposition is required"),
    agent_id: Yup.string().nullable().optional(),
  });
  async function UpdateLeadsActivity(payload: any) {
    console.log("UpdateLeadsActivity → payload:", payload);
    const res = await AxiosProvider.post(UPDATE_ACTIVITY_URL, payload, {
      headers: { "Content-Type": "application/json" },
    });
    // console.log("UpdateLeadsActivity → response:", res.data);
    toast.success("Activity updated successfully");
    setHitApi(!hitApi);
    closeFlyOut();
    return res.data;
  }

  const INITIAL_VALUES = {
    lead_id: leadId,
    conversation: "",
    occurred_at: "",
    disposition_id: "",
    agent_id: (storage.getUserRole() === "Agent" ? storage.getUserId() : "") || "",
  };

  const formInitialValues = activityHistoryData
    ? {
        id: activityHistoryData.id,
        lead_id: leadId,
        conversation: activityHistoryData.conversation ?? "",
        occurred_at: activityHistoryData.occurred_at ?? "",
        disposition_id: activityHistoryData.disposition_id ?? "",
        agent_id: activityHistoryData.agent_id ?? "",
      }
    : { id: "", ...INITIAL_VALUES };

  const InitialValuesForCreateTask = {
    lead_id: leadId, // required
    assigned_agent_id: "", // will hold agent id
    details: "", // task details
    subject: "", // new field
    task_type: "", // new field (e.g., followup, meeting, etc.)
    start_at_text: "", // new field (datetime string)
    end_at_text: "", // new field (datetime string)
    location: "", // required
    description: "", // optional
  };

  const CreateTaskActivity = async (n: typeof InitialValuesForCreateTask) => {
    const { description, ...rest } = n;
    const payload = {
      ...rest,
      lead_id: leadId, // ✅ now included
    };

    console.log("Submitted task values:", payload);

    try {
      await AxiosProvider.post("/leads/tasks/create", n);
      toast.success("Lead task is created");
      setHitApi(!hitApi);
      closeFlyOut();
    } catch (error: any) {
      toast.error("Lead task is not created");
    }
  };

  // ✅ Submit handler
  const CreateLeadsActivity = async (n: typeof INITIAL_VALUES) => {
    try {
      const activeAgentId =
        n.agent_id ||
        (storage.getUserRole() === "Agent" ? storage.getUserId() : null) ||
        data?.agent?.id ||
        null;

      const payload = {
        lead_id: leadId,
        disposition_id: n.disposition_id,
        conversation: n.conversation,
        agent_id: activeAgentId || undefined,
      };

      await AxiosProvider.post("/leads/activities/create", payload);
      toast.success("Lead activity created successfully");
      setHitApi((prev) => !prev);
      closeFlyOut();
    } catch (error: any) {
      console.error("Error creating activity:", error);
      const msg =
        error.response?.data?.message || "Failed to create lead activity";
      toast.error(msg);
    }
  };
  //  END CREATE ACTIVITY LEAD
  const fetchData = async () => {
    if (!leadId) return;
    try {
      const res = await AxiosProvider.post("/leads/get", {
        lead_id: leadId,
      });

      // console.log("lead dataOOOOOOOOOOOOOOOOOOOO", res.data.data);
      setData(res.data.data); // <-- if you want to store in state
    } catch (error: any) {
      console.error("Error fetching lead:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [leadId, hitApi]);

  const fetchLeadActivity = async () => {
    if (!leadId) return;
    try {
      const res = await AxiosProvider.post(
        `/leads/activities/list?page=${page}&pageSize=${pageSize}`,
        {
          lead_id: leadId,
        },
      );

      //console.log("Lead Activity wwwwwwwwwwwwwwwwww", res.data.data.activities);
      console.log(
        "Lead Activity pagination",
        res.data.data.pagination.totalPages,
      );
      setFetchLeadaActivityData(res.data.data.activities);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (error: any) {
      console.error("Error fetching lead:", error);
    }
  };
  useEffect(() => {
    fetchLeadActivity();
  }, [page, leadId, hitApi]);

  // NEXT LEADS FUNCTION
  const nextLeads = async () => {
    try {
      const res = await AxiosProvider.get("/leads/random", {});
      //console.log("KKKKKKKKKKKKKKKKKKKKKK",res.data.data.id)
      const currentId = res.data.data.id;
      router.push(`/leadsdetails?id=${currentId}`);
      // return;
      //  console.log("NEXT LEADS RESPONSE", res);
      setLeadId(res.data.data.id);

      // window.open(
      //   `/leadsdetails?id=${res.data.data.id}`,

      //   "noopener,noreferrer"
      // );
      // setData(res.data.data);
    } catch (error: any) {
      console.error("Error fetching lead:", error.response.data.msg);
      toast.error(error.response.data.msg);
    }
  };
  // FETCH DISPOSITION
  const fetchDisposition = async () => {
    try {
      const res = await AxiosProvider.get("/leads/dispositions/all");
      setDisposition(res.data.data.data);

      //console.log("fetch disposition", res.data.data.data);
    } catch (error: any) {
      console.error("Error fetching lead:", error);
    }
  };
  useEffect(() => {
    fetchDisposition();
  }, []);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        if (loggedInUserRole === "Agent") {
          setAgent([
            {
              id: loggedInUserId,
              name: loggedInUserName,
              email: "",
              mobile_number: "",
              created_at: "",
              updated_at: "",
            },
          ]);
        } else {
          const res = await AxiosProvider.get("/allagents");
          setAgent(res.data.data.data);
        }
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };

    fetchAgent();
  }, [loggedInUserRole, loggedInUserId, loggedInUserName]);

  const consolidationStatus = async () => {
    try {
      const response = await AxiosProvider.get("/getconsolidation");
      //  console.log("KKKKKKKKMMMMMMM", response.data.data.data);
      setConsolidationData(response.data.data.data);

      // const result = response.data.data.data;
      // console.log("ALL CRM USER", result);
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
      setDebtConsolidation(response.data?.data?.data || []);
    } catch (error: any) {
      console.log(error);
    }
  };
  useEffect(() => {
    debtConsolidationStatus();
  }, []);

  const fetchLeadSource = async () => {
    try {
      const response = await AxiosProvider.get("/leadsources");
      const list = response.data?.data?.data || (Array.isArray(response.data?.data) ? response.data.data : []);
      setLeadSourceData(list);
    } catch (error: any) {
      console.error("Error fetching lead sources:", error);
    }
  };
  useEffect(() => {
    fetchLeadSource();
  }, []);

  const handleQuickUpdateOrderStatus = async (
    orderId: string,
    newStatus: string,
    newPaymentStatus?: string,
    newPaymentMode?: string
  ) => {
    if (!leadId || !orderId) return;
    try {
      const res = await AxiosProvider.post("/leads/orders/update-status", {
        id: orderId,
        lead_id: leadId,
        order_status: newStatus,
        payment_status: newPaymentStatus,
        payment_mode: newPaymentMode,
      });
      toast.success(res?.data?.msg || "Order status updated");
      fetchLeadOrders();
      if (selectedViewingOrder && selectedViewingOrder.id === orderId) {
        setSelectedViewingOrder((prev: any) => ({
          ...prev,
          order_status: newStatus,
          payment_status: newPaymentStatus || prev.payment_status,
          payment_mode: newPaymentMode || prev.payment_mode,
        }));
      }
    } catch (err: any) {
      console.error("update status error:", err);
      toast.error(err?.response?.data?.msg || "Failed to update order status");
    }
  };

  const fetchLeadOrders = async () => {
    if (!leadId) return;
    try {
      const res = await AxiosProvider.post("/leads/orders/list", { lead_id: leadId });
      if (res?.data?.data) {
        setOrdersList(res.data.data.orders || []);
        setAllOrdersGrandTotal(res.data.data.all_orders_grand_total || 0);
      }
    } catch (err) {
      console.error("fetchLeadOrders error:", err);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadOrders();
    }
  }, [leadId, hitApi]);

  // END FETCH AGENT AND LEAD SOURCE

  const openActivityFlyout = () => {
    setFlyoutFilterOpen(true);
    setActivity(true);
  };
  const openTaskFlyout = () => {
    setFlyoutFilterOpen(true);
    setTask(true);
  };
  const openViewOrderFlyout = (order: any) => {
    setSelectedViewingOrder(order);
    setFlyoutFilterOpen(true);
    setIsViewOrderFlyout(true);
  };

  const openCreateOrderFlyout = () => {
    setEditingOrderId(null);
    setEditingOrderNumber(null);
    setOrderStatus("Pending");
    setOrderPaymentStatus("Pending");
    setPaymentMode("COD");
    setOrderNotes("");
    setCourierName("");
    setTrackingNumber("");
    setOrderItems([{ medicine_name: "", unit: "Strip", quantity: 1, rate: "" }]);
    setFlyoutFilterOpen(true);
    setIsOrderFlyout(true);
  };
  const openOrderFlyout = openCreateOrderFlyout;

  const openEditOrderFlyout = (order: any) => {
    setEditingOrderId(order.id);
    setEditingOrderNumber(order.order_number);
    setOrderStatus(order.order_status || "Pending");
    setOrderPaymentStatus(order.payment_status || "Pending");
    setPaymentMode(order.payment_mode || "COD");
    setOrderNotes(order.order_notes || "");
    setCourierName(order.courier_name || "");
    setTrackingNumber(order.tracking_number || "");
    if (order.items && order.items.length > 0) {
      setOrderItems(
        order.items.map((it: any) => ({
          id: it.id,
          medicine_name: it.medicine_name,
          unit: it.unit || "Strip",
          quantity: it.quantity,
          rate: it.rate,
        }))
      );
    } else {
      setOrderItems([{ medicine_name: "", unit: "Strip", quantity: 1, rate: "" }]);
    }
    setFlyoutFilterOpen(true);
    setIsOrderFlyout(true);
  };

  const handleAddOrderItemRow = () => {
    setOrderItems((prev) => [...prev, { medicine_name: "", unit: "Strip", quantity: 1, rate: "" }]);
  };

  const handleRemoveOrderItemRow = (index: number) => {
    if (orderItems.length === 1) {
      setOrderItems([{ medicine_name: "", unit: "Strip", quantity: 1, rate: "" }]);
      return;
    }
    setOrderItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOrderItemChange = (index: number, field: string, value: any) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveOrderMedicines = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    const validItems = orderItems.filter((i) => i.medicine_name && i.medicine_name.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please add at least one medicine item with a name");
      return;
    }

    setIsSavingOrder(true);
    try {
      const payload = {
        id: editingOrderId || undefined,
        lead_id: leadId,
        order_status: orderStatus,
        payment_status: paymentStatus,
        payment_mode: paymentMode,
        order_notes: orderNotes || null,
        courier_name: courierName || null,
        tracking_number: trackingNumber || null,
        items: validItems.map((i) => ({
          id: i.id || undefined,
          medicine_name: i.medicine_name.trim(),
          unit: i.unit || "Strip",
          quantity: Number(i.quantity) || 1,
          rate: Number(i.rate) || 0,
        })),
      };
      const res = await AxiosProvider.post("/leads/orders/save", payload);
      toast.success(res?.data?.msg || "Order saved successfully");
      setHitApi((prev) => !prev);
      closeFlyOut();
      fetchLeadOrders();
    } catch (err: any) {
      console.error("Save order error:", err);
      toast.error(err?.response?.data?.msg || "Failed to save order");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const deleteLeadOrder = async (order: any) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete order ${order.order_number}?`,
      icon: "warning",
      background: "#181818",
      color: "#ffffff",
      iconColor: "#eab308",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      customClass: {
        popup: "border border-gray-700 rounded-2xl shadow-2xl",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await AxiosProvider.post("/leads/orders/delete", {
            id: order.id,
            lead_id: leadId,
          });
          toast.success(`Order ${order.order_number} deleted successfully`);
          setHitApi((prev) => !prev);
          fetchLeadOrders();
        } catch (err) {
          console.error("Delete order error:", err);
          toast.error("Failed to delete order");
        }
      }
    });
  };

  const openDocumentFlyout = () => {
    setFlyoutFilterOpen(true);
    setDocument(true);
  };
  const openLeadActivityFlyOut = () => {
    setFlyoutFilterOpen(true);
    setIsActvityFilter(true);
  };
  const openLeadTaskInFlyout = () => {
    setFlyoutFilterOpen(true);
    setIsTaskFilter(true);
  };
  const openLeadDocumentInFlyOut = () => {
    setFlyoutFilterOpen(true);
    setIsDocumentFilter(true);
  };
  const openActivityHistoryFlyout = (activity: any) => {
    setFlyoutFilterOpen(true);
    setUpdateActivityHistory(true);
    setActivityHistoryData(activity);
  };
  const openEditDocumentFlyOut = (d: any) => {
    setDocumentEditObjectData(d);
    setDocumentName(d.notes);
    setFlyoutFilterOpen(true);
    setIsDocumentEdit(true);
  };
  const openEditTask = (task: TaskData) => {
    setTaskEditObject(task);

    setFlyoutFilterOpen(true);
    setIsTaskEdit(true);
  };
  const closeFlyOut = () => {
    setActivity(false);
    setTask(false);
    setIsOrderFlyout(false);
    setIsViewOrderFlyout(false);
    setSelectedViewingOrder(null);
    setFlyoutFilterOpen(false);
    setDocument(false);
    setUpdateActivityHistory(false);
    setIsActvityFilter(false);
    setIsTaskFilter(false);
    setIsDocumentFilter(false);
    setIsDocumentEdit(false);
    setIsTaskEdit(false);
  };
  const handleChangepagination = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  const UPLOAD_URL = "/leads/documents/upload"; // 👈 your final endpoint

  const handleSubmitDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!leadId) return;

    const userID = storage.getUserId();
    if (!userID) return;

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;

    // 🔥 Only compress images
    const finalFile = isImageFile(file)
      ? await compressIfImage(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.72,
          mimeType: "image/jpeg",
          compressIfLargerThanBytes: 400 * 1024,
        })
      : file; // ← Excel / CSV / PDF remain unchanged

    const fd = new FormData();
    fd.set("lead_id", String(leadId));
    fd.set("uploaded_by", String(userID));
    fd.set("file", finalFile);
    fd.set("notes", documentName);

    try {
      await AxiosProvider.post(UPLOAD_URL, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        maxBodyLength: Infinity,
      });

      toast.success("Document uploaded successfully");
      closeFlyOut();
      setHitApi(!hitApi);
      setDocumentName("");
      form.reset();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    }
  };

  // ✅ Endpoint for update

  // Optional: tiny helper so we only compress images
  const isImageFile = (f?: File | null) => !!f && f.type?.startsWith("image/");
  const UPDATE_URL = "/leads/document/edit";

  const handleUpdateDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!documentEditObjectData?.id) {
      toast.error("No document selected to update.");
      return;
    }

    const userID = storage.getUserId();
    if (!userID) return;

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem(
      "file",
    ) as HTMLInputElement | null;
    const file = fileInput?.files?.[0] ?? null;

    const fd = new FormData();
    fd.set("document_id", String(documentEditObjectData.id));
    fd.set("lead_id", String(leadId));
    fd.set("uploaded_by", String(userID));
    fd.set("notes", documentName);

    // 🔥 Only compress if the file is an IMAGE
    if (file) {
      const finalFile = isImageFile(file)
        ? await compressIfImage(file, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.72,
            mimeType: "image/jpeg",
            compressIfLargerThanBytes: 400 * 1024,
          })
        : file; // ← Excel / CSV / PDF remain unchanged

      fd.set("file", finalFile);
    }

    try {
      await AxiosProvider.post(UPDATE_URL, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        maxBodyLength: Infinity,
      });

      toast.success("Document updated successfully");
      closeFlyOut();
      setHitApi(!hitApi);
      setDocumentName("");
      form.reset();
    } catch (err) {
      console.error(err);
      toast.error("Update failed. Please try again.");
    }
  };

  const fetchLeadDocumentData = async () => {
    if (!leadId) return;
    try {
      const res = await AxiosProvider.post("/leads/documents/list", {
        lead_id: leadId,
      });

      console.log("lead document data22222222222", res.data.data.data);
      setDocs(res.data.data.data); // <-- if you want to store in state
    } catch (error: any) {
      console.error("Error fetching lead:", error);
    }
  };

  useEffect(() => {
    fetchLeadDocumentData();
  }, [leadId, hitApi]);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""; // if storage_path is relative
  const url = (p: string) => (p?.startsWith("http") ? p : `${baseUrl}${p}`);
  const fmtSize = (b: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let i = 0,
      n = b;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(1)} ${units[i]}`;
  };
  const fileExt = (name: string) =>
    (name?.split(".").pop() || "").toUpperCase();
  // ----------------- DOWNLOAD IMAGE

  const downloadDocument = async (src: string | Blob, fileName = "document") => {
    if (!src) {
      toast.error("Download link not available");
      return;
    }
    if (typeof src === "string") {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("Fetch failed");
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = fileName;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        // Fallback: direct window open if cross-origin fetch is blocked
        const a = window.document.createElement("a");
        a.href = src;
        a.target = "_blank";
        a.rel = "noreferrer noopener";
        a.download = fileName;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      }
    } else {
      const url = URL.createObjectURL(src);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  // -----------------------END DOWNLOAD IMAGE

  const deleteActivityHistory = async (deleteId: any) => {
    const activityHistoryId = deleteId.id;
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this activity?",
      icon: "warning",
      background: "#181818",
      color: "#ffffff",
      iconColor: "#eab308",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      customClass: {
        popup: "border border-gray-700 rounded-2xl shadow-2xl",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await AxiosProvider.post("/leads/activities/soft-delete", {
            id: activityHistoryId,
          });

          toast.success("Activity successfully deleted");
          setHitApi(!hitApi);
        } catch (error) {
          console.error("Error deleting activity:", error);
          toast.error("Failed to delete activity");
        }
      }
    });
  };
  const deleteDocument = async (deleteId: any) => {
    const documentId = deleteId.id;
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this document?",
      icon: "warning",
      background: "#181818",
      color: "#ffffff",
      iconColor: "#eab308",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      customClass: {
        popup: "border border-gray-700 rounded-2xl shadow-2xl",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await AxiosProvider.post("/leads/documents/soft-delete", {
            id: documentId,
          });

          toast.success("Document successfully deleted");
          setHitApi(!hitApi);
        } catch (error) {
          console.error("Error deleting document:", error);
          toast.error("Failed to delete document");
        }
      }
    });
  };
  const handleSelect = (item: string) => {
    setSelectedDropDownTaskValue(item); // save value in state
    openTaskFlyout(); // your existing function
  };
  
  const maxLength = 100; // Set your desired maximum length

  // Function to handle Show More/Show Less toggle
  const toggleConversationExpansion = () => {
    setIsConversationExpanded(!isConversationExpanded);
  };
  useEffect(() => {
    setIsActivityHistoryPaination(true);
  }, [hitApi]);

  const tabs = [
    {
      label: "Activity History",
      content: (
        <>
          {/* Tab content 3 */}
          <div className="container mx-auto p-4">
            <button
              onClick={() => openLeadActivityFlyOut()}
              className="bg-primary-600 hover:bg-primary-700 py-3 px-4 rounded-[4px] text-sm font-medium text-white mb-2"
            >
              Filter Activity
            </button>

            {fetchLeadActivityData && fetchLeadActivityData.length > 0 ? (
              fetchLeadActivityData.map((activity) => {
                const formattedOccurredCa = activity.created_at_ca || "--";

                return (
                  <div
                    key={activity.id}
                    className="w-full flex justify-between gap-4 hover:bg-primary-800 py-2 px-2 rounded transition-colors border-b border-[#E7E7E7] odd:bg-[#404040]"
                  >
                    {/* Left: icon + occurred date/time */}
                    <div className="flex gap-2 shrink-0">
                      <TbActivity className="bg-primary-500 text-white p-1 text-2xl rounded-full" />
                      <div className="leading-5 text-sm text-white">
                        <p>{formattedOccurredCa}</p>
                      </div>
                    </div>

                    {/* Middle: details */}
                    <div className="flex-1 min-w-0 text-white">
                      <p>
                        <span className="text-primary-300">
                          {activity.disposition}:
                        </span>{" "}
                        {activity.conversation.length > maxLength &&
                        !isConversationExpanded
                          ? activity.conversation.substring(0, maxLength) +
                            "..."
                          : activity.conversation}
                      </p>
                      {activity.conversation.length > maxLength && (
                        <button
                          onClick={toggleConversationExpansion}
                          className="text-primary-300 underline text-sm"
                        >
                          {isConversationExpanded ? "Show less" : "Show more"}
                        </button>
                      )}

                      <p className="text-xs text-gray-400">
                        Added by {activity.agent_name} on {formattedOccurredCa}{" "}
                        {activity.edited ? "(Edited)" : ""}
                      </p>
                    </div>

                    {/* Right: Action buttons */}
                    <div className="space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openActivityHistoryFlyout(activity)}
                        className="py-1.5 px-3 rounded text-sm bg-primary-500 text-white hover:bg-primary-600"
                      >
                        {/* Edit */}
                        <MdEdit />
                      </button>
                      {userRole === "Admin" && (
                        <button
                          type="button"
                          onClick={() => deleteActivityHistory(activity)}
                          className="py-1.5 px-3 rounded text-sm bg-red-600 text-white hover:bg-red-700"
                        >
                          {/* Delete */}
                          <RiDeleteBin6Line />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-400 py-4">No data found</p>
            )}

            {/* PAGINATION */}
            {isActivityHistoryPagination &&
              fetchLeadActivityData.length > 0 && (
                <div className="flex justify-center items-center my-10 relative">
                  <button
                    onClick={() => handleChangepagination(page - 1)}
                    disabled={page === 1}
                    className="px-2 py-2 mx-2 border rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiChevronDoubleLeft className="w-6 h-auto" />
                  </button>
                  <span className="text-gray-400 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handleChangepagination(page + 1)}
                    disabled={page === totalPages}
                    className="px-2 py-2 mx-2 border rounded bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <HiChevronDoubleRight className="w-6 h-auto" />
                  </button>
                </div>
              )}
            {/* END PAGINATION */}
          </div>
        </>
      ),
      // End Tab content 2
    },
    {
      label: "Task",
      content: (
        <>
          {/* Tab content 3 */}

          <AppCalendar
            leadId={leadId}
            reloadKey={reloadKey}
            hitApi={hitApi}
            setHitApi={setHitApi}
            openEditTask={openEditTask}
            openLeadTaskInFlyout={openLeadTaskInFlyout}
            incomingTasks={fileteredTaskData}
            //filteredTaskData={fileteredTaskData}
          />
          {/* End Tab content 3 */}
        </>
      ),
    },
    {
      label: "Document",
      content: (
        <>
          {/* Tab content 4 */}
          <div className="space-y-3">
            {docs.length === 0 ? (
              <p className="text-sm text-gray-400">No documents found</p>
            ) : (
              docs.map((d) => (
                <div
                  key={d.id}
                  className="grid grid-cols-[30%_1fr] gap-4  p-3 border border-white rounded hover:bg-primary-600 transition-colors"
                >
                  {/* Left Column: Notes */}
                  <div className="flex items-center">
                    <p className="text-base text-white whitespace-pre-wrap capitalize">
                      {d.notes || "—"}
                    </p>
                  </div>

                  {/* Right Column: File Info + Buttons */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">
                        {d.file_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {d.mime_type} · {fmtSize(d.file_size)} ·{" "}
                        {new Date(d.created_at_ca).toLocaleString()}{" "}
                        {d.is_edited ? "(Edited)" : ""}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap mt-2 md:mt-0">
                      <button
                        onClick={() => downloadDocument(d.download, d.file_name)}
                        className="py-2 px-3 border border-gray-600 rounded text-sm text-white hover:bg-primary-500 hover:text-white transition-colors cursor-pointer"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => openEditDocumentFlyOut(d)}
                        className="py-2 px-3 border border-gray-600 rounded text-sm text-white hover:bg-primary-500 hover:text-white transition-colors"
                      >
                        {/* Edit */}
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => deleteDocument(d)}
                        className="py-2 px-3 border border-red-500 rounded text-sm text-white hover:bg-red-600 hover:text-white transition-colors"
                      >
                        {/* Delete */}
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* End Tab content 4 */}
        </>
      ),
    },
    {
      label: "Order",
      content: (
        <>
          <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-lg font-bold text-white">Customer Orders</p>
                <p className="text-xs text-gray-400">All orders placed by this customer</p>
              </div>
            </div>

            {ordersList && ordersList.length > 0 ? (
              <div className="space-y-4">
                <div className="w-full overflow-x-auto border border-gray-700 rounded-lg">
                  <table className="w-full text-left text-sm text-gray-200">
                    <thead className="bg-[#181818] text-gray-400 uppercase text-xs border-b border-gray-700">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Order Number</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-center">Items</th>
                        <th className="py-3 px-4 text-right">Grand Total</th>
                        <th className="py-3 px-4 text-center">Order Status</th>
                        <th className="py-3 px-4 text-center">Payment</th>
                        <th className="py-3 px-4 text-center w-36">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {ordersList.map((ord: any, idx: number) => {
                        const isExpanded = expandedOrderId === ord.id;
                        return (
                          <React.Fragment key={ord.id || idx}>
                            <tr className="odd:bg-[#1E1E1E] even:bg-[#141414] hover:bg-gray-800/60 transition-colors">
                              <td className="py-3 px-4 text-center text-gray-400 font-medium">{idx + 1}</td>
                              <td className="py-3 px-4 font-bold text-primary-400">
                                {ord.order_number}
                              </td>
                              <td className="py-3 px-4 text-xs text-gray-300">
                                {new Date(ord.created_at).toLocaleDateString()} {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 px-4 text-center font-medium text-white">
                                <span className="px-2 py-0.5 rounded bg-gray-700 text-xs font-semibold text-white">
                                  {ord.total_items} Items
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-extrabold text-white text-base">
                                ₹{Number(ord.grand_total).toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <select
                                  value={ord.order_status || "Pending"}
                                  onChange={(e) =>
                                    handleQuickUpdateOrderStatus(
                                      ord.id,
                                      e.target.value,
                                      ord.payment_status,
                                      ord.payment_mode
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer bg-black focus:outline-none ${
                                    ord.order_status === "Delivered"
                                      ? "text-green-300 border-green-700/60"
                                      : ord.order_status === "Shipped"
                                      ? "text-blue-300 border-blue-700/60"
                                      : ord.order_status === "Confirmed"
                                      ? "text-purple-300 border-purple-700/60"
                                      : ord.order_status === "Cancelled"
                                      ? "text-red-300 border-red-700/60"
                                      : "text-yellow-300 border-yellow-700/60"
                                  }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  ord.payment_status === "Paid"
                                    ? "bg-green-950 text-green-400 border border-green-800"
                                    : "bg-gray-800 text-gray-300"
                                }`}>
                                  {ord.payment_mode || "COD"} · {ord.payment_status || "Pending"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openViewOrderFlyout(ord)}
                                    className="p-1.5 rounded text-primary-400 hover:bg-primary-950/60 hover:text-white transition-colors cursor-pointer"
                                    title="View order details in flyout"
                                  >
                                    <FaEye className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditOrderFlyout(ord)}
                                    className="p-1.5 rounded text-gray-300 hover:text-white hover:bg-gray-700 transition-colors cursor-pointer"
                                    title="Edit Order"
                                  >
                                    <MdEdit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteLeadOrder(ord)}
                                    className="p-1.5 rounded text-red-400 hover:text-white hover:bg-red-600 transition-colors cursor-pointer"
                                    title="Delete Order"
                                  >
                                    <RiDeleteBin6Line className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#111111] border-t-2 border-primary-600">
                      <tr>
                        <td colSpan={3} className="py-4 px-4 font-bold text-white text-sm whitespace-nowrap">
                          Total Orders: {ordersList.length}
                        </td>
                        <td colSpan={3} className="py-4 px-4 text-right font-bold text-gray-300 text-sm whitespace-nowrap">
                          All Orders Grand Total:
                        </td>
                        <td colSpan={2} className="py-4 px-4 text-left font-black text-primary-400 text-xl whitespace-nowrap">
                          ₹{Number(allOrdersGrandTotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 border border-dashed border-gray-700 rounded-lg text-center bg-[#151515]">
                <FaPills className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                <p className="text-base text-gray-300 font-medium mb-1">No orders placed yet</p>
                <p className="text-xs text-gray-500 mb-4">Click below to generate the first order for this lead.</p>
                <button
                  type="button"
                  onClick={() => openCreateOrderFlyout()}
                  className="bg-primary-600 hover:bg-primary-700 py-2.5 px-6 rounded-[4px] text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FaPills className="w-4 h-4" />
                  + Create First Order
                </button>
              </div>
            )}
          </div>
        </>
      ),
    },
  ];
  if (checking) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center bg-white">
        <Image
          src="/images/crmlogo.png"
          alt="Loading"
          width={150}
          height={150}
          className="animate-pulse rounded"
        />
      </div>
    );
  }
  const handleSubmit = async () => {};

  // --------------------------- DATE HELPER

  // Timezone (Eastern with DST)
  const CA_TZ = "America/Toronto";

  // Window + slot config
  const WORK_START_HOUR = 10; // 10:00
  const WORK_END_HOUR = 21; // 21:00 (latest selectable "From")
  const SLOT_MINUTES = 15; // time-step shown in picker
  const DURATION_MINUTES = 30; // length of scheduled slot

  // UTC -> Canada local (for showing)
  const toPickerLocal = (d: Date | null) =>
    d ? utcToZonedTime(d, CA_TZ) : null;

  // Canada local -> UTC (for storing/state)
  const fromPickerLocal = (d: Date | null) =>
    d ? zonedTimeToUtc(d, CA_TZ) : null;

  // "Now" in Canada tz
  const nowCA = () => utcToZonedTime(new Date(), CA_TZ);

  // Round UP to next SLOT_MINUTES (Canada time)
  const roundUpToSlot = (d: Date = nowCA()) => {
    const copy = new Date(d);
    copy.setSeconds(0, 0);
    const mins = copy.getMinutes();
    const add = (SLOT_MINUTES - (mins % SLOT_MINUTES)) % SLOT_MINUTES;
    copy.setMinutes(mins + add);
    return copy;
  };

  // Add minutes
  const addMinutes = (d: Date, mins: number) => {
    const copy = new Date(d);
    copy.setMinutes(copy.getMinutes() + mins);
    return copy;
  };

  // Same-day check in Canada tz
  const isSameDay = (a?: Date | null, b?: Date | null) => {
    if (!a || !b) return false;
    const za = utcToZonedTime(a, CA_TZ);
    const zb = utcToZonedTime(b, CA_TZ);
    return (
      za.getFullYear() === zb.getFullYear() &&
      za.getMonth() === zb.getMonth() &&
      za.getDate() === zb.getDate()
    );
  };

  // Start of today (Canada tz) for minDate
  const startOfTodayCA = () => {
    const n = nowCA();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };

  // Build a time on the same calendar day (Canada local)
  const atHM = (baseCA: Date, hour: number, minute = 0) =>
    new Date(
      baseCA.getFullYear(),
      baseCA.getMonth(),
      baseCA.getDate(),
      hour,
      minute,
      0,
      0,
    );

  // Daily bounds (Canada local)
  const windowStartCA = (dCA: Date) => atHM(dCA, WORK_START_HOUR, 0); // 10:00
  const windowEndCA = (dCA: Date) => atHM(dCA, WORK_END_HOUR, 0); // 21:00

  // Next valid START within window (for defaults and today's earliest)
  // Allows picking up to 21:00; if "now" >= 21:00, move to tomorrow 10:00
  const nextValidStartInWindowCA = (base: Date = nowCA()) => {
    const today = new Date(base);
    const wStart = windowStartCA(today);
    const wEnd = windowEndCA(today);

    if (base < wStart) return wStart; // before 10:00 -> 10:00
    if (base >= wEnd) {
      const tomorrow = addMinutes(atHM(today, 0), 24 * 60);
      return windowStartCA(tomorrow);
    }
    const rounded = roundUpToSlot(base);
    return rounded > wEnd ? wEnd : rounded;
  };

  // Formatter for payload (Canada local)
  const formatDateTime = (d: Date) => {
    const z = utcToZonedTime(d, CA_TZ);
    const pad = (n: number) => String(n).padStart(2, "0");
    let h = z.getHours();
    const m = pad(z.getMinutes());
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    const yyyy = z.getFullYear();
    const mm = pad(z.getMonth() + 1);
    const dd = pad(z.getDate());
    return `${mm}-${dd}-${yyyy} ${pad(h)}:${m}${ampm}`;
  };

  // ---------- Defaults for Formik initialValues (store UTC) ----------
  const defaultStartCA = nextValidStartInWindowCA();
  const defaultStart = fromPickerLocal(defaultStartCA)!;
  const defaultEnd = addMinutes(defaultStart, DURATION_MINUTES);

  // --------- END DATE HELPER ------------

  // helpers (put inside the component)
  const findById = (list: any[], id: string | number) =>
    list?.find((o: any) => String(o.id) === String(id)) || null;

  const getIdFromName = (list: any[], name?: string | null) => {
    if (!name) return "";
    const item = list?.find((o: any) => String(o.name) === String(name));
    return item ? item.id : "";
  };

  function setFieldTouched(arg0: string, arg1: boolean): void {
    throw new Error("Function not implemented.");
  }

  function setFieldValue(arg0: string, arg1: any) {
    throw new Error("Function not implemented.");
  }

  // HELPER TO DROP DOWN AGENT OR ADMIN

  return (
    <>
      <div className=" flex justify-end  min-h-screen">
        {/* Main content right section */}
        <div className="ml-[97px]  w-full md:w-[90%] m-auto  min-h-[500px]  rounded p-4 mt-0 ">
          <LeftSideBar />
          {/* left section top row */}
          <DesktopHeader />
          {/* right section top row */}
          {/* </div> */}
          <div className=" w-full    flex justify-center relative">
            <div className="w-full md:w-full min-h-[600px]  !rounded-3xl  mainContainerBg">
              <div className="py-4 px-2 md:p-6">
                {/* Buttons */}

                <div className="flex justify-end items-center mb-6 w-full gap-2">
                  <div className="flex justify-center items-center gap-4 ">
                    <div
                      className="flex gap-2 py-3 px-0 justify-center rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-800 group min-w-32"
                      onClick={() => openActivityFlyout()}
                    >
                      <LuSquareActivity className="w-5 h-5 text-white group-hover:text-white" />
                      <p className="text-white text-base font-medium group-hover:text-white">
                        Activity
                      </p>
                    </div>
                  </div>
                  {/* TASK */}
                  <div className="flex justify-center items-center gap-4">
                    <div className="relative group">
                      {/* Main Button */}
                      <div
                        className="flex gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-800 min-w-32"
                        // onClick={() => openTaskFlyout()}
                        onClick={() => handleSelect("meeting")}
                      >
                        <FaNotesMedical className="w-5 h-5 text-white" />
                        <p className="text-white text-base font-medium">Task</p>
                      </div>

                      {/* Dropdown */}
                      {/* <div className="absolute left-0 mt-2 w-40 rounded-[4px] border border-[#E7E7E7] bg-white shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <ul className="flex flex-col">
                          {["meeting", "followup", "phonecall"].map((item) => (
                            <li
                              key={item}
                              onClick={() => handleSelect(item)}
                              className="px-4 py-2 text-gray-700 hover:bg-primary-100 hover:text-primary-700 cursor-pointer text-sm capitalize"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div> */}
                    </div>
                  </div>

                  {/* END TASK */}
                  <div className="flex justify-center items-center gap-4">
                    <div
                      className="flex gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-800 group min-w-32"
                      onClick={() => openDocumentFlyout()}
                    >
                      <FaTasks className="w-5 h-5 text-white group-hover:text-white" />
                      <p className="text-white text-base font-medium group-hover:text-white">
                        Document
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center items-center gap-4">
                    <div
                      className="flex gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-800 group min-w-32"
                      onClick={() => openOrderFlyout()}
                    >
                      <FaPills className="w-5 h-5 text-white group-hover:text-white" />
                      <p className="text-white text-base font-medium group-hover:text-white">
                        + Add Order
                      </p>
                    </div>
                  </div>
                </div>
                <div className=" grid grid-cols-[30%_70%]  gap-4">
                  <div className="  w-full">
                    {/* LEAD */}
                    {/* CONTACT & ADDRESS INFORMATION */}
                    {isEditFirstLead ? (
                      /* ---------- VIEW MODE ---------- */
                      <div className="w-full rounded bg-primary-600 px-4 py-6 mb-6">
                        <div className="flex justify-between text-white mb-5 capitalize">
                          <div className="flex gap-2 items-center">
                            <FaStar className="text-white text-base" />
                            <div>
                              <p className="text-base font-medium leading-none">
                                {data?.full_name || "-"}
                              </p>
                              {data?.address?.country && (
                                <p className="text-xs text-gray-200 mt-1">{data?.address?.country}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsEditFirstLead(false)}
                            className="px-4 py-2 rounded-[4px] bg-white text-secondBlack text-sm font-medium flex gap-1 items-center hover:bg-gray-100"
                          >
                            <span>
                              <MdEdit />
                            </span>
                            Edit
                          </button>
                        </div>

                        {/* Email */}
                        <div className="flex text-white items-center gap-2 mb-3">
                          <IoIosMail className="text-lg flex-shrink-0" />
                          <p className="text-sm font-medium leading-none truncate">
                            {data?.email || "-"}
                          </p>
                        </div>

                        {/* Phone / Mobile */}
                        <div className="flex text-white items-center gap-2 mb-3">
                          <IoIosCall className="text-lg flex-shrink-0" />
                          <p className="text-sm font-medium leading-none">
                            {data?.phone || "-"}
                          </p>
                        </div>

                        {/* Address */}
                        <div className="flex text-white items-start gap-2 mb-3">
                          <MdLocationPin className="text-lg flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-medium leading-relaxed">
                            {[
                              data?.address?.line1,
                              data?.address?.line2,
                              data?.address?.city,
                              data?.address?.state,
                              data?.address?.postal_code,
                              data?.address?.country
                            ].filter(Boolean).join(", ") || "-"}
                          </p>
                        </div>

                        {/* Note */}
                        {data?.note && (
                          <div className="flex text-white items-start gap-2 mb-3 border-t border-white/20 pt-3">
                            <PiNotepadLight className="text-lg flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-200 font-medium">Note:</p>
                              <p className="text-sm font-medium leading-relaxed">{data?.note}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ---------- EDIT MODE (Formik form) ---------- */
                      <div className="w-full rounded px-0 py-0 mb-6">
                        <Formik
                          enableReinitialize
                          initialValues={{
                            full_name: data?.full_name ?? "",
                            email: data?.email ?? "",
                            phone: data?.phone ?? "",
                            country: data?.address?.country ?? data?.country ?? "India",
                            state: data?.address?.state ?? data?.state ?? "",
                            city: data?.address?.city ?? data?.city ?? "",
                            address_line1: data?.address?.line1 ?? data?.address_line1 ?? "",
                            address_line2: data?.address?.line2 ?? data?.address_line2 ?? "",
                            postal_code: data?.address?.postal_code ?? data?.postal_code ?? "",
                            note: data?.note ?? "",
                          }}
                          validationSchema={Yup.object({
                            full_name: Yup.string().trim().required("Full name is required"),
                            email: Yup.string().trim().email("Invalid email").required("Email is required"),
                            phone: Yup.string().trim().required("Mobile is required"),
                            country: Yup.string().trim().nullable(),
                            state: Yup.string().trim().nullable(),
                            city: Yup.string().trim().nullable(),
                            address_line1: Yup.string().trim().nullable(),
                            address_line2: Yup.string().trim().nullable(),
                            postal_code: Yup.string().trim().nullable(),
                            note: Yup.string().trim().nullable(),
                          })}
                          onSubmit={async (values, { setSubmitting }) => {
                            try {
                              const payload = {
                                id: data?.id,
                                ...values,
                              };
                              await AxiosProvider.post("/leads/update", payload);
                              toast.success("Lead contact updated successfully");
                              setIsEditFirstLead(true);
                              setHitApi(!hitApi);
                            } catch (e) {
                              console.error(e);
                              toast.error("Failed to update lead");
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                        >
                          {({
                            isSubmitting,
                            values,
                            setFieldValue,
                            setFieldTouched,
                          }) => {
                            const currentStates = statesByCountry[values.country] || Object.values(statesByCountry).flat();

                            return (
                              <Form className="w-full rounded bg-primary-600 px-4 py-6 mb-6 space-y-4 text-white">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-base font-semibold">Edit Contact & Address</p>
                                </div>

                                {/* Full Name */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">
                                    Full Name <span className="text-red-300">*</span>
                                  </label>
                                  <Field
                                    name="full_name"
                                    type="text"
                                    className="w-full border border-white/30 rounded-[4px] px-3 py-2 text-sm bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                                    placeholder="Enter full name"
                                  />
                                  <ErrorMessage name="full_name" component="p" className="text-red-300 text-xs mt-1" />
                                </div>

                                {/* Email */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">
                                    Email <span className="text-red-300">*</span>
                                  </label>
                                  <Field
                                    name="email"
                                    type="email"
                                    className="w-full border border-white/30 rounded-[4px] px-3 py-2 text-sm bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                                    placeholder="name@example.com"
                                  />
                                  <ErrorMessage name="email" component="p" className="text-red-300 text-xs mt-1" />
                                </div>

                                {/* Mobile / Phone */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">
                                    Mobile <span className="text-red-300">*</span>
                                  </label>
                                  <div className="flex w-full border border-white/30 rounded-[4px] bg-black/40 overflow-hidden focus-within:border-white">
                                    <select 
                                      className="bg-black text-white text-xs border-r border-white/30 px-2 py-2 outline-none cursor-pointer"
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
                                      className="w-full bg-transparent text-white text-sm px-3 py-2 outline-none placeholder-gray-300"
                                      placeholder="Enter mobile number"
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
                                  <ErrorMessage name="phone" component="p" className="text-red-300 text-xs mt-1" />
                                </div>

                                {/* Country */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">Country</label>
                                  <Select
                                    value={countryOptions.find((opt) => opt.id === values.country) || null}
                                    onChange={(selected: any) => {
                                      const countryId = selected ? selected.id : "";
                                      setFieldValue("country", countryId);
                                      setFieldValue("state", "");
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
                                      control: () => "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black/40 !border-white/30",
                                    }}
                                    styles={{
                                      menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                                      option: (base, { isFocused, isSelected }) => ({
                                        ...base,
                                        backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                                        color: "#fff",
                                      }),
                                      singleValue: (base) => ({ ...base, color: "#fff" }),
                                      input: (base) => ({ ...base, color: "#fff" }),
                                      placeholder: (base) => ({ ...base, color: "#ccc" }),
                                    }}
                                  />
                                </div>

                                {/* State / Region */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">State / Region</label>
                                  <Select
                                    value={currentStates.find((opt: any) => opt.id === values.state || opt.name === values.state) || null}
                                    onChange={(selected: any) => setFieldValue("state", selected ? selected.id : "")}
                                    onBlur={() => setFieldTouched("state", true)}
                                    getOptionLabel={(opt: any) => opt.name}
                                    getOptionValue={(opt: any) => opt.id}
                                    options={currentStates}
                                    placeholder="Select State / Region"
                                    isClearable
                                    classNames={{
                                      control: () => "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black/40 !border-white/30",
                                    }}
                                    styles={{
                                      menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                                      option: (base, { isFocused, isSelected }) => ({
                                        ...base,
                                        backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                                        color: "#fff",
                                      }),
                                      singleValue: (base) => ({ ...base, color: "#fff" }),
                                      input: (base) => ({ ...base, color: "#fff" }),
                                      placeholder: (base) => ({ ...base, color: "#ccc" }),
                                    }}
                                  />
                                </div>

                                {/* City */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">City</label>
                                  <Field
                                    name="city"
                                    type="text"
                                    className="w-full border border-white/30 rounded-[4px] px-3 py-2 text-sm bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                                    placeholder="Enter city"
                                  />
                                </div>

                                {/* Address Line 1 */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">Address Line 1</label>
                                  <Field
                                    name="address_line1"
                                    type="text"
                                    className="w-full border border-white/30 rounded-[4px] px-3 py-2 text-sm bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                                    placeholder="House / Street / Area"
                                  />
                                </div>

                                {/* Address Line 2 */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">Address Line 2</label>
                                  <Field
                                    name="address_line2"
                                    type="text"
                                    className="w-full border border-white/30 rounded-[4px] px-3 py-2 text-sm bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                                    placeholder="Apartment / Suite / Landmark"
                                  />
                                </div>

                                {/* Postal Code */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">Postal Code</label>
                                  <Field
                                    name="postal_code"
                                    type="text"
                                    className="w-full border border-white/30 rounded-[4px] px-3 py-2 text-sm bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                                    placeholder="Enter postal code"
                                  />
                                </div>

                                {/* Note */}
                                <div>
                                  <label className="block text-xs font-medium text-white mb-1">Note</label>
                                  <Field
                                    as="textarea"
                                    name="note"
                                    rows={2}
                                    className="w-full border border-white/30 rounded-[4px] px-3 py-2 text-sm bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                                    placeholder="Enter notes..."
                                  />
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setIsEditFirstLead(true)}
                                    className="px-4 py-2 rounded-[4px] border border-white text-white text-sm font-medium hover:bg-white/10"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-[4px] bg-white text-primary-700 text-sm font-medium hover:bg-gray-100 disabled:opacity-60"
                                  >
                                    {isSubmitting ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              </Form>
                            );
                          }}
                        </Formik>
                      </div>
                    )}

                    {/* LEAD PROPERTIES & ORDER INFORMATION */}
                    {isleadPropertyEdit ? (
                      <div className="w-full border border-gray-700 rounded overflow-hidden mb-6">
                        <table className="w-full text-sm text-left text-white">
                          <thead className="text-xs">
                            <tr className="border border-gray-700 talbleheaderBg">
                              <th
                                scope="col"
                                colSpan={2}
                                className="px-3 py-3 md:p-3 border border-gray-700 font-semibold text-white text-base"
                              >
                                <div className="flex justify-between items-center">
                                  <span>Lead & Order Properties</span>
                                  <span
                                    className="flex gap-1 items-center px-4 py-2 rounded-[4px] bg-primary-600 text-white text-sm font-medium cursor-pointer hover:bg-primary-700"
                                    onClick={() => setIsLeadPropertyEdit(!isleadPropertyEdit)}
                                  >
                                    <MdEdit />
                                    <span>Edit</span>
                                  </span>
                                </div>
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {[
                              { label: "Lead Number", value: data?.lead_number },
                              { label: "Lead Status", value: data?.lead_status || "New" },
                              { label: "Agent Name", value: data?.agent?.name || data?.owner_name || "Unassigned" },
                              { label: "Lead Source", value: data?.lead_source },
                              { label: "Best time to call", value: data?.best_time_to_call },
                              { label: "WhatsApp Number", value: data?.whatsapp_number },
                              ...(userRole === "Admin"
                                ? [{ label: "Lead Age", value: data?.lead_age_label || (data?.lead_age_days ? `${data?.lead_age_days} Days` : "-") }]
                                : []),
                            ].map((row, idx) => (
                              <tr
                                key={idx}
                                className="border transition-colors border-b border-gray-700 odd:bg-[#1E1E1E] even:bg-[#141414]"
                              >
                                <td className="text-sm text-gray-400 py-3 px-4 font-medium w-1/3">
                                  {row.label}
                                </td>
                                <td className="text-sm font-medium text-white py-3 px-4">
                                  {row.value || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      // LEAD PROPERTIES EDIT FORM
                      <div className="w-full border border-gray-700 rounded overflow-hidden mb-6 bg-[#181818] p-4">
                        <p className="text-base font-semibold text-white mb-4 border-b border-gray-700 pb-2">
                          Edit Lead Properties
                        </p>
                        <Formik
                          enableReinitialize
                          initialValues={{
                            id: leadId,
                            agent_id: data?.agent?.id ?? "",
                            lead_status: data?.lead_status ?? "New",
                            lead_source_id: data?.lead_source_id || data?.lead_source?.id || (leadSourceData.find((s) => s.name?.toLowerCase() === (typeof data?.lead_source === 'string' ? data?.lead_source?.toLowerCase() : ''))?.id) || "",
                            best_time_to_call: data?.best_time_to_call ?? "",
                            whatsapp_number: data?.whatsapp_number ?? "",
                          }}
                          validationSchema={Yup.object({
                            agent_id: Yup.string().nullable(),
                            lead_status: Yup.string().nullable(),
                            lead_source_id: Yup.string().nullable(),
                            best_time_to_call: Yup.string().trim().nullable(),
                            whatsapp_number: Yup.string().trim().nullable(),
                          })}
                          onSubmit={async (values, { setSubmitting }) => {
                            try {
                              const payload: any = {
                                id: leadId,
                                agent_id: values.agent_id || undefined,
                                lead_status: values.lead_status || undefined,
                                lead_source_id: values.lead_source_id || undefined,
                                best_time_to_call: values.best_time_to_call || undefined,
                                whatsapp_number: values.whatsapp_number || undefined,
                              };
                              await AxiosProvider.post("/leads/update", payload);
                              toast.success("Lead properties updated successfully");
                              setHitApi(!hitApi);
                              setIsLeadPropertyEdit(true);
                            } catch (error: any) {
                              toast.error("Failed to update lead properties");
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                        >
                          {({
                            setFieldValue,
                            setFieldTouched,
                            values,
                            isSubmitting,
                          }) => (
                            <Form className="space-y-4">
                              {/* Assign Agent */}
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Agent Name</label>
                                <Select
                                  value={agent.find((opt) => opt.id === values.agent_id) || null}
                                  onChange={(selected: any) => setFieldValue("agent_id", selected ? selected.id : "")}
                                  onBlur={() => setFieldTouched("agent_id", true)}
                                  getOptionLabel={(opt: any) => opt.name}
                                  getOptionValue={(opt: any) => opt.id}
                                  options={agent}
                                  placeholder="Select Agent"
                                  isClearable
                                  classNames={{
                                    control: () => "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black !border-gray-700",
                                  }}
                                  styles={{
                                    menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                                    option: (base, { isFocused, isSelected }) => ({
                                      ...base,
                                      backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                                      color: "#fff",
                                    }),
                                    singleValue: (base) => ({ ...base, color: "#fff" }),
                                    input: (base) => ({ ...base, color: "#fff" }),
                                    placeholder: (base) => ({ ...base, color: "#888" }),
                                  }}
                                />
                              </div>

                              {/* Lead Status */}
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Lead Status</label>
                                <Select
                                  value={leadStatusOptions.find((opt) => opt.id === values.lead_status) || null}
                                  onChange={(selected: any) => setFieldValue("lead_status", selected ? selected.id : "New")}
                                  onBlur={() => setFieldTouched("lead_status", true)}
                                  getOptionLabel={(opt: any) => opt.name}
                                  getOptionValue={(opt: any) => opt.id}
                                  options={leadStatusOptions}
                                  placeholder="Select Lead Status"
                                  classNames={{
                                    control: () => "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black !border-gray-700",
                                  }}
                                  styles={{
                                    menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                                    option: (base, { isFocused, isSelected }) => ({
                                      ...base,
                                      backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                                      color: "#fff",
                                    }),
                                    singleValue: (base) => ({ ...base, color: "#fff" }),
                                    input: (base) => ({ ...base, color: "#fff" }),
                                    placeholder: (base) => ({ ...base, color: "#888" }),
                                  }}
                                />
                              </div>

                              {/* Lead Source */}
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Lead Source</label>
                                <Select
                                  value={leadSourceData.find((opt) => opt.id === values.lead_source_id || opt.name?.toLowerCase() === values.lead_source_id?.toLowerCase() || (data?.lead_source && opt.name?.toLowerCase() === (typeof data.lead_source === 'string' ? data.lead_source.toLowerCase() : ''))) || null}
                                  onChange={(selected: any) => setFieldValue("lead_source_id", selected ? selected.id : "")}
                                  onBlur={() => setFieldTouched("lead_source_id", true)}
                                  getOptionLabel={(opt: any) => opt.name}
                                  getOptionValue={(opt: any) => opt.id}
                                  options={leadSourceData}
                                  placeholder="Select Lead Source"
                                  isClearable
                                  classNames={{
                                    control: () => "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black !border-gray-700",
                                  }}
                                  styles={{
                                    menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                                    option: (base, { isFocused, isSelected }) => ({
                                      ...base,
                                      backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                                      color: "#fff",
                                    }),
                                    singleValue: (base) => ({ ...base, color: "#fff" }),
                                    input: (base) => ({ ...base, color: "#fff" }),
                                    placeholder: (base) => ({ ...base, color: "#888" }),
                                  }}
                                />
                              </div>

                              {/* Best time to call */}
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">Best time to call</label>
                                <Field
                                  name="best_time_to_call"
                                  type="text"
                                  className="w-full border border-gray-700 rounded-[4px] text-white bg-black text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                                  placeholder="e.g. 3-5 PM"
                                />
                              </div>

                              {/* WhatsApp Number */}
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">WhatsApp Number</label>
                                <div className="flex w-full border border-gray-700 rounded-[4px] bg-black overflow-hidden focus-within:border-primary-500">
                                  <select 
                                    className="bg-black text-white text-xs border-r border-gray-700 px-2 py-2 outline-none cursor-pointer"
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
                                    className="w-full bg-transparent text-white text-sm px-3 py-2 outline-none placeholder-gray-500"
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

                              {/* Actions */}
                              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
                                <button
                                  type="button"
                                  onClick={() => setIsLeadPropertyEdit(true)}
                                  className="px-4 py-2 rounded-[4px] border border-gray-700 text-white text-sm font-medium bg-black hover:bg-gray-900"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className="px-4 py-2 rounded-[4px] bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
                                >
                                  {isSubmitting ? "Saving..." : "Save Properties"}
                                </button>
                              </div>
                            </Form>
                          )}
                        </Formik>
                      </div>
                    )}
                  </div>

                  <div className=" md:flex relative w-full">
                    <Tabs tabs={tabs} />
                    <GrPowerReset
                      onClick={() => setHitApi(!hitApi)}
                      className=" absolute -top-5 -right-1 md:top-2 md:right-1 cursor-pointer text-lg md:text-2xl text-white hover:text-primary-500 active:text-primary-600"
                    />
                  </div>
                </div>
                {userRole === "Agent" && (
                  <>
                    <div className="w-full flex justify-center border-b border-gray-200 mb-4"></div>
                    <div className="w-full flex justify-center ">
                      <div
                        onClick={() => nextLeads()}
                        className="flex w-auto gap-2 py-3 px-6 rounded-[4px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-500 active:bg-primary-700  "
                      >
                        <p className="text-white text-base font-medium">
                          Next Leads
                        </p>
                        <BiSkipNextCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <CustomerViewDetails
        isCustomerViewDetailOpen={isCustomerViewDetailOpen}
        setIsEditFlyoutOpen={setIsCustomerViewDetailOpen}
        customer={customer}
        selectedButton={selectedButton}
        setFaceImageFromChild={setFaceImageFromChild}
        setIdEctoFromChild={setIdEctoFromChild}
        setIdVersoFromChild={setIdVersoFromChild}
        setUserSignatureFromChild={setUserSignatureFromChild}
        setUserVideoFromChild={setUserVideoFromChild}
        hitApi={hitApi}
        setHitApi={setHitApi}
      /> */}
      {/* START FLY OUT */}
      {/* FITLER FLYOUT */}
      {isFlyoutFilterOpen && (
        <div
          className=" min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
          onClick={() => {
            closeFlyOut();
          }}
        ></div>
      )}

      <div className={`filterflyout ${isFlyoutFilterOpen ? "filteropen" : ""} ${isOrderFlyout || isViewOrderFlyout ? "!w-[96%] md:!w-[1000px] lg:!w-[1060px]" : ""}`}>
        {activity && (
          <div className="w-full min-h-auto  text-white p-4">
            {/* Flyout Header */}
            <div className="flex justify-between mb-4">
              <p className="text-primary-600 text-[26px] font-bold leading-9">
                Create Lead Activity
              </p>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-4"></div>

            {/* FORM */}
            <Formik
              initialValues={INITIAL_VALUES}
              validationSchema={CreateLeadsActivitySchema}
              onSubmit={async (values, { setSubmitting }) => {
                await CreateLeadsActivity(values);
                setReloadKey((k) => k + 1);
                setSubmitting(false);
              }}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
                setFieldValue,
                setFieldTouched,
                isSubmitting,
              }) => (
                <form onSubmit={handleSubmit} noValidate>
                  {/* GRID */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:justify-between mb-4 sm:mb-6">
                    {/* Disposition */}
                    <div className="w-full relative">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Disposition
                      </p>
                      <Select
                        value={
                          (disposition || []).find(
                            (opt: any) => opt.id === values.disposition_id,
                          ) || null
                        }
                        onChange={(selectedOption: any) => {
                          const id = selectedOption ? selectedOption.id : "";
                          const name = selectedOption
                            ? selectedOption.name
                            : "";
                          setFieldValue("disposition_id", id);
                          setFieldValue(
                            "conversation",
                            selectedOption && DISPO_AUTOFILL.has(name)
                              ? name
                              : "",
                          );
                        }}
                        onBlur={() => setFieldTouched("disposition_id", true)}
                        getOptionLabel={(opt: any) => opt.name}
                        getOptionValue={(opt: any) => opt.id}
                        options={disposition}
                        placeholder="Select Disposition"
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
                              ? "var(--primary-500)"
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
                      {touched.disposition_id && errors.disposition_id && (
                        <p className="text-red-500 absolute top-[85px] text-xs">
                          {String(errors.disposition_id)}
                        </p>
                      )}
                    </div>

                    {/* Agent */}
                    {/* Agent */}
                    {/* Agent */}
                    <div className="w-full relative">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Agent
                        {loggedInUserRole === "Agent" && (
                          <span className="text-xs text-gray-400 ml-2">
                            (Auto-selected)
                          </span>
                        )}
                      </p>

                      {loggedInUserRole === "Agent" ? (
                        // 🔥 Agent ke liye display only field
                        <div className="w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium py-3 px-4 bg-black text-white opacity-70">
                          {loggedInUserName} (You)
                        </div>
                      ) : (
                        // 🔥 Admin ke liye normal dropdown
                        <Select
                          value={
                            (agent || []).find(
                              (opt: any) => opt.id === values.agent_id,
                            ) || null
                          }
                          onChange={(selectedOption: any) =>
                            setFieldValue(
                              "agent_id",
                              selectedOption ? selectedOption.id : "",
                            )
                          }
                          onBlur={() => setFieldTouched("agent_id", true)}
                          getOptionLabel={(opt: any) => opt.name}
                          getOptionValue={(opt: any) => opt.id}
                          options={agent}
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
                                ? "var(--primary-500)"
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
                      )}

                      {touched.agent_id && errors.agent_id && (
                        <p className="text-red-500 absolute top-[85px] text-xs">
                          {String(errors.agent_id)}
                        </p>
                      )}
                    </div>

                    {/* Conversation */}
                    <div className="w-full relative mt-4 col-span-2">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Conversation
                      </p>
                      <textarea
                        name="conversation"
                        value={values.conversation}
                        onChange={handleChange}
                        onBlur={() => setFieldTouched("conversation", true)}
                        placeholder="Enter conversation"
                        className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white"
                        rows={5}
                      />
                      {touched.conversation && errors.conversation && (
                        <p className="text-red-500 absolute top-[150px] text-xs">
                          {String(errors.conversation)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="mt-10 w-full flex flex-col gap-y-4 md:flex-row justify-between items-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700 hover:text-white"
                    >
                      Create Lead Activity
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          </div>
        )}
        {task && (
          <div className="w-full min-h-auto  text-white p-4">
            {/* Flyout content */}
            <div className="flex justify-between mb-4">
              <p className="text-primary-500 text-[26px] font-bold leading-9">
                Create Lead Task
              </p>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-4"></div>

            {/* TASK FORM */}
            <Formik
              enableReinitialize
              initialValues={{
                owner: data?.agent?.id || (storage.getUserRole() === "Agent" ? storage.getUserId() : "") || "",
                associated_lead: data?.full_name || "",
                subject:
                  (selectedDropDownTaskValue
                    ? selectedDropDownTaskValue + ": "
                    : "") + (data?.full_name || ""),
                location: "online",
                description: "",
                start_at: defaultStart,
                end_at: defaultEnd,
              }}
              validationSchema={Yup.object({
                location: Yup.string().trim().required("Location is required"),
                description: Yup.string().trim().optional(),
                start_at: Yup.date().required("Start date is required"),
                end_at: Yup.date()
                  .required("End date is required")
                  .test("after", "End must be after start", function (value) {
                    const { start_at } = this.parent as {
                      start_at?: Date | null;
                    };
                    return start_at && value ? value > start_at : true;
                  }),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                const activeAgentId =
                  data?.agent?.id ||
                  (storage.getUserRole() === "Agent" ? storage.getUserId() : "") ||
                  "";
                const payload = {
                  lead_id: leadId,
                  assigned_agent_id: activeAgentId,
                  details: values.description || "",
                  subject: values.subject || "",
                  task_type: "followup",
                  start_at_text: values.start_at
                    ? formatDateTime(values.start_at)
                    : "",
                  end_at_text: values.end_at
                    ? formatDateTime(values.end_at)
                    : "",
                  location: values.location,
                  description: values.description || "",
                };
                await CreateTaskActivity(payload);
                setSubmitting(false);
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
                  {/* Grid wrapper */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:justify-between mb-4 sm:mb-6">
                    {/* Owner */}
                    <div className="w-full relative">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Owner
                      </p>
                      <input
                        type="hidden"
                        name="owner"
                        value={data?.agent?.id || (storage.getUserRole() === "Agent" ? storage.getUserId() : "") || ""}
                        readOnly
                      />
                      <input
                        type="text"
                        value={data?.agent?.name || (storage.getUserRole() === "Agent" ? storage.getUserName() : "") || "Unassigned"}
                        readOnly
                        className="capitalize w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white cursor-not-allowed"
                      />
                    </div>

                    {/* Associated Lead */}
                    <div className="w-full relative">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Associated Lead
                      </p>
                      <input
                        type="text"
                        name="associated_lead"
                        value={values.associated_lead}
                        readOnly
                        onBlur={() => setFieldTouched("associated_lead", true)}
                        className="capitalize w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white cursor-not-allowed"
                      />
                    </div>

                    {/* Subject */}
                    <div className="w-full relative">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Subject
                      </p>
                      <input
                        type="text"
                        name="subject"
                        value={values.subject}
                        readOnly
                        onBlur={() => setFieldTouched("subject", true)}
                        className="capitalize w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white cursor-not-allowed"
                      />
                    </div>

                    {/* Location */}
                    <div className="w-full relative">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Location
                      </p>
                      <input
                        type="text"
                        name="location"
                        value={values.location}
                        onChange={handleChange}
                        onBlur={() => setFieldTouched("location", true)}
                        placeholder="Enter location"
                        className="w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white"
                      />
                      {touched.location && errors.location && (
                        <p className="text-red-500 absolute top-[85px] text-xs">
                          {String(errors.location)}
                        </p>
                      )}
                    </div>

                    {/* Schedule date: From */}
                    <div className="w-full md:col-span-2">
                      <p className="text-white font-medium text-base leading-6 mb-3">
                        Schedule
                      </p>

                      {/* From */}
                      <div className="w-full relative mb-4">
                        <p className="text-white font-medium text-sm leading-6 mb-2">
                          From
                        </p>
                        <DatePicker
                          selected={toPickerLocal(values.start_at)}
                          onChange={(date: Date | null) => {
                            const utcStart = fromPickerLocal(date);
                            setFieldValue("start_at", utcStart);
                            if (utcStart)
                              setFieldValue(
                                "end_at",
                                addMinutes(utcStart, DURATION_MINUTES),
                              );
                          }}
                          onBlur={() => setFieldTouched("start_at", true)}
                          showTimeSelect
                          timeFormat="h:mma"
                          timeIntervals={SLOT_MINUTES}
                          dateFormat="MM-dd-yyyy h:mma"
                          placeholderText="MM-dd-yyyy hh:mmam/pm"
                          className="w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white"
                          popperClassName="custom-datepicker"
                          dayClassName={(date) => {
                            const todayCA = nowCA().toDateString();
                            const selectedCA = values.start_at
                              ? toPickerLocal(values.start_at)!.toDateString()
                              : null;
                            if (todayCA === date.toDateString())
                              return "bg-[#FFF0F1] text-[#A3000E]";
                            if (selectedCA === date.toDateString())
                              return "bg-[#A3000E] text-white";
                            return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
                          }}
                        />
                        {touched.start_at && errors.start_at && (
                          <p className="text-red-500 absolute top-[85px] text-xs">
                            {String(errors.start_at)}
                          </p>
                        )}
                      </div>

                      {/* To */}
                      <div className="w-full relative">
                        <p className="text-white font-medium text-sm leading-6 mb-2">
                          To
                        </p>
                        <DatePicker
                          selected={toPickerLocal(values.end_at)}
                          onChange={() => {}}
                          onBlur={() => setFieldTouched("end_at", true)}
                          showTimeSelect
                          timeFormat="h:mma"
                          timeIntervals={SLOT_MINUTES}
                          dateFormat="MM-dd-yyyy h:mma"
                          placeholderText="MM-dd-yyyy hh:mmam/pm"
                          disabled
                          className="w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white cursor-not-allowed"
                          popperClassName="custom-datepicker"
                          dayClassName={() => "pointer-events-none"}
                        />
                        {touched.end_at && errors.end_at && (
                          <p className="text-red-500 absolute top-[85px] text-xs">
                            {String(errors.end_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="w-full relative md:col-span-2">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Description (optional)
                      </p>
                      <textarea
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        onBlur={() => setFieldTouched("description", true)}
                        placeholder="Add description (optional)"
                        rows={4}
                        className="w-full border border-gray-700 rounded-[4px] text-sm leading-5 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white resize-y"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="mt-10 w-full flex flex-col gap-y-4 md:flex-row justify-between items-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700 hover:text-white"
                    >
                      Create Task Activity
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          </div>
        )}
        {document && (
          <div className="w-full min-h-auto  text-white p-4">
            <div className="flex justify-between mb-4">
              <p className="text-primary-600 text-[26px] font-bold leading-9">
                Create Document
              </p>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-4"></div>

            <form onSubmit={handleSubmitDocument} encType="multipart/form-data">
              <div className="w-full">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:justify-between mb-4 sm:mb-6">
                  {/* Document Name */}
                  <div className="w-full">
                    <p className="text-white font-medium text-base leading-6 mb-2">
                      Document name
                    </p>
                    <input
                      type="text"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Enter notes"
                      required
                      className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white"
                    />
                  </div>

                  {/* Document File */}
                  <div className="w-full">
                    <p className="text-white font-medium text-base leading-6 mb-2">
                      Document
                    </p>
                    <input
                      type="file"
                      name="file"
                      required
                      accept="
    image/*,
    application/pdf,
    application/msword,
    application/vnd.openxmlformats-officedocument.wordprocessingml.document,
    application/vnd.ms-excel,
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
    text/csv,
    .pdf,
    .doc,
    .docx,
    .xls,
    .xlsx,
    .csv
  "
                      className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white"
                    />
                  </div>
                </div>

                <div className="mt-10 w-full flex flex-col gap-y-4 md:flex-row justify-between items-center">
                  <button
                    type="submit"
                    className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700 hover:text-white"
                  >
                    Submit Document
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
        {updateAcitivityHistory && (
          <div className="w-full min-h-auto  text-white p-4">
            {/* Flyout header */}
            <div className="flex justify-between mb-4">
              <p className="text-primary-500 text-[26px] font-bold leading-9">
                Update Activity History
              </p>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-4"></div>

            {/* Formik form */}
            <Formik
              enableReinitialize
              initialValues={formInitialValues}
              validationSchema={Yup.object({
                disposition_id: Yup.string()
                  .trim()
                  .required("Disposition is required"),
                conversation: Yup.string()
                  .trim()
                  .required("Conversation is required"),
                // keep date optional but valid if present
                occurred_at: Yup.date()
                  .typeError("Invalid date")
                  .nullable()
                  .notRequired(),
                // ✅ Agent is required now
                agent_id: Yup.string().trim().required("Agent is required"),
                // passthrough
                id: Yup.string().nullable().notRequired(),
                lead_id: Yup.string().nullable().notRequired(),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                const payload: any = {
                  id: values.id,
                  lead_id: values.lead_id,
                  conversation: values.conversation,
                  occurred_at: values.occurred_at || undefined,
                  disposition_id: values.disposition_id || undefined,
                  agent_id: values.agent_id || undefined,
                };
                try {
                  await UpdateLeadsActivity(payload);
                  setReloadKey((k) => k + 1);
                } catch (e) {
                  console.error("API error:", e);
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
                setFieldValue,
                setFieldTouched,
                isSubmitting,
              }) => (
                <form onSubmit={handleSubmit} noValidate>
                  {/* Hidden: Created At (occurred_at) kept but not shown on UI */}
                  <input
                    type="hidden"
                    name="occurred_at"
                    value={values.occurred_at || ""}
                    onChange={handleChange}
                  />

                  {/* Grid: any, Agent */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:justify-between mb-4 sm:mb-6">
                    {/* Disposition */}
                    <div className="w-full relative">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Disposition
                      </p>
                      <Select
                        value={
                          (disposition || []).find(
                            (opt: any) =>
                              String(opt.id) === String(values.disposition_id),
                          ) || null
                        }
                        onChange={(selectedOption: any) => {
                          const id = selectedOption
                            ? String(selectedOption.id)
                            : "";
                          const name = selectedOption
                            ? selectedOption.name
                            : "";

                          setFieldValue("disposition_id", id);

                          // Autofill conversation if disposition is in DISPO_AUTOFILL; clear otherwise
                          setFieldValue(
                            "conversation",
                            selectedOption && DISPO_AUTOFILL.has(name)
                              ? name
                              : "",
                          );
                        }}
                        onBlur={() => setFieldTouched("disposition_id", true)}
                        getOptionLabel={(opt: any) => opt.name}
                        getOptionValue={(opt: any) => String(opt.id)}
                        options={disposition}
                        placeholder="Select Disposition"
                        isClearable
                        classNames={{
                          control: ({ isFocused }: any) =>
                            `!w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
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
                              ? "var(--primary-500)"
                              : isFocused
                                ? "#222"
                                : "#000",
                            color: "#fff",
                            cursor: "pointer",
                          }),
                          singleValue: (base) => ({ ...base, color: "#fff" }),
                          placeholder: (base) => ({ ...base, color: "#999" }),
                        }}
                      />
                      {touched.disposition_id && errors.disposition_id && (
                        <p className="text-red-500 text-xs mt-1">
                          {String(errors.disposition_id)}
                        </p>
                      )}
                    </div>

                    {/* Agent */}
                    <div className="w-full relative">
                      <p className="text-white font-medium text-base leading-6 mb-2">
                        Agent
                      </p>
                      <Select
                        value={
                          (agent || []).find(
                            (opt: any) =>
                              String(opt.id) === String(values.agent_id),
                          ) || null
                        }
                        onChange={(selectedOption: any) =>
                          setFieldValue(
                            "agent_id",
                            selectedOption ? String(selectedOption.id) : "",
                          )
                        }
                        onBlur={() => setFieldTouched("agent_id", true)}
                        getOptionLabel={(opt: any) => opt.name}
                        getOptionValue={(opt: any) => String(opt.id)}
                        options={agent}
                        placeholder="Select Agent"
                        isClearable
                        isDisabled={userRole !== "Admin"}
                        classNames={{
                          control: ({ isFocused }: any) =>
                            `!w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
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
                              ? "var(--primary-500)"
                              : isFocused
                                ? "#222"
                                : "#000",
                            color: "#fff",
                            cursor:
                              userRole === "Admin" ? "pointer" : "not-allowed",
                          }),
                          singleValue: (base) => ({ ...base, color: "#fff" }),
                          placeholder: (base) => ({ ...base, color: "#999" }),
                        }}
                      />
                      {touched.agent_id && errors.agent_id && (
                        <p className="text-red-500 text-xs mt-1">
                          {String(errors.agent_id)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Conversation */}
                  <div className="w-full relative md:col-span-2">
                    <p className="text-white font-medium text-base leading-6 mb-2">
                      Conversation
                    </p>
                    <textarea
                      name="conversation"
                      value={values.conversation}
                      onChange={handleChange}
                      onBlur={() => setFieldTouched("conversation", true)}
                      placeholder="Enter conversation"
                      rows={4}
                      className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white"
                    />
                    {touched.conversation && errors.conversation && (
                      <p className="text-red-500 text-xs mt-1">
                        {String(errors.conversation)}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <div className="mt-10 w-full flex flex-col gap-y-4 md:flex-row justify-between items-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700"
                    >
                      Update Activity History
                    </button>
                  </div>
                </form>
              )}
            </Formik>
          </div>
        )}
        {isActivityFilter && (
          <div className="w-full min-h-auto  text-white p-4">
            <div className="flex justify-between mb-4">
              <p className="text-primary-500 text-[26px] font-bold leading-9">
                Filter Activity
              </p>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-4"></div>

            <Formik<{
              conversation: string;
              disposition_id: string;
              agent_id: string;
              startDate: string;
              endDate: string;
              lead_id: string;
            }>
              initialValues={{
                conversation: "",
                disposition_id: "",
                agent_id: "",
                startDate: "",
                endDate: "",
                lead_id: leadId,
              }}
              onSubmit={async (values, { setSubmitting, resetForm }) => {
                if (
                  !values.conversation &&
                  !values.disposition_id &&
                  !values.agent_id &&
                  !values.startDate &&
                  !values.endDate
                ) {
                  toast.error("At least 1 field is required");
                } else {
                  try {
                    const res = await AxiosProvider.post(
                      "/lead/activity/filter",
                      values,
                    );
                    setFetchLeadaActivityData(res.data.data.activities);
                    setFlyoutFilterOpen(false);
                    setIsActivityHistoryPaination(false);
                    setIsActvityFilter(false);
                    resetForm();
                  } catch (error) {
                    console.error("Error filtering activity:", error);
                    toast.error("Not Filtered, try again");
                  }
                }
                setSubmitting(false);
              }}
            >
              {(formik) => {
                type Option = { id: string; name: string };
                const fmt = (d: Date) => {
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  return `${y}-${m}-${day}`;
                };

                const {
                  values,
                  handleChange,
                  handleSubmit,
                  setFieldValue,
                  setFieldTouched,
                  isSubmitting,
                } = formik;

                return (
                  <form onSubmit={handleSubmit} noValidate>
                    {/* Date Range */}
                    <div className="w-full flex flex-col md:flex-row gap-4 md:justify-between mb-4 sm:mb-6">
                      <div className="w-full md:w-[49%]">
                        <p className="text-white font-medium text-base leading-6 mb-2">
                          From
                        </p>
                        <DatePicker
                          selected={
                            values.startDate ? new Date(values.startDate) : null
                          }
                          onChange={(date: Date | null) =>
                            setFieldValue("startDate", date ? fmt(date) : "")
                          }
                          onBlur={() => setFieldTouched("startDate", true)}
                          name="startDate"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="yyyy-mm-dd"
                          className="hover:shadow-hoverInputShadow focus-border-primary !w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white shadow-sm"
                          popperClassName="custom-datepicker"
                        />
                      </div>

                      <div className="w-full md:w-[49%]">
                        <p className="text-white font-medium text-base leading-6 mb-2">
                          To
                        </p>
                        <DatePicker
                          selected={
                            values.endDate ? new Date(values.endDate) : null
                          }
                          onChange={(date: Date | null) =>
                            setFieldValue("endDate", date ? fmt(date) : "")
                          }
                          onBlur={() => setFieldTouched("endDate", true)}
                          name="endDate"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="yyyy-mm-dd"
                          className="hover:shadow-hoverInputShadow focus-border-primary !w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white shadow-sm"
                          popperClassName="custom-datepicker"
                        />
                      </div>
                    </div>

                    {/* Conversation / Disposition / Agent */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:justify-between mb-4 sm:mb-6">
                      <div className="w-full relative">
                        <p className="text-white font-medium text-base leading-6 mb-2">
                          Conversation
                        </p>
                        <input
                          type="text"
                          name="conversation"
                          value={values.conversation}
                          onChange={handleChange}
                          onBlur={() => setFieldTouched("conversation", true)}
                          placeholder="Enter conversation"
                          className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-gray-700 rounded-[4px] text-sm leading-4 font-medium placeholder-gray-400 py-4 px-4 bg-black text-white"
                        />
                      </div>

                      <div className="w-full relative">
                        <p className="text-white font-medium text-base leading-6 mb-2">
                          Disposition
                        </p>
                        <Select
                          value={
                            (disposition || []).find(
                              (opt: any) => opt.id === values.disposition_id,
                            ) || null
                          }
                          onChange={(selected: any) =>
                            setFieldValue(
                              "disposition_id",
                              selected ? selected.id : "",
                            )
                          }
                          onBlur={() => setFieldTouched("disposition_id", true)}
                          getOptionLabel={(opt: any) => opt.name}
                          getOptionValue={(opt: any) => opt.id}
                          options={disposition}
                          placeholder="Select Disposition"
                          isClearable
                          classNames={{
                            control: ({ isFocused }) =>
                              `!w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
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
                                ? "var(--primary-500)"
                                : isFocused
                                  ? "#222"
                                  : "#000",
                              color: "#fff",
                              cursor: "pointer",
                            }),
                            singleValue: (base) => ({ ...base, color: "#fff" }),
                            placeholder: (base) => ({ ...base, color: "#999" }),
                          }}
                        />
                      </div>

                      <div className="w-full relative">
                        <p className="text-white font-medium text-base leading-6 mb-2">
                          Agent
                        </p>
                        <Select
                          value={
                            (agent || []).find(
                              (opt: any) => opt.id === values.agent_id,
                            ) || null
                          }
                          onChange={(selected: any) =>
                            setFieldValue(
                              "agent_id",
                              selected ? selected.id : "",
                            )
                          }
                          onBlur={() => setFieldTouched("agent_id", true)}
                          getOptionLabel={(opt: any) => opt.name}
                          getOptionValue={(opt: any) => opt.id}
                          options={agent}
                          placeholder="Select Agent"
                          isClearable
                          classNames={{
                            control: ({ isFocused }) =>
                              `!w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
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
                                ? "var(--primary-500)"
                                : isFocused
                                  ? "#222"
                                  : "#000",
                              color: "#fff",
                              cursor: "pointer",
                            }),
                            singleValue: (base) => ({ ...base, color: "#fff" }),
                            placeholder: (base) => ({ ...base, color: "#999" }),
                          }}
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="mt-10 w-full flex flex-col gap-y-4 md:flex-row justify-between items-center">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="py-[13px] px-[26px] bg-primary-500 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700"
                      >
                        Filter Lead Activity
                      </button>
                    </div>
                  </form>
                );
              }}
            </Formik>
          </div>
        )}
        {isTaskFilter && (
          <div className="w-full min-h-auto">
            <div className="flex justify-between mb-4">
              <p className="text-primary-600 text-[26px] font-bold leading-9">
                Filter Task
              </p>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-[#E7E7E7] text-secondBlack rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-[#E7E7E7] mb-4"></div>

            {/* 🔎 Filter Tasks Formik — drop inside your existing component (uses your local leadId, agent list, etc.). 
    No Yup. Same UI/CSS patterns. Two date pickers: From / To (yyyy-MM-dd). 
    Endpoint: "/leads/tasks/fliter". Sends only non-empty fields. */}

            <Formik<{
              lead_id: string;
              details: string;
              from: string; // yyyy-MM-dd or ""
              to: string; // yyyy-MM-dd or ""
              subject: string;
              date: string; // yyyy-MM-dd or ""
              location: string;
              task_type: string;
              status: string;
              assigned_agent_id: string;
            }>
              initialValues={{
                lead_id: leadId, // ✅ from your local var
                details: "",
                from: "",
                to: "",
                subject: "",
                date: "",
                location: "",
                task_type: "",
                status: "",
                assigned_agent_id: "",
              }}
              onSubmit={async (values, { setSubmitting }) => {
                // require at least one filter (besides lead_id)
                const { lead_id, ...rest } = values;
                const allEmpty = Object.values(rest).every((v) => !v);
                if (allEmpty) {
                  toast.error("At least 1 field is required");
                  setSubmitting(false);
                  return;
                }

                // date consistency (optional guard)
                if (values.from && values.to) {
                  const s = new Date(values.from);
                  const e = new Date(values.to);
                  if (e < s) {
                    toast.error("To date cannot be earlier than From date");
                    setSubmitting(false);
                    return;
                  }
                }

                // send only non-empty fields
                const payload = Object.fromEntries(
                  Object.entries(values).filter(
                    ([_, v]) => v !== "" && v != null,
                  ),
                );

                try {
                  const res = await AxiosProvider.post(
                    "/leads/tasks/filter",
                    payload,
                  );
                  console.log(
                    "DDDDDDDDDDDDDDDDDDD1111111111111111",
                    res.data.data.task,
                  );
                  setFilteredTasKData(res.data.data.task);
                } catch (err) {
                  console.error("Filter Task error:", err);
                  //  toast.error("Failed to filter tasks");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {(formik) => {
                // helpers INSIDE Formik
                type Option = { id: string; name: string };

                const fmt = (d: Date) => {
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  return `${y}-${m}-${day}`;
                };

                const {
                  values,
                  handleChange,
                  handleSubmit,
                  setFieldValue,
                  setFieldTouched,
                  isSubmitting,
                } = formik;

                return (
                  <form onSubmit={handleSubmit} noValidate>
                    {/* ===== Lead (readonly) ===== */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:justify-between mb-4 sm:mb-6">
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Lead ID
                        </p>
                        <input
                          type="text"
                          name="lead_id"
                          value={values.lead_id}
                          readOnly
                          className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 text-firstBlack bg-gray-50 cursor-not-allowed"
                        />
                      </div>

                      {/* Assigned Agent */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Assigned Agent
                        </p>
                        <Select
                          value={
                            (agent || []).find(
                              (opt: any) => opt.id === values.assigned_agent_id,
                            ) || null
                          }
                          onChange={(selected: any) =>
                            setFieldValue(
                              "assigned_agent_id",
                              selected ? selected.id : "",
                            )
                          }
                          onBlur={() =>
                            setFieldTouched("assigned_agent_id", true)
                          }
                          getOptionLabel={(opt: any) => opt.name}
                          getOptionValue={(opt: any) => opt.id}
                          options={agent}
                          placeholder="Select Agent"
                          isClearable
                          classNames={{
                            control: ({ isFocused }) =>
                              `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-white !shadow-sm ${
                                isFocused
                                  ? "!border-primary-500"
                                  : "!border-[#DFEAF2]"
                              }`,
                          }}
                          styles={{
                            menu: (base) => ({
                              ...base,
                              borderRadius: "4px",
                              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                              backgroundColor: "#fff",
                            }),
                            option: (base, { isFocused, isSelected }) => ({
                              ...base,
                              backgroundColor: isSelected
                                ? "var(--primary-500)"
                                : isFocused
                                  ? "var(--primary-100)"
                                  : "#fff",
                              color: isSelected ? "#fff" : "#333",
                              cursor: "pointer",
                            }),
                          }}
                        />
                      </div>
                    </div>

                    {/* ===== Date Range (From / To) ===== */}
                    <div className="w-full flex flex-col md:flex-row gap-4 md:justify-between mb-4 sm:mb-6">
                      {/* From */}
                      <div className="w-full md:w-[49%]">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          From
                        </p>
                        <DatePicker
                          selected={values.from ? new Date(values.from) : null}
                          onChange={(date: Date | null) =>
                            setFieldValue("from", date ? fmt(date) : "")
                          }
                          onBlur={() => setFieldTouched("from", true)}
                          name="from"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="yyyy-mm-dd"
                          className="hover:shadow-hoverInputShadow focus-border-primary 
               !w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 
               font-medium placeholder-[#717171] py-4 px-4 bg-white shadow-sm"
                          popperClassName="custom-datepicker"
                          dayClassName={(date) => {
                            const today = new Date().toDateString();
                            const selectedDate = values.from
                              ? new Date(values.from).toDateString()
                              : null;
                            if (today === date.toDateString())
                              return "bg-[#FFF0F1] text-[#A3000E]";
                            if (selectedDate === date.toDateString())
                              return "bg-[#A3000E] text-white";
                            return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
                          }}
                          maxDate={values.to ? new Date(values.to) : undefined}
                          isClearable
                        />
                      </div>

                      {/* To */}
                      <div className="w-full md:w-[49%]">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          To
                        </p>
                        <DatePicker
                          selected={values.to ? new Date(values.to) : null}
                          onChange={(date: Date | null) =>
                            setFieldValue("to", date ? fmt(date) : "")
                          }
                          onBlur={() => setFieldTouched("to", true)}
                          name="to"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="yyyy-mm-dd"
                          className="hover:shadow-hoverInputShadow focus-border-primary 
               !w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 
               font-medium placeholder-[#717171] py-4 px-4 bg-white shadow-sm"
                          popperClassName="custom-datepicker"
                          dayClassName={(date) => {
                            const today = new Date().toDateString();
                            const selectedDate = values.to
                              ? new Date(values.to).toDateString()
                              : null;
                            if (today === date.toDateString())
                              return "bg-[#FFF0F1] text-[#A3000E]";
                            if (selectedDate === date.toDateString())
                              return "bg-[#A3000E] text-white";
                            return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
                          }}
                          minDate={
                            values.from ? new Date(values.from) : undefined
                          }
                          isClearable
                        />
                      </div>
                    </div>

                    {/* ===== Single Date (optional) ===== */}
                    <div className="w-full mb-4 sm:mb-6">
                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                        On Date
                      </p>
                      <DatePicker
                        selected={values.date ? new Date(values.date) : null}
                        onChange={(date: Date | null) =>
                          setFieldValue("date", date ? fmt(date) : "")
                        }
                        onBlur={() => setFieldTouched("date", true)}
                        name="date"
                        dateFormat="yyyy-MM-dd"
                        placeholderText="yyyy-mm-dd"
                        className="hover:shadow-hoverInputShadow focus-border-primary 
             !w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 
             font-medium placeholder-[#717171] py-4 px-4 bg-white shadow-sm"
                        popperClassName="custom-datepicker"
                        dayClassName={(date) => {
                          const today = new Date().toDateString();
                          const selectedDate = values.date
                            ? new Date(values.date).toDateString()
                            : null;
                          if (today === date.toDateString())
                            return "bg-[#FFF0F1] text-[#A3000E]";
                          if (selectedDate === date.toDateString())
                            return "bg-[#A3000E] text-white";
                          return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
                        }}
                        isClearable
                      />
                    </div>

                    {/* ===== Text Filters ===== */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:justify-between mb-4 sm:mb-6">
                      {/* Subject */}
                      <div className="w-full">
                        <p className="text-secondBlack font-medium text-base leading-6 mb-2">
                          Subject
                        </p>
                        <input
                          type="text"
                          name="subject"
                          value={values.subject}
                          onChange={handleChange}
                          onBlur={() => setFieldTouched("subject", true)}
                          placeholder="Subject contains…"
                          className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 text-firstBlack"
                        />
                      </div>

                      {/* Details */}
                      <div className="w-full">
                        <p className="text-secondBlack font-medium text-base leading-6 mb-2">
                          Details
                        </p>
                        <input
                          type="text"
                          name="details"
                          value={values.details}
                          onChange={handleChange}
                          onBlur={() => setFieldTouched("details", true)}
                          placeholder="Details contain…"
                          className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 text-firstBlack"
                        />
                      </div>

                      {/* Location */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Location
                        </p>
                        <input
                          type="text"
                          name="location"
                          value={values.location}
                          onChange={handleChange}
                          onBlur={() => setFieldTouched("location", true)}
                          placeholder="Location contains…"
                          className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 text-firstBlack"
                        />
                      </div>

                      {/* Task Type */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Task Type
                        </p>
                        <input
                          type="text"
                          name="task_type"
                          value={values.task_type}
                          onChange={handleChange}
                          onBlur={() => setFieldTouched("task_type", true)}
                          placeholder="e.g., meeting / followup / phonecall"
                          className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 text-firstBlack"
                        />
                      </div>

                      {/* Status */}
                      <div className="w-full">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          Status
                        </p>
                        <input
                          type="text"
                          name="status"
                          value={values.status}
                          onChange={handleChange}
                          onBlur={() => setFieldTouched("status", true)}
                          placeholder="e.g., open / completed / overdue"
                          className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 text-firstBlack"
                        />
                      </div>
                    </div>

                    {/* ===== Actions ===== */}
                    <div className="mt-10 w-full flex flex-col gap-y-4 md:flex-row justify-between items-center">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="py-[13px] px-[26px] bg-primary-500 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700"
                      >
                        Filter Tasks
                      </button>
                    </div>
                  </form>
                );
              }}
            </Formik>
          </div>
        )}
        {isDocumentFilter && (
          <div className="w-full min-h-auto">
            <div className="flex justify-between mb-4">
              <p className="text-primary-600 text-[26px] font-bold leading-9">
                Filter Document
              </p>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-[#E7E7E7] text-secondBlack rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-[#E7E7E7] mb-4"></div>
            <Formik<{
              lead_id: string;
              notes: string;
              from: string; // yyyy-MM-dd or ""
              to: string; // yyyy-MM-dd or ""
            }>
              initialValues={{
                lead_id: leadId, // 👈 dynamic
                notes: "",
                from: "",
                to: "",
              }}
              onSubmit={async (values, { setSubmitting }) => {
                // Require at least one filter besides lead_id
                const { lead_id, ...rest } = values;
                if (Object.values(rest).every((v) => !v)) {
                  alert("At least 1 field is required");
                } else {
                  console.log("Filter Document payload:", values);
                  try {
                    const res = await AxiosProvider.post(
                      "/leads/documents/filter",
                      values,
                    );
                    // console.log(
                    //   "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
                    //   res.data.data.data
                    // );
                    setDocs(res.data.data.data);
                  } catch (err) {
                    console.error("Filter Task error:", err);
                    //  toast.error("Failed to filter tasks");
                  }

                  // 🔧 If/when you want to call the API:
                  // const payload = Object.fromEntries(Object.entries(values).filter(([_, v]) => v !== "" && v != null));
                  // AxiosProvider.post("/leads/documents/filter", payload)
                  //   .then(res => console.log("Filter Document result:", res.data))
                  //   .catch(err => console.error("Filter Document error:", err));
                }
                setSubmitting(false);
              }}
            >
              {(formik) => {
                const {
                  values,
                  handleChange,
                  handleSubmit,
                  setFieldValue,
                  setFieldTouched,
                  isSubmitting,
                } = formik;

                const fmt = (d: Date) => {
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, "0");
                  const day = String(d.getDate()).padStart(2, "0");
                  return `${y}-${m}-${day}`;
                };

                return (
                  <form onSubmit={handleSubmit} noValidate>
                    {/* Lead ID (readonly) */}
                    <div className="mb-4">
                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                        Lead ID
                      </p>
                      <input
                        type="text"
                        name="lead_id"
                        value={values.lead_id}
                        readOnly
                        className="hover:shadow-hoverInputShadow focus-border-primary 
              w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 
              font-medium placeholder-[#717171] py-4 px-4 text-firstBlack 
              bg-gray-50 cursor-not-allowed"
                      />
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                        Notes
                      </p>
                      <input
                        type="text"
                        name="notes"
                        value={values.notes}
                        onChange={handleChange}
                        onBlur={() => setFieldTouched("notes", true)}
                        placeholder="Enter notes"
                        className="hover:shadow-hoverInputShadow focus-border-primary 
              w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 
              font-medium placeholder-[#717171] py-4 px-4 text-firstBlack"
                      />
                    </div>

                    {/* Date Range (From / To) */}
                    <div className="w-full flex flex-col md:flex-row gap-4 md:justify-between mb-6">
                      {/* From */}
                      <div className="w-full md:w-[49%]">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          From
                        </p>
                        <DatePicker
                          selected={values.from ? new Date(values.from) : null}
                          onChange={(date: Date | null) =>
                            setFieldValue("from", date ? fmt(date) : "")
                          }
                          onBlur={() => setFieldTouched("from", true)}
                          name="from"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="yyyy-mm-dd"
                          className="hover:shadow-hoverInputShadow focus-border-primary 
                !w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 
                font-medium placeholder-[#717171] py-4 px-4 bg-white shadow-sm"
                          popperClassName="custom-datepicker"
                          dayClassName={(date) => {
                            const today = new Date().toDateString();
                            const selectedDate = values.from
                              ? new Date(values.from).toDateString()
                              : null;
                            if (today === date.toDateString())
                              return "bg-[#FFF0F1] text-[#A3000E]";
                            if (selectedDate === date.toDateString())
                              return "bg-[#A3000E] text-white";
                            return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
                          }}
                          maxDate={values.to ? new Date(values.to) : undefined}
                          isClearable
                        />
                      </div>

                      {/* To */}
                      <div className="w-full md:w-[49%]">
                        <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                          To
                        </p>
                        <DatePicker
                          selected={values.to ? new Date(values.to) : null}
                          onChange={(date: Date | null) =>
                            setFieldValue("to", date ? fmt(date) : "")
                          }
                          onBlur={() => setFieldTouched("to", true)}
                          name="to"
                          dateFormat="yyyy-MM-dd"
                          placeholderText="yyyy-mm-dd"
                          className="hover:shadow-hoverInputShadow focus-border-primary 
                !w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 
                font-medium placeholder-[#717171] py-4 px-4 bg-white shadow-sm"
                          popperClassName="custom-datepicker"
                          dayClassName={(date) => {
                            const today = new Date().toDateString();
                            const selectedDate = values.to
                              ? new Date(values.to).toDateString()
                              : null;
                            if (today === date.toDateString())
                              return "bg-[#FFF0F1] text-[#A3000E]";
                            if (selectedDate === date.toDateString())
                              return "bg-[#A3000E] text-white";
                            return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
                          }}
                          minDate={
                            values.from ? new Date(values.from) : undefined
                          }
                          isClearable
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="py-[13px] px-[26px] bg-primary-500 rounded-[4px] 
              text-base font-medium leading-6 text-white 
              hover:bg-primary-700 w-full text-center"
                      >
                        Filter Document
                      </button>
                    </div>
                  </form>
                );
              }}
            </Formik>
          </div>
        )}
        {isDocumentEdit && (
          <div className="w-full min-h-auto">
            <div className="flex justify-between mb-4">
              <p className="text-primary-600 text-[26px] font-bold leading-9">
                Update Document
              </p>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-[#E7E7E7]  rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-[#E7E7E7] mb-4"></div>

            <form onSubmit={handleUpdateDocument} encType="multipart/form-data">
              <div className="w-full">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:justify-between mb-4 sm:mb-6">
                  {/* Document name */}
                  <div className="w-full">
                    <p className=" font-medium text-base leading-6 mb-2">
                      Document name
                    </p>
                    <input
                      type="text"
                      value={
                        documentName !== undefined
                          ? documentName
                          : documentEditObjectData?.notes || ""
                      } // Display documentName or fallback to documentEditObjectData?.notes
                      onChange={(e) => setDocumentName(e.target.value)} // Update documentName on user input
                      placeholder="Enter document name"
                      required
                      className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 bg-black"
                    />
                  </div>

                  {/* Replace file */}
                  <div className="w-full">
                    <p className=" font-medium text-base leading-6 mb-2">
                      Replace file (optional)
                    </p>
                    <input
                      type="file"
                      name="file"
                      accept="
    image/*,
    application/pdf,
    application/msword,
    application/vnd.openxmlformats-officedocument.wordprocessingml.document,
    application/vnd.ms-excel,
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
    text/csv,
    .pdf,
    .doc,
    .docx,
    .xls,
    .xlsx,
    .csv
  "
                      className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 bg-black"
                    />

                    {documentEditObjectData && (
                      <p className="text-xs text-gray-500 mt-2">
                        Current:{" "}
                        <a
                          href={documentEditObjectData.download}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-primary-600"
                        >
                          {documentEditObjectData.file_name}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-10 w-full flex flex-col gap-y-4 md:flex-row justify-between items-center">
                  <button
                    type="submit"
                    className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700 hover:text-white"
                  >
                    Update Document
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
        {isTaskEdit && (
          <>
            <div className="w-full min-h-auto">
              <div className="flex justify-between mb-4">
                <p className="text-primary-600 text-[26px] font-bold leading-9">
                  Update Task
                </p>
                <IoCloseOutline
                  onClick={() => closeFlyOut()}
                  className="h-8 w-8 border border-[#E7E7E7]  rounded cursor-pointer"
                />
              </div>
              <div className="w-full border-b border-[#E7E7E7] mb-4"></div>
              {/* FORMIK */}
              <Formik
                enableReinitialize
                initialValues={{
                  // ------ shared ------
                  location: taskEditObject?.location ?? "",
                  description:
                    taskEditObject?.description ??
                    taskEditObject?.details ??
                    "",
                  start_at:
                    (taskEditObject?.start_at
                      ? new Date(taskEditObject.start_at)
                      : defaultStart) || defaultStart,
                  end_at:
                    (taskEditObject?.end_at
                      ? new Date(taskEditObject.end_at)
                      : taskEditObject?.start_at
                        ? addMinutes(new Date(taskEditObject.start_at), 15)
                        : defaultEnd) || defaultEnd,

                  // ------ create-only (ignored in edit UI) ------
                  owner: data?.agent?.id || "",
                  associated_lead: data?.full_name || "",
                  subject:
                    (selectedDropDownTaskValue
                      ? selectedDropDownTaskValue + ": "
                      : "") + (data?.full_name || ""),
                }}
                validationSchema={Yup.object({
                  location: Yup.string()
                    .trim()
                    .required("Location is required"),
                  description: Yup.string().trim().optional(),
                  start_at: Yup.date().required("Start date is required"),
                  end_at: Yup.date()
                    .required("End date is required")
                    .test("after", "End must be after start", function (value) {
                      const { start_at } = this.parent as {
                        start_at?: Date | null;
                      };
                      return start_at && value ? value > start_at : true;
                    }),
                })}
                onSubmit={async (values, { setSubmitting }) => {
                  const isEditing = !!taskEditObject;

                  if (isEditing) {
                    // ----- UPDATE payload -----
                    const payload = {
                      task_id: taskEditObject?.id,
                      location: values.location,
                      details: values.description || "",
                      start_at_text: values.start_at
                        ? formatDateTime(values.start_at)
                        : "",
                      end_at_text: values.end_at
                        ? formatDateTime(values.end_at)
                        : "",
                    };

                    console.log("UPDATE TASK PAYLOAD =>", payload);
                    try {
                      await AxiosProvider.post("/leads/tasks/edit", payload);
                      toast.success("Lead task is updated");
                      setHitApi(!hitApi);
                      closeFlyOut();
                    } catch (error: any) {
                      toast.error("Lead task is not updated");
                    }
                    // TODO: call your update API here instead of console:
                    // await UpdateTaskActivity(payload);
                  } else {
                    // ----- CREATE payload (your original) -----
                    const payload = {
                      lead_id: leadId,
                      assigned_agent_id: data?.agent?.id || "",
                      details: values.description || "",
                      subject: values.subject || "",
                      task_type: "followup",
                      start_at_text: values.start_at
                        ? formatDateTime(values.start_at)
                        : "",
                      end_at_text: values.end_at
                        ? formatDateTime(values.end_at)
                        : "",
                      location: values.location,
                      description: values.description || "",
                    };
                    // await CreateTaskActivity(payload);
                  }

                  setSubmitting(false);
                  closeFlyOut();
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
                }) => {
                  const isEditing = !!taskEditObject;

                  return (
                    <form onSubmit={handleSubmit} noValidate>
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:justify-between mb-4 sm:mb-6">
                        {/* ====== CREATE-ONLY FIELDS ====== */}
                        {!isEditing && (
                          <>
                            {/* Owner (readonly: submit id, display name) */}
                            <div className="w-full relative">
                              <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                                Owner
                              </p>
                              <input
                                type="hidden"
                                name="owner"
                                value={data?.agent?.id || (storage.getUserRole() === "Agent" ? storage.getUserId() : "") || ""}
                                readOnly
                              />
                              <input
                                type="text"
                                value={data?.agent?.name || (storage.getUserRole() === "Agent" ? storage.getUserName() : "") || "Unassigned"}
                                readOnly
                                className="capitalize hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 text-firstBlack bg-gray-50 cursor-not-allowed"
                              />
                            </div>

                            {/* Associated Lead (readonly) */}
                            <div className="w-full relative">
                              <p className="text-[#0A0A0A] font-medium text-base leading-6 mb-2">
                                Associated Lead
                              </p>
                              <input
                                type="text"
                                name="associated_lead"
                                value={values.associated_lead}
                                readOnly
                                onBlur={() =>
                                  setFieldTouched("associated_lead", true)
                                }
                                className="capitalize hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 text-firstBlack bg-gray-50 cursor-not-allowed"
                              />
                            </div>

                            {/* Subject (readonly) */}
                            <div className="w-full relative md:col-span-2">
                              <p className="text-secondBlack font-medium text-base leading-6 mb-2">
                                Subject
                              </p>
                              <input
                                type="text"
                                name="subject"
                                value={values.subject}
                                readOnly
                                onBlur={() => setFieldTouched("subject", true)}
                                placeholder="Subject"
                                className="capitalize hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 text-firstBlack bg-gray-50 cursor-not-allowed"
                              />
                            </div>
                          </>
                        )}

                        {/* ====== COMMON FIELDS (shown in BOTH, but these are the ONLY ones in EDIT) ====== */}

                        {/* Location (required) */}
                        <div className="w-full relative md:col-span-2">
                          <p className=" font-medium text-base leading-6 mb-2">
                            Location
                          </p>
                          <input
                            type="text"
                            name="location"
                            value={values.location}
                            onChange={handleChange}
                            onBlur={() => setFieldTouched("location", true)}
                            placeholder="Enter location"
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4  bg-black"
                          />
                          {touched.location && (errors as any).location ? (
                            <p className="text-red-500 mt-1 text-xs">
                              {(errors as any).location}
                            </p>
                          ) : null}
                        </div>

                        {/* ===== Schedule (From / To) ===== */}
                        <div className="w-full md:col-span-2">
                          <p className=" font-medium text-base leading-6 mb-3">
                            Schedule
                          </p>

                          {/* From */}
                          <div className="w-full relative mb-4">
                            <div className="w-full relative mb-4">
                              <p className=" font-medium text-sm leading-6 mb-2">
                                From
                              </p>
                              <DatePicker
                                /* SHOW as Canada time */
                                selected={toPickerLocal(values.start_at)}
                                /* TAKE as Canada time -> store UTC and set end = start + 30 */
                                onChange={(date: Date | null) => {
                                  const utcStart = fromPickerLocal(date);
                                  setFieldValue("start_at", utcStart);
                                  if (utcStart)
                                    setFieldValue(
                                      "end_at",
                                      addMinutes(utcStart, 30),
                                    );
                                }}
                                onBlur={() => setFieldTouched("start_at", true)}
                                name="start_at"
                                showTimeSelect
                                timeFormat="h:mma"
                                timeIntervals={15} // 15-min steps
                                dateFormat="MM-dd-yyyy h:mma"
                                placeholderText="MM-dd-yyyy hh:mmam/pm"
                                className="hover:shadow-hoverInputShadow focus-border-primary !w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 font-medium placeholder-[#717171] py-4 px-4 bg-black shadow-s"
                                popperClassName="custom-datepicker"
                                dayClassName={(date) => {
                                  const todayCA = nowCA().toDateString();
                                  const selectedCA = values.start_at
                                    ? toPickerLocal(
                                        values.start_at,
                                      )!.toDateString()
                                    : null;
                                  if (todayCA === date.toDateString())
                                    return "bg-[#FFF0F1] text-[#A3000E]";
                                  if (selectedCA === date.toDateString())
                                    return "bg-[#A3000E] text-white";
                                  return "hover:bg-[#FFCCD0] hover:text-[#A3000E]";
                                }}
                              />
                              {touched.start_at && (errors as any).start_at ? (
                                <p className="text-red-500 absolute top-[85px] text-xs">
                                  {(errors as any).start_at}
                                </p>
                              ) : null}
                            </div>

                            {touched.start_at && (errors as any).start_at ? (
                              <p className="text-red-500 absolute top-[85px] text-xs">
                                {(errors as any).start_at}
                              </p>
                            ) : null}
                          </div>

                          {/* To (read-only) */}
                          <div className="w-full relative">
                            <p className=" font-medium text-sm leading-6 mb-2">
                              To
                            </p>
                            <DatePicker
                              /* SHOW end time as Canada time */
                              selected={toPickerLocal(values.end_at)}
                              onChange={() => {}}
                              onBlur={() => setFieldTouched("end_at", true)}
                              name="end_at"
                              showTimeSelect
                              timeFormat="h:mma"
                              timeIntervals={15} // display grid at 15-min
                              dateFormat="MM-dd-yyyy h:mma"
                              placeholderText="MM-dd-yyyy hh:mmam/pm"
                              disabled
                              className="hover:shadow-hoverInputShadow focus-border-primary 
        !w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-4 
        font-medium placeholder-[#717171] py-4 px-4 bg-black cursor-not-allowed"
                              popperClassName="custom-datepicker"
                              dayClassName={() => "pointer-events-none"}
                            />
                            {touched.end_at && (errors as any).end_at ? (
                              <p className="text-red-500 absolute top-[85px] text-xs">
                                {(errors as any).end_at}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="w-full relative md:col-span-2">
                          <p className=" font-medium text-base leading-6 mb-2">
                            Description (optional)
                          </p>
                          <textarea
                            name="description"
                            value={values.description}
                            onChange={handleChange}
                            onBlur={() => setFieldTouched("description", true)}
                            placeholder="Add description (optional)"
                            rows={4}
                            className="hover:shadow-hoverInputShadow focus-border-primary w-full border border-[#DFEAF2] rounded-[4px] text-sm leading-5 font-medium placeholder-[#717171] py-4 px-4 bg-black resize-y"
                          />
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="mt-10 w-full flex flex-col gap-y-4 md:flex-row justify-between items-center">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700 hover:text-white"
                        >
                          {taskEditObject
                            ? "Save Changes"
                            : "Create Task Activity"}
                        </button>
                      </div>
                    </form>
                  );
                }}
              </Formik>
            </div>
          </>
        )}

        {isOrderFlyout && (
          <div className="w-full min-h-auto text-white p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-primary-500 text-[24px] font-bold leading-8 flex items-center gap-2">
                  <FaPills /> {editingOrderId ? `Edit Order ${editingOrderNumber}` : "Create New Customer Order"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Add medicine items, select status and payment mode. Totals are calculated automatically.
                </p>
              </div>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition-colors"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>

            <form onSubmit={handleSaveOrderMedicines} className="space-y-4">
              {/* Individual Order Status & Payment Setup */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-[#141414] border border-gray-700 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Order Status <span className="text-primary-400">*</span>
                  </label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setOrderPaymentStatus(e.target.value)}
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="COD">COD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                  >
                    <option value="COD">Cash On Delivery (COD)</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="NetBanking">Net Banking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              {/* Rows List */}
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {orderItems.map((item, index) => {
                  const qtyNum = Number(item.quantity) || 0;
                  const rateNum = Number(item.rate) || 0;
                  const rowTotal = (qtyNum * rateNum).toFixed(2);

                  return (
                    <div
                      key={index}
                      className="p-3.5 bg-[#141414] border border-gray-700 rounded-lg space-y-3 relative group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-primary-400 bg-primary-950/60 px-2 py-0.5 rounded border border-primary-800/40">
                          Medicine #{index + 1}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">
                            Item Total: <span className="text-sm font-bold text-primary-400">₹{rowTotal}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOrderItemRow(index)}
                            className="text-red-400 hover:text-red-200 p-1 hover:bg-red-950/50 rounded transition-colors cursor-pointer"
                            title="Remove this item"
                          >
                            <RiDeleteBin6Line className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                        {/* Medicine Name */}
                        <div className="md:col-span-4">
                          <label className="block text-xs font-medium text-gray-300 mb-1">
                            Medicine Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Paracetamol 650mg"
                            value={item.medicine_name}
                            onChange={(e) => handleOrderItemChange(index, "medicine_name", e.target.value)}
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                          />
                        </div>

                        {/* Unit */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-300 mb-1">Unit</label>
                          <select
                            value={item.unit}
                            onChange={(e) => handleOrderItemChange(index, "unit", e.target.value)}
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                          >
                            <option value="Strip">Strip</option>
                            <option value="Bottle">Bottle</option>
                            <option value="Box">Box</option>
                            <option value="Tablet">Tablet</option>
                            <option value="Syrup">Syrup</option>
                            <option value="Capsule">Capsule</option>
                            <option value="Tube">Tube</option>
                            <option value="Injection">Injection</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-300 mb-1">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleOrderItemChange(index, "quantity", e.target.value)}
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                          />
                        </div>

                        {/* Rate */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-300 mb-1">Rate (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.rate}
                            onChange={(e) => handleOrderItemChange(index, "rate", e.target.value)}
                            className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                          />
                        </div>

                        {/* Total (Read-only) */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-300 mb-1">Total (₹)</label>
                          <input
                            type="text"
                            readOnly
                            value={`₹${rowTotal}`}
                            className="w-full border border-gray-700 rounded-[4px] bg-[#1a1a1a] text-primary-400 font-bold text-sm px-3 py-2 cursor-not-allowed outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add More Row Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddOrderItemRow}
                  className="w-full py-2.5 border-2 border-dashed border-primary-600/60 hover:border-primary-500 text-primary-400 hover:text-white hover:bg-primary-950/30 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FaPills className="w-4 h-4" />
                  + Add Another Medicine
                </button>
              </div>

              {/* Courier & Tracking Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-[#141414] border border-gray-700 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Courier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. DHL / FedEx / SpeedPost / BlueDart"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DHL123456789"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Order Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Call before delivery, urgent order"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-3 py-2 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {/* Grand Total Summary Box */}
              {(() => {
                const totalOrderAmount = orderItems.reduce((acc, curr) => {
                  const q = Number(curr.quantity) || 0;
                  const r = Number(curr.rate) || 0;
                  return acc + q * r;
                }, 0);

                return (
                  <div className="p-4 bg-[#111111] border-2 border-primary-600/80 rounded-xl flex justify-between items-center mt-4">
                    <div>
                      <p className="text-xs text-gray-400">Total Items in this Order</p>
                      <p className="text-lg font-bold text-white">
                        {orderItems.filter((i) => i.medicine_name.trim() !== "").length} Items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Total Order Amount</p>
                      <p className="text-2xl font-black text-primary-400">
                        ₹{totalOrderAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSavingOrder}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 text-white font-bold rounded-[4px] text-base transition-colors cursor-pointer shadow-lg"
                >
                  {isSavingOrder ? "Saving Order..." : editingOrderId ? "Update Order" : "Generate & Save Order"}
                </button>
              </div>
            </form>
          </div>
        )}
{isViewOrderFlyout && selectedViewingOrder && (
          <div className="w-full min-h-auto text-white p-4 space-y-5">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <div>
                <p className="text-primary-500 text-[24px] font-bold leading-8 flex items-center gap-2">
                  <FaPills /> Order Details - {selectedViewingOrder.order_number}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Placed on {new Date(selectedViewingOrder.created_at).toLocaleDateString()} at{" "}
                  {new Date(selectedViewingOrder.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <IoCloseOutline
                onClick={() => closeFlyOut()}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition-colors"
              />
            </div>

            {/* Quick Badges & Instant Status Update */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-[#151515] border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400">Order Number</p>
                <p className="text-sm font-bold text-primary-400 mt-1">{selectedViewingOrder.order_number}</p>
              </div>
              <div className="p-3 bg-[#151515] border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400">Total Items</p>
                <p className="text-sm font-bold text-white mt-1">{selectedViewingOrder.total_items} Items</p>
              </div>
              <div className="p-3 bg-[#151515] border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Update Status</p>
                <select
                  value={selectedViewingOrder.order_status || "Pending"}
                  onChange={(e) =>
                    handleQuickUpdateOrderStatus(
                      selectedViewingOrder.id,
                      e.target.value,
                      selectedViewingOrder.payment_status,
                      selectedViewingOrder.payment_mode
                    )
                  }
                  className="w-full text-xs py-1 px-2 rounded bg-black border border-gray-700 text-yellow-300 font-semibold focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="p-3 bg-[#151515] border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Update Payment</p>
                <select
                  value={selectedViewingOrder.payment_status || "Pending"}
                  onChange={(e) =>
                    handleQuickUpdateOrderStatus(
                      selectedViewingOrder.id,
                      selectedViewingOrder.order_status,
                      e.target.value,
                      selectedViewingOrder.payment_mode
                    )
                  }
                  className="w-full text-xs py-1 px-2 rounded bg-black border border-gray-700 text-green-300 font-semibold focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="COD">COD</option>
                </select>
              </div>
            </div>

            {/* Medicines List Table */}
            <div>
              <p className="text-sm font-bold text-gray-200 mb-2">Ordered Medicines Breakdown</p>
              <div className="w-full overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full text-left text-sm text-gray-200">
                  <thead className="bg-[#181818] text-gray-400 uppercase text-xs border-b border-gray-700">
                    <tr>
                      <th className="py-2.5 px-4 w-12 text-center">#</th>
                      <th className="py-2.5 px-4">Medicine Name</th>
                      <th className="py-2.5 px-4 w-28">Unit</th>
                      <th className="py-2.5 px-4 w-24 text-center">Qty</th>
                      <th className="py-2.5 px-4 w-32 text-right">Unit Rate</th>
                      <th className="py-2.5 px-4 w-36 text-right">Item Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {selectedViewingOrder.items && selectedViewingOrder.items.length > 0 ? (
                      selectedViewingOrder.items.map((it: any, itIdx: number) => (
                        <tr key={it.id || itIdx} className="odd:bg-[#1E1E1E] even:bg-[#141414]">
                          <td className="py-3 px-4 text-center text-gray-400 font-medium">{itIdx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-white">{it.medicine_name}</td>
                          <td className="py-3 px-4 text-gray-300">
                            <span className="px-2 py-0.5 rounded bg-gray-700 text-xs text-gray-200">
                              {it.unit || "Strip"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-white">{it.quantity}</td>
                          <td className="py-3 px-4 text-right text-gray-300">₹{Number(it.rate).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-bold text-primary-400">
                            ₹{Number(it.total_price).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-500 italic">
                          No medicines listed in this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-[#111111] border-t-2 border-primary-600">
                    <tr>
                      <td colSpan={3} className="py-3.5 px-4 font-bold text-white text-base">
                        Total Items: {selectedViewingOrder.items?.length || 0}
                      </td>
                      <td colSpan={2} className="py-3.5 px-4 text-right font-bold text-gray-300 text-base">
                        Total Order Amount:
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-primary-400 text-lg">
                        ₹{Number(selectedViewingOrder.grand_total).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Shipping & Tracking Information */}
            {(selectedViewingOrder.courier_name || selectedViewingOrder.tracking_number) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-[#141414] border border-gray-700 rounded-lg">
                <div>
                  <p className="text-xs text-gray-400">Courier Partner</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {selectedViewingOrder.courier_name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tracking Number</p>
                  <p className="text-sm font-bold text-primary-400 mt-0.5 font-mono">
                    {selectedViewingOrder.tracking_number || "-"}
                  </p>
                </div>
              </div>
            )}

            {/* Order Notes */}
            {selectedViewingOrder.order_notes && (
              <div className="p-3.5 bg-[#141414] border border-gray-700 rounded-lg">
                <p className="text-xs font-semibold text-gray-400 mb-1">Order Notes</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{selectedViewingOrder.order_notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const ord = selectedViewingOrder;
                  closeFlyOut();
                  openEditOrderFlyout(ord);
                }}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold rounded-[4px] text-sm transition-colors cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <MdEdit className="w-4 h-4" />
                Edit This Order
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FITLER FLYOUT END */}
    </>
  );
}
