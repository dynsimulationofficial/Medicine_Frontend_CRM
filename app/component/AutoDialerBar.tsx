"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
    pauseAutoDialer,
    resumeAutoDialer,
    skipCurrentLead,
    dialCurrentLead,
    saveDispositionAndNext,
    stopAutoDialer,
    toggleMinimize,
  } = useAutoDialer();

  const [selectedDispId, setSelectedDispId] = useState<string>("");
  const [quickNote, setQuickNote] = useState<string>("");
  const [showDispositionBox, setShowDispositionBox] = useState<boolean>(false);

  const router = useRouter();

  if (!isOpen) return null;

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
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 flex justify-center pointer-events-none animate-slide-up">
      <div className="pointer-events-auto w-full max-w-5xl bg-[#141414]/95 backdrop-blur-md border border-gray-700/80 rounded-2xl shadow-2xl text-white overflow-hidden transition-all duration-300">
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
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    status === "in-call"
                      ? "bg-emerald-400"
                      : status === "dialing"
                      ? "bg-sky-400"
                      : "bg-amber-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    status === "in-call"
                      ? "bg-emerald-500"
                      : status === "dialing"
                      ? "bg-sky-500"
                      : "bg-amber-500"
                  }`}
                />
              </span>
              <p className="text-xs font-semibold text-gray-200">
                ⚡ Auto-Dialer:{" "}
                <span className="text-white">
                  {currentLead?.full_name || "Lead"}
                </span>{" "}
                {stats.completed > 0 ? `(${stats.completed} calls done)` : ""}
              </p>
              {status === "in-call" && (
                <span className="text-xs font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  ⏱️ {formatTime(callDuration)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMinimize}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                title="Expand Auto-Dialer"
              >
                <FaChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={stopAutoDialer}
                className="p-1.5 hover:bg-red-950/80 rounded-lg text-gray-400 hover:text-red-400 transition"
                title="Stop Auto-Dialer"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Full Expanded Auto-Dialer Bar */
          <div className="p-4 sm:p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* 1. Lead Information */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-inner ${
                    status === "in-call"
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 animate-pulse"
                      : status === "dialing"
                      ? "bg-sky-950/60 border-sky-500/40 text-sky-400"
                      : status === "wrap-up"
                      ? "bg-amber-950/60 border-amber-500/40 text-amber-400"
                      : "bg-gray-800 border-gray-700 text-gray-300"
                  }`}
                >
                  <FaPhoneAlt className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                      {currentLead?.full_name || "Unknown Lead"}
                    </p>
                    {currentLead?.lead_number && (
                      <span className="text-[10px] font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700">
                        #{currentLead.lead_number}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={openLeadProfile}
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Open full lead details in new tab"
                    >
                      <span>View</span>
                      <FaExternalLinkAlt className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span className="font-medium text-gray-200">
                      📞 {currentLead?.phone || currentLead?.whatsapp_number || "No Phone"}
                    </span>
                    {(currentLead?.city || currentLead?.country) && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <MdOutlineLocationOn className="w-3 h-3 text-gray-500" />
                        {[currentLead?.city, currentLead?.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {currentLead?.best_time_to_call && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400/90">
                        <FaClock className="w-2.5 h-2.5" />
                        {currentLead.best_time_to_call}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Status & Live Indicators */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {status === "in-call" && (
                  <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-emerald-300 font-mono text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>In Call: {formatTime(callDuration)}</span>
                  </div>
                )}

                {status === "dialing" && (
                  <div className="flex items-center gap-2 bg-sky-950/60 border border-sky-500/40 px-3 py-1.5 rounded-lg text-sky-300 text-xs">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                    <span>Dialing CloudTalk...</span>
                  </div>
                )}

                {status === "wrap-up" && (
                  <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-lg text-amber-300 text-xs">
                    <span className="font-bold text-amber-400 text-sm">{countdown}s</span>
                    <span>Next lead calling...</span>
                  </div>
                )}

                {status === "paused" && (
                  <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-yellow-400 text-xs">
                    <FaPause className="w-2.5 h-2.5" />
                    <span>Queue Paused</span>
                  </div>
                )}

                {status === "completed" && (
                  <div className="flex items-center gap-2 bg-emerald-900 border border-emerald-600 px-3 py-1.5 rounded-lg text-white text-xs">
                    <IoCheckmarkDoneCircleSharp className="w-4 h-4 text-emerald-400" />
                    <span>All Leads Done!</span>
                  </div>
                )}

                {/* Progress Badge */}
                <span className="text-xs text-gray-300 font-medium bg-gray-800/80 px-2.5 py-1.5 rounded-lg border border-gray-700">
                  ⚡ {stats.completed} Calls Done
                </span>
              </div>

              {/* 3. Action Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Wrap-up / Disposition Toggle */}
                <button
                  type="button"
                  onClick={() => setShowDispositionBox(!showDispositionBox)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                    showDispositionBox
                      ? "bg-primary-600 text-white border-primary-500"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700"
                  }`}
                  title="Log Quick Note / Disposition"
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
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <FaPlay className="w-3 h-3" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={pauseAutoDialer}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Pause Auto-Dialer"
                  >
                    <FaPause className="w-3 h-3 text-amber-400" />
                    <span>Pause</span>
                  </button>
                )}

                {/* Dial Now / Redial */}
                <button
                  type="button"
                  onClick={dialCurrentLead}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Call Lead Now"
                >
                  <FaPhoneAlt className="w-3 h-3" />
                  <span>Dial Now</span>
                </button>

                {/* Skip Lead */}
                <button
                  type="button"
                  onClick={skipCurrentLead}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-xs transition cursor-pointer"
                  title="Skip to next lead"
                >
                  <FaForward className="w-3.5 h-3.5" />
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

            {/* Expandable Quick Disposition & Note Fly-out Box */}
            {showDispositionBox && (
              <div className="mt-3.5 pt-3.5 border-t border-gray-800 flex flex-col sm:flex-row items-center gap-3">
                <div className="w-full sm:w-1/3">
                  <select
                    value={selectedDispId}
                    onChange={(e) => setSelectedDispId(e.target.value)}
                    className="w-full h-9 bg-black border border-gray-700 rounded-lg text-xs text-white px-3 outline-none focus:border-primary-500 cursor-pointer"
                  >
                    <option value="">Select Disposition...</option>
                    {dispositions.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-1/2">
                  <input
                    type="text"
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    placeholder="Enter quick conversation note (e.g. Call back on Friday, ordered paracetamol)..."
                    className="w-full h-9 bg-black border border-gray-700 rounded-lg text-xs text-white px-3 outline-none focus:border-primary-500 placeholder-gray-500"
                  />
                </div>

                <div className="w-full sm:w-auto flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDisposition}
                    className="px-4 h-9 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    Save & Advance
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
