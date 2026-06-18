// page.tsx
"use client";

import { useRef, useState } from "react";

import AutodeskViewer, {
  type AutodeskViewerHandle,
} from "@/components/AutodeskViewer";
import AnnotationToolbar from "@/components/AnnotationToolbar";
import ModelSelector from "@/components/ModelSelector";
import PdfWatermarkedViewer from "@/components/PdfWatermarkedViewer";
import { uploadModel } from "@/api/modelApi";

export default function Home() {
  const fileRef = useRef<HTMLInputElement>(null);
  const viewerHandle = useRef<AutodeskViewerHandle | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urn, setUrn] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Detect PDF file
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setPdfFile(file);
      return;
    }

    try {
      setUploading(true);
      const model = await uploadModel(file);

      alert("Upload successful");

      setUrn(model.urn);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (pdfFile) {
    return (
      <main className="flex min-h-screen flex-col">
        <PdfWatermarkedViewer initialFile={pdfFile} onClose={() => setPdfFile(null)} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex gap-3 p-4 border-b items-center">
        <ModelSelector onSelect={setUrn} />
        <input
          type="file"
          ref={fileRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="relative ml-auto">
          <button
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>

          <div className="fixed right-4 top-20 z-50">
            <AnnotationToolbar
              onArrow={() => viewerHandle.current?.invoke("line")}
              onText={() => viewerHandle.current?.invoke("text")}
              onSave={() => viewerHandle.current?.invoke("save")}
              onClear={() => viewerHandle.current?.invoke("clear")}
              onReload={() => viewerHandle.current?.invoke("reload")}
              onPlaceImage={(dataUrl: string) =>
                viewerHandle.current?.invoke("placeImage", dataUrl)
              }
            />
          </div>
        </div>
      </div>

      {urn && (
        <div className="flex-1">
          <div className="h-full min-h-0">
            <AutodeskViewer ref={viewerHandle} urn={urn} />
          </div>
        </div>
      )}
    </main>
  );
}
