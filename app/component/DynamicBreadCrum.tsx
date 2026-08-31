import React from "react";
import { usePathname } from "next/navigation";
import { IoChevronForward } from "react-icons/io5";
import { useContext } from "react";
import { AppContext } from "../AppContext";
import Link from "next/link";

const DynamicBreadCrum = () => {
  const pathname = usePathname();
  const context = useContext(AppContext);
  const { customerFullName } = context;
  if (!context) {
    throw new Error("ProfileComponent must be used within an AppProvider");
  }

  return (
    <div>
      {pathname === "/dashboard" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            Dashboard
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Dashboard
          </p>
        </div>
      )}
      {/* {(pathname === "/customer" || pathname === "/customerdetails") && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-[#4B5675] text-sm font-medium leading-5">
            Customers
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <Link href="/customer">
            <span className="text-primary-600 text-sm leading-5 font-medium hover:text-primary-600">
              All customers
            </span>
          </Link>
          <p className="text-primary-600 text-sm leading-5 font-medium capitalize">
            {pathname === "/customerdetails" && (
              <div className="flex items-center">
                <IoChevronForward className="text-[#99A1B7] w-3 h-3 mr-1" />
                {customerFullName}
              </div>
            )}
          </p>
        </div>
      )} */}
      {pathname === "/leads" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            Leads
          </p>
          <IoChevronForward className="text-white w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All lead
          </p>
        </div>
      )}
      {pathname === "/usermanagement" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            User Management
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Users
          </p>
        </div>
      )}
      {pathname === "/useradd" && (
        <div className="flex  md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            User Add
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            Recently added
          </p>
        </div>
      )}
      {pathname === "/user-activity" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            User Activity
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Logs
          </p>
        </div>
      )}
      {pathname === "/setting" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            Setting
          </p>
          <IoChevronForward className="text-[#99A1B7] w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All setting
          </p>
        </div>
      )}
      {pathname === "/medicines" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            Medicines
          </p>
          <IoChevronForward className="text-white w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Medicines
          </p>
        </div>
      )}
      {pathname === "/campaigns" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            Campaigns
          </p>
          <IoChevronForward className="text-white w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Campaigns
          </p>
        </div>
      )}
      {pathname === "/leadsources" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            Lead Sources
          </p>
          <IoChevronForward className="text-white w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            All Sources
          </p>
        </div>
      )}
      {pathname === "/reports" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            Reports
          </p>
          <IoChevronForward className="text-white w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            Performance Analytics
          </p>
        </div>
      )}
      {pathname === "/dashboard-admin" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            Dashboard
          </p>
          <IoChevronForward className="text-white w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            Admin Dashboard
          </p>
        </div>
      )}
      {pathname === "/dashboard-agent" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            Dashboard
          </p>
          <IoChevronForward className="text-white w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            Agent Dashboard
          </p>
        </div>
      )}
      {pathname === "/blocked_user" && (
        <div className="flex md:flex gap-2 w-auto items-center">
          <p className="text-white text-sm font-medium leading-5">
            User Management
          </p>
          <IoChevronForward className="text-white w-3 h-3" />
          <p className="text-primary-600 text-sm leading-5 font-medium">
            Blocked Users
          </p>
        </div>
      )}
    </div>
  );
};

export default DynamicBreadCrum;
