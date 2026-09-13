"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAutoDialer } from "../../provider/AutoDialerContext";
import {
  FaPhoneAlt,
  FaPause,
  FaPlay,
  FaForward,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaExternalLinkAlt,
  FaUser,
  FaClock,
} from "react-icons/fa";
import { MdOutlineLocationOn, MdCallEnd } from "react-icons/md";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";

export default function AutoDialerBar() {
  const {
    isOpen,
    isMinimized,
    status,
    queue,
    currentIndex,
    currentLead,
    countdown,
    callDuration,
    stats,
    dispositions,
    activeCampaignName,
    ringSecondsLeft,
    pauseAutoDialer,
    resumeAutoDialer,
    skipCurrentLead,
    dialCurrentLead,
    saveDispositionAndNext,
    stopAutoDialer,
    toggleMinimize,
    markCallAsConnected,
  } = useAutoDialer();

  const [selectedDispId, setSelectedDispId] = useState<string>("");
  const [quickNote, setQuickNote] = useState<string>("");
  const [showDispositionBox, setShowDispositionBox] = useState<boolean>(true);

  const router = useRouter();
  const pathname = usePathname();
  const isAlreadyOnLeadDetails = pathname === "/leadsdetails";

  const userRole = typeof window !== "undefined" ? (localStorage.getItem("userRole") || "").toLowerCase() : "";
  // Admin PC NEVER renders the dialer bottom bar under ANY circumstance!
  if (!isOpen || userRole === "admin") return null;

  // Format call duration MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSaveDisposition = async () => {
    await saveDispositionAndNext(selectedDispId, quickNote);
    setSelectedDispId("");
    setQuickNote("");
    setShowDispositionBox(false);
  };

  const openLeadProfile = () => {
    if (currentLead?.id) {
      router.push(`/leadsdetails?id=${currentLead.id}`);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 flex justify-center pointer-events-none animate-slide-up">
      <div className="pointer-events-auto w-full max-w-5xl bg-[#121212]/95 backdrop-blur-md border border-gray-700/80 rounded-2xl shadow-2xl text-white overflow-hidden transition-all duration-300">
        {/* Top Status Bar Line */}
        <div className="w-full bg-gray-800 h-1">
          <div
            className={`h-1 transition-all duration-500 ease-out ${
              status === "in-call"
                ? "bg-emerald-500 w-full animate-pulse"
                : status === "dialing"
                ? "bg-sky-500 w-full animate-pulse"
                : status === "wrap-up"
                ? "bg-amber-500 w-full"
                : "bg-primary-500 w-full"
            }`}
          />
        </div>

        {/* Minimized Header Bar */}
        {isMinimized ? (
          <div className="px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <p className="text-xs font-semibold text-gray-200">
                ⚡ Auto-Dialer: <span className="text-white font-bold">{currentLead?.full_name || "Lead"}</span>
                {currentLead?.phone ? <span className="text-emerald-400 font-mono ml-1.5">{currentLead.phone}</span> : ""}
              </p>
              {status === "in-call" && (
                <span className="text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                  ⏱️ {formatTime(callDuration)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMinimize}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
                title="Expand Auto-Dialer"
              >
                <FaChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={stopAutoDialer}
                className="p-1.5 hover:bg-red-950/80 rounded-lg text-gray-400 hover:text-red-400 transition cursor-pointer"
                title="Stop Auto-Dialer"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Full Expanded Auto-Dialer Bar */
          <div className="p-3.5 sm:p-4">
            {/* Top Row: Lead info + Live Timer + Controls */}
            <div className="flex items-center justify-between gap-3">
              {/* 1. Lead Information (Left) */}
              <div className="flex items-center gap-3 min-w-0 max-w-[45%]">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner ${
                    status === "in-call"
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 animate-pulse"
                      : "bg-sky-950/60 border-sky-500/40 text-sky-400"
                  }`}
                >
                  <FaPhoneAlt className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                      {currentLead?.full_name || "Customer"}
                    </p>
                    {currentLead?.lead_number && (
                      <span className="text-[10px] font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700 flex-shrink-0">
                        #{currentLead.lead_number}
                      </span>
                    )}
                    {currentLead?.id && !isAlreadyOnLeadDetails && (
                      <button
                        type="button"
                        onClick={openLeadProfile}
                        className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 hover:underline cursor-pointer flex-shrink-0"
                        title="Open full lead details"
                      >
                        <FaExternalLinkAlt className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 truncate">
                    <span className="font-mono text-emerald-400 font-semibold truncate">
                      📞 {currentLead?.phone || currentLead?.whatsapp_number || "No Phone"}
                    </span>
                    {(currentLead?.city || currentLead?.country) && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-400 truncate">
                        • {[currentLead?.city, currentLead?.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Status & Live Indicators (Center) */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {status === "in-call" && (
                  <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-emerald-300 font-mono text-xs font-bold shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>In Call: {formatTime(callDuration)}</span>
                  </div>
                )}
                {status === "in-call" && ringSecondsLeft > 0 && (
                  <span className="text-[11px] text-sky-400 bg-sky-950/80 px-2 py-1 rounded-lg border border-sky-800 font-medium whitespace-nowrap hidden sm:inline-block">
                    ⏳ Ringing ({ringSecondsLeft}s)
                  </span>
                )}
                {status === "dialing" && (
                  <div className="flex items-center gap-2 bg-sky-950/80 border border-sky-500/40 px-3 py-1.5 rounded-lg text-sky-300 text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>Dialing CloudTalk...</span>
                  </div>
                )}
                {status === "wrap-up" && (
                  <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/40 px-3 py-1.5 rounded-lg text-amber-300 text-xs font-medium">
                    <span className="font-bold text-amber-400">{countdown}s</span>
                    <span>Next lead...</span>
                  </div>
                )}
                {status === "paused" && (
                  <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-lg text-yellow-400 text-xs font-medium">
                    <FaPause className="w-2.5 h-2.5" />
                    <span>Paused</span>
                  </div>
                )}
                {status === "completed" && (
                  <div className="flex items-center gap-1.5 bg-emerald-900 border border-emerald-600 px-2.5 py-1 rounded-lg text-white text-xs font-medium">
                    <IoCheckmarkDoneCircleSharp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Completed</span>
                  </div>
                )}
                <span className="text-xs text-gray-400 bg-gray-800/80 px-2 py-1 rounded-lg border border-gray-700 whitespace-nowrap hidden md:inline-block">
                  ⚡ {stats.completed} Done
                </span>
              </div>

              {/* 3. Action Controls (Right) */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Notes Toggle */}
                <button
                  type="button"
                  onClick={() => setShowDispositionBox(!showDispositionBox)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                    showDispositionBox
                      ? "bg-primary-600 text-white border-primary-500 shadow-sm"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                  }`}
                  title="Disposition & Quick Notes"
                >
                  <span>📝 Notes</span>
                  <FaChevronDown
                    className={`w-2.5 h-2.5 transition-transform ${
                      showDispositionBox ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Pause / Resume Button */}
                {status === "paused" ? (
                  <button
                    type="button"
                    onClick={resumeAutoDialer}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs transition cursor-pointer shadow-sm"
                    title="Resume Auto-Dialer"
                  >
                    <FaPlay className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseAutoDialer}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-xs transition cursor-pointer"
                    title="Pause Auto-Dialer"
                  >
                    <FaPause className="w-3 h-3 text-amber-400" />
                  </button>
                )}

                {/* Skip Lead Button */}
                <button
                  type="button"
                  onClick={skipCurrentLead}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-xs transition cursor-pointer"
                  title="Skip to next lead"
                >
                  <FaForward className="w-3 h-3" />
                </button>

                {/* Minimize Button */}
                <button
                  type="button"
                  onClick={toggleMinimize}
                  className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition cursor-pointer"
                  title="Minimize"
                >
                  <FaChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Stop / Close Session Button */}
                <button
                  type="button"
                  onClick={stopAutoDialer}
                  className="p-2 hover:bg-red-950 text-gray-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                  title="End Auto-Dialer Session"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Quick Disposition & Note Input */}
            {showDispositionBox && (
              <div className="mt-3 pt-3 border-t border-gray-800/80 flex flex-col sm:flex-row items-center gap-2.5">
                <div className="w-full sm:w-60 flex-shrink-0">
                  <select
                    value={selectedDispId}
                    onChange={(e) => setSelectedDispId(e.target.value)}
                    className="w-full h-9 bg-black/90 border border-gray-700 rounded-lg text-xs text-white px-3 outline-none focus:border-primary-500 cursor-pointer font-medium"
                  >
                    <option value="">Select Disposition...</option>
                    {dispositions.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full flex-1 min-w-0">
                  <input
                    type="text"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Enter quick conversation note (e.g. Call back on Friday, ordered paracetamol)..."
                    className="w-full h-9 bg-black/90 border border-gray-700 rounded-lg text-xs text-white px-3 outline-none focus:border-primary-500 placeholder-gray-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveDisposition();
                    }}
                  />
                </div>

                <div className="w-full sm:w-auto flex justify-end flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveDisposition}
                    className="w-full sm:w-auto px-5 h-9 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap shadow-md flex items-center justify-center gap-1.5"
                  >
                    <IoCheckmarkDoneCircleSharp className="w-4 h-4" />
                    <span>Save & Next</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
