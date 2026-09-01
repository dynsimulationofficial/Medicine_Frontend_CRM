"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BiSkipNextCircle } from "react-icons/bi";
import { GrPowerReset } from "react-icons/gr";
import { toast } from "react-toastify";

import StorageManager from "../../provider/StorageManager";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import Tabs from "../component/Tabs";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import AxiosProvider from "../../provider/AxiosProvider";

import LeadProfileSidebar from "./LeadProfileSidebar";
import LeadActivityTab from "./LeadActivityTab";
import LeadTasksTab from "./LeadTasksTab";
import LeadDocumentsTab from "./LeadDocumentsTab";
import LeadOrdersTab from "./LeadOrdersTab";

const storage = new StorageManager();

export default function LeadDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checking = useAuthRedirect();

  const [leadId, setLeadId] = useState<string | undefined>(
    searchParams.get("id") ?? undefined
  );
  const [data, setData] = useState<any>(null);
  const [hitApi, setHitApi] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const userRole = storage.getUserRole();

  useEffect(() => {
    const newId = searchParams.get("id") ?? undefined;
    if (newId !== leadId) {
      setLeadId(newId);
    }
  }, [searchParams]);

  // Fetch core Lead Profile
  const fetchLeadDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await AxiosProvider.post("/leads/get", { lead_id: id, id });
      const leadData = res.data?.data?.data || res.data?.data;
      if (leadData) {
        setData(leadData);
      }
    } catch (err) {
      console.error("Error loading lead details:", err);
      toast.error("Failed to load lead details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails(leadId);
    }
  }, [leadId, hitApi]);

  // Next Leads action for Agents
  const nextLeads = async () => {
    try {
      const res = await AxiosProvider.get("/leads/random");
      const nextId = res.data?.data?.id;
      if (nextId) {
        router.push(`/leadsdetails?id=${nextId}`);
      } else {
        toast.info("No more unassigned leads available");
      }
    } catch {
      toast.error("Error fetching next lead");
    }
  };

  // Modular Tabs Configuration
  const tabs = [
    {
      label: "Activity History",
      content: (
        <LeadActivityTab
          leadId={leadId || ""}
          hitApi={hitApi}
          setHitApi={setHitApi}
        />
      ),
    },
    {
      label: "Task",
      content: (
        <LeadTasksTab
          leadId={leadId || ""}
          leadName={data?.full_name}
          agentId={data?.agent_id}
          agentName={data?.agent_name}
          hitApi={hitApi}
          setHitApi={setHitApi}
        />
      ),
    },
    {
      label: "Document",
      content: (
        <LeadDocumentsTab
          leadId={leadId || ""}
          hitApi={hitApi}
          setHitApi={setHitApi}
        />
      ),
    },
    {
      label: "Order",
      content: (
        <LeadOrdersTab
          leadId={leadId || ""}
          hitApi={hitApi}
          setHitApi={setHitApi}
        />
      ),
    },
  ];

  if (checking || (isLoading && !data)) {
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

          <div className="w-full flex justify-center relative">
            <div className="w-full min-h-[600px] rounded-3xl mainContainerBg">
              <div className="py-4 px-2 md:p-6">
                {/* Lead Profile Sidebar (28%) + Modular Tabs (72%) */}
                <div className="grid grid-cols-1 xl:grid-cols-[28%_72%] lg:grid-cols-[30%_70%] gap-4">
                  <LeadProfileSidebar
                    data={data}
                    leadId={leadId}
                    onUpdate={() => setHitApi((prev) => !prev)}
                  />

                  <div className="relative w-full">
                    <Tabs tabs={tabs} />
                    <GrPowerReset
                      onClick={() => setHitApi((prev) => !prev)}
                      className="absolute -top-5 -right-1 md:top-2 md:right-1 cursor-pointer text-lg md:text-2xl text-white hover:text-primary-500 active:text-primary-600"
                      title="Refresh"
                    />
                  </div>
                </div>

                {/* Next Leads Button (Agent Only) */}
                {userRole === "Agent" && (
                  <>
                    <div className="w-full flex justify-center border-b border-gray-700/60 my-6"></div>
                    <div className="w-full flex justify-center">
                      <div
                        onClick={nextLeads}
                        className="flex w-auto gap-2 py-3 px-6 rounded-[12px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-800 transition"
                      >
                        <p className="text-white text-base font-medium">
                          Next Leads
                        </p>
                        <BiSkipNextCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
