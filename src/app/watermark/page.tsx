"use client";

import React from "react";
import PdfWatermarkedViewer from "@/components/PdfWatermarkedViewer";

export default function WatermarkPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <PdfWatermarkedViewer />
    </div>
  );
}