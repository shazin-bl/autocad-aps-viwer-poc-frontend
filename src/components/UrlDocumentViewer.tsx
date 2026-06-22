import React, { useState, useEffect } from "react";
import WatermarkControl from "./WatermarkControl";
import DocViewerWrapper from "./DocViewerWrapper";
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

const PRESETS = [
  {
    name: "Sample DOCX (Word)",
    url: "https://raw.githubusercontent.com/plutext/AndroidDocxToHtml/master/res/raw/sample.docx",
    description: "Sample Word document with simple text formatting",
  },
  {
    name: "Sample PPTX (PowerPoint)",
    url: "https://raw.githubusercontent.com/jessehouwing/ppt-diffmerge/main/sample.pptx",
    description: "Sample PowerPoint presentation with multiple slides",
  },
  {
    name: "Sample XLSX (Excel)",
    url: "https://raw.githubusercontent.com/rjsmith/robot-ooxml/master/atest/testdata/parsing/data_formats/xlsx/Sample.xlsx",
    description: "Sample spreadsheet containing data sheets",
  },
  {
    name: "Sample PDF File",
    url: "https://www.aeee.in/wp-content/uploads/2020/08/Sample-pdf.pdf",
    description: "A standard PDF document with pages",
  },
];

export default function UrlDocumentViewer() {
  const [url, setUrl] = useState<string>(PRESETS[0].url);
  const [inputUrl, setInputUrl] = useState<string>(PRESETS[0].url);
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS);

  // Sync loaded URL with the text box
  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  const getWatermarkStyle = () => {
    const scaledFontSize = settings.fontSize;

    if (settings.layout === "single") {
      return {
        fontSize: `${scaledFontSize}px`,
        color: settings.color,
        opacity: settings.opacity,
        transform: `rotate(${settings.rotation}deg)`,
        fontWeight: settings.bold ? "bold" : "normal",
        fontStyle: settings.italic ? "italic" : "normal",
        fontFamily: "Inter, system-ui, sans-serif",
      };
    } else {
      const svgWidth = Math.max(160, scaledFontSize * 6);
      const svgHeight = Math.max(120, scaledFontSize * 4.5);

      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
          <text 
            x="50%" 
            y="50%" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            font-family="Inter, system-ui, sans-serif" 
            font-size="${scaledFontSize}px" 
            font-weight="${settings.bold ? "bold" : "normal"}" 
            font-style="${settings.italic ? "italic" : "normal"}" 
            fill="${settings.color}" 
            opacity="${settings.opacity}" 
            transform="rotate(${settings.rotation}, ${svgWidth / 2}, ${svgHeight / 2})"
          >
            ${settings.text || "WATERMARK"}
          </text>
        </svg>
      `.trim();

      const base64Svg = btoa(unescape(encodeURIComponent(svgString)));
      return {
        backgroundImage: `url("data:image/svg+xml;base64,${base64Svg}")`,
        backgroundRepeat: "repeat",
      };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setUrl(inputUrl.trim());
    }
  };

  const getFileName = (fileUrl: string) => {
    try {
      const parsed = new URL(fileUrl);
      const pathname = parsed.pathname;
      return pathname.substring(pathname.lastIndexOf("/") + 1) || "document";
    } catch {
      return "document";
    }
  };

  const getFileType = (fileUrl: string) => {
    const name = getFileName(fileUrl);
    return name.split(".").pop()?.toLowerCase() || "";
  };

  const ext = getFileType(url);
  const docs = url
    ? [{ uri: url, fileType: ext, fileName: getFileName(url) }]
    : [];

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-zinc-50 text-zinc-900">
      {/* URL Entry / Preset Panel */}
      <div className="bg-white border-b border-zinc-200 p-6 shadow-sm flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl w-full">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste a public document URL (e.g. https://example.com/file.docx)"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {inputUrl && (
              <button
                type="button"
                onClick={() => setInputUrl("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
          >
            Load URL
          </button>
        </form>

        {/* Preset Cards */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Test Preset Documents:
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESETS.map((preset) => {
              const isActive = url === preset.url;
              return (
                <button
                  key={preset.name}
                  onClick={() => setUrl(preset.url)}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between h-20 shadow-sm cursor-pointer ${
                    isActive
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-500"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <span className="text-xs font-bold text-zinc-800 line-clamp-1">
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 line-clamp-2 leading-tight">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Sidebar (Watermark Settings) */}
        <aside className="w-full md:w-80 border-r border-zinc-200 bg-zinc-50 p-4 md:p-6 overflow-y-auto shrink-0 flex flex-col gap-4">
          <WatermarkControl settings={settings} onChange={setSettings} />

          <div className="p-4 border border-zinc-200 rounded-xl bg-white text-xs text-zinc-500 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              CORS must be enabled on the remote host to render documents or
              PDFs directly in this viewer.
            </span>
          </div>
        </aside>

        {/* Right Main Viewer */}
        <main className="flex-1 flex flex-col p-4 md:p-6 min-h-0 bg-zinc-50">
          {url ? (
            <div className="flex flex-col flex-1 h-full min-h-0 bg-zinc-100 rounded-2xl border border-zinc-200 overflow-hidden">
              {/* Viewer Title Toolbar */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-zinc-200 shadow-sm shrink-0">
                <div className="text-sm font-semibold text-zinc-900 truncate max-w-[400px]">
                  {getFileName(url)}
                </div>
                <div className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase">
                  {ext || "unknown"} format
                </div>
              </div>

              {/* Viewer Wrapper with Overlay */}
              <div className="flex-1 overflow-auto p-4 flex justify-center items-stretch min-h-0 relative select-none">
                <div className="relative shadow-2xl border border-zinc-200 bg-white rounded flex-1 flex flex-col overflow-hidden">
                  {/* The Document Renderer Wrapper */}
                  <DocViewerWrapper docs={docs} />

                  {/* Visual CSS Watermark Overlay */}
                  {settings.text && (
                    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-30">
                      {settings.layout === "single" ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            style={getWatermarkStyle() as React.CSSProperties}
                          >
                            {settings.text}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={getWatermarkStyle() as React.CSSProperties}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-300 rounded-2xl bg-white p-8">
              <svg
                className="w-12 h-12 text-zinc-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-sm font-bold text-zinc-700">
                No Document Loaded
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Please paste a public URL or select one of the test presets
                above.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
