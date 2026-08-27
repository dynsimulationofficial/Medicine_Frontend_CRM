"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FiPlusCircle } from "react-icons/fi";
import { MdOutlineDriveFolderUpload } from "react-icons/md";
import { IoCloseOutline } from "react-icons/io5";

import StorageManager from "../../provider/StorageManager";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import Tabs from "../component/Tabs";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

import CreateLead from "./CreateLead";
import BulkUploadLead from "./BulkUploadLead";
import UnassignedLeadsTable from "./UnassignedLeadsTable";
import AssignedLeadsTable from "./AssignedLeadsTable";

export default function Home() {
  const checking = useAuthRedirect();

  // ✅ Exact sample code formula: single flyout state
  const [flyout, setFlyout] = useState<"create" | "bulk_lead" | "">("");

  // Refresh Trigger
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const refreshData = () => setRefreshKey((k) => k + 1);

  const storage = new StorageManager();
  const userRole = storage.getUserRole();

  const closeFlyout = () => {
    setFlyout("");
  };

  const handleViewLead = (id: string) => {
    window.open(`/leadsdetails?id=${id}`, "_blank");
  };

  // Main Tabs Configuration
  const tabs = [
    {
      label: "Unassign Leads",
      content: (
        <UnassignedLeadsTable
          userRole={userRole}
          refreshKey={refreshKey}
          onRefresh={refreshData}
          onViewLead={handleViewLead}
        />
      ),
    },
    {
      label: "Assign Leads",
      content: (
        <AssignedLeadsTable
          userRole={userRole}
          refreshKey={refreshKey}
          onRefresh={refreshData}
          onViewLead={handleViewLead}
        />
      ),
    },
  ];

  if (checking) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center bg-black">
        <Image
          src="/images/crmlogo.png"
          alt="Loading"
          width={150}
          height={150}
          className="animate-pulse rounded-full"
        />
      </div>
    );
  }

  return (
    <>
      <LeftSideBar />
      <div className="flex justify-end min-h-screen">
        <div className="ml-[97px] w-full md:w-[90%] m-auto min-h-[500px] rounded p-4 mt-0">
          <DesktopHeader />

          {/* ---------------- Table Container ----------------------- */}
          <div className="relative overflow-x-auto shadow-lastTransaction rounded-xl sm:rounded-3xl px-1 py-6 md:p-6 z-10 mainContainerBg">
            {/* Top Action Buttons (Create Leads & Bulk Leads) */}
            <div className="flex justify-end items-center mb-6 w-full mx-auto gap-4">
              <div
                className="flex justify-center gap-2 py-3 px-6 rounded-[12px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-700 group"
                onClick={() => setFlyout("create")}
              >
                <FiPlusCircle className="w-5 h-5 text-white group-hover:text-white" />
                <p className="text-white text-base font-medium group-hover:text-white">
                  Create Leads
                </p>
              </div>

              {userRole === "Admin" && (
                <div
                  className="flex justify-center gap-2 py-3 px-6 rounded-[12px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-700 group"
                  onClick={() => setFlyout("bulk_lead")}
                >
                  <MdOutlineDriveFolderUpload className="w-5 h-5 text-white group-hover:text-white" />
                  <p className="text-white text-base font-medium group-hover:text-white">
                    Bulk Leads
                  </p>
                </div>
              )}
            </div>

            {/* Main Tabs */}
            {userRole === "Admin" && <Tabs tabs={tabs} />}
          </div>
        </div>
      </div>

      {/* ---------------- Overlay Backdrop ---------------- */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          flyout ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeFlyout}
      />

      {/* ---------------- Flyout Container ---------------- */}
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[600px] md:w-[700px] xl:w-[800px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          flyout ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Create Lead Flyout */}
        {flyout === "create" && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-600 text-2xl font-bold leading-9">
                Create Leads
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>
            <CreateLead
              closeFlyOut={() => {
                closeFlyout();
                refreshData();
              }}
            />
          </div>
        )}

        {/* Bulk Upload Flyout */}
        {flyout === "bulk_lead" && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-600 text-2xl font-bold leading-9">
                Bulk Leads
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>
            <BulkUploadLead
              closeFlyout={closeFlyout}
              onSuccess={refreshData}
            />
          </div>
        )}
      </div>
    </>
  );
}
