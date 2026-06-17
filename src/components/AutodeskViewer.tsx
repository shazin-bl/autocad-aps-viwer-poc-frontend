// components/AutodeskViewer.tsx
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { initViewer, loadModel } from "@/hooks/useAutodeskViewer";
import { getAnnotations, saveAnnotation } from "@/api/annotationApi";

export type AutodeskViewerHandle = {
  invoke: (
    action:
      | "line"
      | "text"
      | "save"
      | "clear"
      | "reload"
      | "placeImage",
    payload?: any
  ) => void;
};

const AutodeskViewer = forwardRef<AutodeskViewerHandle, { urn: string }>(
  function AutodeskViewer({ urn }, ref) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const viewerInstanceRef = useRef<any>(null);

    function getMarkupExtension() {
      const viewer = viewerInstanceRef.current;
      if (!viewer) return null;
      return viewer.getExtension("Autodesk.Viewing.MarkupsCore");
    }

    function drawLine() {
      console.log("Draw Line clicked");
      const ext = getMarkupExtension();
      if (!ext) {
        console.log("Markup extension not available");
        return;
      }

      ext.show();
      ext.enterEditMode();

      const LineMode =
        window.Autodesk.Viewing.Extensions.Markups.Core.EditModeLine;
      const mode = LineMode
        ? new LineMode(ext)
        : new window.Autodesk.Viewing.Extensions.Markups.Core.EditModeArrow(
            ext
          );

      if (mode.style) {
        mode.style.lineWidth = 2;
        mode.style.lineColor = "#000000";
      }

      ext.changeEditMode(mode);
      console.log("Line mode activated");
    }

    function addText() {
      console.log("Add Text clicked");
      const ext = getMarkupExtension();
      if (!ext) {
        console.log("Markup extension not available");
        return;
      }

      ext.show();
      ext.enterEditMode();
      const textMode = new window.Autodesk.Viewing.Extensions.Markups.Core.EditModeText(
        ext
      );

      if (typeof textMode.setFontSize === "function") {
        textMode.setFontSize(10);
      }
      if (typeof textMode.setTextHeight === "function") {
        textMode.setTextHeight(10);
      }
      if (textMode.style) {
        textMode.style.fontSize = 10;
        textMode.style.textSize = 10;
      }

      ext.changeEditMode(textMode);
      console.log("Text mode activated");
    }

 async function saveMarkup() {
  const ext = getMarkupExtension();

  if (!ext) {
    console.log("Markup extension not available");
    return;
  }

  try {
    try {
      // If we're in edit mode, leave it so generateData can access the svg layer
      if (typeof ext.leaveEditMode === "function") {
        try {
          ext.leaveEditMode();
        } catch (_) {}
      }
    } catch (_) {}

    // small delay to let MarkupsCore update internal state
    await new Promise((res) => setTimeout(res, 80));

    const svgData = ext.generateData();

    console.log("Generated markup SVG:", svgData);

    await saveAnnotation({
      urn,
      svgData,
      timestamp: new Date().toISOString(),
    });

    alert("Markup saved successfully!");
  } catch (error) {
    console.error(
      "Failed to save markup:",
      error
    );

    alert("Failed to save markup");
  }
}

    function clearMarkup() {
      const ext = getMarkupExtension();
      if (!ext) {
        console.log("Markup extension not available");
        return;
      }

      ext.clear();
      ext.hide();
    }

async function reloadStoredComments() {
  console.log("Reloading stored comments for URN:", urn);

  try {
    const ext = getMarkupExtension();

    if (!ext) return;

    const annotations = await getAnnotations(urn);

    console.log("Fetched annotations:", annotations);

    try {
      ext.leaveEditMode();
    } catch (_) {}

    try {
      ext.unloadMarkupsAll();
    } catch (_) {}

    ext.clear();
    ext.show();

    annotations.forEach(
      (annotation: any, index: number) => {
        if (!annotation.svgData) return;

        console.log(
          `Loading annotation ${index}`
        );

        ext.loadMarkups(
          annotation.svgData,
          `saved_layer_${index}`
        );
      }
    );

    ext.show();

    console.log("Reload complete");
  } catch (error) {
    console.error(error);
  }
}

    function placeImage(dataUrl: string) {
      const ext = getMarkupExtension();
      if (!ext) {
        console.log("Markup extension not available");
        return;
      }

      try {
        ext.show();

        const layerName = `image_${Date.now()}`;

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfile="full" layer-order-id="markups-svg"><g pointer-events="painted"><image href="${dataUrl}" x="10" y="10" width="200" height="150"/></g></svg>`;

        ext.loadMarkups(svg, layerName);
        ext.show();

        console.log("Placed image into markups", layerName);
      } catch (error) {
        console.error("Failed to place image into markups:", error);
      }
    }

    useImperativeHandle(ref, () => ({
      invoke(action, payload) {
        if (action === "line") drawLine();
        else if (action === "text") addText();
        else if (action === "save") saveMarkup();
        else if (action === "clear") clearMarkup();
        else if (action === "reload") reloadStoredComments();
        else if (action === "placeImage") placeImage(payload);
      },
    }));

    useEffect(() => {
      if (!viewerRef.current) return;

      let currentViewer: any;

      async function start() {
        try {
          currentViewer = await initViewer(viewerRef.current!);
          console.log("Viewer initialized", currentViewer);

          const ext = await currentViewer.loadExtension(
            "Autodesk.Viewing.MarkupsCore"
          );
          console.log("Markup extension loaded", ext);

          await loadModel(currentViewer, urn);

          currentViewer.resize?.();
          viewerInstanceRef.current = currentViewer;
        } catch (error) {
          console.error("Autodesk viewer initialization failed:", error);
        }
      }

      start();

      return () => {
        currentViewer?.finish();
      };
    }, [urn]);

    return (
      <div className="h-full min-h-0 w-full">
        <div ref={viewerRef} className="h-full min-h-0 w-full" />
      </div>
    );
  }
);

export default AutodeskViewer;
