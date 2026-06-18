"use client";

import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import { pdfjs } from "react-pdf";

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
  return (
    <div className="w-full h-full min-h-0 flex-1 overflow-auto bg-white dark:bg-zinc-900 rounded-lg">
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
    </div>
  );
}
