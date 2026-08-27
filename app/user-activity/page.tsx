"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FiFilter } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { RxAvatar } from "react-icons/rx";
import { FaRegIdCard, FaUserEdit, FaUserTag } from "react-icons/fa";
import { MdDateRange, MdViewModule } from "react-icons/md";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import { toast } from "react-toastify";
import Select from "react-select";
import { Formik, Field, Form } from "formik";
import * as Yup from "yup";

import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

interface FilterData {
  uuId?: string;
  module?: string;
  type?: string;
}

interface UserActivity {
  id: number;
  uuid: string;
  user_activity: string;
  activity_timestamp: string;
  module: string;
  type: string;
  user: {
    id: string;
    name: string;
  };
}

interface Agent {
  id: string;
  name: string;
  email: string;
  mobile_number: string;
}

interface OptionType {
  value: string;
  label: string;
}

const moduleOptions: OptionType[] = [
  { value: "document_management", label: "Document Management" },
  { value: "authentication", label: "Authentication" },
  { value: "activity_management", label: "Activity Management" },
  { value: "user_management", label: "User Management" },
  { value: "leads", label: "Leads" },
  { value: "task_management", label: "Task Management" },
];

const typeOptions: OptionType[] = [
  { value: "update", label: "Update" },
  { value: "create", label: "Create" },
  { value: "login", label: "Login" },
  { value: "delete", label: "Delete" },
  { value: "block", label: "Block" },
  { value: "unblock", label: "Unblock" },
];

