"use client";

import { useRef, useState } from "react";

import AutodeskViewer from "@/components/AutodeskViewer";
import ModelSelector from "@/components/ModelSelector";
import { uploadModel } from "@/api/modelApi";

export default function Home() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urn, setUrn] = useState("");


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

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


  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex gap-3 p-4 border-b">
        <ModelSelector onSelect={setUrn} />

        <input
          type="file"
          ref={fileRef}
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {urn && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full min-h-0">
            <AutodeskViewer urn={urn} />
          </div>
        </div>
      )}
    </main>
  );
}
