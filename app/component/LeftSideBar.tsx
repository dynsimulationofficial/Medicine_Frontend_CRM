"use client";
import Link from "next/link";
import Image from "next/image";
import { IoMdLogOut, IoMdSettings } from "react-icons/io";
import { usePathname } from "next/navigation";
import AxiosProvider from "../../provider/AxiosProvider";
import { useState, useEffect } from "react";
import { RiFileAddLine, RiHistoryLine, RiBarChartBoxLine } from "react-icons/ri";
import { FaPills, FaUserEdit } from "react-icons/fa";
import { MdOutlineDashboard } from "react-icons/md";
import StorageManager from "../../provider/StorageManager";

const LeftSideBar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const storage = new StorageManager();
    const role = storage.getUserRole();
    setUserRole(role);
  }, []);

  const isAdmin = userRole?.toLowerCase() === "admin";

  const handleLogout = async () => {
    try {
      await AxiosProvider.post("/logout", {});
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`hidden md:flex flex-col justify-between py-4 px-1.5 border-r border-customBorder shadow-borderShadow mt-0 h-screen fixed top-0 left-0 transition-all duration-200 ease-in-out overflow-hidden text-white z-[1000] bg-[#232323] ${
        isExpanded ? "w-60" : "w-[56px]"
      }`}
    >
      {/* SIDE LEFT BAR TOP SECTION */}
      <div className="z-50 custom-scrollbar">
        <Link href="/dashboard">
          <div className="flex items-center gap-3.5 mb-6 px-2.5 py-1.5">
            <div className="relative h-6 w-6 shrink-0">
              <Image
                src="/images/crmLogoSidebar.png"
                alt="Orizon icon"
                fill
                className="object-contain"
              />
            </div>

            {isExpanded && (
              <p className="text-base leading-none font-bold uppercase text-white tracking-wide whitespace-nowrap">
                Lead CRM
              </p>
            )}
          </div>
        </Link>

        {/* MENU WITH ICONS */}
        <div>
          <Link href={isAdmin ? "/dashboard-admin" : "/dashboard-agent"}>
            <div
              className={`mb-3.5 flex items-center gap-3.5 group px-3 py-2.5 rounded-[4px] relative cursor-pointer text-sm leading-none font-medium text-white hover:bg-primary-600 active:bg-primary-700 transition-colors ${
                pathname === "/dashboard" ||
                pathname === "/dashboard-admin" ||
                pathname === "/dashboard-agent"
                  ? "bg-primary-600 text-white hover:!text-white"
                  : ""
              }`}
            >
              <div className="h-5 w-5 shrink-0 grid place-items-center">
                <MdOutlineDashboard className="h-[18px] w-[18px]" />
              </div>
              {isExpanded && (
                <p className="whitespace-nowrap leading-none">Dashboard</p>
              )}
            </div>
          </Link>

          {/* LEADS */}
          {isAdmin && (
            <Link href="/leads">
              <div
                className={`mb-3.5 flex items-center gap-3.5 group px-3 py-2.5 rounded-[4px] relative cursor-pointer text-sm leading-none font-medium text-white hover:bg-primary-600 active:bg-primary-700 transition-colors ${
                  pathname === "/leads" || pathname === "/leadsdetails"
                    ? "bg-primary-600 text-white hover:!text-white"
                    : ""
                }`}
              >
                <div className="h-5 w-5 shrink-0 grid place-items-center">
                  <RiFileAddLine className="h-[18px] w-[18px]" />
                </div>
                {isExpanded && (
                  <p className="whitespace-nowrap leading-none">Leads</p>
                )}
              </div>
            </Link>
          )}

          {/* MEDICINES MASTER */}
          {isAdmin && (
            <Link href="/medicines">
              <div
                className={`mb-3.5 flex items-center gap-3.5 group px-3 py-2.5 rounded-[4px] relative cursor-pointer text-sm leading-none font-medium text-white hover:bg-primary-600 active:bg-primary-700 transition-colors ${
                  pathname === "/medicines"
                    ? "bg-primary-600 text-white hover:!text-white"
                    : ""
                }`}
              >
                <div className="h-5 w-5 shrink-0 grid place-items-center">
                  <FaPills className="h-[18px] w-[18px]" />
                </div>
                {isExpanded && (
                  <p className="whitespace-nowrap leading-none">Medicines</p>
                )}
              </div>
            </Link>
          )}

          {/* USER MANAGEMENT */}
          {isAdmin && (
            <Link href="/usermanagement">
              <div
                className={`mb-3.5 flex items-center gap-3.5 group px-3 py-2.5 rounded-[4px] relative cursor-pointer text-sm leading-none font-medium text-white hover:bg-primary-600 active:bg-primary-700 transition-colors ${
                  pathname === "/usermanagement" || pathname === "/useradd"
                    ? "bg-primary-600 text-white hover:!text-white"
                    : ""
                }`}
              >
                <div className="h-5 w-5 shrink-0 grid place-items-center">
                  <FaUserEdit className="h-[18px] w-[18px]" />
                </div>
                {isExpanded && (
                  <p className="whitespace-nowrap leading-none">
                    User Management
                  </p>
                )}
              </div>
            </Link>
          )}

          {/* USER ACTIVITY */}
          {isAdmin && (
            <Link href="/user-activity">
              <div
                className={`mb-3.5 flex items-center gap-3.5 group px-3 py-2.5 rounded-[4px] relative cursor-pointer text-sm leading-none font-medium text-white hover:bg-primary-600 active:bg-primary-700 transition-colors ${
                  pathname === "/user-activity"
                    ? "bg-primary-600 text-white hover:!text-white"
                    : ""
                }`}
              >
                <div className="h-5 w-5 shrink-0 grid place-items-center">
                  <RiHistoryLine className="h-[18px] w-[18px]" />
                </div>
                {isExpanded && (
                  <p className="whitespace-nowrap leading-none">User Activity</p>
                )}
              </div>
            </Link>
          )}

          {/* REPORTS & KPIS */}
          {isAdmin && (
            <Link href="/reports">
              <div
                className={`mb-3.5 flex items-center gap-3.5 group px-3 py-2.5 rounded-[4px] relative cursor-pointer text-sm leading-none font-medium text-white hover:bg-primary-600 active:bg-primary-700 transition-colors ${
                  pathname === "/reports"
                    ? "bg-primary-600 text-white hover:!text-white"
                    : ""
                }`}
              >
                <div className="h-5 w-5 shrink-0 grid place-items-center">
                  <RiBarChartBoxLine className="h-[18px] w-[18px]" />
                </div>
                {isExpanded && (
                  <p className="whitespace-nowrap leading-none">Reports & KPIs</p>
                )}
              </div>
            </Link>
          )}

          {/* SETTINGS */}
          {isAdmin && (
            <Link href="/setting">
              <div
                className={`mb-3.5 flex items-center gap-3.5 group px-3 py-2.5 rounded-[4px] relative cursor-pointer text-sm leading-none font-medium text-white hover:bg-primary-600 active:bg-primary-700 transition-colors ${
                  pathname === "/setting"
                    ? "bg-primary-600 text-white hover:!text-white"
                    : ""
                }`}
              >
                <div className="h-5 w-5 shrink-0 grid place-items-center">
                  <IoMdSettings className="h-[18px] w-[18px]" />
                </div>
                {isExpanded && (
                  <p className="whitespace-nowrap leading-none">Setting</p>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>
      {/* END SIDE LEFT BAR TOP SECTION */}

      {/* SIDE LEFT BAR BOTTOM SECTION */}
      <div
        onClick={handleLogout}
        className="flex items-center gap-3.5 px-2.5 py-2.5 z-10 cursor-pointer hover:bg-red-600/30 rounded transition-colors"
      >
        <div className="h-5 w-5 shrink-0 grid place-items-center">
          <IoMdLogOut className="h-[18px] w-[18px] text-red-400" />
        </div>
        {isExpanded && (
          <span className="text-sm font-semibold leading-none text-white whitespace-nowrap">
            Logout
          </span>
        )}
      </div>
    </div>
  );
};

export default LeftSideBar;
