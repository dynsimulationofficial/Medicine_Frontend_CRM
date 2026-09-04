"use client";
import Image from "next/image";
import { RxAvatar } from "react-icons/rx";
import { CiSettings } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FaLandMineOn, FaPlus, FaRegAddressCard } from "react-icons/fa6";
import { MdOutlineCall } from "react-icons/md";
import { LiaArrowCircleDownSolid } from "react-icons/lia";
import { MdRemoveRedEye, MdModeEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCloseOutline, IoMailOpenOutline } from "react-icons/io5";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { AppContext } from "../AppContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
const getThemeSwal = () => Swal.mixin({
  background: "#171717",
  color: "#ffffff",
  confirmButtonColor: "#138ab6",
  cancelButtonColor: "#404040",
});

import SidebarUserUpdateForm from "../component/SidebarUserUpdateForm";
import StorageManager from "../../provider/StorageManager";
import React from "react";
import LeftSideBar from "../component/LeftSideBar";
import UserActivityLogger from "../../provider/UserActivityLogger";
import { useRouter } from "next/navigation";
import { HiChevronDoubleLeft } from "react-icons/hi";
import { HiChevronDoubleRight } from "react-icons/hi";
import DesktopHeader from "../component/DesktopHeader";
import { Tooltip } from "react-tooltip";
import { FaEllipsisVertical } from "react-icons/fa6";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { ImBlocked } from "react-icons/im";
import { TbLockOpenOff } from "react-icons/tb";

export interface User {
  id: string;
  name: string;
  email: string;
  mobile_number: string;
  created_at: string; // could be Date if you parse it
  updated_at: string; // same here
  role_name: string;
  role_level: number;
}

interface CurrentUserData {
  id: string;
  name: string;
  mobile_number: string;
  email: string;
  role: string;
}
export interface EditUser {
  user_id: string;
  name: string;
  mobile_number: string;
  email: string;
  password: string;
  role_name: string;
}
const axiosProvider = new AxiosProvider();
const storage = new StorageManager();
const activityLogger = new UserActivityLogger();

