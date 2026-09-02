"use client";

import React, { useEffect, useState } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import { FaPills, FaTrash, FaPlus, FaMapMarkerAlt } from "react-icons/fa";
import { FiPlusCircle } from "react-icons/fi";
import Swal from "sweetalert2";
import TrackingTimelineDrawer from "./TrackingTimelineDrawer";

// ==================== TYPES & INTERFACES ====================
export interface OrderItem {
  id?: string;
  medicine_name: string;
  unit: string;
  quantity: number | string;
  rate: number | string;
  total_price?: number;
}

export interface OrderData {
  id: string;
  order_number: string;
  lead_id: string;
  agent_id?: string | null;
  agent_name?: string | null;
  total_items: number;
  grand_total: number;
  order_status: string;
  payment_status: string;
  payment_mode: string;
  order_notes?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

type Props = {
  leadId: string;
  hitApi: boolean;
  setHitApi: React.Dispatch<React.SetStateAction<boolean>>;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
};

// ==================== MAIN COMPONENT ====================
export default function LeadOrdersTab({
  leadId,
  hitApi,
  setHitApi,
  isCreateOpen = false,
  onCloseCreate,
}: Props) {
  // ---------------- State Management ----------------
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);
  const [isLocalCreateOpen, setIsLocalCreateOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<OrderData | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);

