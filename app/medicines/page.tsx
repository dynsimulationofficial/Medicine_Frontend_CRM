"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FiPlusCircle } from "react-icons/fi";
import { IoCloseOutline } from "react-icons/io5";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
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

  const [flyout, setFlyout] = useState<"add" | "edit" | "">("");
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
        toast.success(isEdit ? "Medicine updated successfully" : "Medicine added successfully");
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

          {/* ---------------- Table Container ----------------------- */}
          <div className="relative overflow-x-auto shadow-lastTransaction rounded-xl sm:rounded-2xl px-1 py-4 md:p-5 z-10 mainContainerBg">
            {/* Top Action Buttons */}
            <div className="flex justify-between items-center mb-5 w-full mx-auto gap-4">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Medicines
              </h2>

              {/* Add Medicine Button */}
              <div
                className="flex justify-center gap-2 py-2 px-3.5 rounded-[8px] border border-[#E7E7E7] cursor-pointer bg-primary-600 items-center hover:bg-primary-700 active:bg-primary-700 group transition"
                onClick={() => {
                  setSelectedData(null);
                  setFlyout("add");
                }}
              >
                <FiPlusCircle className="w-4 h-4 text-white group-hover:text-white" />
                <p className="text-white text-xs font-semibold group-hover:text-white">
                  Add Medicine
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto border border-gray-600 rounded-lg">
              <table className="w-full text-left text-xs text-white">
                <thead className="text-xs uppercase talbleheaderBg text-white border-b border-gray-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 w-16 text-center">#</th>
                    <th className="py-2.5 px-3">Medicine Name</th>
                    <th className="py-2.5 px-3">Added On</th>
                    <th className="py-2.5 px-3 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/60">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400 text-xs font-medium">
                        No data found
                      </td>
                    </tr>
                  ) : (
                    data.map((row, idx) => (
                      <tr
                        key={row.id || idx}
                        className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-700/80 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center text-gray-300 font-medium">
                          {(page - 1) * 20 + idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white text-xs">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-200 whitespace-nowrap">
                          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedData(row);
                                setFlyout("edit");
                              }}
                              className="py-1 px-2 bg-primary-600 hover:bg-primary-700 rounded text-white text-xs transition-colors cursor-pointer"
                              title="Edit Medicine"
                            >
                              <MdEdit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(row.id, row.name)}
                              className="py-1 px-2 bg-red-600 hover:bg-red-700 rounded text-white text-xs transition-colors cursor-pointer"
                              title="Delete Medicine"
                            >
                              <RiDeleteBin6Line className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.length > 0 && (
              <div className="flex justify-center items-center my-6 gap-3 flex-wrap">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1.5 border border-gray-700 rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 cursor-pointer transition"
                >
                  <HiChevronDoubleLeft className="w-4 h-auto" />
                </button>
                <span className="text-xs font-medium text-gray-300 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1.5 border border-gray-700 rounded bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 cursor-pointer transition"
                >
                  <HiChevronDoubleRight className="w-4 h-auto" />
                </button>
              </div>
            )}
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
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[500px] md:w-[550px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          flyout ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {(flyout === "add" || flyout === "edit") && (
          <div className="w-full min-h-auto p-5 sm:p-6 text-white">
            <div className="flex justify-between items-center mb-5">
              <p className="text-primary-600 text-xl font-bold leading-none">
                {flyout === "edit" ? "Edit Medicine" : "Add Medicine"}
              </p>
              <IoCloseOutline
                onClick={closeFlyout}
                className="h-7 w-7 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-5"></div>

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
                    <p className="text-white font-medium text-xs mb-1.5">
                      Medicine Name <span className="text-red-500">*</span>
                    </p>
                    <Field
                      name="name"
                      placeholder="e.g. Paracetamol 500mg"
                      autoFocus
                      className="w-full h-[38px] border border-gray-700 rounded-[4px] text-xs px-3 bg-black text-white outline-none focus:border-primary-500 hover:shadow-hoverInputShadow transition"
                    />
                    <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-[38px] bg-primary-600 rounded-[4px] text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 transition cursor-pointer flex items-center justify-center"
                  >
                    {isSubmitting ? "Saving..." : flyout === "edit" ? "Update Medicine" : "Create Medicine"}
                  </button>
                </Form>
              )}
            </Formik>
          </div>
        )}
      </div>
    </>
  );
}
