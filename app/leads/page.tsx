"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FiFilter, FiPlusCircle } from "react-icons/fi";
import { MdOutlineDriveFolderUpload } from "react-icons/md";
import { IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import Select from "react-select";

import AxiosProvider from "../../provider/AxiosProvider";
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
  const [flyout, setFlyout] = useState<"create" | "bulk" | "bulk_assign" | "">("");

  // Dropdowns data
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  const [agentList, setAgentList] = useState<any[]>([]);

  // Selected agent for bulk assign
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  // Selected IDs from Unassigned Table
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // System states
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

  // Fetch dropdown data on mount
  useEffect(() => {
    const fetchLeadSources = async () => {
      try {
        const response = await AxiosProvider.get("/leadsources");
        setLeadSourceData(response.data.data.data);
      } catch (error: any) {
        console.log(error);
      }
    };

    const fetchAgents = async () => {
      try {
        const res = await AxiosProvider.get("/allagents");
        setAgentList(res.data?.data?.data ?? []);
      } catch (error: any) {
        console.error("Error fetching agents:", error);
        setAgentList([]);
      }
    };

    fetchLeadSources();
    fetchAgents();
  }, []);

  // Bulk Agent Assignment
  const handleBulkAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) {
      toast.error("Please select an agent");
      return;
    }
    closeFlyout();

    try {
      await AxiosProvider.post("/leads/assigned/bulk", {
        lead_ids: selectedIds,
        agent_id: selectedAgent.id,
      });
      toast.success("Lead is assigned");
      refreshData();
      setSelectedAgent(null);
      setSelectedIds([]);
    } catch (error: any) {
      toast.error("Lead is not Updated");
    }
  };

  // Main Tabs Configuration
  const tabs = [
    {
      label: "Unassign Leads",
      content: (
        <UnassignedLeadsTable
          userRole={userRole}
          refreshKey={refreshKey}
          onViewLead={handleViewLead}
          onSelectionChange={(ids: string[]) => setSelectedIds(ids)}
          leadSourceData={leadSourceData}
          agentList={agentList}
        />
      ),
    },
    {
      label: "Assign Leads",
      content: (
        <AssignedLeadsTable
          userRole={userRole}
          refreshKey={refreshKey}
          onViewLead={handleViewLead}
          leadSourceData={leadSourceData}
          agentList={agentList}
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
            {/* Search and filter table row */}
            <div className="flex justify-between items-center mb-6 w-full mx-auto">
              <div>
                {selectedIds.length > 0 && (
                  <div className="flex items-center">
                    <div
                      className="flex justify-center gap-2 py-3 px-6 rounded-[12px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-800 group"
                      onClick={() => setFlyout("bulk_assign")}
                    >
                      <FiFilter className="w-5 h-5 text-white group-hover:text-white" />
                      <p className="text-white text-base font-medium group-hover:text-white">
                        Assign Agent Bulk ({selectedIds.length})
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center items-center gap-4">
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
                    onClick={() => setFlyout("bulk")}
                  >
                    <MdOutlineDriveFolderUpload className="w-5 h-5 text-white group-hover:text-white" />
                    <p className="text-white text-base font-medium group-hover:text-white">
                      Bulk Leads
                    </p>
                  </div>
                )}
              </div>
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
        {flyout === "bulk" && (
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
              leadSourceData={leadSourceData}
              agentList={agentList}
            />
          </div>
        )}

        {/* Bulk Assign Agent Flyout */}
        {flyout === "bulk_assign" && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-600 text-[26px] font-bold leading-9">
                Assign to Agent
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-[#E7E7E7] rounded cursor-pointer"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>

            <form onSubmit={handleBulkAction} className="w-full space-y-6">
              <div className="w-full">
                <p className="text-base leading-6 mb-2">Assign to Agent</p>
                <Select
                  value={selectedAgent}
                  onChange={(selected: any) => setSelectedAgent(selected)}
                  options={agentList}
                  getOptionLabel={(opt: any) => opt.name}
                  getOptionValue={(opt: any) => String(opt.id)}
                  placeholder="Select Agent"
                  isClearable
                  classNames={{
                    control: ({ isFocused }: any) =>
                      `onHoverBoxShadow !w-full !border-[0.4px] !rounded-[4px] !text-sm !leading-4 !font-medium !py-1.5 !px-1 !bg-black !shadow-sm ${
                        isFocused ? "!border-primary-500" : "!border-gray-700"
                      }`,
                  }}
                  styles={{
                    menu: (base) => ({ ...base, borderRadius: 4, backgroundColor: "#000" }),
                    option: (base, { isFocused, isSelected }) => ({
                      ...base,
                      backgroundColor: isSelected ? "var(--primary-600)" : isFocused ? "#222" : "#000",
                      color: "#fff",
                      cursor: "pointer",
                    }),
                    singleValue: (base) => ({ ...base, color: "#fff" }),
                    input: (base) => ({ ...base, color: "#fff" }),
                    placeholder: (base) => ({ ...base, color: "#aaa" }),
                  }}
                />
              </div>

              <button
                type="submit"
                className="py-[13px] px-[26px] bg-primary-500 rounded-[4px] text-base font-medium leading-6 text-white hover:text-dark cursor-pointer w-full text-center hover:bg-primary-700 hover:text-white"
              >
                Assign to Agent Check Bulk
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
