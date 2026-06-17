// components/AnnotationToolbar.tsx
import React from "react";
type Props = {
  onArrow: () => void;
  onText: () => void;
  onSave: () => void;
  onClear: () => void;
  onReload: () => void;
  onPlaceImage: (dataUrl: string) => void;
};

export default function AnnotationToolbar({
  onArrow,
  onText,
  onSave,
  onClear,
  onReload,
  onPlaceImage,
}: Props) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onPlaceImage(result);
    };
    reader.readAsDataURL(file);
    // reset
    e.currentTarget.value = "";
  }
  return (
    <div className="w-80 rounded-lg bg-white p-4 shadow-lg">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">2D Markups</h3>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            console.log("Line button pressed");
            onArrow();
          }}
          className="rounded-md bg-white/90 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Draw Line
        </button>

        <button
          //   onClick={onText}
          onClick={() => {
            console.log("Text button pressed");
            onText();
          }}
          className="rounded-md bg-white/90 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Add Text
        </button>

        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-md bg-amber-500 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            Place Image (2D)
          </button>
        </>

        <button
          onClick={onSave}
          className="rounded-md bg-emerald-500 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
        >
          Save 2D Markup
        </button>

        <button
          onClick={onClear}
          className="mt-3 rounded-md border border-slate-200 py-2 text-sm font-medium text-slate-700 bg-white shadow-sm hover:bg-slate-50"
        >
          Clear Canvas
        </button>

        <button
          onClick={onReload}
          className="mt-2 w-full rounded-md bg-purple-500 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
        >
          Reload & Render All Stored Comments
        </button>
      </div>
    </div>
  );
}
