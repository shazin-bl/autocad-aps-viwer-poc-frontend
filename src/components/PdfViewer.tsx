import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { WatermarkSettings } from "@/types/watermark";

// Dynamically import the wrapper to prevent SSR compilation errors in Next.js
const DocViewerWrapper = dynamic(() => import("./DocViewerWrapper"), { ssr: false });

interface PdfViewerProps {
  file: File;
  watermarkSettings: WatermarkSettings;
}

export default function PdfViewer({ file, watermarkSettings }: PdfViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>("");

  // Create temporary Blob URL for the uploaded file and clean it up on change/unmount
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-[400px] gap-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          Loading Document...
        </p>
      </div>
    );
  }

  // Calculate watermark overlay dimensions and style
  const getWatermarkStyle = () => {
    const scaledFontSize = watermarkSettings.fontSize;

    if (watermarkSettings.layout === "single") {
      return {
        fontSize: `${scaledFontSize}px`,
        color: watermarkSettings.color,
        opacity: watermarkSettings.opacity,
        transform: `rotate(${watermarkSettings.rotation}deg)`,
        fontWeight: watermarkSettings.bold ? "bold" : "normal",
        fontStyle: watermarkSettings.italic ? "italic" : "normal",
        fontFamily: "Inter, system-ui, sans-serif",
      };
    } else {
      // Repeated grid/tile SVG background
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
            font-weight="${watermarkSettings.bold ? 'bold' : 'normal'}" 
            font-style="${watermarkSettings.italic ? 'italic' : 'normal'}" 
            fill="${watermarkSettings.color}" 
            opacity="${watermarkSettings.opacity}" 
            transform="rotate(${watermarkSettings.rotation}, ${svgWidth/2}, ${svgHeight/2})"
          >
            ${watermarkSettings.text || "WATERMARK"}
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

  const docs = [{ uri: fileUrl, fileType: "pdf", fileName: file.name }];

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-900 overflow-hidden">
      {/* Viewer Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[400px]">
          {file.name}
        </div>
        <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Viewer via react-doc-viewer
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-stretch min-h-0 relative select-none">
        {/* Document & Watermark Container */}
        <div className="relative shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white rounded flex-1 flex flex-col overflow-hidden">
          {/* DocViewer Renderer Wrapper */}
          <DocViewerWrapper docs={docs} />

          {/* CSS Watermark Overlay */}
          {watermarkSettings.text && (
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-30">
              {watermarkSettings.layout === "single" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div style={getWatermarkStyle() as React.CSSProperties}>
                    {watermarkSettings.text}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0" style={getWatermarkStyle() as React.CSSProperties} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
