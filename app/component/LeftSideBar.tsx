"use client";
import Link from "next/link";
import Image from "next/image";
import { IoMdLogOut, IoMdSettings } from "react-icons/io";
import { usePathname } from "next/navigation";
import AxiosProvider from "../../provider/AxiosProvider";
import { useState, useEffect } from "react";
import { RiFileAddLine, RiHistoryLine, RiBarChartBoxLine } from "react-icons/ri";
import { FaPills, FaUserEdit, FaBullhorn, FaShareAlt } from "react-icons/fa";
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

  const navItems = [
    {
      href: isAdmin ? "/dashboard-admin" : "/dashboard-agent",
      label: "Dashboard",
      icon: <MdOutlineDashboard className="h-[18px] w-[18px]" />,
      isActive: pathname === "/dashboard" || pathname === "/dashboard-admin" || pathname === "/dashboard-agent",
      show: true,
    },
    {
      href: "/leads",
      label: "Leads",
      icon: <RiFileAddLine className="h-[18px] w-[18px]" />,
      isActive: pathname === "/leads" || pathname === "/leadsdetails",
      show: isAdmin,
    },
    {
      href: "/medicines",
      label: "Medicines",
      icon: <FaPills className="h-[18px] w-[18px]" />,
      isActive: pathname === "/medicines",
      show: isAdmin,
    },
    {
      href: "/leadsources",
      label: "Lead Sources",
      icon: <FaShareAlt className="h-[18px] w-[18px]" />,
      isActive: pathname === "/leadsources",
      show: isAdmin,
    },
    {
      href: "/campaigns",
      label: "Campaigns",
      icon: <FaBullhorn className="h-[18px] w-[18px]" />,
      isActive: pathname === "/campaigns",
      show: isAdmin,
    },
    {
      href: "/usermanagement",
      label: "User Management",
      icon: <FaUserEdit className="h-[18px] w-[18px]" />,
      isActive: pathname === "/usermanagement" || pathname === "/useradd",
      show: isAdmin,
    },
    {
      href: "/user-activity",
      label: "User Activity",
      icon: <RiHistoryLine className="h-[18px] w-[18px]" />,
      isActive: pathname === "/user-activity",
      show: isAdmin,
    },
    {
      href: "/reports",
      label: "Reports & KPIs",
      icon: <RiBarChartBoxLine className="h-[18px] w-[18px]" />,
      isActive: pathname === "/reports",
      show: isAdmin,
    },
    {
      href: "/setting",
      label: "Setting",
      icon: <IoMdSettings className="h-[18px] w-[18px]" />,
      isActive: pathname === "/setting",
      show: isAdmin,
    },
  ];

  return (
    <div
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`hidden md:flex flex-col justify-between py-4 px-1.5 border-r border-customBorder shadow-borderShadow mt-0 h-screen fixed top-0 left-0 transition-all duration-200 ease-in-out text-white z-[1000] bg-[#232323] ${
        isExpanded ? "w-60" : "w-[56px]"
      }`}
    >
      {/* SIDE LEFT BAR TOP SECTION */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden z-50">
        {/* LOGO */}
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
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={`mb-3.5 flex items-center gap-3.5 group px-3 py-2.5 rounded-[4px] relative cursor-pointer text-sm leading-none font-medium text-white hover:bg-primary-600 active:bg-primary-700 transition-colors ${
                    item.isActive ? "bg-primary-600 text-white hover:!text-white" : ""
                  }`}
                >
                  <div className="h-5 w-5 shrink-0 grid place-items-center">
                    {item.icon}
                  </div>
                  {isExpanded && (
                    <p className="whitespace-nowrap leading-none">{item.label}</p>
                  )}
                </div>
              </Link>
            ))}
        </div>
      </div>
      {/* END SIDE LEFT BAR TOP SECTION */}

      {/* SIDE LEFT BAR BOTTOM SECTION */}
      <div className="shrink-0 pt-2 border-t border-gray-700/40">
        <div
          onClick={handleLogout}
          className="flex items-center gap-3.5 px-2.5 py-2.5 cursor-pointer hover:bg-red-600/30 rounded transition-colors"
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
    </div>
  );
};

export default LeftSideBar;