  // Form State
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { medicine_name: "", unit: "Strip", quantity: 1, rate: 0 },
  ]);
  const [paymentStatus, setPaymentStatus] = useState<string>("Pending");
  const [paymentMode, setPaymentMode] = useState<string>("COD");
  const [orderStatus, setOrderStatus] = useState<string>("Pending");
  const [courierName, setCourierName] = useState<string>("India Post");
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Medicine Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeSugIndex, setActiveSugIndex] = useState<number | null>(null);

  // ---------------- 1. API: Fetch Orders ----------------
  const fetchOrders = async () => {
    try {
      const res = await AxiosProvider.post("/leads/orders/list", {
        lead_id: leadId,
      });
      setOrders(res.data?.data?.orders || []);
    } catch (e) {
      console.error("Error fetching orders:", e);
    }
  };

  useEffect(() => {
    if (leadId) fetchOrders();
  }, [leadId, hitApi]);

  // Click-outside listener to dismiss autocomplete dropdown
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".medicine-suggestion-box") &&
        !target.closest(".medicine-name-input")
      ) {
        setActiveSugIndex(null);
      }
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveSugIndex(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  // ---------------- 2. Form Open / Reset ----------------
  const openEdit = (ord: OrderData) => {
    setEditingOrder(ord);
    setPaymentStatus(ord.payment_status || "Pending");
    setPaymentMode(ord.payment_mode || "COD");
    setOrderStatus(ord.order_status || "Pending");
    setCourierName(ord.courier_name || "India Post");
    setTrackingNumber(ord.tracking_number || "");
    setOrderNotes(ord.order_notes || "");
    if (ord.items && ord.items.length > 0) {
      setOrderItems(
        ord.items.map((it) => ({
          id: it.id,
          medicine_name: it.medicine_name,
          unit: it.unit || "Strip",
          quantity: it.quantity,
          rate: it.rate,
        }))
      );
    } else {
      setOrderItems([{ medicine_name: "", unit: "Strip", quantity: 1, rate: 0 }]);
    }
  };

  const isModalOpen = isCreateOpen || isLocalCreateOpen || !!editingOrder;
  const handleCloseModal = () => {
    setEditingOrder(null);
    setIsLocalCreateOpen(false);
    if (onCloseCreate) onCloseCreate();
  };

  // ---------------- 3. API: Delete Order ----------------
  const handleDeleteOrder = (ord: OrderData) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete order "${ord.order_number}"?`,
      icon: "warning",
      background: "#181818",
      color: "#ffffff",
      iconColor: "#ef4444",
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
          await AxiosProvider.post("/leads/orders/delete", {
            id: ord.id,
            order_id: ord.id,
            lead_id: ord.lead_id || leadId,
          });
          toast.success("Order deleted successfully");
          setHitApi((prev) => !prev);
          fetchOrders();
        } catch {
          toast.error("Failed to delete order");
        }
      }
    });
  };

  // ---------------- 4. Medicine Items Handlers ----------------
  const handleItemChange = (index: number, field: keyof OrderItem, val: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: val };
    setOrderItems(updated);

    if (field === "medicine_name") {
      fetchSuggestions(val, index);
    }
  };

  const fetchSuggestions = async (query: string, index: number) => {
    try {
      const res = await AxiosProvider.get(
        `/leads/medicines/suggestions?q=${encodeURIComponent(query)}`
      );
      if (res.data?.success) {
        setSuggestions(res.data.data?.suggestions || []);
        setActiveSugIndex(index);
      }
    } catch {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (index: number, item: any) => {
    const updated = [...orderItems];
    updated[index] = {
      ...updated[index],
      medicine_name: item.medicine_name,
      unit: item.unit || "Strip",
      rate: item.rate != null && Number(item.rate) > 0 ? Number(item.rate) : updated[index].rate,
    };
    setOrderItems(updated);
    setActiveSugIndex(null);
  };

  const addItemRow = () => {
    setOrderItems([
      ...orderItems,
      { medicine_name: "", unit: "Strip", quantity: 1, rate: 0 },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (orderItems.length === 1) {
      toast.warning("At least one medicine item is required");
      return;
    }
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Calculate Grand Total
  const grandTotal = orderItems.reduce((sum, it) => {
    const q = Number(it.quantity) || 0;
    const r = Number(it.rate) || 0;
    return sum + q * r;
  }, 0);

  // ---------------- 5. API: Save / Update Order ----------------
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = orderItems.filter((it) => it.medicine_name.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please enter at least one valid medicine name");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: editingOrder?.id || undefined,
        order_id: editingOrder?.id || undefined,
        lead_id: leadId,
        order_status: orderStatus,
        payment_status: paymentStatus,
        payment_mode: paymentMode,
        courier_name: courierName,
        tracking_number: trackingNumber.trim(),
        order_notes: orderNotes,
        items: validItems.map((it) => ({
          id: it.id || undefined,
          medicine_name: it.medicine_name.trim(),
          unit: it.unit || "Strip",
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
        })),
      };

      const res = await AxiosProvider.post("/leads/orders/save", payload);
      toast.success(res.data?.msg || res.data?.message || "Order saved successfully");
      setHitApi((prev) => !prev);
      fetchOrders();
      handleCloseModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.msg || e?.response?.data?.message || "Failed to save order");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top Add Order Button */}
      <div className="flex justify-end items-center mb-4">
        <button
          type="button"
          onClick={() => {
            setEditingOrder(null);
            setOrderItems([{ medicine_name: "", unit: "Strip", quantity: 1, rate: 0 }]);
            setPaymentStatus("Pending");
            setPaymentMode("COD");
            setOrderStatus("Pending");
            setCourierName("India Post");
            setTrackingNumber("");
            setOrderNotes("");
            setIsLocalCreateOpen(true);
          }}
          className="flex items-center justify-center gap-2 w-[160px] h-[38px] rounded-[4px] border border-[#E7E7E7] bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold tracking-wide cursor-pointer transition shadow-sm"
        >
          <FiPlusCircle className="w-4 h-4 text-white" />
          <span>Add Order</span>
        </button>
      </div>

      {/* 1. ORDERS TABLE */}
      {!orders || orders.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-base font-medium">
          No data found
        </p>
      ) : (
        <div className="w-full overflow-x-auto border border-gray-600 rounded-lg">
          <table className="w-full text-left text-xs text-white">
            <thead className="text-[11px] uppercase talbleheaderBg text-white border-b border-gray-600">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Order Number</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-center">Items</th>
                <th className="py-2.5 px-3 text-right">Grand Total</th>
                <th className="py-2.5 px-3 text-center">Order Status</th>
                <th className="py-2.5 px-3 text-center">Payment</th>
                <th className="py-2.5 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {orders.map((ord: OrderData, idx: number) => (
                <tr
                  key={ord.id || idx}
                  className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-700/80 transition-colors"
                >
                  <td className="py-2 px-3 text-center text-gray-300 font-medium align-middle whitespace-nowrap">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 font-bold text-primary-300 text-xs align-middle whitespace-nowrap">
                    {ord.order_number}
                  </td>
                  <td className="py-2 px-3 text-[11px] text-gray-200 align-middle whitespace-nowrap">
                    {new Date(ord.created_at).toLocaleDateString()}{" "}
                    {new Date(ord.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 px-3 text-center align-middle whitespace-nowrap">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-gray-700 text-[11px] font-semibold text-white whitespace-nowrap">
                      {ord.total_items} Items
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-white text-xs align-middle whitespace-nowrap">
                    {Number(ord.grand_total).toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-center align-middle whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap border ${
                        ord.order_status === "Delivered"
                          ? "bg-green-900/40 text-green-300 border-green-700"
                          : ord.order_status === "Shipped" || ord.order_status === "Confirmed"
                          ? "bg-blue-900/40 text-blue-300 border-blue-700"
                          : ord.order_status === "Cancelled"
                          ? "bg-red-900/40 text-red-300 border-red-700"
                          : "bg-yellow-900/40 text-yellow-300 border-yellow-700"
                      }`}
                    >
                      {ord.order_status || "Pending"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center align-middle whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap border ${
                        ord.payment_status === "Paid"
                          ? "bg-green-900/40 text-green-300 border-green-700"
                          : ord.payment_status === "Partial"
                          ? "bg-yellow-900/40 text-yellow-300 border-yellow-700"
                          : "bg-red-900/40 text-red-300 border-red-700"
                      }`}
                    >
                      {ord.payment_status || "Pending"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center align-middle whitespace-nowrap">
                    <div className="inline-flex items-center rounded-lg border border-gray-700 bg-black p-1 gap-1 shadow-sm">
                      {ord.tracking_number && (
                        <button
                          onClick={() => {
                            setTrackingOrder(ord);
                            setIsTrackingOpen(true);
                          }}
                          className="p-1 hover:bg-cyan-700 rounded-md text-white transition cursor-pointer flex items-center justify-center"
                          title="Track Parcel Journey"
                        >
                          <FaMapMarkerAlt className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(ord)}
                        className="p-1 hover:bg-primary-700 rounded-md text-white transition cursor-pointer flex items-center justify-center"
                        title="Edit Order"
                      >
                        <MdEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(ord)}
                        className="p-1 hover:bg-red-700 rounded-md text-white transition cursor-pointer flex items-center justify-center"
                        title="Delete Order"
                      >
                        <RiDeleteBin6Line className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. CREATE / EDIT ORDER RIGHT-SIDE FLYOUT */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          isModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleCloseModal}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[420px] sm:w-[600px] md:w-[700px] xl:w-[800px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isModalOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full min-h-auto p-6 sm:p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <FaPills className="text-primary-400 text-xl" />
              <p className="text-primary-600 text-2xl font-bold leading-9">
                {editingOrder ? `Update Order - ${editingOrder.order_number}` : "Create New Order"}
              </p>
            </div>
            <IoCloseOutline
              onClick={handleCloseModal}
              className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
            />
          </div>
          <div className="w-full border-b border-gray-700 mb-6"></div>

          <form onSubmit={handleSaveOrder} className="space-y-4">
            {/* Status & Payment Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-black/50 border border-gray-700 rounded-lg">
              <div>
                <p className="text-xs text-gray-300 mb-1 font-medium">Order Status</p>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded text-xs p-2 text-white outline-none focus:border-primary-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <p className="text-xs text-gray-300 mb-1 font-medium">Payment Mode</p>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded text-xs p-2 text-white outline-none focus:border-primary-500"
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="Prepaid">Prepaid (Online)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div>
                <p className="text-xs text-gray-300 mb-1 font-medium">Payment Status</p>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded text-xs p-2 text-white outline-none focus:border-primary-500"
                >
                  <option value="Pending">Pending / Unpaid</option>
                  <option value="Partial">Partially Paid</option>
                  <option value="Paid">Fully Paid</option>
                </select>
              </div>
            </div>

            {/* Medicine Items List */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-white">
                  Order Items ({orderItems.length})
                </p>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1.5 px-3 py-1 bg-primary-600 hover:bg-primary-700 rounded text-xs text-white cursor-pointer font-medium"
                >
                  <FaPlus className="w-2.5 h-2.5" /> Add Another Item
                </button>
              </div>

              <div className="space-y-3">
                {orderItems.map((item, idx) => {
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-black/60 border border-gray-700 rounded-lg relative"
                    >
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Medicine Name with Autocomplete */}
                        <div className="col-span-12 sm:col-span-5 relative">
                          <p className="text-xs text-gray-400 mb-1">Medicine Name *</p>
                          <input
                            type="text"
                            value={item.medicine_name}
                            onFocus={() => fetchSuggestions(item.medicine_name || "", idx)}
                            onChange={(e) =>
                              handleItemChange(idx, "medicine_name", e.target.value)
                            }
                            placeholder="Type medicine name..."
                            required
                            className="medicine-name-input w-full bg-black border border-gray-700 rounded text-xs p-2 text-white outline-none focus:border-primary-500"
                          />
                          {activeSugIndex === idx && suggestions.length > 0 && (
                            <div className="medicine-suggestion-box absolute top-full left-0 right-0 z-50 bg-[#1c1c1c] border border-gray-600 rounded-md shadow-2xl max-h-56 overflow-y-auto mt-1 divide-y divide-gray-700/60">
                              {suggestions.map((sug, sIdx) => (
                                <div
                                  key={sIdx}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectSuggestion(idx, sug);
                                  }}
                                  className="p-2.5 text-xs text-white hover:bg-primary-600 cursor-pointer flex items-center transition-colors"
                                >
                                  <span className="font-medium text-gray-100">{sug.medicine_name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Unit */}
                        <div className="col-span-4 sm:col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Unit</p>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                            placeholder="Strip/Box"
                            className="w-full bg-black border border-gray-700 rounded text-xs p-2 text-white outline-none"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="col-span-4 sm:col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Qty</p>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded text-xs p-2 text-white text-center outline-none"
                          />
                        </div>

                        {/* Rate */}
                        <div className="col-span-3 sm:col-span-2">
                          <p className="text-xs text-gray-400 mb-1">Rate</p>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded text-xs p-2 text-white text-right outline-none"
                          />
                        </div>

                        {/* Remove button */}
                        <div className="col-span-1 flex justify-center items-end pt-5">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition cursor-pointer"
                            title="Remove Item"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-1.5 text-right text-xs text-gray-400">
                        Total: <span className="text-primary-300 font-bold">{lineTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping / Courier & Tracking Details */}
            <div className="p-3 bg-black/50 border border-gray-700 rounded-lg">
              <p className="text-xs text-primary-400 font-bold mb-2">
                Shipping & Courier Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-300 mb-1 font-medium">Courier Partner</p>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full bg-black border border-gray-700 rounded text-xs p-2 text-white outline-none focus:border-primary-500"
                  >
                    <option value="India Post">India Post (Speed Post / EMS)</option>
                    <option value="Emirates Post">Emirates Post</option>
                    <option value="Dubai Post">Dubai Post</option>
                    <option value="Aramex">Aramex (UAE / Middle East)</option>
                    <option value="DHL Express">DHL Express</option>
                    <option value="FedEx">FedEx</option>
                    <option value="Blue Dart">Blue Dart</option>
                    <option value="Other">Other Courier</option>
                  </select>
                </div>

                <div>
                  <p className="text-xs text-gray-300 mb-1 font-medium">Tracking / Consignment Number</p>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g., EM123456789IN or EE...AE"
                    className="w-full bg-black border border-gray-700 rounded text-xs p-2 text-white outline-none focus:border-primary-500 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs text-gray-300 mb-1 font-medium">Order Notes / Instructions</p>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Shipping instructions, dosage instructions, etc."
                className="w-full bg-black border border-gray-700 rounded text-xs p-2.5 text-white outline-none focus:border-primary-500 resize-none"
              />
            </div>

            {/* Grand Total Footer */}
            <div className="flex justify-between items-center p-3 bg-primary-900/20 border border-primary-500/40 rounded-lg">
              <span className="text-sm font-semibold text-gray-200">Grand Total:</span>
              <span className="text-xl font-black text-primary-400">{grandTotal.toFixed(2)}</span>
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving Order..." : editingOrder ? "Update Order" : "Place Order"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. TRACKING TIMELINE DRAWER */}
      <TrackingTimelineDrawer
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        order={trackingOrder}
        onStatusUpdated={fetchOrders}
      />
    </div>
  );
}
