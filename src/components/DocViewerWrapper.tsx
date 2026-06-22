"use client";

import React, { useEffect, useRef, useState } from "react";

interface DocViewerWrapperProps {
  docs: Array<{ uri: string; fileType?: string; fileName?: string }>;
  readOnly?: boolean;
}

export default function DocViewerWrapper({ docs, readOnly = true }: DocViewerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const container = containerRef.current;
    if (!container || docs.length === 0 || !docs[0].uri) return;

    let cleanup = () => {};

    (async () => {
      setLoading(true);
      try {
        const NutrientViewer = (await import("@nutrient-sdk/viewer")).default;
        // Call early — for example, on app init or after login.
        NutrientViewer.preloadWorker({ useCDN: true } as any);
        // Ensure any previous instance is unloaded
        NutrientViewer.unload(container);

        // Filter out print and download if in readOnly mode
        const defaultItems = [...NutrientViewer.defaultToolbarItems];
        const customToolbarItems = readOnly
          ? defaultItems.filter(
              (item: any) => item.type !== "print" && item.type !== "export-pdf"
            )
          : defaultItems;

        // Load the document using standalone WASM viewer from CDN
        const instance = await NutrientViewer.load({
          container,
          useCDN: true,
          document: docs[0].uri,
          initialViewState: new NutrientViewer.ViewState({
            readOnly: readOnly,
          }),
          toolbarItems: customToolbarItems,
        });

        console.log("Nutrient SDK Viewer loaded successfully with readOnly =", readOnly);
        setLoading(false);

        cleanup = () => {
          NutrientViewer.unload(container);
        };
      } catch (error) {
        console.error("Failed to load Nutrient SDK Viewer:", error);
        setLoading(false);
      }
    })();

    return () => {
      cleanup();
    };
  }, [docs, readOnly]);

  return (
    <div className="w-full h-full min-h-0 flex-1 relative flex flex-col bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
      {/* <h1>hello</h1> */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-900/80 gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Loading Document Viewer...</p>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full min-h-[500px]" 
        style={{ flex: 1 }}
      />
    </div>
  );
}
