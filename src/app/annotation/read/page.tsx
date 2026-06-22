"use client";

import React from "react";
import AnnotationViewer from "@/components/AnnotationViewer";

export default function AnnotationReadPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AnnotationViewer readOnly={true} />
    </div>
  );
}
