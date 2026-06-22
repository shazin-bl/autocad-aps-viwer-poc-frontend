"use client";

import React, { useState, useEffect } from "react";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import { pdfjs } from "react-pdf";
import { StyleSheetManager } from "styled-components";

// Import react-pdf core stylesheets to remove TextLayer and AnnotationLayer warning logs
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Point to the local worker file served from the Next.js public directory
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

interface DocViewerWrapperProps {
  docs: Array<{ uri: string; fileType?: string; fileName?: string }>;
}

export default function DocViewerWrapper({ docs }: DocViewerWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-0 flex-1 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const shouldForwardProp = (prop: string) => {
    return !["documents", "pluginRenderers", "config", "theme"].includes(prop);
  };

  return (
    <div className="w-full h-full min-h-0 flex-1 overflow-auto bg-white dark:bg-zinc-900 rounded-lg flex flex-col">
      <style>{`
        #react-doc-viewer {
          background-color: transparent !important;
          height: 100% !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }
        #react-doc-viewer iframe {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
        #pdf-renderer {
          height: 100% !important;
          width: 100% !important;
        }
      `}</style>
      <StyleSheetManager shouldForwardProp={shouldForwardProp}>
        <DocViewer
          documents={docs}
          pluginRenderers={DocViewerRenderers}
          config={{
            header: {
              disableHeader: true,
              disableFileName: true,
              retainURLParams: false,
            },
          }}
          theme={{
            primary: "#3B82F6", // blue-500 matching our design
            secondary: "#1F2937",
            tertiary: "#F3F4F6",
            text_primary: "#111827",
            text_secondary: "#6B7280",
            text_tertiary: "#9CA3AF",
            // disable_theme_scrollbar: true,
          }}
        />
      </StyleSheetManager>
    </div>
  );
}
