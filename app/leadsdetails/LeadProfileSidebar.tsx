"use client";

import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import { MdEdit, MdLocationPin } from "react-icons/md";
import { IoIosMail, IoIosCall } from "react-icons/io";
import { PiNotepadLight } from "react-icons/pi";
import dynamic from "next/dynamic";
const Select = dynamic(() => import("react-select"), { ssr: false });

import AxiosProvider from "../../provider/AxiosProvider";
import { statesByCountry, countryOptions, leadStatusOptions } from "../leads/CreateLead";

interface LeadProfileSidebarProps {
  data: any;
  leadId: string | undefined;
  onUpdate: () => void;
}

export default function LeadProfileSidebar({
  data,
  leadId,
  onUpdate,
}: LeadProfileSidebarProps) {
  const [isEditFirstLead, setIsEditFirstLead] = useState<boolean>(true);
  const [isleadPropertyEdit, setIsLeadPropertyEdit] = useState<boolean>(true);

  // Dropdown states for Edit Lead Properties
  const [agentList, setAgentList] = useState<any[]>([]);
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  const [campaignData, setCampaignData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [agentRes, srcRes, campRes] = await Promise.all([
          AxiosProvider.get("/allagents"),
          AxiosProvider.get("/lead-sources?limit=100"),
          AxiosProvider.get("/campaigns?limit=100"),
        ]);
        setAgentList(agentRes.data?.data?.data ?? agentRes.data?.data ?? []);
        setLeadSourceData(srcRes.data?.data ?? srcRes.data?.data?.data ?? []);
        setCampaignData(campRes.data?.data ?? campRes.data?.data?.data ?? []);
        setAgentList(agentRes.data?.data?.data ?? []);
        setLeadSourceData(srcRes.data?.data?.data ?? []);
      } catch (err) {
        console.error("Error fetching dropdowns in LeadProfileSidebar:", err);
      }
    };
    fetchDropdowns();
  }, []);

  return (
    <div className="w-full">
      {/* ========================================================================= */}
      {/* 1. CONTACT & ADDRESS INFORMATION CARD */}
      {/* ========================================================================= */}
      {isEditFirstLead ? (
        /* ---------- VIEW MODE ---------- */
        <div className="w-full rounded bg-primary-600 px-3.5 py-4 mb-5 shadow">
          <div className="flex justify-between text-white mb-3.5 capitalize">
            <div className="flex gap-2 items-center">
              <FaStar className="text-white text-sm" />
              <div>
                <p className="text-sm font-semibold leading-none">
                  {data?.full_name || "-"}
                </p>
                {data?.address?.country && (
                  <p className="text-[11px] text-gray-200 mt-1">
                    {data?.address?.country}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditFirstLead(false)}
              className="px-2.5 py-1 rounded-[4px] bg-white text-secondBlack text-xs font-semibold flex gap-1 items-center hover:bg-gray-100 cursor-pointer shadow-sm"
            >
              <span>
                <MdEdit className="w-3 h-3" />
              </span>
              Edit
            </button>
          </div>

          {/* Email */}
          <div className="flex text-white items-center gap-2 mb-2">
            <IoIosMail className="text-base flex-shrink-0" />
            <p className="text-xs font-medium leading-none truncate">
              {data?.email || "-"}
            </p>
          </div>

          {/* Phone / Mobile */}
          <div className="flex text-white items-center gap-2 mb-2">
            <IoIosCall className="text-base flex-shrink-0" />
            <p className="text-xs font-medium leading-none">
              {data?.phone || "-"}
            </p>
          </div>

          {/* Address */}
          <div className="flex text-white items-start gap-2 mb-2">
            <MdLocationPin className="text-base flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              {[
                data?.address?.line1,
                data?.address?.line2,
                data?.address?.city,
                data?.address?.state,
                data?.address?.postal_code,
                data?.address?.country,
              ]
                .filter(Boolean)
                .join(", ") || "-"}
            </p>
          </div>

          {/* Note */}
          {data?.note && (
            <div className="flex text-white items-start gap-2 mb-1 border-t border-white/20 pt-2">
              <PiNotepadLight className="text-base flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-200 font-medium">Note:</p>
                <p className="text-xs font-medium leading-relaxed">
                  {data?.note}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ---------- EDIT MODE (Formik form) ---------- */
        <div className="w-full rounded px-0 py-0 mb-6">
          <Formik
            enableReinitialize
            initialValues={{
              full_name: data?.full_name ?? "",
              email: data?.email ?? "",
              phone: data?.phone ?? "",
              country: data?.address?.country ?? data?.country ?? "India",
              state: data?.address?.state ?? data?.state ?? "",
              city: data?.address?.city ?? data?.city ?? "",
              address_line1: data?.address?.line1 ?? data?.address_line1 ?? "",
              address_line2: data?.address?.line2 ?? data?.address_line2 ?? "",
              postal_code: data?.address?.postal_code ?? data?.postal_code ?? "",
              note: data?.note ?? "",
            }}
            validationSchema={Yup.object({
              full_name: Yup.string().trim().required("Full name is required"),
              email: Yup.string()
                .trim()
                .email("Invalid email")
                .required("Email is required"),
              phone: Yup.string().trim().required("Mobile is required"),
              country: Yup.string().trim().nullable(),
              state: Yup.string().trim().nullable(),
              city: Yup.string().trim().nullable(),
              address_line1: Yup.string().trim().nullable(),
              address_line2: Yup.string().trim().nullable(),
              postal_code: Yup.string().trim().nullable(),
              note: Yup.string().trim().nullable(),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const payload = {
                  id: data?.id,
                  ...values,
                };
                await AxiosProvider.post("/leads/update", payload);
                toast.success("Lead contact updated successfully");
                setIsEditFirstLead(true);
                onUpdate();
              } catch (e: any) {
                console.error(e);
                toast.error(
                  e.response?.data?.msg ||
                    e.response?.data?.message ||
                    "Failed to update lead",
                );
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({
              isSubmitting,
              values,
              setFieldValue,
              setFieldTouched,
            }) => {
              const currentStates =
                statesByCountry[values.country] ||
                Object.values(statesByCountry).flat();

              return (
                <Form className="w-full rounded bg-primary-600 px-4 py-6 mb-6 space-y-4 text-white">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-base font-semibold">
                      Edit Contact & Address
                    </p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      Full Name <span className="text-red-300">*</span>
                    </label>
                    <Field
                      name="full_name"
                      type="text"
                      className="w-full h-[38px] border border-white/30 rounded-[4px] px-3 text-xs bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                      placeholder="Enter full name"
                    />
                    <ErrorMessage
                      name="full_name"
                      component="p"
                      className="text-red-300 text-xs mt-1"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      Email <span className="text-red-300">*</span>
                    </label>
                    <Field
                      name="email"
                      type="email"
                      className="w-full h-[38px] border border-white/30 rounded-[4px] px-3 text-xs bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                      placeholder="name@example.com"
                    />
                    <ErrorMessage
                      name="email"
                      component="p"
                      className="text-red-300 text-xs mt-1"
                    />
                  </div>

                  {/* Mobile / Phone */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      Mobile <span className="text-red-300">*</span>
                    </label>
                    <div className="flex w-full h-[38px] border border-white/30 rounded-[4px] bg-black/40 overflow-hidden focus-within:border-white">
                      <select
                        className="bg-black text-white text-xs border-r border-white/30 px-2 py-2 outline-none cursor-pointer"
                        value={
                          values.phone?.startsWith("+1")
                            ? "+1"
                            : values.phone?.startsWith("+44")
                            ? "+44"
                            : "+91"
                        }
                        onChange={(e) => {
                          const currentCode = values.phone?.startsWith("+1")
                            ? "+1"
                            : values.phone?.startsWith("+44")
                            ? "+44"
                            : "+91";
                          const numberPart = (values.phone || "").replace(
                            currentCode,
                            "",
                          );
                          setFieldValue(
                            "phone",
                            numberPart ? e.target.value + numberPart : "",
                          );
                        }}
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                      </select>
                      <input
                        type="text"
                        maxLength={10}
                        className="h-full w-full bg-transparent text-white text-xs px-3 outline-none placeholder-gray-300"
                        placeholder="Enter mobile number"
                        value={(() => {
                          const code = values.phone?.startsWith("+1")
                            ? "+1"
                            : values.phone?.startsWith("+44")
                            ? "+44"
                            : "+91";
                          return (values.phone || "").substring(code.length);
                        })()}
                        onChange={(e) => {
                          const code = values.phone?.startsWith("+1")
                            ? "+1"
                            : values.phone?.startsWith("+44")
                            ? "+44"
                            : "+91";
                          const digitsOnly = e.target.value.replace(/\D/g, "");
                          setFieldValue("phone", digitsOnly ? code + digitsOnly : "");
                        }}
                        onBlur={() => setFieldTouched("phone", true)}
                      />
                    </div>
                    <ErrorMessage
                      name="phone"
                      component="p"
                      className="text-red-300 text-xs mt-1"
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      Country
                    </label>
                    <Select
                      value={
                        countryOptions.find((opt) => opt.id === values.country) ||
                        null
                      }
                      onChange={(selected: any) => {
                        const countryId = selected ? selected.id : "";
                        setFieldValue("country", countryId);
                        setFieldValue("state", "");
                        if (countryId === "India")
                          setFieldValue("currency", "INR");
                        else if (countryId === "USA")
                          setFieldValue("currency", "USD");
                        else if (countryId === "UK")
                          setFieldValue("currency", "GBP");
                      }}
                      onBlur={() => setFieldTouched("country", true)}
                      getOptionLabel={(opt: any) => opt.name}
                      getOptionValue={(opt: any) => opt.id}
                      options={countryOptions}
                      placeholder="Select Country"
                      classNames={{
                        control: () =>
                          "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black/40 !border-white/30",
                      }}
                      styles={{
                        menu: (base) => ({
                          ...base,
                          borderRadius: 4,
                          backgroundColor: "#000",
                        }),
                        option: (base, { isFocused, isSelected }) => ({
                          ...base,
                          backgroundColor: isSelected
                            ? "var(--primary-600)"
                            : isFocused
                            ? "#222"
                            : "#000",
                          color: "#fff",
                        }),
                        singleValue: (base) => ({ ...base, color: "#fff" }),
                        input: (base) => ({ ...base, color: "#fff" }),
                        placeholder: (base) => ({ ...base, color: "#ccc" }),
                      }}
                    />
                  </div>

                  {/* State / Region */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      State / Region
                    </label>
                    <Select
                      value={
                        currentStates.find(
                          (opt: any) =>
                            opt.id === values.state || opt.name === values.state,
                        ) || null
                      }
                      onChange={(selected: any) =>
                        setFieldValue("state", selected ? selected.id : "")
                      }
                      onBlur={() => setFieldTouched("state", true)}
                      getOptionLabel={(opt: any) => opt.name}
                      getOptionValue={(opt: any) => opt.id}
                      options={currentStates}
                      placeholder="Select State / Region"
                      isClearable
                      classNames={{
                        control: () =>
                          "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black/40 !border-white/30",
                      }}
                      styles={{
                        menu: (base) => ({
                          ...base,
                          borderRadius: 4,
                          backgroundColor: "#000",
                        }),
                        option: (base, { isFocused, isSelected }) => ({
                          ...base,
                          backgroundColor: isSelected
                            ? "var(--primary-600)"
                            : isFocused
                            ? "#222"
                            : "#000",
                          color: "#fff",
                        }),
                        singleValue: (base) => ({ ...base, color: "#fff" }),
                        input: (base) => ({ ...base, color: "#fff" }),
                        placeholder: (base) => ({ ...base, color: "#ccc" }),
                      }}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      City
                    </label>
                    <Field
                      name="city"
                      type="text"
                      className="w-full h-[38px] border border-white/30 rounded-[4px] px-3 text-xs bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                      placeholder="Enter city"
                    />
                  </div>

                  {/* Address Line 1 */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      Address Line 1
                    </label>
                    <Field
                      name="address_line1"
                      type="text"
                      className="w-full h-[38px] border border-white/30 rounded-[4px] px-3 text-xs bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                      placeholder="House / Street / Area"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      Address Line 2
                    </label>
                    <Field
                      name="address_line2"
                      type="text"
                      className="w-full h-[38px] border border-white/30 rounded-[4px] px-3 text-xs bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                      placeholder="Apartment / Suite / Landmark"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      Postal Code
                    </label>
                    <Field
                      name="postal_code"
                      type="text"
                      className="w-full h-[38px] border border-white/30 rounded-[4px] px-3 text-xs bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                      placeholder="Enter postal code"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs font-medium text-white mb-1">
                      Note
                    </label>
                    <Field
                      as="textarea"
                      name="note"
                      rows={2}
                      className="w-full h-[38px] border border-white/30 rounded-[4px] px-3 text-xs bg-black/40 text-white placeholder-gray-300 focus:outline-none focus:border-white"
                      placeholder="Enter notes..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditFirstLead(true)}
                      className="px-4 py-2 rounded-[4px] border border-white text-white text-sm font-medium hover:bg-white/10 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-[4px] bg-white text-primary-700 text-sm font-medium hover:bg-gray-100 disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? "Saving..." : "Save"}
                    </button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LEAD & ORDER PROPERTIES CARD */}
      {/* ========================================================================= */}
      {isleadPropertyEdit ? (
        <div className="w-full border border-gray-700 rounded overflow-hidden mb-5">
          <table className="w-full text-xs text-left text-white">
            <thead>
              <tr className="border border-gray-700 talbleheaderBg">
                <th
                  scope="col"
                  colSpan={2}
                  className="px-3 py-2.5 border border-gray-700 font-semibold text-white text-xs"
                >
                  <div className="flex justify-between items-center">
                    <span>Lead & Order Properties</span>
                    <button
                      type="button"
                      className="flex gap-1 items-center px-2.5 py-1 rounded-[4px] bg-primary-600 text-white text-xs font-medium cursor-pointer hover:bg-primary-700"
                      onClick={() => setIsLeadPropertyEdit(!isleadPropertyEdit)}
                    >
                      <MdEdit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {[
                { label: "Lead Number", value: data?.lead_number },
                { label: "Lead Status", value: data?.lead_status || "New" },
                {
                  label: "Agent Name",
                  value: data?.agent?.name || data?.owner_name || "Unassigned",
                },
                { label: "Lead Source", value: data?.lead_source },
                { label: "Campaign", value: data?.campaign_name || data?.campaign?.name || "-" },
                { label: "Best time to call", value: data?.best_time_to_call },
                { label: "WhatsApp Number", value: data?.whatsapp_number },
              ].map((row, idx) => (
                <tr
                  key={idx}
                  className="border transition-colors border-b border-gray-700 odd:bg-[#1E1E1E] even:bg-[#141414]"
                >
                  <td className="text-xs text-gray-400 py-2 px-3 font-medium w-1/3">
                    {row.label}
                  </td>
                  <td className="text-xs font-medium text-white py-2 px-3">
                    {row.value || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ---------- LEAD PROPERTIES EDIT FORM ---------- */
        <div className="w-full border border-gray-700 rounded overflow-hidden mb-6 bg-[#181818] p-4">
          <p className="text-base font-semibold text-white mb-4 border-b border-gray-700 pb-2">
            Edit Lead Properties
          </p>
          <Formik
            enableReinitialize
            initialValues={{
              id: leadId,
              agent_id: data?.agent?.id ?? "",
              lead_status: data?.lead_status ?? "New",
              lead_source_id:
                data?.lead_source_id ||
                data?.lead_source?.id ||
                leadSourceData.find(
                  (s) =>
                    s.name?.toLowerCase() ===
                    (typeof data?.lead_source === "string"
                      ? data?.lead_source?.toLowerCase()
                      : ""),
                )?.id ||
                "",
              campaign_id: data?.campaign_id || data?.campaign?.id || "",
              best_time_to_call: data?.best_time_to_call ?? "",
              whatsapp_number: data?.whatsapp_number ?? "",
            }}
            validationSchema={Yup.object({
              agent_id: Yup.string().nullable(),
              lead_status: Yup.string().nullable(),
              lead_source_id: Yup.string().nullable(),
              campaign_id: Yup.string().nullable(),
              best_time_to_call: Yup.string().trim().nullable(),
              whatsapp_number: Yup.string().trim().nullable(),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                const payload: any = {
                  id: leadId,
                  agent_id: values.agent_id || undefined,
                  lead_status: values.lead_status || undefined,
                  lead_source_id: values.lead_source_id || undefined,
                  campaign_id: values.campaign_id || undefined,
                  best_time_to_call: values.best_time_to_call || undefined,
                  whatsapp_number: values.whatsapp_number || undefined,
                };
                await AxiosProvider.post("/leads/update", payload);
                toast.success("Lead properties updated successfully");
                setIsLeadPropertyEdit(true);
                onUpdate();
              } catch (error: any) {
                toast.error("Failed to update lead properties");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ setFieldValue, setFieldTouched, values, isSubmitting }) => (
              <Form className="space-y-4">
                {/* Assign Agent */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Agent Name
                  </label>
                  <Select
                    value={
                      agentList.find((opt) => opt.id === values.agent_id) || null
                    }
                    onChange={(selected: any) =>
                      setFieldValue("agent_id", selected ? selected.id : "")
                    }
                    onBlur={() => setFieldTouched("agent_id", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={agentList}
                    placeholder="Select Agent"
                    isClearable
                    classNames={{
                      control: () =>
                        "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black !border-gray-700",
                    }}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        borderRadius: 4,
                        backgroundColor: "#000",
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                          ? "#222"
                          : "#000",
                        color: "#fff",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff" }),
                      input: (base) => ({ ...base, color: "#fff" }),
                      placeholder: (base) => ({ ...base, color: "#888" }),
                    }}
                  />
                </div>

                {/* Lead Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Lead Status
                  </label>
                  <Select
                    value={
                      leadStatusOptions.find(
                        (opt) => opt.id === values.lead_status,
                      ) || null
                    }
                    onChange={(selected: any) =>
                      setFieldValue(
                        "lead_status",
                        selected ? selected.id : "New",
                      )
                    }
                    onBlur={() => setFieldTouched("lead_status", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={leadStatusOptions}
                    placeholder="Select Lead Status"
                    classNames={{
                      control: () =>
                        "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black !border-gray-700",
                    }}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        borderRadius: 4,
                        backgroundColor: "#000",
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                          ? "#222"
                          : "#000",
                        color: "#fff",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff" }),
                      input: (base) => ({ ...base, color: "#fff" }),
                      placeholder: (base) => ({ ...base, color: "#888" }),
                    }}
                  />
                </div>

                {/* Lead Source */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Lead Source
                  </label>
                  <Select
                    value={
                      leadSourceData.find(
                        (opt) =>
                          opt.id === values.lead_source_id ||
                          opt.name?.toLowerCase() ===
                            values.lead_source_id?.toLowerCase() ||
                          (data?.lead_source &&
                            opt.name?.toLowerCase() ===
                              (typeof data.lead_source === "string"
                                ? data.lead_source.toLowerCase()
                                : "")),
                      ) || null
                    }
                    onChange={(selected: any) =>
                      setFieldValue(
                        "lead_source_id",
                        selected ? selected.id : "",
                      )
                    }
                    onBlur={() => setFieldTouched("lead_source_id", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={leadSourceData}
                    placeholder="Select Lead Source"
                    isClearable
                    classNames={{
                      control: () =>
                        "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black !border-gray-700",
                    }}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        borderRadius: 4,
                        backgroundColor: "#000",
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                          ? "#222"
                          : "#000",
                        color: "#fff",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff" }),
                      input: (base) => ({ ...base, color: "#fff" }),
                      placeholder: (base) => ({ ...base, color: "#888" }),
                    }}
                  />
                </div>

                {/* Campaign */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Campaign
                  </label>
                  <Select
                    value={
                      campaignData.find((opt) => opt.id === values.campaign_id) || null
                    }
                    onChange={(selected: any) =>
                      setFieldValue("campaign_id", selected ? selected.id : "")
                    }
                    onBlur={() => setFieldTouched("campaign_id", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={
                      values.lead_source_id
                        ? campaignData.filter((c) => !c.lead_source_id || c.lead_source_id === values.lead_source_id)
                        : campaignData
                    }
                    placeholder="Select Campaign"
                    isClearable
                    classNames={{
                      control: () =>
                        "!w-full !border-[0.4px] !rounded-[4px] !text-sm !py-1 !px-1 !bg-black !border-gray-700",
                    }}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        borderRadius: 4,
                        backgroundColor: "#000",
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                          ? "#222"
                          : "#000",
                        color: "#fff",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff" }),
                      input: (base) => ({ ...base, color: "#fff" }),
                      placeholder: (base) => ({ ...base, color: "#888" }),
                    }}
                  />
                </div>

                {/* Best time to call */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Best time to call
                  </label>
                  <Field
                    name="best_time_to_call"
                    type="text"
                    className="w-full border border-gray-700 rounded-[4px] text-white bg-black text-sm px-3 py-2 focus:outline-none focus:border-primary-500"
                    placeholder="e.g. 3-5 PM"
                  />
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    WhatsApp Number
                  </label>
                  <div className="flex w-full border border-gray-700 rounded-[4px] bg-black overflow-hidden focus-within:border-primary-500">
                    <select
                      className="bg-black text-white text-xs border-r border-gray-700 px-2 py-2 outline-none cursor-pointer"
                      value={
                        values.whatsapp_number?.startsWith("+1")
                          ? "+1"
                          : values.whatsapp_number?.startsWith("+44")
                          ? "+44"
                          : "+91"
                      }
                      onChange={(e) => {
                        const currentCode = values.whatsapp_number?.startsWith("+1")
                          ? "+1"
                          : values.whatsapp_number?.startsWith("+44")
                          ? "+44"
                          : "+91";
                        const numberPart = (
                          values.whatsapp_number || ""
                        ).replace(currentCode, "");
                        setFieldValue(
                          "whatsapp_number",
                          e.target.value + numberPart,
                        );
                      }}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                    <input
                      type="text"
                      maxLength={10}
                      className="h-full w-full bg-transparent text-white text-xs px-3 outline-none placeholder-gray-500"
                      placeholder="Enter whatsapp number"
                      value={(() => {
                        const code = values.whatsapp_number?.startsWith("+1")
                          ? "+1"
                          : values.whatsapp_number?.startsWith("+44")
                          ? "+44"
                          : "+91";
                        return (values.whatsapp_number || "").substring(
                          code.length,
                        );
                      })()}
                      onChange={(e) => {
                        const code = values.whatsapp_number?.startsWith("+1")
                          ? "+1"
                          : values.whatsapp_number?.startsWith("+44")
                          ? "+44"
                          : "+91";
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        setFieldValue(
                          "whatsapp_number",
                          code + digitsOnly,
                        );
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLeadPropertyEdit(true)}
                    className="px-4 py-2 rounded-[4px] border border-gray-600 text-gray-300 text-sm font-medium hover:bg-gray-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-[4px] bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? "Saving..." : "Save Properties"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
  );
}
