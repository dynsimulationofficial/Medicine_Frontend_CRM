"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AxiosProvider, { getBaseURL } from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
import { FiPlusCircle } from "react-icons/fi";
import { FaDownload } from "react-icons/fa";
import Swal from "sweetalert2";

export interface DocumentData {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  is_image: boolean;
  notes?: string | null;
  uploaded_by?: string | null;
  uploaded_by_name?: string | null;
  created_at: string;
  updated_at: string;
  download?: string;
}

type Props = {
  leadId: string;
  hitApi: boolean;
  setHitApi: React.Dispatch<React.SetStateAction<boolean>>;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
};

const fmtSize = (bytes: number): string => {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function LeadDocumentsTab({
  leadId,
  hitApi,
  setHitApi,
  isCreateOpen = false,
  onCloseCreate,
}: Props) {
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [editingDoc, setEditingDoc] = useState<DocumentData | null>(null);
  const [editNotes, setEditNotes] = useState<string>("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isLocalCreateOpen, setIsLocalCreateOpen] = useState(false);

  const isCreateVisible = isCreateOpen || isLocalCreateOpen;

  // Create form state
  const [createNotes, setCreateNotes] = useState<string>("");
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    try {
      const res = await AxiosProvider.post("/leads/documents/list", {
        lead_id: leadId,
      });
      setDocs(res.data?.data?.documents || []);
    } catch (e) {
      console.error("Error fetching documents:", e);
    }
  };

  useEffect(() => {
    if (leadId) fetchDocs();
  }, [leadId, hitApi]);

  const handleDownload = async (doc: DocumentData) => {
    try {
      const res = await AxiosProvider.post("/leads/documents/geturl", {
        id: doc.id,
      });
      let fileUrl = res.data?.data?.url;
      if (!fileUrl) {
        toast.error("Download URL not available");
        return;
      }

      // If relative path, resolve to backend origin
      if (fileUrl.startsWith("/")) {
        try {
          const origin = new URL(getBaseURL()).origin;
          fileUrl = `${origin}${fileUrl}`;
        } catch {
          fileUrl = `http://localhost:8016${fileUrl}`;
        }
      }

      // Trigger seamless background download without opening any blank new tab
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = fileUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 5000);
      toast.success("Download started");
    } catch (err) {
      console.error("Failed to download file:", err);
      toast.error("Failed to download document");
    }
  };

  const handleDelete = (doc: DocumentData) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete "${doc.file_name}"?`,
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await AxiosProvider.post("/leads/documents/delete", { id: doc.id });
          toast.success("Document deleted successfully");
          setHitApi((prev) => !prev);
          fetchDocs();
        } catch {
          toast.error("Failed to delete document");
        }
      }
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFile) {
      toast.error("Please select a file to upload");
      return;
    }

    const fd = new FormData();
    fd.append("lead_id", leadId);
    fd.append("file", createFile);
    if (createNotes.trim()) fd.append("notes", createNotes.trim());

    setIsUploading(true);
    try {
      await AxiosProvider.post("/leads/documents/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully");
      setCreateNotes("");
      setCreateFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setHitApi((prev) => !prev);
      closeCreateDrawer();
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    try {
      if (editFile) {
        const fd = new FormData();
        fd.append("lead_id", leadId);
        fd.append("file", editFile);
        if (editNotes.trim()) fd.append("notes", editNotes.trim());

        await AxiosProvider.post("/leads/documents/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        try {
          await AxiosProvider.post("/leads/documents/delete", {
            id: editingDoc.id,
          });
        } catch {}
        toast.success("Document updated successfully");
      } else {
        await AxiosProvider.post("/leads/document/notes", {
          id: editingDoc.id,
          notes: editNotes,
        });
        toast.success("Document notes updated successfully");
      }
      setEditingDoc(null);
      setEditFile(null);
      setHitApi((prev) => !prev);
      fetchDocs();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.msg ||
          "Failed to update document",
      );
    }
  };

  const closeCreateDrawer = () => {
    setIsLocalCreateOpen(false);
    if (onCloseCreate) onCloseCreate();
  };

  return (
    <div className="w-full">
      {/* Top Upload Button */}
      <div className="flex justify-end items-center mb-4">
        <button
          type="button"
          onClick={() => setIsLocalCreateOpen(true)}
          className="flex items-center justify-center gap-2 w-[160px] h-[38px] rounded-[4px] border border-[#E7E7E7] bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-semibold tracking-wide cursor-pointer transition shadow-sm"
        >
          <FiPlusCircle className="w-4 h-4 text-white" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* 1. DOCUMENTS TABLE */}
      {!docs || docs.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-base font-medium">
          No data found
        </p>
      ) : (
        <div className="w-full overflow-x-auto border border-gray-600 rounded-lg">
          <table className="w-full text-left text-xs text-white">
            <thead className="text-[11px] uppercase talbleheaderBg text-white border-b border-gray-600">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">File Name</th>
                <th className="py-2.5 px-3">Notes</th>
                <th className="py-2.5 px-3 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {docs.map((d, idx) => (
                <tr
                  key={d.id || idx}
                  className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-700/80 transition-colors"
                >
                  <td className="py-2 px-3 text-center text-gray-300 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 font-semibold text-white truncate max-w-[260px] text-xs">
                    {d.file_name}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-200 max-w-xs truncate">
                    {d.notes || "—"}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="inline-flex items-center rounded-lg border border-gray-700 bg-black p-1 gap-1 shadow-sm">
                      <button
                        onClick={() => handleDownload(d)}
                        className="px-2 py-1 hover:bg-primary-700 rounded-md text-[11px] text-white cursor-pointer transition flex items-center gap-1 font-medium"
                        title="Download File"
                      >
                        <FaDownload className="w-3 h-3" />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          setEditingDoc(d);
                          setEditNotes(d.notes || "");
                        }}
                        className="p-1 hover:bg-primary-700 rounded-md text-white transition cursor-pointer flex items-center justify-center"
                        title="Edit Notes"
                      >
                        <MdEdit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        className="p-1 hover:bg-red-700 rounded-md text-white transition cursor-pointer flex items-center justify-center"
                        title="Delete Document"
                      >
                        <RiDeleteBin6Line className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. UPLOAD DOCUMENT RIGHT-SIDE FLYOUT */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          isCreateVisible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCreateDrawer}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[500px] md:w-[600px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isCreateVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full min-h-auto p-6 sm:p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <p className="text-primary-600 text-2xl font-bold leading-9">
              Upload Document
            </p>
            <IoCloseOutline
              onClick={closeCreateDrawer}
              className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
            />
          </div>
          <div className="w-full border-b border-gray-700 mb-6"></div>

          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div>
              <p className="text-white font-medium text-xs mb-1">
                Document Notes / Name
              </p>
              <input
                type="text"
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                placeholder="Enter document notes or title"
                className="w-full h-[38px] border border-gray-700 rounded-[4px] text-xs px-3 bg-black text-white outline-none focus:border-primary-600"
              />
            </div>

            <div>
              <p className="text-white font-medium text-xs mb-1.5">
                Select File <span className="text-red-400">*</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
                accept=".jpeg,.jpg,.png,.webp,.pdf,.xls,.xlsx,.csv"
                required
                className="w-full h-[38px] border border-gray-700 rounded-[4px] text-xs p-1.5 bg-black text-white file:mr-4 file:py-1 file:px-3 file:rounded-[4px] file:border-0 file:text-xs file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Allowed: JPEG, PNG, WEBP, PDF, XLS, XLSX, CSV
              </p>
            </div>

            <div className="mt-6 flex gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={closeCreateDrawer}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. EDIT DOCUMENT NOTES RIGHT-SIDE FLYOUT */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-40 transition-opacity duration-300 ease-in-out cursor-pointer ${
          editingDoc
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setEditingDoc(null)}
      />
      <div
        className={`fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[#141414] w-[400px] sm:w-[500px] md:w-[600px] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          editingDoc ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-full min-h-auto p-6 sm:p-8 text-white">
          <div className="flex justify-between items-center mb-6">
            <p className="text-primary-600 text-2xl font-bold leading-9">
              Edit Document
            </p>
            <IoCloseOutline
              onClick={() => setEditingDoc(null)}
              className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
            />
          </div>
          <div className="w-full border-b border-gray-700 mb-6"></div>

          {editingDoc && (
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <p className="text-white font-medium text-xs mb-1.5">
                  Current File
                </p>
                <input
                  type="text"
                  value={editingDoc.file_name}
                  readOnly
                  className="w-full h-[38px] border border-gray-700 rounded-[4px] text-xs px-3 bg-black/60 text-white cursor-not-allowed"
                />
              </div>

              <div>
                <p className="text-white font-medium text-xs mb-1.5">
                  Choose New File{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (optional - to replace existing file)
                  </span>
                </p>
                <input
                  type="file"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="w-full h-[38px] border border-gray-700 rounded-[4px] text-xs p-1.5 bg-black text-white file:mr-4 file:py-1 file:px-3 file:rounded-[4px] file:border-0 file:text-xs file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Allowed: JPEG, PNG, WEBP, PDF, XLS, XLSX, CSV
                </p>
              </div>

              <div>
                <p className="text-white font-medium text-xs mb-1.5">
                  Document Notes
                </p>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Enter notes..."
                  className="w-full border border-gray-700 rounded-[4px] text-xs p-3 bg-black text-white outline-none focus:border-primary-600 resize-none"
                />
              </div>

              <div className="mt-6 flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDoc(null);
                    setEditFile(null);
                  }}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-medium transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
