"use client";

import React, { useEffect, useState } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import { FaPills, FaTrash, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";

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

export default function LeadOrdersTab({
  leadId,
  hitApi,
  setHitApi,
  isCreateOpen = false,
  onCloseCreate,
}: Props) {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null);

  // Form state for Create / Edit
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { medicine_name: "", unit: "Strip", quantity: 1, rate: 0 },
  ]);
  const [paymentStatus, setPaymentStatus] = useState<string>("Pending");
  const [paymentMode, setPaymentMode] = useState<string>("COD");
  const [orderStatus, setOrderStatus] = useState<string>("Pending");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Medicine Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeSugIndex, setActiveSugIndex] = useState<number | null>(null);

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

  // When opening Create modal
  useEffect(() => {
    if (isCreateOpen) {
      setOrderItems([{ medicine_name: "", unit: "Strip", quantity: 1, rate: 0 }]);
      setPaymentStatus("Pending");
      setPaymentMode("COD");
      setOrderStatus("Pending");
      setOrderNotes("");
    }
  }, [isCreateOpen]);

  // When opening Edit modal
  const openEdit = (ord: OrderData) => {
    setEditingOrder(ord);
    setPaymentStatus(ord.payment_status || "Pending");
    setPaymentMode(ord.payment_mode || "COD");
    setOrderStatus(ord.order_status || "Pending");
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

  const handleQuickUpdateStatus = async (
    orderId: string,
    newOrderStatus?: string,
    newPaymentStatus?: string
  ) => {
    try {
      await AxiosProvider.post("/leads/orders/status", {
        id: orderId,
        lead_id: leadId,
        order_status: newOrderStatus,
        payment_status: newPaymentStatus,
      });
      toast.success("Order status updated");
      setHitApi((prev) => !prev);
      fetchOrders();
    } catch (e) {
      console.error("Error updating order status:", e);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteOrder = (ord: OrderData) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete order "${ord.order_number}"?`,
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
            id: ord.id,
            lead_id: leadId,
          });
          toast.success(`Order ${ord.order_number} deleted successfully`);
          setHitApi((prev) => !prev);
          fetchOrders();
        } catch (error) {
          console.error("Error deleting order:", error);
          toast.error("Failed to delete order");
        }
      }
    });
  };

  // Autocomplete medicine fetch
  const fetchSuggestions = async (q: string) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await AxiosProvider.get(`/leads/medicines/suggestions?q=${encodeURIComponent(q)}`);
      setSuggestions(res.data?.data?.suggestions || []);
    } catch {
      setSuggestions([]);
    }
  };

  const handleItemChange = (index: number, field: keyof OrderItem, val: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: val };
    setOrderItems(updated);

    if (field === "medicine_name") {
      fetchSuggestions(val);
      setActiveSugIndex(index);
    }
  };

  const handleSelectSuggestion = (index: number, sug: any) => {
    const updated = [...orderItems];
    updated[index] = {
      ...updated[index],
      medicine_name: sug.medicine_name,
      unit: sug.unit || updated[index].unit || "Strip",
      rate: sug.rate !== undefined ? sug.rate : updated[index].rate,
    };
    setOrderItems(updated);
    setActiveSugIndex(null);
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { medicine_name: "", unit: "Strip", quantity: 1, rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length === 1) {
      setOrderItems([{ medicine_name: "", unit: "Strip", quantity: 1, rate: 0 }]);
      return;
    }
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return orderItems.reduce((acc, curr) => {
      const q = Number(curr.quantity) || 0;
      const r = Number(curr.rate) || 0;
      return acc + q * r;
    }, 0);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = orderItems.filter((i) => i.medicine_name.trim() !== "");
    if (!validItems.length) {
      toast.error("Please add at least one medicine item");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: editingOrder?.id || undefined,
        lead_id: leadId,
        payment_status: paymentStatus,
        payment_mode: paymentMode,
        order_status: orderStatus,
        order_notes: orderNotes.trim() || undefined,
        items: validItems.map((it) => ({
          id: it.id || undefined,
          medicine_name: it.medicine_name.trim(),
          unit: it.unit || "Strip",
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
        })),
      };

      const res = await AxiosProvider.post("/leads/orders/save", payload);
      toast.success(res.data?.msg || "Order saved successfully");
      setHitApi((prev) => !prev);
      fetchOrders();
      setEditingOrder(null);
      if (onCloseCreate) onCloseCreate();
    } catch (e: any) {
      console.error("Save order error:", e);
      toast.error(e?.response?.data?.msg || "Failed to save order");
    } finally {
      setIsSaving(false);
    }
  };

  const isModalOpen = isCreateOpen || !!editingOrder;
  const handleCloseModal = () => {
    setEditingOrder(null);
    if (onCloseCreate) onCloseCreate();
  };

  return (
    <div className="w-full">
      {/* 1. ORDERS TABLE */}
      {!orders || orders.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-base font-medium">
          No data found
        </p>
      ) : (
        <div className="w-full overflow-x-auto border border-gray-600 rounded-lg">
          <table className="w-full text-left text-sm text-white">
            <thead className="text-xs uppercase talbleheaderBg text-white border-b border-gray-600">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Order Status</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {orders.map((ord: OrderData, idx: number) => (
                <tr
                  key={ord.id || idx}
                  className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-700/80 transition-colors"
                >
                  <td className="py-3 px-4 text-center text-gray-300 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4 font-bold text-primary-300">
                    {ord.order_number}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-200 whitespace-nowrap">
                    {new Date(ord.created_at).toLocaleDateString()}{" "}
                    {new Date(ord.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-white">
                    <span className="px-2 py-0.5 rounded bg-gray-700 text-xs font-semibold text-white">
                      {ord.total_items} Items
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-white text-base">
                    {Number(ord.grand_total).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={ord.order_status || "Pending"}
                      onChange={(e) =>
                        handleQuickUpdateStatus(ord.id, e.target.value, ord.payment_status)
                      }
                      className="bg-black/60 border border-gray-600 text-xs text-white rounded px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={ord.payment_status || "Pending"}
                      onChange={(e) =>
                        handleQuickUpdateStatus(ord.id, ord.order_status, e.target.value)
                      }
                      className="bg-black/60 border border-gray-600 text-xs text-white rounded px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => openEdit(ord)}
                        className="py-1 px-2.5 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm cursor-pointer transition-colors"
                        title="Edit Order"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(ord)}
                        className="py-1 px-2.5 bg-red-600 hover:bg-red-700 rounded text-white text-sm cursor-pointer transition-colors"
                        title="Delete Order"
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. CREATE / EDIT ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-xl max-w-4xl w-full p-6 text-white shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <FaPills className="text-primary-400 text-xl" />
                <p className="text-primary-400 text-2xl font-bold">
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
              {/* Medicine Items List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                    Medicine Items
                  </p>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FaPlus className="w-3 h-3" /> Add Medicine
                  </button>
                </div>

                {orderItems.map((item, idx) => {
                  const itemTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-black/50 border border-gray-700 rounded-lg grid grid-cols-12 gap-3 items-center relative"
                    >
                      {/* Medicine Name with Search Suggestions */}
                      <div className="col-span-12 md:col-span-5 relative">
                        <label className="block text-xs text-gray-400 mb-1">
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={item.medicine_name}
                          onChange={(e) => handleItemChange(idx, "medicine_name", e.target.value)}
                          onFocus={() => setActiveSugIndex(idx)}
                          placeholder="Search or enter medicine name"
                          required
                          className="w-full border border-gray-700 rounded text-sm p-2.5 bg-black text-white outline-none focus:border-primary-500"
                        />
                        {/* Autocomplete dropdown */}
                        {activeSugIndex === idx && suggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1a1a] border border-gray-600 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                            {suggestions.map((sug, sIdx) => (
                              <div
                                key={sIdx}
                                onClick={() => handleSelectSuggestion(idx, sug)}
                                className="px-3 py-2 text-xs text-white hover:bg-primary-600 hover:text-white cursor-pointer border-b border-gray-800 last:border-0 flex justify-between items-center"
                              >
                                <span>{sug.medicine_name}</span>
                                <span className="text-gray-400 text-[10px]">
                                  {sug.unit} | {sug.rate}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Unit */}
                      <div className="col-span-4 md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                          className="w-full border border-gray-700 rounded text-sm p-2.5 bg-black text-white outline-none"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-4 md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          required
                          className="w-full border border-gray-700 rounded text-sm p-2.5 bg-black text-white outline-none text-center"
                        />
                      </div>

                      {/* Rate */}
                      <div className="col-span-3 md:col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Rate</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                          required
                          className="w-full border border-gray-700 rounded text-sm p-2.5 bg-black text-white outline-none text-right"
                        />
                      </div>

                      {/* Delete item button */}
                      <div className="col-span-1 flex justify-center pt-5">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded transition cursor-pointer"
                          title="Remove item"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Properties */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Order Status</label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full border border-gray-700 rounded text-sm p-2.5 bg-black text-white outline-none cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full border border-gray-700 rounded text-sm p-2.5 bg-black text-white outline-none cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full border border-gray-700 rounded text-sm p-2.5 bg-black text-white outline-none cursor-pointer"
                  >
                    <option value="COD">COD</option>
                    <option value="Online">Online</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Order Notes (Optional)</label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Deliver before 5 PM, customer requested extra packing"
                  className="w-full border border-gray-700 rounded text-sm p-2.5 bg-black text-white outline-none resize-y"
                />
              </div>

              {/* Total Summary Footer */}
              <div className="p-4 bg-black/60 border border-primary-600/60 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400">Total Items</p>
                  <p className="text-lg font-bold text-white">
                    {orderItems.filter((i) => i.medicine_name.trim() !== "").length} Items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Grand Total</p>
                  <p className="text-2xl font-black text-primary-400">
                    {calculateGrandTotal().toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingOrder ? "Update Order" : "Generate & Save Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
