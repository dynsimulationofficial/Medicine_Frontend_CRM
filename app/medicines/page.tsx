"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FiPlusCircle } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { FaEdit, FaPills, FaEye } from "react-icons/fa";
import { MdDateRange, MdOutlineSettings } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { HiChevronDoubleLeft, HiChevronDoubleRight } from "react-icons/hi";
import Swal from "sweetalert2";

import LeftSideBar from "../component/LeftSideBar";
import DesktopHeader from "../component/DesktopHeader";
import AxiosProvider from "../../provider/AxiosProvider";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

const medicineSchema = Yup.object({
  name: Yup.string().trim().required("Medicine name is required").max(255),
});

export default function MedicinesPage() {
  const checking = useAuthRedirect();

  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [flyout, setFlyout] = useState<"add" | "edit" | "view" | "">("");
  const [selectedData, setSelectedData] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await AxiosProvider.get(`/medicines?page=${page}&limit=20`);
      if (res.data?.success) {
        setData(Array.isArray(res.data.data) ? res.data.data : []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch {
      toast.error("Failed to load medicines");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const closeFlyout = () => {
    setFlyout("");
    setSelectedData(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete "${name}"?`,
      icon: "warning",
      background: "#181818",
      color: "#ffffff",
      iconColor: "#eab308",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "border border-gray-700 rounded-2xl shadow-2xl",
      },
    });
    if (res.isConfirmed) {
      try {
        await AxiosProvider.delete(`/medicines/${id}`);
        toast.success("Medicine deleted successfully");
        fetchData();
      } catch {
        toast.error("Delete failed");
      }
    }
  };

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      const isEdit = flyout === "edit" && selectedData?.id;
      const res = isEdit
        ? await AxiosProvider.put(`/medicines/${selectedData.id}`, values)
        : await AxiosProvider.post("/medicines", values);

      if (res.data?.success) {
        toast.success(
          isEdit
            ? "Medicine updated successfully"
            : "Medicine added successfully",
        );
        closeFlyout();
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking || (isLoading && data.length === 0)) {
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

          {/* ---------------- Main Container ----------------------- */}
          <div className="relative overflow-x-auto shadow-lastTransaction rounded-xl sm:rounded-3xl px-1 py-6 md:p-6 z-10 mainContainerBg">
            {/* Top Action Button (Create Medicine) */}
            <div className="flex justify-end items-center mb-6 w-full mx-auto gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 h-[38px] px-4 rounded-[4px] border border-[#E7E7E7] bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold tracking-wide cursor-pointer transition shadow-sm"
                onClick={() => {
                  setSelectedData(null);
                  setFlyout("add");
                }}
              >
                <FiPlusCircle className="w-4 h-4 text-white" />
                <span>Add Medicine</span>
              </button>
            </div>

            {/* Table */}
            <table className="w-full text-xs text-left text-white whitespace-nowrap">
              <thead className="text-xs text-[#999999] talbleheaderBg">
                <tr>
                  <th scope="col" className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs tracking-wide">
                        #
                      </span>
                    </div>
                  </th>

                  <th scope="col" className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <FaPills className="w-4 h-4 text-white" />
                      <span className="font-bold text-white text-xs tracking-wide">
                        Medicine Name
                      </span>
                    </div>
                  </th>

                  <th scope="col" className="px-3 py-2 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <MdDateRange className="w-4 h-4 text-white" />
                      <span className="font-bold text-white text-xs tracking-wide">
                        Added Date
                      </span>
                    </div>
                  </th>

                  <th scope="col" className="px-3 py-2 md:table-cell">
                    <div className="flex items-center gap-2">
                      <MdOutlineSettings className="w-4 h-4 text-white" />
                      <span className="font-bold text-white text-xs tracking-wide">
                        Action
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-white">
                      <div className="animate-pulse">Loading medicines...</div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-xl py-8 text-white">
                      <div>Data not found</div>
                    </td>
                  </tr>
                ) : (
                  data.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="hover:bg-primary-700 border-b border-[#E7E7E7] odd:bg-[#404040]"
                    >
                      <td className="px-3 py-2 text-center text-gray-300 font-medium">
                        {(page - 1) * 20 + idx + 1}
                      </td>
                      <td className="px-3 py-2 font-semibold text-white">
                        {row.name}
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell text-white">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-3 py-2 md:table-cell">
                        <div className="inline-flex items-center rounded-lg border border-gray-700 bg-black p-1 gap-1 shadow-sm">
                          <button
                            onClick={() => {
                              setSelectedData(row);
                              setFlyout("view");
                            }}
                            className="p-1 hover:bg-primary-700 rounded-md text-white transition cursor-pointer"
                            title="View Details"
                          >
                            <FaEye className="text-white w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedData(row);
                              setFlyout("edit");
                            }}
                            className="p-1 hover:bg-primary-700 rounded-md text-white transition cursor-pointer"
                            title="Edit Medicine"
                          >
                            <FaEdit className="text-white w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.id, row.name)}
                            className="p-1 hover:bg-red-700 rounded-md text-white transition cursor-pointer"
                            title="Delete Medicine"
                          >
                            <RiDeleteBin6Line className="text-white w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="flex justify-center items-center my-10 relative gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-2 mx-2 border rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <HiChevronDoubleLeft className="w-6 h-auto" />
                </button>
                <span className="text-white text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-2 mx-2 border rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <HiChevronDoubleRight className="w-6 h-auto" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flyout Overlay */}
      {flyout && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 cursor-pointer"
          onClick={closeFlyout}
        />
      )}

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[500px] md:w-[550px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          flyout ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ADD / EDIT FORM */}
        {(flyout === "add" || flyout === "edit") && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-500 text-[26px] font-bold leading-9">
                {flyout === "edit" ? "Edit Medicine" : "Create Medicine"}
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
              />
            </div>

            <Formik
              initialValues={{
                name: selectedData?.name || "",
              }}
              validationSchema={medicineSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <p className="text-white text-xs mb-1.5 font-medium">
                      Medicine Name <span className="text-red-500">*</span>
                    </p>
                    <Field
                      name="name"
                      placeholder="e.g. Paracetamol 500mg"
                      autoFocus
                      className="hover:shadow-hoverInputShadow focus:border-primary-600 w-full h-[38px] border border-gray-700 rounded-[4px] text-white text-xs placeholder-gray-400 px-3 bg-black outline-none"
                    />
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-[38px] bg-primary-600 hover:bg-primary-700 rounded-[4px] text-white text-xs font-semibold cursor-pointer transition flex items-center justify-center disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : flyout === "edit"
                          ? "Update Medicine"
                          : "Create Medicine"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}

        {/* VIEW DETAILS */}
        {flyout === "view" && selectedData && (
          <div className="w-full min-h-auto p-6 sm:p-8 text-white">
            <div className="flex justify-between items-center mb-6">
              <p className="text-primary-500 text-[26px] font-bold leading-9">
                Medicine Details
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary-400 border-b border-gray-800 pb-2">
                Medicine Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Medicine Name</p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {selectedData.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Created At</p>
                  <p className="text-sm font-medium text-gray-200 mt-0.5">
                    {selectedData.created_at
                      ? new Date(selectedData.created_at).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-8">
              <button
                onClick={closeFlyout}
                className="w-full h-[38px] bg-primary-600 hover:bg-primary-700 rounded-[4px] text-white text-xs font-semibold cursor-pointer transition flex items-center justify-center"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
