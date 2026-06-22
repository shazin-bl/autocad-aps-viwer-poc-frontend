import React, { useState, useRef } from "react";
import WatermarkControl from "./WatermarkControl";
import PdfViewer from "./PdfViewer";
import { WatermarkSettings } from "@/types/watermark";

const DEFAULT_SETTINGS: WatermarkSettings = {
  text: "CONFIDENTIAL",
  fontSize: 36,
  color: "#FF0000",
  opacity: 0.35,
  rotation: -45,
  bold: true,
  italic: false,
  layout: "grid",
};

interface PdfWatermarkedViewerProps {
  initialFile?: File | null;
  onClose?: () => void;
}

export default function PdfWatermarkedViewer({
  initialFile = null,
  onClose,
}: PdfWatermarkedViewerProps) {
  const [file, setFile] = useState<File | null>(initialFile);
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initialFile if it changes in parent
  React.useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
    }
  }, [initialFile]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const isSupportedFile = (file: File) => {
    const supportedExtensions = [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "png",
      "jpg",
      "jpeg",
      "gif",
      "bmp",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return (
      supportedExtensions.includes(ext) ||
      file.type.startsWith("image/") ||
      file.type === "application/pdf" ||
      file.type === "text/plain"
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isSupportedFile(droppedFile)) {
        setFile(droppedFile);
      } else {
        alert(
          "Unsupported file type. Please upload a PDF, Word, Excel, PowerPoint, Text, or Image file.",
        );
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isSupportedFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        alert(
          "Unsupported file type. Please upload a PDF, Word, Excel, PowerPoint, Text, or Image file.",
        );
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              PDF Watermark Studio
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Visualize custom dynamic watermarks on your PDF documents.
            </p>
          </div>
        </div>

        {file && (
          <div className="flex items-center gap-3">
            <button
              onClick={clearFile}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              Close Document
            </button>
            <a
              href="/annotation"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              Go to Annotation Studio
            </a>
            <a
              href="/"
              className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Go to CAD Viewer
            </a>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {!file ? (
          /* File Upload / Drag-and-drop State */
          <div className="flex-1 flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-2xl p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-6 cursor-pointer bg-white dark:bg-zinc-900 transition-all duration-300 shadow-md ${
                dragActive
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-102"
                  : "border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-lg hover:scale-101"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.csv,.png,.jpg,.jpeg,.gif,.bmp,image/*,text/plain,application/pdf"
                className="hidden"
              />

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full animate-pulse">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Drag and drop your PDF here
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
                  or click to browse from your device
                </p>
                <span className="inline-block mt-3 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-semibold">
                  PDF, Word, Excel, PowerPoint, Text, or Image files are
                  supported
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Split View Dashboard Workspace */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Left Control Sidebar */}
            {/* <aside className="w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 overflow-y-auto shrink-0">
              <WatermarkControl settings={settings} onChange={setSettings} />
              
              <div className="mt-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  The watermark is rendered visually in this viewer and does not alter the source PDF file.
                </span>
              </div>
            </aside> */}

            {/* Right Interactive Viewer Panel */}
            <main className="flex-1 flex flex-col p-4 md:p-6 min-h-0 bg-zinc-50 dark:bg-zinc-950">
              <PdfViewer file={file} watermarkSettings={settings} />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
