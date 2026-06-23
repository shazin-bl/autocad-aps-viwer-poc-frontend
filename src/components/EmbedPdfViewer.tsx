"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import the PDFViewer component to prevent SSR compilation errors in Next.js
const PDFViewer = dynamic(
  () => import("@embedpdf/react-pdf-viewer").then((mod) => mod.PDFViewer),
  { ssr: false },
);

const PRESETS = [
  {
    name: "Sample PDF File",
    url: "https://www.aeee.in/wp-content/uploads/2020/08/Sample-pdf.pdf",
    description: "Standard PDF containing multiple pages",
  },
  {
    name: "EmbedPDF Ebook",
    url: "https://snippet.embedpdf.com/ebook.pdf",
    description: "A sample ebook PDF from EmbedPDF host",
  },
];

interface EmbedPdfViewerProps {
  readOnly?: boolean;
}

export default function EmbedPdfViewer({
  readOnly = false,
}: EmbedPdfViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>(PRESETS[0].url);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const registryRef = useRef<any>(null);

  // Revoke Blob URLs when clean up is needed
  useEffect(() => {
    return () => {
      if (fileUrl && fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === "application/pdf" ||
        droppedFile.name.endsWith(".pdf")
      ) {
        if (fileUrl && fileUrl.startsWith("blob:")) {
          URL.revokeObjectURL(fileUrl);
        }
        const url = URL.createObjectURL(droppedFile);
        setFileUrl(url);
        setFileName(droppedFile.name);
      } else {
        alert("Please upload a valid PDF file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (
        selectedFile.type === "application/pdf" ||
        selectedFile.name.endsWith(".pdf")
      ) {
        if (fileUrl && fileUrl.startsWith("blob:")) {
          URL.revokeObjectURL(fileUrl);
        }
        const url = URL.createObjectURL(selectedFile);
        setFileUrl(url);
        setFileName(selectedFile.name);
      } else {
        alert("Please upload a valid PDF file.");
      }
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      if (fileUrl && fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
      setFileUrl(inputUrl.trim());
      setFileName(getFileNameFromUrl(inputUrl.trim()));
    }
  };

  const getFileNameFromUrl = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);
      const pathname = parsed.pathname;
      return pathname.substring(pathname.lastIndexOf("/") + 1) || "Remote PDF";
    } catch {
      return "Remote PDF";
    }
  };

  const clearDocument = () => {
    if (fileUrl && fileUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileUrl);
    }
    setFileUrl("");
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!registryRef.current) {
      console.warn("EmbedPDF registry is not initialized yet.");
      return;
    }

    const store = registryRef.current.getStore();
    const state = store?.getState();
    const activeDocumentId = state?.core?.activeDocumentId || "";

    const annotationPlugin = registryRef.current.getPlugin("annotation");
    const annotationCap = annotationPlugin?.provides();

    if (!annotationCap) {
      console.warn("Annotation capability is not available.");
      return;
    }

    const trackedAnnotations = annotationCap.getAnnotations() || [];

    const SUBTYPE_MAP: Record<number, string> = {
      0: "UNKNOWN",
      1: "TEXT",
      2: "LINK",
      3: "FREETEXT",
      4: "LINE",
      5: "SQUARE",
      6: "CIRCLE",
      7: "POLYGON",
      8: "POLYLINE",
      9: "HIGHLIGHT",
      10: "UNDERLINE",
      11: "SQUIGGLY",
      12: "STRIKEOUT",
      13: "STAMP",
      14: "CARET",
      15: "INK",
      16: "POPUP",
      17: "FILEATTACHMENT",
      18: "SOUND",
      19: "MOVIE",
      20: "WIDGET",
      21: "SCREEN",
      22: "PRINTERMARK",
      23: "TRAPNET",
      24: "WATERMARK",
      25: "THREED",
      26: "RICHMEDIA",
      27: "XFAWIDGET",
      28: "REDACT",
    };

    const normalizeDate = (value: any) => {
      if (!value) return null;
      if (value instanceof Date) return value.toISOString();

      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };

    const getPageNumber = (anno: any) => {
      if (typeof anno.pageNumber === "number") return anno.pageNumber;
      if (typeof anno.pageIndex === "number") return anno.pageIndex + 1;
      return null;
    };

    const getAnnotationType = (anno: any) => {
      if (typeof anno.type === "number") {
        return SUBTYPE_MAP[anno.type] || `TYPE_${anno.type}`;
      }
      if (typeof anno.type === "string" && anno.type.trim()) {
        return anno.type.toUpperCase();
      }
      return "UNKNOWN";
    };

    const extractGeometry = (anno: any) => {
      const pageNumber = getPageNumber(anno);

      // EmbedPDF shape seen in your console:
      // rect: { origin: { x, y }, size: { width, height } }
      if (anno?.rect?.origin && anno?.rect?.size) {
        return {
          x:
            typeof anno.rect.origin.x === "number"
              ? anno.rect.origin.x
              : null,
          y:
            typeof anno.rect.origin.y === "number"
              ? anno.rect.origin.y
              : null,
          width:
            typeof anno.rect.size.width === "number"
              ? anno.rect.size.width
              : null,
          height:
            typeof anno.rect.size.height === "number"
              ? anno.rect.size.height
              : null,
          rotation:
            typeof anno.rotation === "number" ? anno.rotation : null,
          pageNumber,
        };
      }

      // Fallback for other possible shapes
      if (anno?.rect) {
        const rect = anno.rect;
        const left =
          typeof rect.left === "number"
            ? rect.left
            : typeof rect.x === "number"
              ? rect.x
              : null;
        const top =
          typeof rect.top === "number"
            ? rect.top
            : typeof rect.y === "number"
              ? rect.y
              : null;

        let width: number | null = null;
        let height: number | null = null;

        if (
          typeof rect.width === "number" &&
          typeof rect.height === "number"
        ) {
          width = rect.width;
          height = rect.height;
        } else if (
          typeof rect.right === "number" &&
          typeof rect.left === "number"
        ) {
          width = rect.right - rect.left;
        } else if (
          typeof rect.bottom === "number" &&
          typeof rect.top === "number"
        ) {
          height = rect.bottom - rect.top;
        }

        return {
          x: left,
          y: top,
          width,
          height,
          rotation:
            typeof anno.rotation === "number" ? anno.rotation : null,
          pageNumber,
        };
      }

      return {
        x: null,
        y: null,
        width: null,
        height: null,
        rotation: typeof anno.rotation === "number" ? anno.rotation : null,
        pageNumber,
      };
    };

    const formatColor = (value: any) => {
      if (!value) return null;
      if (typeof value === "string") return value;

      // if a future version returns color object, preserve it as string if possible
      if (typeof value?.toString === "function") {
        const str = value.toString();
        return str && str !== "[object Object]" ? str : null;
      }

      return null;
    };

    // 1) map tracked annotations to actual annotation objects
    const rawAnnotations = trackedAnnotations
      .map((ta: any) => ta?.object)
      .filter(Boolean);

    // 2) filter out built-in PDF link annotations
    //    because those are not user review markups
    const annotationsToSave = rawAnnotations.filter((anno: any) => {
      const typeName = getAnnotationType(anno);

      if (typeName === "LINK") return false;
      if (anno?.type === 2) return false;

      return true;
    });

    const formattedAnnotations = annotationsToSave.map((anno: any) => {
      const annotationType = getAnnotationType(anno);
      const pageNumber = getPageNumber(anno);
      const geometry = extractGeometry(anno);

      return {
        annotationId: anno.id || "",
        annotationType,
        page: pageNumber,
        author: anno.author || null,
        subject: anno.subject || null,
        contents:
          typeof anno.contents === "string" && anno.contents.trim() !== ""
            ? anno.contents
            : null,
        createdAt: normalizeDate(anno.created),
        modifiedAt: normalizeDate(anno.modified),
        geometry,
        style: {
          strokeColor: formatColor(anno.strokeColor || anno.color),
          fillColor: formatColor(anno.fillColor || anno.backgroundColor),
          textColor: formatColor(anno.textColor || anno.fontColor),
          fontSize:
            typeof anno.fontSize === "number" ? anno.fontSize : null,
          opacity:
            typeof anno.opacity === "number" ? anno.opacity : null,
        },
        raw: anno,
      };
    });

    const payload = {
      // IMPORTANT:
      // Replace this with your real backend file id once available.
      fileId: fileName || activeDocumentId || "unknown-file",
      documentVersionId: activeDocumentId || undefined,
      savedAt: new Date().toISOString(),
      annotations: formattedAnnotations,
    };

    console.log("💾 SaveAnnotationsPayload:", payload);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {readOnly
                ? "EmbedPDF Viewer (Read-Only)"
                : "EmbedPDF Viewer Workspace"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {readOnly
                ? "View and read PDF files in strict read-only mode."
                : "View, edit, and annotate PDF documents with full interactive capabilities."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {fileUrl && (
            <>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={clearDocument}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                Close Document
              </button>
            </>
          )}
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Go to CAD Viewer
          </a>
        </div>
      </header>

      {/* Main workspace body */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {!fileUrl ? (
          /* Selection Screen */
          <div className="flex-1 overflow-auto p-8 flex flex-col items-center justify-center gap-8 bg-zinc-50 dark:bg-zinc-950">
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Box 1: Local PDF Upload */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-5 cursor-pointer bg-white dark:bg-zinc-900 transition-all duration-300 shadow-md ${
                  dragActive
                    ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 scale-102"
                    : "border-zinc-300 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-700 hover:shadow-lg hover:scale-101"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                  className="hidden"
                />
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full">
                  <svg
                    className="w-10 h-10"
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
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Upload PDF
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Drag and drop your PDF here, or click to browse
                  </p>
                </div>
              </div>

              {/* Box 2: URL & Presets */}
              <div className="p-8 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-md flex flex-col justify-between gap-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Load from PDF URL
                  </h3>
                  <form onSubmit={handleUrlSubmit} className="flex gap-2 mt-4">
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="Paste PDF public link..."
                      className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      Load
                    </button>
                  </form>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    PDF Presets:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          if (fileUrl && fileUrl.startsWith("blob:")) {
                            URL.revokeObjectURL(fileUrl);
                          }
                          setFileUrl(preset.url);
                          setFileName(preset.name);
                        }}
                        className="text-left p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 transition-all flex flex-col justify-between h-16 cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                          {preset.name}
                        </span>
                        <span className="text-[8px] text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-none">
                          {preset.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Document Viewer Panel */
          <main className="flex-1 flex flex-col p-4 md:p-6 min-h-0 bg-zinc-50 dark:bg-zinc-950">
            <div className="flex flex-col flex-1 h-full min-h-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              {/* Document Info Bar */}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[50%]">
                  {fileName}
                </div>
                <div className="flex items-center gap-2">
                  {readOnly ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                      Read-Only View Mode
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400">
                      <span className="w-1.5 h-1.5 mr-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                      Interactive Annotations Active
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                    PDF
                  </span>
                </div>
              </div>

              {/* EmbedPDF Render Container */}
              <div className="flex-1 p-4 flex justify-center items-stretch min-h-0 relative">
                <div className="relative shadow-lg border border-zinc-200 dark:border-zinc-800 bg-white rounded flex-1 flex flex-col overflow-hidden">
                  <PDFViewer
                    config={{
                      src: fileUrl,
                      disabledCategories: readOnly
                        ? [
                            "annotation",
                            "print",
                            "export",
                            "download",
                            "redaction",
                            "form",
                            "insert",
                            "document",
                          ]
                        : [],
                    }}
                    onReady={(registry: any) => {
                      registryRef.current = registry;
                    }}
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
