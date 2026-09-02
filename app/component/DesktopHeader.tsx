"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { CiSettings } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { RiMenu2Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import LeftSideBarMobile from "./LeftSideBarMobile";
import DynamicBreadCrum from "./DynamicBreadCrum";

import { usePathname } from "next/navigation";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import { toast } from "react-toastify";
import { LuSearchX } from "react-icons/lu";
import { FaSearch } from "react-icons/fa";

const DesktopHeader = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationData, setNotificationData] = useState<any[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isFlyoutFilterOpen, setFlyoutFilterOpen] = useState<boolean>(false);
  const toggleFilterFlyout = () => setFlyoutFilterOpen(!isFlyoutFilterOpen);
  const [isLeftSidebar, setIsLeftSideBar] = useState<boolean>(false);

  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storage = new StorageManager();
      const role = (storage.getUserRole() || "").toLowerCase();
      setIsAdmin(role === "admin");
    }
  }, []);

  // Gentle WhatsApp-like notification chime
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  // WhatsApp-style Desktop Pop-up Notification
  const showDesktopNotification = (title: string, body: string, leadId?: string) => {
    playNotificationSound();

    // 1. Chrome / OS Desktop Popup
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          const n = new Notification(title || "New Lead Assigned", {
            body: body || "A new lead has been assigned to you.",
            icon: "/favicon.ico",
          });
          n.onclick = () => {
            window.focus();
            if (leadId) {
              window.open(`/leadsdetails?id=${leadId}`, "_blank");
            }
          };
        } catch (e) {
          console.error("Browser notification error:", e);
        }
      }
    }

    // 2. In-App Toast Popup (Top-Right)
    toast.info(`🔔 ${title}: ${body}`, {
      position: "top-right",
      autoClose: 6000,
      onClick: () => {
        if (leadId) {
          window.open(`/leadsdetails?id=${leadId}`, "_blank");
        }
      },
    });
  };

  // Request browser notification permission once on load
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const handleSearch = async () => {
    if (!query) {
      toast.error("Please enter email or mobile ");
      return;
    }

    // basic type check
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    const isPhone = /^(?:\+91[\s-]?)?\d{10}$/.test(query);

    if (!isEmail && !isPhone) {
      toast.error("Enter a valid email or 10-digit mobile number");
      return;
    }

    try {
      const res = await AxiosProvider.get(`/leads/search/dashboard?q=${query}`);
      const searchId = res.data.data.leads[0].id;
      window.open(`/leadsdetails?id=${searchId}`, "_blank");
    } catch (err) {
      console.error("Search failed:", err);
      toast.error("No lead found");
    }
  };

  // Notification fetcher with background auto-polling
  const fetchNotification = async () => {
    if (isAdmin) {
      setNotificationData([]);
      return;
    }
    try {
      const response = await AxiosProvider.get("/assigned-lead-notifications");
      const list: any[] = Array.isArray(response.data?.data) ? response.data.data : [];
      setNotificationData(list);

      // On initial load, mark existing notifications as seen
      if (!initialLoadDoneRef.current) {
        list.forEach((item) => {
          if (item.id) knownIdsRef.current.add(item.id);
        });
        initialLoadDoneRef.current = true;
      } else {
        // Any new notification that arrives triggers the desktop popup!
        for (const item of list) {
          if (item.id && !knownIdsRef.current.has(item.id)) {
            knownIdsRef.current.add(item.id);
            showDesktopNotification(
              item.title || "New Lead Assigned",
              item.body || "A new lead has been assigned to you.",
              item.lead_id
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching Notification:", error);
      setNotificationData([]);
    }
  };

  useEffect(() => {
    if (isAdmin) return;
    fetchNotification();
    const interval = setInterval(fetchNotification, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [isAdmin]);

  const navigateLeadDetails = (leadId: string) => {
    window.open(`/leadsdetails?id=${leadId}`, "_blank"); // "_blank" = new tab
  };

  const closeFlyOut = () => {
    setIsLeftSideBar(false);
  };
  return (
    <>
      <div className="w-full flex justify-between items-center gap-4 pt-3 pb-3 mb-9 md:mb-11">
        <div className="w-full h-24 bg-[linear-gradient(206deg,#21abd6_28.85%,rgba(33,171,214,0)_89.55%)] p-6 rounded-lg text-white opacity-20 absolute top-0 left-0 right-0 pointer-events-none"></div>
        {/* SEARCH INPUT WITH ICON */}
        <div className="hidden md:block md:w-auto">
          <DynamicBreadCrum />
        </div>
        <div className="hidden md:w-auto md:flex md:justify-end md:items-center md:gap-3 w-auto z-10">
          {/* Seamless Search Bar */}
          <div className="flex items-center h-[36px] bg-black border border-gray-700 rounded-[5px] overflow-hidden focus-within:border-primary-500 hover:shadow-hoverInputShadow">
            <input
              type="text"
              placeholder="Search for email, mobile"
              className="bg-transparent w-56 sm:w-64 h-full px-3.5 placeholder-gray-400 text-white text-xs outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value.trim())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              type="button"
              className="h-full px-3.5 bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center text-xs transition cursor-pointer"
              onClick={handleSearch}
              title="Search"
            >
              <FaSearch className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bell icon (Only for Agents, completely hidden from Admin) */}
          {!isAdmin && (
            <div
              className="relative flex items-center cursor-pointer"
              onClick={() => {
                setIsLeftSideBar(true);
                fetchNotification();
              }}
              title="Notifications"
            >
              <div className="w-[36px] h-[36px] bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center transition shrink-0 relative">
                <IoIosNotificationsOutline className="text-white w-[20px] h-[20px]" />
                {notificationData?.length > 0 && (
                  <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-600 rounded-full border border-black"></div>
                )}
              </div>

              {/* Notification list */}
              {isHovered && (notificationData?.length || 0) > 0 && (
                <div className="absolute top-[42px] right-0 w-96 shadow-lg rounded-md z-50 bg-[#171717]">
                  <ul className="divide-y divide-gray-200">
                    {(notificationData || []).map((notification, index) => (
                      <li
                        onClick={() => navigateLeadDetails(notification.lead_id)}
                        key={index}
                        className="px-3 py-3 text-sm hover:cursor-pointer hover:bg-primary-800"
                      >
                        {notification.body}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {/* END BELL ICON */}
          {/* <div className=" w-[50px] h-[50px]  rounded-full flex justify-center items-center z-10">
            <Image
              src="/images/dummy-image.jpg"
              alt="Orizon profile"
              width={50}
              height={50}
              className="rounded-full border-2 border-primary-500"
            />
          </div> */}
        </div>
        <RiMenu2Line
          onClick={toggleFilterFlyout}
          className="text-black text-xl cursor-pointer md:hidden z-20"
        />
        <div className=" md:hidden w-[50px] h-[50px]  rounded-full flex justify-center items-center z-10">
          <Image
            src="/images/dummy-image.jpg"
            alt="Orizon profile"
            width={50}
            height={50}
            className="rounded-full border-2 border-primary-500"
          />
        </div>
      </div>
      <div className="w-full mt-1 mb-4 md:hidden z-[30]">
        <DynamicBreadCrum />
      </div>
      {/* LEFT SIDEBAR MENU */}
      {isFlyoutFilterOpen && (
        <>
          <div
            className=" min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
            onClick={() => {
              setFlyoutFilterOpen(!isFlyoutFilterOpen);
            }}
          ></div>
          <div
            className={`leftSideBar ${
              isFlyoutFilterOpen ? "leftSideBarOpen" : ""
            }`}
          >
            <div className=" w-full flex min-h-auto">
              {/* Flyout content here */}
              <LeftSideBarMobile />
              <IoCloseOutline
                onClick={toggleFilterFlyout}
                className=" h-8 w-8 border border-[#E7E7E7] text-[#0A0A0A] rounded cursor-pointer absolute top-[69px] right-4"
              />
            </div>
          </div>
        </>
      )}
      {/*  LEFT SIDEBAR MENU END */}

      {/* FLYOUT IS START */}
      {isLeftSidebar && (
        <div
          className=" min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
          onClick={() => {
            closeFlyOut();
          }}
        ></div>
      )}

      <div className={`leftSideBar ${isLeftSidebar ? "leftSideBarOpen" : ""}`}>
        <div className="w-full min-h-auto p-4 text-white">
          {/* Flyout header */}
          <div className="flex justify-between mb-4">
            <p className="text-primary-500 text-2xl font-bold leading-9">
              Notification List
            </p>
            <IoCloseOutline
              onClick={() => closeFlyOut()}
              className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
            />
          </div>

          <div className="w-full border-b border-gray-700 mb-4"></div>

          {/* ✅ Notification list starts here */}
          <ul className="overflow-y-auto divide-y divide-gray-800">
            {notificationData.length > 0 ? (
              notificationData.map((notification, index) => (
                <li
                  key={index}
                  onClick={() => notification.lead_id && navigateLeadDetails(notification.lead_id)}
                  className="px-3 py-3 text-sm hover:cursor-pointer hover:bg-gray-800/60 rounded transition"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-primary-400 text-xs">
                      {notification.title || "Notification"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {notification.created_at ? new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-gray-200 text-xs leading-relaxed">
                    {notification.body}
                  </p>
                </li>
              ))
            ) : (
              <p className="text-gray-400 text-sm px-3 py-3">
                No notifications found.
              </p>
            )}
          </ul>
          {/* ✅ End of notification list */}
        </div>
      </div>
    </>
  );
};

export default DesktopHeader;
