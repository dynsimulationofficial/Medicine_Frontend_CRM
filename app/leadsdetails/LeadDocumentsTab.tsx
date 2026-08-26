"use client";

import React, { useEffect, useState, useRef } from "react";
import AxiosProvider from "../../provider/AxiosProvider";
import { toast } from "react-toastify";
import { MdEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCloseOutline } from "react-icons/io5";
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
      const url = res.data?.data?.url;
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.file_name || "document";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        toast.error("Download URL not available");
      }
    } catch (e) {
      console.error("Download error:", e);
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
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      customClass: {
        popup: "border border-gray-700 rounded-2xl shadow-2xl",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await AxiosProvider.post("/leads/documents/soft-delete", {
            id: doc.id,
          });
          toast.success("Document successfully deleted");
          setHitApi((prev) => !prev);
          fetchDocs();
        } catch (error) {
          console.error("Error deleting document:", error);
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
      if (onCloseCreate) onCloseCreate();
    } catch (e) {
      console.error("Upload error:", e);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    try {
      await AxiosProvider.post("/leads/document/notes", {
        id: editingDoc.id,
        notes: editNotes,
      });
      toast.success("Document notes updated successfully");
      setEditingDoc(null);
      setHitApi((prev) => !prev);
      fetchDocs();
    } catch (e) {
      console.error("Update notes error:", e);
      toast.error("Failed to update document notes");
    }
  };

  return (
    <div className="w-full">
      {/* 1. DOCUMENTS TABLE */}
      {!docs || docs.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-base font-medium">
          No data found
        </p>
      ) : (
        <div className="w-full overflow-x-auto border border-gray-600 rounded-lg">
          <table className="w-full text-left text-sm text-white">
            <thead className="text-xs uppercase talbleheaderBg text-white border-b border-gray-600">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Uploaded On</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/60">
              {docs.map((d, idx) => (
                <tr
                  key={d.id || idx}
                  className="odd:bg-[#404040] even:bg-[#2d2d2d] hover:bg-primary-700/80 transition-colors"
                >
                  <td className="py-3 px-4 text-center text-gray-300 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white truncate max-w-xs">
                    {d.file_name}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-300">
                    {d.mime_type || "-"}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-200">
                    {fmtSize(d.file_size)}
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-200 whitespace-nowrap">
                    {d.created_at ? new Date(d.created_at).toLocaleString() : "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-200">
                    {d.notes || "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleDownload(d)}
                        className="py-1 px-2.5 bg-primary-600 hover:bg-primary-700 rounded text-xs text-white cursor-pointer transition-colors"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => {
                          setEditingDoc(d);
                          setEditNotes(d.notes || "");
                        }}
                        className="py-1 px-2 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm cursor-pointer transition-colors"
                        title="Edit Notes"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        className="py-1 px-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm cursor-pointer transition-colors"
                        title="Delete Document"
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. CREATE / UPLOAD DOCUMENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg max-w-xl w-full p-6 text-white shadow-2xl relative my-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-primary-500 text-2xl font-bold">
                Upload Document
              </p>
              <IoCloseOutline
                onClick={onCloseCreate}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <p className="text-white font-medium text-sm mb-1">
                  Document Notes / Name
                </p>
                <input
                  type="text"
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="Enter document notes or title"
                  className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white outline-none"
                />
              </div>

              <div>
                <p className="text-white font-medium text-sm mb-1">
                  Select File <span className="text-red-400">*</span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setCreateFile(e.target.files?.[0] || null)}
                  accept=".jpeg,.jpg,.png,.webp,.pdf,.xls,.xlsx,.csv"
                  required
                  className="w-full border border-gray-700 rounded text-sm p-2.5 bg-black text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Allowed: JPEG, PNG, WEBP, PDF, XLS, XLSX, CSV
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCloseCreate}
                  className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-medium transition cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT DOCUMENT NOTES MODAL */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg max-w-xl w-full p-6 text-white shadow-2xl relative my-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-primary-500 text-2xl font-bold">
                Edit Document Notes
              </p>
              <IoCloseOutline
                onClick={() => setEditingDoc(null)}
                className="h-8 w-8 border border-gray-700 text-white rounded cursor-pointer hover:bg-gray-800 transition"
              />
            </div>
            <div className="w-full border-b border-gray-700 mb-6"></div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <p className="text-white font-medium text-sm mb-1">File Name</p>
                <input
                  type="text"
                  value={editingDoc.file_name}
                  readOnly
                  className="w-full border border-gray-700 rounded text-sm p-3 bg-black/60 text-gray-300 cursor-not-allowed"
                />
              </div>

              <div>
                <p className="text-white font-medium text-sm mb-1">Notes</p>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  placeholder="Update notes..."
                  className="w-full border border-gray-700 rounded text-sm p-3 bg-black text-white outline-none resize-y"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 rounded text-white text-sm font-medium transition cursor-pointer"
                >
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
