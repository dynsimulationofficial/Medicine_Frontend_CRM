import React, { useEffect, useState } from 'react';
import AxiosProvider from '../../provider/AxiosProvider';
import { Formik, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { toast } from 'react-toastify';





export const countryOptions = [
  { id: "India", name: "India 🇮🇳" },
  { id: "USA", name: "USA 🇺🇸" },
  { id: "UK", name: "UK 🇬🇧" },
];

export const statesByCountry: Record<string, { id: string; name: string }[]> = {
  India: [
    { id: "Andhra Pradesh", name: "Andhra Pradesh" },
    { id: "Arunachal Pradesh", name: "Arunachal Pradesh" },
    { id: "Assam", name: "Assam" },
    { id: "Bihar", name: "Bihar" },
    { id: "Chhattisgarh", name: "Chhattisgarh" },
    { id: "Goa", name: "Goa" },
    { id: "Gujarat", name: "Gujarat" },
    { id: "Haryana", name: "Haryana" },
    { id: "Himachal Pradesh", name: "Himachal Pradesh" },
    { id: "Jharkhand", name: "Jharkhand" },
    { id: "Karnataka", name: "Karnataka" },
    { id: "Kerala", name: "Kerala" },
    { id: "Madhya Pradesh", name: "Madhya Pradesh" },
    { id: "Maharashtra", name: "Maharashtra" },
    { id: "Manipur", name: "Manipur" },
    { id: "Meghalaya", name: "Meghalaya" },
    { id: "Mizoram", name: "Mizoram" },
    { id: "Nagaland", name: "Nagaland" },
    { id: "Odisha", name: "Odisha" },
    { id: "Punjab", name: "Punjab" },
    { id: "Rajasthan", name: "Rajasthan" },
    { id: "Sikkim", name: "Sikkim" },
    { id: "Tamil Nadu", name: "Tamil Nadu" },
    { id: "Telangana", name: "Telangana" },
    { id: "Tripura", name: "Tripura" },
    { id: "Uttar Pradesh", name: "Uttar Pradesh" },
    { id: "Uttarakhand", name: "Uttarakhand" },
    { id: "West Bengal", name: "West Bengal" },
    { id: "Delhi", name: "Delhi" },
    { id: "Jammu and Kashmir", name: "Jammu and Kashmir" },
    { id: "Ladakh", name: "Ladakh" },
    { id: "Puducherry", name: "Puducherry" },
    { id: "Chandigarh", name: "Chandigarh" },
  ],
  USA: [
    { id: "Alabama", name: "Alabama" },
    { id: "Alaska", name: "Alaska" },
    { id: "Arizona", name: "Arizona" },
    { id: "Arkansas", name: "Arkansas" },
    { id: "California", name: "California" },
    { id: "Colorado", name: "Colorado" },
    { id: "Connecticut", name: "Connecticut" },
    { id: "Delaware", name: "Delaware" },
    { id: "Florida", name: "Florida" },
    { id: "Georgia", name: "Georgia" },
    { id: "Hawaii", name: "Hawaii" },
    { id: "Idaho", name: "Idaho" },
    { id: "Illinois", name: "Illinois" },
    { id: "Indiana", name: "Indiana" },
    { id: "Iowa", name: "Iowa" },
    { id: "Kansas", name: "Kansas" },
    { id: "Kentucky", name: "Kentucky" },
    { id: "Louisiana", name: "Louisiana" },
    { id: "Maine", name: "Maine" },
    { id: "Maryland", name: "Maryland" },
    { id: "Massachusetts", name: "Massachusetts" },
    { id: "Michigan", name: "Michigan" },
    { id: "Minnesota", name: "Minnesota" },
    { id: "Mississippi", name: "Mississippi" },
    { id: "Missouri", name: "Missouri" },
    { id: "Montana", name: "Montana" },
    { id: "Nebraska", name: "Nebraska" },
    { id: "Nevada", name: "Nevada" },
    { id: "New Hampshire", name: "New Hampshire" },
    { id: "New Jersey", name: "New Jersey" },
    { id: "New Mexico", name: "New Mexico" },
    { id: "New York", name: "New York" },
    { id: "North Carolina", name: "North Carolina" },
    { id: "North Dakota", name: "North Dakota" },
    { id: "Ohio", name: "Ohio" },
    { id: "Oklahoma", name: "Oklahoma" },
    { id: "Oregon", name: "Oregon" },
    { id: "Pennsylvania", name: "Pennsylvania" },
    { id: "Rhode Island", name: "Rhode Island" },
    { id: "South Carolina", name: "South Carolina" },
    { id: "South Dakota", name: "South Dakota" },
    { id: "Tennessee", name: "Tennessee" },
    { id: "Texas", name: "Texas" },
    { id: "Utah", name: "Utah" },
    { id: "Vermont", name: "Vermont" },
    { id: "Virginia", name: "Virginia" },
    { id: "Washington", name: "Washington" },
    { id: "West Virginia", name: "West Virginia" },
    { id: "Wisconsin", name: "Wisconsin" },
    { id: "Wyoming", name: "Wyoming" },
    { id: "District of Columbia", name: "District of Columbia" },
  ],
  UK: [
    { id: "England", name: "England" },
    { id: "Scotland", name: "Scotland" },
    { id: "Wales", name: "Wales" },
    { id: "Northern Ireland", name: "Northern Ireland" },
    { id: "Greater London", name: "Greater London" },
    { id: "West Midlands", name: "West Midlands" },
    { id: "Greater Manchester", name: "Greater Manchester" },
    { id: "West Yorkshire", name: "West Yorkshire" },
    { id: "Kent", name: "Kent" },
    { id: "Essex", name: "Essex" },
    { id: "Hampshire", name: "Hampshire" },
    { id: "Lancashire", name: "Lancashire" },
    { id: "Merseyside", name: "Merseyside" },
    { id: "South Yorkshire", name: "South Yorkshire" },
    { id: "Surrey", name: "Surrey" },
    { id: "Hertfordshire", name: "Hertfordshire" },
  ],
};

export const leadStatusOptions = [
  { id: "New", name: "New" },
  { id: "In Progress", name: "In Progress" },
  { id: "Follow-up", name: "Follow-up" },
  { id: "Converted", name: "Converted" },
  { id: "Lost", name: "Lost" },
];

export const paymentStatusOptions = [
  { id: "Pending", name: "Pending" },
  { id: "Paid", name: "Paid" },
  { id: "Failed", name: "Failed" },
  { id: "Refunded", name: "Refunded" },
];

export const deliveryStatusOptions = [
  { id: "Pending", name: "Pending" },
  { id: "Dispatched", name: "Dispatched" },
  { id: "Delivered", name: "Delivered" },
  { id: "Failed", name: "Failed" },
];

export const currencyOptions = [
  { id: "USD", name: "USD ($)" },
  { id: "INR", name: "INR (₹)" },
  { id: "GBP", name: "GBP (£)" },
];

const CreateLead: React.FC<any> = ({ closeFlyOut }) => {
  const [leadSourceData, setLeadSourceData] = useState<any[]>([]);
  const [agentList, setAgentList] = useState<any[]>([]);

  useEffect(() => {
    const leadSource = async () => {
      try {
        const response = await AxiosProvider.get("/leadsources");
        setLeadSourceData(response.data.data.data);
      } catch (error: any) {
        console.log(error);
      }
    };
    leadSource();
  }, []);

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        const res = await AxiosProvider.get("/allagents");
        const result = res.data?.data?.data ?? [];
        setAgentList(result);
      } catch (error: any) {
        console.error("Error fetching agents:", error);
        setAgentList([]);
      }
    };
    fetchAgent();
  }, []);

  const handleCreateLead = async (payload: any) => {
    try {
      await AxiosProvider.post("/leads", payload);
      toast.success("Lead is Created");
      closeFlyOut();
    } catch (error: any) {
      toast.error(error.response?.data?.msg || "Failed to create lead");
    }
  };

  const LeadSchema = Yup.object({
    full_name: Yup.string().trim().required("Full name is required"),
    email: Yup.string()
      .trim()
      .email("Enter a valid email")
      .required("Email is required"),
    phone: Yup.string()
      .trim()
      .required("Phone number is required")
      .test(
        "is-valid-phone",
        "Enter a valid 10-digit phone number",
        (val) => {
          if (!val) return false;
          return /^(\+91|\+1|\+44)[0-9]{10}$/.test(val);
        }
      ),
    address_line1: Yup.string().nullable().notRequired(),
    address_line2: Yup.string().nullable().notRequired(),
    city: Yup.string().nullable().notRequired(),
    state: Yup.string().nullable().notRequired(),
    postal_code: Yup.string().nullable().notRequired(),
    country: Yup.string().nullable().notRequired(),
    lead_score: Yup.number()
      .transform((v, o) => (o === "" ? undefined : v))
      .typeError("Lead score must be a number")
      .nullable()
      .notRequired(),
    lead_quality: Yup.string().nullable().notRequired(),
    best_time_to_call: Yup.string().nullable().notRequired(),
  });

  return (
    <>
      <Formik
        initialValues={{
          full_name: "",
          email: "",
          phone: "",
          address_line1: "",
          country: "India",
          state: "",
          postal_code: "",
          best_time_to_call: "",
          lead_source_id: "",
          whatsapp_number: "",
          agent_id: "",
          lead_status: "New",
          payment_status: "Pending",
          delivery_status: "Pending",
          currency: "INR",
          courier_name: "",
          tracking_number: "",
        }}
        validationSchema={LeadSchema}
        onSubmit={(values, { setSubmitting, resetForm }) => {
          handleCreateLead(values);
          setSubmitting(false);
          resetForm();
        }}
      >
        {({ handleSubmit, isSubmitting, values, setFieldValue, setFieldTouched }) => {
          const currentStates = statesByCountry[values.country] || Object.values(statesByCountry).flat();

          return (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <p className="text-white mb-2">Full Name <span className="text-red-500">*</span></p>
                  <Field
                    type="text"
                    name="full_name"
                    placeholder="Alexandre Dumas"
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                  />
                  <ErrorMessage name="full_name" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Email */}
                <div>
                  <p className="text-white mb-2">Email <span className="text-red-500">*</span></p>
                  <Field
                    type="email"
                    name="email"
                    placeholder="alexandre@example.com"
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Phone */}
                <div>
                  <p className="text-white mb-2">Phone <span className="text-red-500">*</span></p>
                  <div className="flex w-full border border-gray-700 rounded-[4px] bg-black overflow-hidden hover:shadow-hoverInputShadow focus-within:border-primary-600">
                    <select 
                      className="bg-black text-white text-sm border-r border-gray-700 px-2 py-3 outline-none cursor-pointer"
                      value={values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91"}
                      onChange={(e) => {
                        const currentCode = values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91";
                        const numberPart = (values.phone || "").replace(currentCode, "");
                        setFieldValue("phone", numberPart ? e.target.value + numberPart : "");
                      }}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                    <input
                      type="text"
                      maxLength={10}
                      className="w-full bg-transparent text-white text-sm px-3 py-3 outline-none placeholder-gray-400"
                      placeholder="Enter phone number"
                      value={(() => {
                        const code = values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91";
                        return (values.phone || "").substring(code.length);
                      })()}
                      onChange={(e) => {
                        const code = values.phone?.startsWith("+1") ? "+1" : values.phone?.startsWith("+44") ? "+44" : "+91";
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        setFieldValue("phone", digitsOnly ? code + digitsOnly : "");
                      }}
                      onBlur={() => setFieldTouched("phone", true)}
                    />
                  </div>
                  <ErrorMessage name="phone" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                {/* Address Line 1 */}
                <div>
                  <p className="text-white mb-2">Address Line 1</p>
                  <Field
                    type="text"
                    name="address_line1"
                    placeholder="Street, House no."
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                  />
                </div>

                {/* Address Line 2 */}
                <div>
                  <p className="text-white mb-2">Address Line 2</p>
                  <Field
                    type="text"
                    name="address_line2"
                    placeholder="Apartment, suite, unit, etc."
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                  />
                </div>

                {/* City */}
                <div>
                  <p className="text-white mb-2">City</p>
                  <Field
                    type="text"
                    name="city"
                    placeholder="City / Town"
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                  />
                </div>

                {/* Country */}
                <div>
                  <p className="text-white mb-2">Country</p>
                  <Select
                    value={countryOptions.find((opt) => opt.id === values.country) || null}
                    onChange={(selected: any) => {
                      const countryId = selected ? selected.id : "";
                      setFieldValue("country", countryId);
                      setFieldValue("state", ""); // reset state when country changes
                      if (countryId === "India") setFieldValue("currency", "INR");
                      else if (countryId === "USA") setFieldValue("currency", "USD");
                      else if (countryId === "UK") setFieldValue("currency", "GBP");
                    }}
                    onBlur={() => setFieldTouched("country", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={countryOptions}
                    placeholder="Select Country"
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

                {/* State / Region */}
                <div>
                  <p className="text-white mb-2">State / Region</p>
                  <Select
                    value={currentStates.find((opt) => opt.id === values.state) || null}
                    onChange={(selected: any) => setFieldValue("state", selected ? selected.id : "")}
                    onBlur={() => setFieldTouched("state", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={currentStates}
                    placeholder="Select State / Region"
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

                {/* Postal Code */}
                <div>
                  <p className="text-white mb-2">Postal Code</p>
                  <Field
                    type="text"
                    name="postal_code"
                    placeholder="400071"
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                  />
                </div>

                {/* Best Time to Call */}
                <div>
                  <p className="text-white mb-2">Best Time to Call</p>
                  <Field
                    type="text"
                    name="best_time_to_call"
                    placeholder="e.g., 3–5 PM"
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                  />
                </div>

                {/* Lead Source */}
                <div>
                  <p className="text-white mb-2">Lead Source</p>
                  <Select
                    value={leadSourceData.find((opt) => opt.id === values.lead_source_id) || null}
                    onChange={(selected: any) => setFieldValue("lead_source_id", selected ? selected.id : "")}
                    onBlur={() => setFieldTouched("lead_source_id", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={leadSourceData}
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

                {/* WhatsApp Number */}
                <div>
                                      <p className="text-white mb-2">WhatsApp Number</p>
                    <div className="flex w-full border border-gray-700 rounded-[4px] bg-black overflow-hidden hover:shadow-hoverInputShadow focus-within:border-primary-600">
                      <select 
                        className="bg-black text-white text-sm border-r border-gray-700 px-2 py-3 outline-none cursor-pointer"
                        value={values.whatsapp_number?.startsWith('+1') ? '+1' : values.whatsapp_number?.startsWith('+44') ? '+44' : '+91'}
                        onChange={(e) => {
                          const currentCode = values.whatsapp_number?.startsWith('+1') ? '+1' : values.whatsapp_number?.startsWith('+44') ? '+44' : '+91';
                          const numberPart = (values.whatsapp_number || '').replace(currentCode, '');
                          setFieldValue('whatsapp_number', e.target.value + numberPart);
                        }}
                      >
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                      </select>
                      <input
                        type="text"
                        maxLength={10}
                        className="w-full bg-transparent text-white text-sm px-3 py-3 outline-none placeholder-gray-400"
                        placeholder="Enter whatsapp number"
                        value={(() => {
                          const code = values.whatsapp_number?.startsWith('+1') ? '+1' : values.whatsapp_number?.startsWith('+44') ? '+44' : '+91';
                          return (values.whatsapp_number || '').substring(code.length);
                        })()}
                        onChange={(e) => {
                          const code = values.whatsapp_number?.startsWith('+1') ? '+1' : values.whatsapp_number?.startsWith('+44') ? '+44' : '+91';
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          setFieldValue('whatsapp_number', code + digitsOnly);
                        }}
                      />
                    </div>
                    <ErrorMessage name="whatsapp_number" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                {/* Assign to Agent */}
                <div>
                  <p className="text-white mb-2">Assign to Agent</p>
                  <Select
                    value={agentList.find((opt) => opt.id === values.agent_id) || null}
                    onChange={(selected: any) => setFieldValue("agent_id", selected ? selected.id : "")}
                    onBlur={() => setFieldTouched("agent_id", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={agentList}
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

                {/* Lead Status */}
                <div>
                  <p className="text-white mb-2">Lead Status</p>
                  <Select
                    value={leadStatusOptions.find((opt) => opt.id === values.lead_status) || null}
                    onChange={(selected: any) =>
                      setFieldValue("lead_status", selected ? selected.id : "New")
                    }
                    onBlur={() => setFieldTouched("lead_status", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={leadStatusOptions}
                    placeholder="Select Lead Status"
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

                {/* Payment Status */}
                <div>
                  <p className="text-white mb-2">Payment Status</p>
                  <Select
                    value={paymentStatusOptions.find((opt) => opt.id === values.payment_status) || null}
                    onChange={(selected: any) =>
                      setFieldValue("payment_status", selected ? selected.id : "Pending")
                    }
                    onBlur={() => setFieldTouched("payment_status", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={paymentStatusOptions}
                    placeholder="Select Payment Status"
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

                {/* Delivery Status */}
                <div>
                  <p className="text-white mb-2">Delivery Status</p>
                  <Select
                    value={deliveryStatusOptions.find((opt) => opt.id === values.delivery_status) || null}
                    onChange={(selected: any) =>
                      setFieldValue("delivery_status", selected ? selected.id : "Pending")
                    }
                    onBlur={() => setFieldTouched("delivery_status", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={deliveryStatusOptions}
                    placeholder="Select Delivery Status"
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

                {/* Currency */}
                <div>
                  <p className="text-white mb-2">Currency</p>
                  <Select
                    value={currencyOptions.find((opt) => opt.id === values.currency) || null}
                    onChange={(selected: any) => setFieldValue("currency", selected ? selected.id : "USD")}
                    onBlur={() => setFieldTouched("currency", true)}
                    getOptionLabel={(opt: any) => opt.name}
                    getOptionValue={(opt: any) => opt.id}
                    options={currencyOptions}
                    placeholder="Select Currency"
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

                {/* Courier Name */}
                <div>
                  <p className="text-white mb-2">Courier Name</p>
                  <Field
                    type="text"
                    name="courier_name"
                    placeholder="e.g. DHL / FedEx / SpeedPost"
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                  />
                </div>

                {/* Tracking Number */}
                <div>
                  <p className="text-white mb-2">Tracking Number</p>
                  <Field
                    type="text"
                    name="tracking_number"
                    placeholder="e.g. DHL123456789"
                    className="w-full border border-gray-700 rounded-[4px] bg-black text-white text-sm px-4 py-3"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-primary-600 rounded-[4px] text-white text-base font-medium hover:bg-primary-700"
              >
                {isSubmitting ? "Creating..." : "Create Leads"}
              </button>
            </form>
          );
        }}
      </Formik>
    </>
  );
};

export default CreateLead;
