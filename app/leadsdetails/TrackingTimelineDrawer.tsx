"use client";

import React, { useEffect, useState } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { IoCloseOutline } from "react-icons/io5";
import { FaSyncAlt, FaExternalLinkAlt, FaCopy, FaCheckCircle, FaPlaneDeparture, FaBoxOpen, FaTruck, FaShieldAlt } from "react-icons/fa";
import { OrderData } from "./LeadOrdersTab";

interface TrackingEvent {
  id?: string;
  status: string;
  sub_status?: string;
  location?: string;
  details: string;
  checkpoint_time: string;
  created_at?: string;
}

interface TrackingData {
  order: any;
  tracking_number: string | null;
  courier_name: string | null;
  status: string;
  latest_location?: string;
  latest_event?: string;
  events: TrackingEvent[];
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  order: OrderData | null;
  onStatusUpdated?: () => void;
};

export default function TrackingTimelineDrawer({
  isOpen,
  onClose,
  order,
  onStatusUpdated,
}: Props) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchTracking = async () => {
    if (!order?.id) return;
    setIsLoading(true);
    try {
      const res = await AxiosProvider.post("/tracking/history", {
        order_id: order.id,
      });
      if (res.data?.success) {
        setTrackingData(res.data.data);
      }
    } catch (e: any) {
      console.error("Error fetching tracking history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && order?.id) {
      fetchTracking();
    } else {
      setTrackingData(null);
    }
  }, [isOpen, order?.id]);

  const handleSyncNow = async () => {
    if (!order?.id) return;
    setIsSyncing(true);
    try {
      const res = await AxiosProvider.post("/tracking/sync", {
        order_id: order.id,
      });
      if (res.data?.success) {
        toast.success("Live tracking updated successfully");
        fetchTracking();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.msg || "Failed to sync tracking");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopy = () => {
    const text = trackingData?.tracking_number || order?.tracking_number || "";
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.info("Tracking number copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getOfficialTrackingUrl = () => {
    const num = trackingData?.tracking_number || order?.tracking_number || "";
    const courier = (trackingData?.courier_name || order?.courier_name || "").toLowerCase();

    if (courier.includes("uae") || courier.includes("emirates")) {
      return `https://emiratespost.ae/en/track-order?trackingNumber=${encodeURIComponent(num)}`;
    }
    if (courier.includes("dhl")) {
      return `https://www.dhl.com/global-en/home/tracking.html?tracking-id=${encodeURIComponent(num)}`;
    }
    if (courier.includes("fedex")) {
      return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(num)}`;
    }
    if (courier.includes("aramex")) {
      return `https://www.aramex.com/express/track-results-multiple.aspx?ShipmentNumber=${encodeURIComponent(num)}`;
    }
    // Default India Post / 17Track universal
    return `https://t.17track.net/en#nums=${encodeURIComponent(num)}`;
  };

  // Determine active step index
  const currentStatus = (trackingData?.status || order?.order_status || "In Transit").toLowerCase();
  let stepIndex = 1; // Booked
  if (currentStatus.includes("transit")) stepIndex = 2;
  if (currentStatus.includes("custom") || currentStatus.includes("cleared")) stepIndex = 3;
  if (currentStatus.includes("out for delivery")) stepIndex = 4;
  if (currentStatus.includes("delivered")) stepIndex = 5;

  const steps = [
    { title: "Booked", icon: FaBoxOpen, desc: "India Post GPO" },
    { title: "In Transit", icon: FaPlaneDeparture, desc: "Air Sorting Hub" },
    { title: "Customs", icon: FaShieldAlt, desc: "UAE Airport Customs" },
    { title: "Out for Delivery", icon: FaTruck, desc: "With Courier" },
    { title: "Delivered", icon: FaCheckCircle, desc: "Consignee Received" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[500px] md:w-[580px] xl:w-[640px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full min-h-auto p-4 sm:p-5 text-white space-y-3.5">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-gray-700/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary-400">
                  Shipment Tracking
                </span>
                <span className="px-2 py-0.5 rounded bg-primary-950/80 border border-primary-500/50 text-xs font-mono font-bold text-primary-300">
                  {order?.order_number}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Partner: <span className="text-white font-medium">{trackingData?.courier_name || order?.courier_name || "India Post"}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 border border-gray-700 hover:bg-gray-800 rounded-lg text-white transition cursor-pointer"
            >
              <IoCloseOutline className="h-5 w-5" />
            </button>
          </div>

          {/* Tracking Number Card with Copy */}
          <div className="p-3 bg-black/70 border border-gray-700 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
            <div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                Consignment / Tracking Number
              </p>
              <p className="text-sm font-mono font-black text-white mt-0.5 tracking-wider">
                {trackingData?.tracking_number || order?.tracking_number || "Not assigned"}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-md text-xs text-gray-200 transition cursor-pointer"
                title="Copy tracking number"
              >
                {copied ? <FaCheckCircle className="text-green-400 text-xs" /> : <FaCopy className="text-xs" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-md text-xs text-white font-medium transition cursor-pointer disabled:opacity-50"
              >
                <FaSyncAlt className={`text-xs ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
              </button>
            </div>
          </div>

          {/* Current Status Banner */}
          <div className="p-3 bg-gradient-to-r from-primary-950/40 via-primary-900/20 to-black border border-primary-500/30 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary-300 font-medium">Current Status</p>
              <p className="text-base font-bold text-white capitalize mt-0.5">
                {trackingData?.status || order?.order_status || "In Transit"}
              </p>
              {trackingData?.latest_location && (
                <p className="text-[11px] text-gray-300 mt-0.5">
                  📍 {trackingData.latest_location}
                </p>
              )}
            </div>
            <a
              href={getOfficialTrackingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-gray-800/80 hover:bg-gray-700 border border-gray-600 text-xs text-primary-300 hover:text-white transition cursor-pointer"
            >
              <span>Official Site</span>
              <FaExternalLinkAlt className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* Visual Progress Stepper */}
          <div className="p-3 bg-black/40 border border-gray-800 rounded-lg">
            <p className="text-[11px] font-bold text-gray-300 mb-3 uppercase tracking-wider">
              Journey Progress
            </p>

            {/* Stepper Grid Container */}
            <div className="relative px-1">
              {/* Connecting Bar Container */}
              <div className="absolute top-[16px] left-[16px] right-[16px] -translate-y-1/2 h-[2px] bg-gray-700/80 rounded-full z-0">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]"
                  style={{ width: `${Math.min(100, Math.max(0, ((stepIndex - 1) / (steps.length - 1)) * 100))}%` }}
                />
              </div>

              {/* Icons & Labels Grid */}
              <div className="relative z-10 flex items-start justify-between">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isPassed = idx + 1 <= stepIndex;
                  const isCurrent = idx + 1 === stepIndex;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center">
                      {/* Circle Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 shadow-md ${
                          isCurrent
                            ? "bg-primary-500 text-black ring-2 ring-primary-500/40 font-bold"
                            : isPassed
                            ? "bg-primary-600 text-white font-medium"
                            : "bg-[#1f1f1f] border border-gray-700 text-gray-500"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      {/* Step Title */}
                      <p
                        className={`text-[10px] mt-1.5 font-medium leading-tight max-w-[65px] ${
                          isCurrent ? "text-primary-300 font-bold" : isPassed ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed History Timeline */}
          <div>
            <p className="text-xs font-bold text-white mb-3 uppercase tracking-wider">
              Live Checkpoint History ({trackingData?.events?.length || 0})
            </p>

            {isLoading ? (
              <div className="py-8 text-center text-gray-400 animate-pulse text-xs">
                Fetching latest courier status...
              </div>
            ) : !trackingData?.events || trackingData.events.length === 0 ? (
              <div className="p-6 bg-black/40 border border-gray-800 rounded-xl text-center text-gray-400 text-xs">
                No checkpoints logged yet. Click &quot;Sync Now&quot; to fetch live updates from courier.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-primary-600/40 space-y-4">
                {trackingData.events.map((ev, idx) => (
                  <div key={idx} className="relative group">
                    {/* Dot on line */}
                    <div
                      className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-black ${
                        idx === 0 ? "bg-primary-400 ring-2 ring-primary-500/40" : "bg-gray-600"
                      }`}
                    />

                    <div className="p-3.5 bg-black/60 border border-gray-700/80 rounded-lg hover:border-primary-500/50 transition">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
                        <span
                          className={`text-xs font-bold ${
                            ev.status === "Delivered"
                              ? "text-green-400"
                              : ev.status === "Out for Delivery"
                              ? "text-blue-400"
                              : ev.status === "Customs Cleared"
                              ? "text-purple-300"
                              : "text-primary-300"
                          }`}
                        >
                          {ev.status}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {new Date(ev.checkpoint_time).toLocaleDateString()}{" "}
                          {new Date(ev.checkpoint_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {ev.location && (
                        <p className="text-[11px] text-gray-300 font-medium mb-1">
                          📍 {ev.location}
                        </p>
                      )}

                      <p className="text-xs text-gray-200 leading-relaxed">
                        {ev.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
