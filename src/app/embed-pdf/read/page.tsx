"use client";

import React from "react";
import EmbedPdfViewer from "@/components/EmbedPdfViewer";

export default function EmbedPdfReadPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <EmbedPdfViewer readOnly={true} />
    </div>
  );
}
