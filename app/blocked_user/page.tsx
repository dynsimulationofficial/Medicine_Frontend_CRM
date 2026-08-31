"use client";
import Image from "next/image";
import { RxAvatar } from "react-icons/rx";
import { CiSettings } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FaPlus, FaRegAddressCard } from "react-icons/fa6";
import { MdOutlineCall } from "react-icons/md";
import { LiaArrowCircleDownSolid } from "react-icons/lia";
import { MdRemoveRedEye, MdModeEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import Link from "next/link";
import { useEffect, useState, useContext } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { AppContext } from "../AppContext";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
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
import { ImBlocked } from "react-icons/im";

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

  const toggleEditFlyout = () => {
    setIsEditFlyoutOpen(!isEditFlyoutOpen);
  };

  const deleteUserData = async (item: User) => {
    const userID = item.id;

    Swal.fire({
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
          await AxiosProvider.post("/userdelete", { id: userID });

          toast.success("Successfully Deleted");
          setShouldRefetch((prev) => !prev);
          //  await activityLogger.userDelete(userID);
        } catch (error) {
          console.error("Error deleting user:", error);
          toast.error("Failed to delete user");
        }
      }
    });
  };
  const blockUserData = async (item: User) => {
    const userID = item.id;

    Swal.fire({
      title: "Block User",
      input: "textarea",
      inputPlaceholder: "Enter reason...",
      inputAttributes: {
        "aria-label": "Reason for blocking user",
      },
      showCancelButton: true,
      confirmButtonText: "Block",
      cancelButtonText: "Cancel",
      confirmButtonColor: "##3085d6",
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
          await AxiosProvider.post("/blockuser", {
            user_id: userID,
            reason: result.value,
          });

          toast.success("User blocked successfully");
          setShouldRefetch((prev) => !prev);
          //await activityLogger.userDelete(userID);
        } catch (error) {
          console.error("Error blocking user:", error);
          toast.error("Failed to block user");
        }
      }
    });
  };
  const unBlockUserData = async (id: string) => {
    try {
      await AxiosProvider.post("/unblockuser", { user_id: id });

      toast.success("Successfully Deleted");
      setShouldRefetch((prev) => !prev);
      // await activityLogger.userDelete(userID);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const changeCurrentUserData = (item: User) => {
    setCurrentUserData(item);
    toggleEditFlyout();
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await AxiosProvider.get(
        `/listblockuser?page=${page}&pageSize=${pageSize}`,
      );
      //console.log('get all user',response.data.data.data);
      const result = response.data.data.data;
      //console.log("BBBBBBBBBBBBBBBB", result);
      // console.log("###########", response.data.data.pagination.totalPages);
      //setTotalPages(response.data.data.pagination.totalPages);
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
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
              <table className="w-full text-xs text-left text-white whitespace-nowrap">
                <thead className="text-xs talbleheaderBg text-white">
                  <tr>
                    <th className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <RxAvatar className="w-4 h-4 text-white" />
                        <span className="font-bold text-white text-xs tracking-wide">
                          Name
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-2 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MdOutlineCall className="w-4 h-4 text-white" />
                        <span className="font-bold text-white text-xs tracking-wide">
                          Email
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-2 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MdOutlineCall className="w-4 h-4 text-white" />
                        <span className="font-bold text-white text-xs tracking-wide">
                          Phone
                        </span>
                      </div>
                    </th>
                    <th className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <LiaArrowCircleDownSolid className="w-4 h-4 text-white" />
                        <span className="font-bold text-white text-xs tracking-wide">
                          Action
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {!data || data.length === 0 || isError ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center text-base py-8 text-white"
                      >
                        Data not found
                      </td>
                    </tr>
                  ) : (
                    data.map((item: any, index: number) => (
                      <tr
                        key={item?.id ?? index}
                        className="hover:bg-primary-700 border-b border-[#E7E7E7] odd:bg-[#404040]"
                      >
                        <td className="px-3 py-2 flex md:flex-row gap-2 font-semibold text-white">
                          <p className="capitalize truncate">
                            {item?.name ?? "-"}
                          </p>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-white">
                          <p className="truncate">
                            {item?.email ?? "-"}
                          </p>
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-white">
                          <p className="truncate">
                            {item?.mobile_number ?? "-"}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <div className="inline-flex items-center rounded-lg border border-gray-700 bg-black p-1 gap-1 shadow-sm">
                            <button
                              onClick={() => unBlockUserData(item.id)}
                              className="px-2.5 py-1 hover:bg-primary-700 rounded-md text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                              title="Unblock User"
                            >
                              <ImBlocked className="text-white w-3.5 h-3.5" />
                              <span>Unblock</span>
                            </button>
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
          <div className="flex justify-center items-center my-10 relative">
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
    </>
  );
}