export default function Home() {
  const checking = useAuthRedirect();
  const [data, setData] = useState<User[] | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [isEditFlyoutOpen, setIsEditFlyoutOpen] = useState<boolean>(false);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { accessToken } = useContext(AppContext);
  const router = useRouter();
  const [isFlyoutOpen, setFlyoutOpen] = useState<boolean>(false);

  const [editFormData, setEditFormData] = useState<any | null>(null);

  console.log("edit data object", editFormData);
  const storage = new StorageManager();
  const userRole = storage.getUserRole();

  const toggleEditFlyout = () => {
    setIsEditFlyoutOpen(!isEditFlyoutOpen);
  };

  const deleteUserData = async (item: User) => {
    const userID = item.id;

    getThemeSwal().fire({
      title: "Are you sure?",
      text: "Do you really want to delete this user?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await AxiosProvider.post("/userdelete", { id: userID });
          if (res.data?.success || res.status === 200) {
            toast.success("Successfully Deleted");
            setShouldRefetch((prev) => !prev);
          }
        } catch (error: any) {
          console.error("Error deleting user:", error);
          toast.error(error.response?.data?.message || "Failed to delete user");
        }
      }
    });
  };
  const blockUserData = async (item: User) => {
    const userID = item.id;

    getThemeSwal().fire({
      title: "Block User",
      input: "textarea",
      inputPlaceholder: "Enter reason...",
      inputAttributes: {
        "aria-label": "Reason for blocking user",
      },
      showCancelButton: true,
      confirmButtonText: "Block",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      preConfirm: (reason) => {
        if (!reason) {
          Swal.showValidationMessage("Reason is required");
        }
        return reason;
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const res = await AxiosProvider.post("/blockuser", {
            user_id: userID,
            reason: result.value,
          });

          if (res.data?.success || res.status === 200) {
            toast.success("User blocked successfully");
            setShouldRefetch((prev) => !prev);
          }
        } catch (error: any) {
          console.error("Error blocking user:", error);
          toast.error(error.response?.data?.message || "Failed to block user");
        }
      }
    });
  };

  const changeCurrentUserData = (item: User) => {
    setCurrentUserData(item);
    toggleEditFlyout();
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await AxiosProvider.get(
        `/allusers?page=${page}&pageSize=${pageSize}`,
      );
      if (response.data?.success || response.status === 200) {
        const result = response.data.data.data;
        setTotalPages(response.data.data.pagination.totalPages);
        setData(result);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [shouldRefetch, page]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const clickOnEditButton = (item: any) => {
    setFlyoutOpen(true);
    setEditFormData({
      user_id: item.id, // 👈 convert id → user_id here
      name: item.name || "",
      mobile_number: item.mobile_number || "",
      email: item.email || "",
      password: "",
      role_name: item.role_name || "", // keep empty if you don't want to prefill password
    });
  };

  const handleSubmit = async (values: EditUser, { setSubmitting }: any) => {
    try {
      const payload: any = { ...values };
      if (!payload.password) {
        delete payload.password;
      }
      
      const res = await AxiosProvider.post("/leads/user/edit", payload);
      if (res.data?.success || res.status === 200) {
        getThemeSwal().fire("Success", "User updated success", "success");
        setFlyoutOpen(false);
        setShouldRefetch((prev) => !prev);
      }
    } catch (err: any) {
      console.error(err);
      const backendMsg = err.response?.data?.message;
      const validationErrs = err.response?.data?.errors?.map((e:any)=>e).join(', ');
      
      const errorMessage = backendMsg || validationErrs || err.message || "User is not updated";
      getThemeSwal().fire("Error", errorMessage, "error");
    } finally {
      if (setSubmitting) setSubmitting(false);
    }
  };
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center">
        <Image
          src="/images/crmlogo.png"
          alt="Table image"
          width={500}
          height={500}
          style={{ width: "150px", height: "auto" }}
          className="animate-pulse rounded"
        />
      </div>
    );
  }
  if (checking) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center bg-white">
        <Image
          src="/images/crmlogo.png"
          alt="Loading"
          width={150}
          height={150}
          className="animate-pulse rounded"
        />
      </div>
    );
  }
  return (
    <>
      <div className=" flex justify-end  min-h-screen">
        <LeftSideBar />
        {/* Main content right section */}
        <div className="ml-[97px] w-full md:w-[90%] m-auto  min-h-[500px]  rounded p-4 mt-0 ">
          {/* left section top row */}
          <DesktopHeader />
          {/* right section top row */}

          <div className="rounded-3xl   py-6 px-1  md:p-6 z-10 relative mainContainerBg">
            {/* Main content middle section */}
            <div className="w-full gap-3 flex justify-end items-center mt-0 mb-6 flex-wrap sm:flex-nowrap">
              <div className="sm:w-auto">
                <Link href="/blocked_user">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 h-[38px] px-4 rounded-[4px] border border-[#E7E7E7] w-full sm:w-auto bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold tracking-wide cursor-pointer transition shadow-sm"
                  >
                    <TbLockOpenOff className="h-4 w-4 text-white" />
                    <span>Blocked User</span>
                  </button>
                </Link>
              </div>
              <div className="sm:w-auto">
                <Link href="/useradd">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 h-[38px] px-4 rounded-[4px] border border-[#E7E7E7] w-full sm:w-auto bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold tracking-wide cursor-pointer transition shadow-sm"
                  >
                    <FaRegAddressCard className="h-4 w-4 text-white" />
                    <span>Create User</span>
                  </button>
                </Link>
              </div>
            </div>
            {/* ----------------Table----------------------- */}
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-xs text-left text-white  whitespace-nowrap">
                <thead className="text-xs talbleheaderBg text-white">
                  <tr className="   ">
                    <th className="px-1 py-3 md:p-3    ">
                      <div className="flex items-center gap-2">
                        <RxAvatar className="w-5 h-5" />
                        <div className="font-bold text-white text-xs">
                          Name - Mail
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-1     hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <IoMailOpenOutline className="w-5 h-5" />
                        <div className="font-bold text-white text-xs">
                          Email
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-1     hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MdOutlineCall className="w-5 h-5" />
                        <div className="font-bold text-white text-xs">
                          Phone
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-1     hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <LiaArrowCircleDownSolid className="w-5 h-5" />
                        <div className="font-bold text-white text-xs">
                          Role
                        </div>
                      </div>
                    </th>
                    <th className="px-2 py-1    ">
                      <div className="flex items-center gap-2">
                        <LiaArrowCircleDownSolid className="w-5 h-5" />
                        <div className="font-bold text-white text-xs">
                          Action
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {!data || data.length === 0 || isError ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-white">
                        Data not found
                      </td>
                    </tr>
                  ) : (
                    data.map((item: any, index: number) => (
                      <tr
                        key={item?.id ?? index}
                        className="     hover:bg-primary-600 border-b border-[#E7E7E7] odd:bg-[#404040]"
                      >
                        {/* Name */}
                        <td className="px-1 md:p-3 py-2 flex md:flex-row gap-2 ">
                          <p className="text-white text-xs leading-normal capitalize truncate">
                            {item?.name ?? "-"}
                          </p>
                        </td>

                        {/* Email */}
                        <td className="px-2 py-1     hidden md:table-cell">
                          <p className="text-white text-xs leading-normal truncate">
                            {item?.email ?? "-"}
                          </p>
                        </td>

                        {/* Phone */}
                        <td className="px-2 py-1     hidden md:table-cell">
                          <p className="text-white text-xs leading-normal capitalize truncate">
                            {item?.mobile_number ?? "-"}
                          </p>
                        </td>

                        {/* Role */}
                        <td className="px-2 py-1 hidden md:table-cell">
                          <span className="inline-flex items-center px-2.5 py-0.5 bg-primary-600 text-white rounded-full text-[11px] font-semibold tracking-wide">
                            {item?.role_name ?? "-"}
                          </span>
                        </td>
                        {/* Action Buttons Group (No Divide Lines) */}
                        <td className="px-2 py-1">
                          <div className="inline-flex items-center rounded-lg border border-gray-700 bg-black p-1 gap-1 shadow-sm">
                            <button
                              onClick={() => clickOnEditButton(item)}
                              className="p-1 hover:bg-primary-700 rounded-md text-white transition cursor-pointer"
                              title="Edit User"
                            >
                              <MdRemoveRedEye className="text-white w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => deleteUserData(item)}
                              className="p-1 hover:bg-red-700 rounded-md text-white transition cursor-pointer"
                              title="Delete User"
                            >
                              <RiDeleteBin6Line className="text-white w-3.5 h-3.5" />
                            </button>

                            {item.role_name === "Admin" ? (
                              <button
                                disabled
                                className="p-1 opacity-30 cursor-not-allowed text-white rounded-md"
                                title="Admin cannot be blocked"
                              >
                                <ImBlocked className="text-white w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => blockUserData(item)}
                                className="p-1 hover:bg-yellow-700 rounded-md text-white transition cursor-pointer"
                                title="Block User"
                              >
                                <ImBlocked className="text-white w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* ----------------End table--------------------------- */}
          {/* Pagination Controls */}
          <div className="flex justify-center items-center my-10 relative gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-2 py-2 mx-2 border rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronDoubleLeft className="w-6 h-auto" />
            </button>

            <span className="text-white text-sm">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-2 py-2 mx-2 border rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiChevronDoubleRight className="w-6 h-auto" />
            </button>
          </div>

          {/* END PAGINATION */}
        </div>
      </div>

      {/* <SidebarUserUpdateForm
        isEditFlyoutOpen={isEditFlyoutOpen}
        setIsEditFlyoutOpen={setIsEditFlyoutOpen}
         currentUserData={currentUserData}
        setShouldRefetch={setShouldRefetch}
      /> */}
      {isFlyoutOpen && (
        <div
          className=" min-h-screen w-full bg-[#1f1d1d80] fixed top-0 left-0 right-0 z-[999]"
          onClick={() => {
            setFlyoutOpen(!isFlyoutOpen);
          }}
        ></div>
      )}
      <div className={`flyout ${isFlyoutOpen ? "open" : ""}`}>
        <div className="w-full min-h-auto  text-white p-4">
          {/* Flyout content here */}
          <div className="flex justify-between mb-4">
            <p className="text-primary-500 text-[26px] font-bold leading-9">
              Edit users
            </p>
            <IoCloseOutline
              onClick={() => setFlyoutOpen(false)}
              className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer"
            />
          </div>
          <div className="w-full border-b border-gray-700 mb-4"></div>

          {/* FORM */}
          {editFormData && (
            <Formik
              enableReinitialize
              initialValues={editFormData}
              validationSchema={Yup.object({
                user_id: Yup.string().required("User ID is required"),
                name: Yup.string().required("Name is required"),
                mobile_number: Yup.string()
                  .required("Mobile number is required")
                  .matches(
                    /^\+91\d{10}$/,
                    "Mobile number must be in the format +91xxxxxxxxxx",
                  ),
                email: Yup.string()
                  .required("Email is required")
                  .email("Invalid email format"),
                role_name: Yup.string().required("Role is required"),
                password: Yup.string()
                  .min(6, "Password must be at least 6 characters")
                  .optional(),
              })}
              onSubmit={handleSubmit}
            >
              {({ values, handleChange, errors, touched }) => (
                <Form className="grid grid-cols-2 gap-6 mt-6">
                  {/* Hidden user_id */}
                  <input type="hidden" name="user_id" value={values.user_id} />

                  {/* Name */}
                  <div className="w-full relative mb-3">
                    <p className="text-white text-xs font-medium mb-1.5">
                      Your Name
                    </p>
                    <input
                      type="text"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      placeholder="Charlene Reed"
                      className={`hover:shadow-hoverInputShadow focus-border-primary w-full h-[38px] border border-gray-700 rounded-[4px] text-xs placeholder-gray-400 px-3 text-white bg-black outline-none focus:border-primary-500`}
                    />
                    {errors.name &&
                      touched.name &&
                      typeof errors.name === "string" && (
                        <div className="text-red-500 text-sm">
                          {errors.name}
                        </div>
                      )}
                  </div>

                  {/* Mobile Number */}
                  <div className="w-full relative mb-3">
                    <p className="text-white text-xs font-medium mb-1.5">
                      Mobile Number
                    </p>
                    <input
                      type="text"
                      name="mobile_number"
                      value={values.mobile_number}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className={`hover:shadow-hoverInputShadow focus-border-primary w-full h-[38px] border border-gray-700 rounded-[4px] text-xs placeholder-gray-400 px-3 text-white bg-black outline-none focus:border-primary-500`}
                    />
                    {errors.mobile_number &&
                      touched.mobile_number &&
                      typeof errors.mobile_number === "string" && (
                        <div className="text-red-500 text-sm">
                          {errors.mobile_number}
                        </div>
                      )}
                  </div>

                  {/* Email */}
                  <div className="w-full relative mb-3">
                    <p className="text-white text-xs font-medium mb-1.5">
                      Email
                    </p>
                    <input
                      type="email"
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      placeholder="youremail@example.com"
                      className={`hover:shadow-hoverInputShadow focus-border-primary w-full h-[38px] border border-gray-700 rounded-[4px] text-xs placeholder-gray-400 px-3 text-white bg-black outline-none focus:border-primary-500`}
                    />
                    {errors.email &&
                      touched.email &&
                      typeof errors.email === "string" && (
                        <div className="text-red-500 text-sm">
                          {errors.email}
                        </div>
                      )}
                  </div>

                  {/* User Role (read-only) */}
                  <div className="w-full relative mb-3">
                    <p className="text-white text-xs font-medium mb-1.5">
                      Role
                    </p>
                    <input
                      type="text"
                      value={values.role_name}
                      readOnly
                      className="w-full h-[38px] border border-gray-700 rounded-[4px] text-xs placeholder-gray-400 px-3 text-white bg-black outline-none focus:border-primary-500 cursor-not-allowed"
                    />
                    {errors.role_name &&
                      touched.role_name &&
                      typeof errors.role_name === "string" && (
                        <div className="text-red-500 text-sm">
                          {errors.role_name}
                        </div>
                      )}
                  </div>

                  {/* New Password (Optional) */}
                  <div className="w-full relative mb-3 col-span-2">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-white text-xs font-medium">
                        New Password <span className="text-gray-400 text-[11px] font-normal">(Leave blank to keep current password)</span>
                      </p>
                    </div>
                    <input
                      type="password"
                      name="password"
                      value={values.password || ""}
                      onChange={handleChange}
                      placeholder="Enter new password (min 6 characters)"
                      className="hover:shadow-hoverInputShadow focus-border-primary w-full h-[38px] border border-gray-700 rounded-[4px] text-xs placeholder-gray-500 px-3 text-white bg-black outline-none focus:border-primary-500"
                    />
                    {errors.password &&
                      touched.password &&
                      typeof errors.password === "string" && (
                        <div className="text-red-500 text-sm mt-1">
                          {errors.password}
                        </div>
                      )}
                  </div>

                  {/* Submit */}
                  <div className="col-span-2">
                    <button
                      type="submit"
                      className="w-full h-[38px] bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-[4px] transition cursor-pointer flex items-center justify-center shadow"
                    >
                      Save Changes
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </>
  );
}
