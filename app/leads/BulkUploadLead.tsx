"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import AxiosProvider, { getBaseURL } from "../../provider/AxiosProvider";

interface BulkUploadLeadProps {
  closeFlyout: () => void;
  onSuccess: () => void;
}

export default function BulkUploadLead({
  closeFlyout,
  onSuccess,
}: BulkUploadLeadProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [leadSourceDisplay, setLeadSourceDisplay] = useState<any>(null);
  const [agentDisplay, setAgentDisplay] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Local dropdown states
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  const [agentList, setAgentList] = useState<any[]>([]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [srcRes, agentRes] = await Promise.all([
          AxiosProvider.get("/leadsources"),
          AxiosProvider.get("/allagents"),
        ]);
        setLeadSourceData(srcRes.data?.data?.data ?? []);
        setAgentList(agentRes.data?.data?.data ?? []);
      } catch (err) {
        console.error("Error fetching dropdowns in BulkUploadLead:", err);
      }
    };
    fetchDropdowns();
  }, []);

  const handleUploadFile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!excelFile) {
      toast.error("Please select a file");
      return;
    }

    const formEl = e.currentTarget;

    try {
      setIsLoading(true);

      const fd = new FormData();
      fd.append("file", excelFile as File);

      if (leadSourceDisplay?.id) {
        fd.append("lead_source_id", String(leadSourceDisplay.id));
      }
      if (agentDisplay?.id) {
        fd.append("agent_id", String(agentDisplay.id));
      }

      const res = await fetch(`${getBaseURL()}/leads/bulk/upload`, {
        method: "POST",
        body: fd,
      });

      let payload: any;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        payload = await res.json();
      } else {
        payload = await res.text();
      }

      if (!res.ok) {
        const errorMessage =
          payload?.message ||
          payload?.error ||
          `Bulk upload failed (HTTP ${res.status})`;
        throw new Error(errorMessage);
      }

      const successMessage = payload?.message || "Bulk upload successful!";
      toast.success(successMessage);

      setExcelFile(null);
      setLeadSourceDisplay(null);
      setAgentDisplay(null);
      formEl.reset();
      closeFlyout();
      onSuccess();
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      if (err.message?.includes("invalid")) {
        toast.error("Bulk upload failed - all rows invalid");
      } else {
        toast.error(err.message || "Bulk upload failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleUploadFile} className="space-y-6">
      <div>
        <p className="text-white text-sm mb-2">CSV / Excel File *</p>
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
          className="w-full border border-gray-700 rounded p-2 bg-black text-white text-sm outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow"
          required
        />
      </div>

      <div>
        <p className="text-white text-sm mb-2">Lead Source</p>
        <Select
          value={leadSourceDisplay}
          onChange={(selected: any) => setLeadSourceDisplay(selected)}
          options={leadSourceData}
          getOptionLabel={(opt: any) => opt.name}
          getOptionValue={(opt: any) => String(opt.id)}
          placeholder="Select Lead Source"
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

      <div>
        <p className="text-white text-sm mb-2">Assign to Agent</p>
        <Select
          value={agentDisplay}
          onChange={(selected: any) => setAgentDisplay(selected)}
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
        disabled={isLoading}
        className="py-[13px] px-[26px] bg-primary-600 rounded-[4px] text-base font-medium leading-6 text-white hover:bg-primary-700 w-full"
      >
        {isLoading ? "Uploading..." : "Upload File"}
      </button>
    </form>
  );
}