export default function UserActivityPage() {
  const checking = useAuthRedirect();
  const [isFlyoutFilterOpen, setFlyoutFilterOpen] = useState<boolean>(false);
  const [data, setData] = useState<UserActivity[]>([]);
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [pageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);
  const [filterPage, setFilterPage] = useState<number>(1);

  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalFilterPages, setTotalFilterPages] = useState<number>(1);
  const [filterData, setFilterData] = useState<FilterData | null>(null);

  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFilter, setIsFilter] = useState<boolean>(false);
  const [hitApi, setHitApi] = useState<boolean>(false);

  const userOptions = agentList.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  const fetchAgent = async () => {
    try {
      const res = await AxiosProvider.get("/allagents");
      const result = res.data?.data?.data ?? (Array.isArray(res.data?.data) ? res.data?.data : []);
      setAgentList(result);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      setAgentList([]);
    }
  };

  useEffect(() => {
    fetchAgent();
  }, []);

  const fetchData = async () => {
    setIsFilter(false);
    setIsLoading(true);
    try {
      const response = await AxiosProvider.get(
        `/user-activity?page=${page}&pageSize=${pageSize}`
      );
      const result = response.data?.data?.data ?? [];
      setData(result);
      setTotalPages(response.data?.data?.pagination?.totalPages || 1);
      setIsError(false);
    } catch (error: any) {
      setIsError(true);
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isFilter) {
      fetchData();
    }
  }, [page, hitApi]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageChangeFilter = (newPage: number) => {
    if (newPage > 0 && newPage <= totalFilterPages) {
      setFilterPage(newPage);
    }
  };

  const clickedFilterClear = () => {
    setFilterData(null);
    setIsFilter(false);
    setFilterPage(1);
    setPage(1);
    setHitApi((prev) => !prev);
  };

  const filterApiCall = async (values: FilterData, targetPage: number = 1) => {
    if (!values.uuId && !values.module && !values.type) {
      toast.error("At least one field is required!");
      return;
    }
    setIsLoading(true);
    try {
      const response = await AxiosProvider.post(
        `/user-activity/filter?page=${targetPage}`,
        values
      );
      setData(response.data?.data?.data ?? []);
      setIsFilter(true);
      setFilterData(values);
      setTotalFilterPages(response.data?.data?.pagination?.totalPages || 1);
      setFlyoutFilterOpen(false);
    } catch (error) {
      console.error("Error while filtering:", error);
      toast.error("Error while fetching filtered data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFilter && filterData) {
      filterApiCall(filterData, filterPage);
    }
  }, [filterPage]);

  const formatActivityDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return isoString;
    }
  };

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

          {/* Table Container */}
          <div className="relative overflow-x-auto shadow-lastTransaction rounded-xl sm:rounded-3xl px-1 py-6 md:p-6 z-10 mainContainerBg">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 w-full mx-auto gap-4">
              <div>
                {isFilter && (
                  <button
                    type="button"
                    onClick={clickedFilterClear}
                    className="flex items-center gap-2 py-2.5 px-4 rounded-[12px] border border-red-500 text-red-400 hover:bg-red-500 hover:text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <IoCloseOutline className="w-4 h-4" />
                    <span>Clear Filter</span>
                  </button>
                )}
              </div>

              <div
                className="flex justify-center gap-2 py-2.5 px-6 rounded-[12px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-800 transition"
                onClick={() => setFlyoutFilterOpen(true)}
              >
                <FiFilter className="w-4 h-4 text-white" />
                <p className="text-white text-sm font-semibold">Filter</p>
              </div>
            </div>

            {/* Table */}
            <div className="relative overflow-x-auto border border-gray-700 rounded-lg">
              <table className="w-full text-xs text-left text-white">
                <thead className="text-[11px] uppercase talbleheaderBg text-white border-b border-gray-700">
                  <tr>
                    <th scope="col" className="py-3 px-3 w-[36%]">
                      <div className="flex items-center gap-1.5">
                        <RxAvatar className="w-4 h-4 text-white" />
                        <span className="font-bold text-white tracking-wide">Name & User Activity</span>
                      </div>
                    </th>
                    <th scope="col" className="py-3 px-3 hidden sm:table-cell w-[14%]">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <FaUserEdit className="w-4 h-4 text-white" />
                        <span className="font-bold text-white tracking-wide">User&apos;s Name</span>
                      </div>
                    </th>
                    <th scope="col" className="py-3 px-3 hidden md:table-cell w-[18%]">
                      <div className="flex items-center gap-1.5">
                        <FaRegIdCard className="w-4 h-4 text-white" />
                        <span className="font-bold text-white tracking-wide">User UUID</span>
                      </div>
                    </th>
                    <th scope="col" className="py-3 px-3 hidden sm:table-cell w-[14%]">
                      <div className="flex items-center gap-1.5">
                        <MdDateRange className="w-4 h-4 text-white" />
                        <span className="font-bold text-white tracking-wide">Date & Time</span>
                      </div>
                    </th>
                    <th scope="col" className="py-3 px-3 hidden sm:table-cell w-[10%]">
                      <div className="flex items-center gap-1.5">
                        <MdViewModule className="w-4 h-4 text-white" />
                        <span className="font-bold text-white tracking-wide">Module</span>
                      </div>
                    </th>
                    <th scope="col" className="py-3 px-3 hidden sm:table-cell w-[8%]">
                      <div className="flex items-center gap-1.5">
                        <FaUserTag className="w-4 h-4 text-white" />
                        <span className="font-bold text-white tracking-wide">Type</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400 text-xs">
                        Loading user activity...
                      </td>
                    </tr>
                  ) : !data || data.length === 0 || isError ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400 text-xs font-medium">
                        No activity records found
                      </td>
                    </tr>
                  ) : (
                    data.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-800/80 transition-colors"
                      >
                        <td className="py-2.5 px-3">
                          <p className="text-white text-xs leading-relaxed font-normal">
                            {item.user_activity}
                          </p>
                        </td>

                        <td className="py-2.5 px-3 hidden sm:table-cell">
                          <p className="text-white text-xs font-medium capitalize">
                            {item.user?.name || "-"}
                          </p>
                        </td>

                        <td className="py-2.5 px-3 hidden md:table-cell">
                          <p className="text-gray-300 text-[11px] font-mono break-all leading-tight">
                            {item.uuid || item.user?.id || "-"}
                          </p>
                        </td>

                        <td className="py-2.5 px-3 hidden sm:table-cell">
                          <p className="text-gray-200 text-xs whitespace-nowrap">
                            {formatActivityDate(item.activity_timestamp)}
                          </p>
                        </td>

                        <td className="py-2.5 px-3 hidden sm:table-cell">
                          <p className="text-gray-200 text-xs capitalize">
                            {item.module || "-"}
                          </p>
                        </td>

                        <td className="py-2.5 px-3 hidden sm:table-cell">
                          <p className="text-gray-200 text-xs capitalize">
                            {item.type || "-"}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {isFilter ? (
              <div className="flex justify-center items-center my-8 gap-2">
                <button
                  onClick={() => handlePageChangeFilter(filterPage - 1)}
                  disabled={filterPage === 1}
                  className="px-2.5 py-1.5 border border-gray-700 rounded bg-primary-600 hover:bg-primary-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <HiChevronDoubleLeft className="w-4 h-4" />
                </button>
                <span className="text-gray-300 text-xs px-2">
                  Filter Page {filterPage} of {totalFilterPages}
                </span>
                <button
                  onClick={() => handlePageChangeFilter(filterPage + 1)}
                  disabled={filterPage === totalFilterPages}
                  className="px-2.5 py-1.5 border border-gray-700 rounded bg-primary-600 hover:bg-primary-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <HiChevronDoubleRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center my-8 gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 border border-gray-700 rounded bg-primary-600 hover:bg-primary-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <HiChevronDoubleLeft className="w-4 h-4" />
                </button>
                <span className="text-gray-300 text-xs px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 border border-gray-700 rounded bg-primary-600 hover:bg-primary-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <HiChevronDoubleRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Overlay Backdrop (Smooth Animation) ---------------- */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          isFlyoutFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setFlyoutFilterOpen(false)}
      />

      {/* ---------------- Flyout Container (Smooth Slide-In) ---------------- */}
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[380px] sm:w-[480px] md:w-[540px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isFlyoutFilterOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full min-h-auto p-6 sm:p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <p className="text-primary-600 text-2xl font-bold leading-9">
              Filter User Activity
            </p>
            <IoCloseOutline
              onClick={() => setFlyoutFilterOpen(false)}
              className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
            />
          </div>
          <div className="w-full border-b border-gray-700 mb-6"></div>

          <Formik
            initialValues={{
              uuId: filterData?.uuId || "",
              module: filterData?.module || "",
              type: filterData?.type || "",
            }}
            validationSchema={Yup.object({
              uuId: Yup.string(),
              module: Yup.string(),
              type: Yup.string(),
            })}
            onSubmit={async (values) => {
              filterApiCall(values, 1);
            }}
          >
            {({ values, errors, touched, setFieldValue, handleSubmit }) => (
              <Form onSubmit={handleSubmit} className="space-y-5">
                {/* User Name */}
                <div>
                  <p className="text-white font-medium text-xs mb-1.5">
                    User / Agent Name
                  </p>
                  <Select
                    value={
                      userOptions.find((option) => option.value === values.uuId) || null
                    }
                    onChange={(selectedOption: any) => {
                      setFieldValue("uuId", selectedOption ? selectedOption.value : "");
                    }}
                    options={userOptions}
                    placeholder="Select User"
                    isClearable
                    classNames={{
                      control: ({ isFocused }: any) =>
                        `!w-full !border !rounded !text-xs !py-1 !px-1 !bg-black !shadow-none ${
                          isFocused ? "!border-primary-500" : "!border-gray-700"
                        }`,
                    }}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        borderRadius: 4,
                        backgroundColor: "#000",
                        border: "1px solid #374151",
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                          ? "#222"
                          : "#000",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "12px",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
                      input: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
                      placeholder: (base) => ({ ...base, color: "#aaa", fontSize: "12px" }),
                    }}
                  />
                  {errors.uuId && touched.uuId && (
                    <div className="text-red-500 text-xs mt-1">{errors.uuId}</div>
                  )}
                </div>

                {/* Module */}
                <div>
                  <p className="text-white font-medium text-xs mb-1.5">Module</p>
                  <Select
                    value={
                      moduleOptions.find((option) => option.value === values.module) || null
                    }
                    onChange={(selectedOption: any) => {
                      setFieldValue("module", selectedOption ? selectedOption.value : "");
                    }}
                    options={moduleOptions}
                    placeholder="Select Module"
                    isClearable
                    classNames={{
                      control: ({ isFocused }: any) =>
                        `!w-full !border !rounded !text-xs !py-1 !px-1 !bg-black !shadow-none ${
                          isFocused ? "!border-primary-500" : "!border-gray-700"
                        }`,
                    }}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        borderRadius: 4,
                        backgroundColor: "#000",
                        border: "1px solid #374151",
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                          ? "#222"
                          : "#000",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "12px",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
                      input: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
                      placeholder: (base) => ({ ...base, color: "#aaa", fontSize: "12px" }),
                    }}
                  />
                  {errors.module && touched.module && (
                    <div className="text-red-500 text-xs mt-1">{errors.module}</div>
                  )}
                </div>

                {/* Type */}
                <div>
                  <p className="text-white font-medium text-xs mb-1.5">Activity Type</p>
                  <Select
                    value={
                      typeOptions.find((option) => option.value === values.type) || null
                    }
                    onChange={(selectedOption: any) => {
                      setFieldValue("type", selectedOption ? selectedOption.value : "");
                    }}
                    options={typeOptions}
                    placeholder="Select Type"
                    isClearable
                    classNames={{
                      control: ({ isFocused }: any) =>
                        `!w-full !border !rounded !text-xs !py-1 !px-1 !bg-black !shadow-none ${
                          isFocused ? "!border-primary-500" : "!border-gray-700"
                        }`,
                    }}
                    styles={{
                      menu: (base) => ({
                        ...base,
                        borderRadius: 4,
                        backgroundColor: "#000",
                        border: "1px solid #374151",
                      }),
                      option: (base, { isFocused, isSelected }) => ({
                        ...base,
                        backgroundColor: isSelected
                          ? "var(--primary-600)"
                          : isFocused
                          ? "#222"
                          : "#000",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "12px",
                      }),
                      singleValue: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
                      input: (base) => ({ ...base, color: "#fff", fontSize: "12px" }),
                      placeholder: (base) => ({ ...base, color: "#aaa", fontSize: "12px" }),
                    }}
                  />
                  {errors.type && touched.type && (
                    <div className="text-red-500 text-xs mt-1">{errors.type}</div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setFlyoutFilterOpen(false)}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-medium transition cursor-pointer"
                  >
                    Apply Filter
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
