"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import AxiosProvider, { getBaseURL } from "../../provider/AxiosProvider";

interface BulkUploadLeadProps {
  closeFlyout: () => void;
  onSuccess: () => void;
}

const customSelectStyles = {
  control: (base: any, { isFocused }: any) => ({
    ...base,
    height: "38px",
    minHeight: "38px",
    backgroundColor: "#000",
    borderColor: isFocused ? "var(--primary-500, #0284c7)" : "#374151",
    borderRadius: 4,
    fontSize: "12px",
    boxShadow: "none",
    "&:hover": {
      borderColor: isFocused ? "var(--primary-500, #0284c7)" : "#4b5563",
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: "38px",
    padding: "0 8px",
  }),
  input: (base: any) => ({
    ...base,
    margin: "0px",
    padding: "0px",
    color: "#fff",
    fontSize: "12px",
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: "38px",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "#fff",
    fontSize: "12px",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#aaa",
    fontSize: "12px",
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: 4,
    backgroundColor: "#000",
    border: "1px solid #374151",
    zIndex: 9999,
  }),
  option: (base: any, { isFocused, isSelected }: any) => ({
    ...base,
    backgroundColor: isSelected
      ? "var(--primary-600, #0284c7)"
      : isFocused
      ? "#222"
      : "#000",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    padding: "8px 12px",
  }),
};

export default function BulkUploadLead({
  closeFlyout,
  onSuccess,
}: BulkUploadLeadProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dropdown states
  const [leadSourceOptions, setLeadSourceOptions] = useState<any[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<any[]>([]);
  const [agentOptions, setAgentOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        let sourcesList: any[] = [];
        try {
          const srcRes = await AxiosProvider.get("/lead-sources?limit=100");
          sourcesList = Array.isArray(srcRes.data?.data)
            ? srcRes.data.data
            : Array.isArray(srcRes.data?.data?.data)
            ? srcRes.data.data.data
            : [];
        } catch {
          const fallbackRes = await AxiosProvider.get("/leadsources");
          sourcesList = Array.isArray(fallbackRes.data?.data?.data)
            ? fallbackRes.data.data.data
            : Array.isArray(fallbackRes.data?.data)
            ? fallbackRes.data.data
            : [];
        }

        setLeadSourceOptions(
          sourcesList.map((s: any) => ({
            value: s.id,
            label: s.name,
            id: s.id,
            name: s.name,
          }))
        );

        const agentRes = await AxiosProvider.get("/allagents");
        const agentsList = Array.isArray(agentRes.data?.data?.data)
          ? agentRes.data.data.data
          : Array.isArray(agentRes.data?.data)
          ? agentRes.data.data
          : [];

        setAgentOptions(
          agentsList.map((a: any) => ({
            value: a.id,
            label: a.name,
            id: a.id,
            name: a.name,
          }))
        );
      } catch (err) {
        console.error("Error fetching dropdowns in BulkUploadLead:", err);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch campaigns dynamically when lead source changes
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const url = selectedSource?.value
          ? `/campaigns/by-source?lead_source_id=${selectedSource.value}`
          : "/campaigns?limit=100";
        const res = await AxiosProvider.get(url);
        const campList = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.data?.data)
          ? res.data.data.data
          : [];

        setCampaignOptions(
          campList.map((c: any) => ({
            value: c.id,
            label: c.name,
            id: c.id,
            name: c.name,
          }))
        );
      } catch {
        setCampaignOptions([]);
      }
    };
    fetchCampaigns();
  }, [selectedSource]);

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

      if (selectedSource?.value) {
        fd.append("lead_source_id", String(selectedSource.value));
      }
      if (selectedCampaign?.value) {
        fd.append("campaign_id", String(selectedCampaign.value));
      }
      if (selectedAgent?.value) {
        fd.append("agent_id", String(selectedAgent.value));
      }

      const res = await AxiosProvider.post("/leads/bulk/upload", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const successMessage = res.data?.message || res.data?.msg || "Bulk upload successful!";
      toast.success(successMessage);

      setExcelFile(null);
      setSelectedSource(null);
      setSelectedCampaign(null);
      setSelectedAgent(null);
      formEl.reset();
      closeFlyout();
      onSuccess();
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.msg ||
        err.message ||
        "Bulk upload failed";
      if (errorMsg.toLowerCase().includes("invalid")) {
        toast.error("Bulk upload failed - all rows invalid");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleUploadFile} className="space-y-4">
      <div>
        <p className="text-white text-xs font-medium mb-1.5">CSV / Excel File *</p>
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
          className="w-full h-[38px] border border-gray-700 rounded px-3 py-1.5 bg-black text-white text-xs outline-none focus:outline-none focus:border-primary-600 hover:shadow-hoverInputShadow cursor-pointer"
          required
        />
      </div>

      <div>
        <p className="text-white text-xs font-medium mb-1.5">Lead Source</p>
        <Select
          value={selectedSource}
          onChange={(opt: any) => {
            setSelectedSource(opt);
            setSelectedCampaign(null);
          }}
          options={leadSourceOptions}
          placeholder="Select Lead Source (Optional)"
          isClearable
          styles={customSelectStyles}
        />
      </div>

      <div>
        <p className="text-white text-xs font-medium mb-1.5">Campaign</p>
        <Select
          value={selectedCampaign}
          onChange={(opt: any) => setSelectedCampaign(opt)}
          options={campaignOptions}
          placeholder="Select Campaign (Optional)"
          isClearable
          styles={customSelectStyles}
        />
      </div>

      <div>
        <p className="text-white text-xs font-medium mb-1.5">Assign to Agent</p>
        <Select
          value={selectedAgent}
          onChange={(opt: any) => setSelectedAgent(opt)}
          options={agentOptions}
          placeholder="Select Agent (Optional)"
          isClearable
          styles={customSelectStyles}
        />
      </div>

      <div className="pt-3">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[38px] bg-primary-600 hover:bg-primary-700 rounded text-white text-xs font-semibold cursor-pointer transition flex items-center justify-center disabled:opacity-50"
        >
          {isLoading ? "Uploading..." : "Upload File"}
        </button>
      </div>
    </form>
  );
}
