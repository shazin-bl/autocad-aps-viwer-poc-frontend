// components/AutodeskViewer.tsx
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { initViewer, loadModel } from "@/hooks/useAutodeskViewer";
import { getAnnotations, saveAnnotation } from "@/api/annotationApi";

export type AutodeskViewerHandle = {
  invoke: (
    action: "line" | "text" | "save" | "clear" | "reload" | "placeImage",
    payload?: any,
  ) => void;
};

type PlacementPhase = "idle" | "placing" | "editing";

type PlacementState = {
  phase: PlacementPhase;
  x: number;
  y: number;
  w: number;
  h: number;
  dataUrl: string | null;
};

const MIN_SIZE = 30;

const AutodeskViewer = forwardRef<AutodeskViewerHandle, { urn: string }>(
  function AutodeskViewer({ urn }, ref) {
    const viewerRef = useRef<HTMLDivElement>(null);
    const viewerInstanceRef = useRef<any>(null);
    const [placement, setPlacement] = useState<PlacementState>({
      phase: "idle",
      x: 0,
      y: 0,
      w: 200,
      h: 150,
      dataUrl: null,
    });

    const dragStateRef = useRef<{
      type: "move" | "resize" | null;
      dir?: string;
      startX: number;
      startY: number;
      startRect: { x: number; y: number; w: number; h: number };
    }>({
      type: null,
      startX: 0,
      startY: 0,
      startRect: { x: 0, y: 0, w: 200, h: 150 },
    });

    function getMarkupExtension() {
      const viewer = viewerInstanceRef.current;
      if (!viewer) return null;
      return viewer.getExtension("Autodesk.Viewing.MarkupsCore");
    }

    function screenRectToSvgCoords(
      svgEl: SVGSVGElement,
      pixelRect: { x: number; y: number; w: number; h: number },
      viewerContainer: HTMLDivElement | null,
    ) {
      if (!viewerContainer) return null;
      const cRect = viewerContainer.getBoundingClientRect();
      const cl = cRect.left + pixelRect.x;
      const ct = cRect.top + pixelRect.y;
      const cr = cl + pixelRect.w;
      const cb = ct + pixelRect.h;

      const refEl = svgEl.querySelector("g") || svgEl;
      const ctm = refEl.getScreenCTM();
      if (!ctm) {
        console.error("[AutodeskViewer] getScreenCTM() returned null");
        return null;
      }
      const inv = ctm.inverse();

      const toSvg = (cx: number, cy: number) => {
        const pt = svgEl.createSVGPoint();
        pt.x = cx;
        pt.y = cy;
        return pt.matrixTransform(inv);
      };

      const tl = toSvg(cl, ct);
      const br = toSvg(cr, cb);

      return {
        x: Math.min(tl.x, br.x),
        y: Math.min(tl.y, br.y),
        w: Math.abs(br.x - tl.x),
        h: Math.abs(br.y - tl.y),
      };
    }

    function commitImageToSvg(
      svgEl: SVGSVGElement,
      svgRect: { x: number; y: number; w: number; h: number },
      dataUrl: string,
    ) {
      console.log("[AutodeskViewer] commitImageToSvg", {
        svgRect,
        dataUrlLength: dataUrl.length,
      });
      const imgEl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "image",
      );
      imgEl.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "xlink:href",
        dataUrl,
      );
      imgEl.setAttribute("href", dataUrl);
      imgEl.setAttribute("x", String(svgRect.x));
      imgEl.setAttribute("y", String(svgRect.y));
      imgEl.setAttribute("width", String(svgRect.w));
      imgEl.setAttribute("height", String(svgRect.h));
      imgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      imgEl.setAttribute("data-markup-image", "true");
      imgEl.style.pointerEvents = "none";

      svgEl.appendChild(imgEl);
      return imgEl;
    }

    function handleViewerClick(e: MouseEvent<HTMLDivElement>) {
      if (!placement.dataUrl) return;
      // const rect = viewerRef.current?.getBoundingClientRect();
      // if (!rect) return;
      const container = viewerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const x = e.clientX - rect.left - placement.w / 2;
      const y = e.clientY - rect.top - placement.h / 2;
      console.log("[AutodeskViewer] viewer click", {
        phase: placement.phase,
        clientX: e.clientX,
        clientY: e.clientY,
        viewerRect: rect,
        targetPos: { x, y },
      });

      setPlacement((prev) => ({
        ...prev,
        phase: "editing",
        x: Math.max(0, x),
        y: Math.max(0, y),
      }));
    }

    function startMove(e: MouseEvent<HTMLDivElement>) {
      if (placement.phase !== "editing") return;
      const target = e.target as HTMLElement;
      if (
        target.closest(".placement-handle") ||
        target.closest(".placement-toolbar")
      ) {
        return;
      }
      e.preventDefault();
      dragStateRef.current = {
        type: "move",
        startX: e.clientX,
        startY: e.clientY,
        startRect: {
          x: placement.x,
          y: placement.y,
          w: placement.w,
          h: placement.h,
        },
      };
    }

    function startResize(e: MouseEvent<HTMLDivElement>, dir: string) {
      if (placement.phase !== "editing") return;
      e.preventDefault();
      e.stopPropagation();
      dragStateRef.current = {
        type: "resize",
        dir,
        startX: e.clientX,
        startY: e.clientY,
        startRect: {
          x: placement.x,
          y: placement.y,
          w: placement.w,
          h: placement.h,
        },
      };
    }

    useEffect(() => {
      const onMouseMove = (e: globalThis.MouseEvent) => {
        const drag = dragStateRef.current;
        if (!drag.type) return;

        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        const { x, y, w, h } = drag.startRect;

        if (drag.type === "move") {
          setPlacement((prev) => ({
            ...prev,
            x: Math.max(0, x + dx),
            y: Math.max(0, y + dy),
          }));
          return;
        }

        if (drag.type === "resize") {
          let nx = x;
          let ny = y;
          let nw = w;
          let nh = h;

          if (drag.dir?.includes("e")) nw = Math.max(MIN_SIZE, w + dx);
          if (drag.dir?.includes("s")) nh = Math.max(MIN_SIZE, h + dy);
          if (drag.dir?.includes("w")) {
            const nextW = Math.max(MIN_SIZE, w - dx);
            nx = x + (w - nextW);
            nw = nextW;
          }
          if (drag.dir?.includes("n")) {
            const nextH = Math.max(MIN_SIZE, h - dy);
            ny = y + (h - nextH);
            nh = nextH;
          }

          setPlacement((prev) => ({ ...prev, x: nx, y: ny, w: nw, h: nh }));
        }
      };

      const onMouseUp = () => {
        dragStateRef.current.type = null;
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
    }, []);

    function placeImage(dataUrl: string) {
      const rect = viewerRef.current?.getBoundingClientRect();
      const defaultX = rect ? Math.max(0, (rect.width - 200) / 2) : 0;
      const defaultY = rect ? Math.max(0, (rect.height - 150) / 2) : 0;
      console.log("[AutodeskViewer] placeImage selected", {
        dataUrlLength: dataUrl.length,
        defaultX,
        defaultY,
      });

      setPlacement({
        phase: "editing",
        x: defaultX,
        y: defaultY,
        w: 200,
        h: 150,
        dataUrl,
      });
    }

    function cancelPlacement() {
      setPlacement({
        phase: "idle",
        x: 0,
        y: 0,
        w: 200,
        h: 150,
        dataUrl: null,
      });
    }

    function confirmPlacement() {
      if (placement.phase !== "editing" || !placement.dataUrl) return;

      const ext = getMarkupExtension();
      if (!ext) {
        console.warn("Markup extension not available at confirm");
        return;
      }

      ext.show();
      const svgEl = ext.svg as SVGSVGElement | null;
      const container = viewerRef.current;
      if (!svgEl || !container) {
        console.error("Unable to access markup SVG or viewer container", {
          svgEl,
          container,
        });
        return;
      }

      const svgRect = screenRectToSvgCoords(
        svgEl,
        {
          x: placement.x,
          y: placement.y,
          w: placement.w,
          h: placement.h,
        },
        container,
      );
      console.log("[AutodeskViewer] confirmPlacement svgRect", {
        svgRect,
        placement,
      });

      if (!svgRect) return;

      commitImageToSvg(svgEl, svgRect, placement.dataUrl);

      setPlacement((prev) => ({
        ...prev,
        phase: "idle",
        dataUrl: null,
      }));
    }

    function drawLine() {
      const ext = getMarkupExtension();
      if (!ext) return;

      ext.show();
      ext.enterEditMode();

      const LineMode =
        window.Autodesk.Viewing.Extensions.Markups.Core.EditModeLine;
      const mode = LineMode
        ? new LineMode(ext)
        : new window.Autodesk.Viewing.Extensions.Markups.Core.EditModeArrow(
            ext,
          );

      if (mode.style) {
        mode.style.lineWidth = 2;
        mode.style.lineColor = "#000000";
      }

      ext.changeEditMode(mode);
    }

    function addText() {
      const ext = getMarkupExtension();
      if (!ext) return;

      ext.show();
      ext.enterEditMode();
      const textMode =
        new window.Autodesk.Viewing.Extensions.Markups.Core.EditModeText(ext);

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
    }

    async function saveMarkup() {
      const ext = getMarkupExtension();
      if (!ext) {
        console.log("Markup extension not available");
        return;
      }
      console.log("[AutodeskViewer] saveMarkup start");

      try {
        if (typeof ext.leaveEditMode === "function") {
          try {
            ext.leaveEditMode();
          } catch (_) {
            /* ignore */
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 120));

        let svgData: string | null = null;

        try {
          if (typeof ext.generateData === "function") {
            svgData = ext.generateData();
          }
        } catch (error) {
          console.warn("generateData failed, retrying", error);
          try {
            if (typeof ext.show === "function") ext.show();
            if (typeof ext.enterEditMode === "function") ext.enterEditMode();
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (typeof ext.leaveEditMode === "function") ext.leaveEditMode();
            await new Promise((resolve) => setTimeout(resolve, 200));
            if (typeof ext.generateData === "function")
              svgData = ext.generateData();
          } catch (retryError) {
            console.warn("Markup retry failed", retryError);
          }
        }

        if (!svgData) {
          throw new Error("generateData returned empty SVG");
        }

        console.log("[AutodeskViewer] saveMarkup generated svgData", {
          urn,
          svgDataLength: svgData.length,
          svgDataSnippet: svgData.slice(0, 200),
        });

        await saveAnnotation({
          urn,
          svgData,
          timestamp: new Date().toISOString(),
        });
        alert("Markup saved successfully!");
      } catch (error) {
        console.error("Failed to save markup:", error);
        alert("Failed to save markup");
      }
    }

    function clearMarkup() {
      const ext = getMarkupExtension();
      if (!ext) return;
      ext.clear();
      ext.hide();
    }

    async function reloadStoredComments() {
      const ext = getMarkupExtension();
      if (!ext) return;

      try {
        const annotations = await getAnnotations(urn);
        console.log(
          "[AutodeskViewer] reloadStoredComments loaded annotations",
          {
            urn,
            count: annotations.length,
            annotations,
          },
        );

        try {
          ext.leaveEditMode();
        } catch (_) {
          /* ignore */
        }
        try {
          ext.unloadMarkupsAll();
        } catch (_) {
          /* ignore */
        }
        ext.clear();
        ext.show();

        annotations.forEach((annotation: any, index: number) => {
          if (!annotation.svgData) return;
          console.log("[AutodeskViewer] loading annotation", {
            index,
            svgDataLength: annotation.svgData.length,
            snippet: annotation.svgData.slice(0, 200),
          });
          ext.loadMarkups(annotation.svgData, `saved_layer_${index}`);
        });
      } catch (error) {
        console.error("Failed to reload annotations:", error);
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
      if (!viewerRef.current || !urn) return;

      let currentViewer: any;

      async function start() {
        try {
          const container = viewerRef.current;
          if (!container) return;
          currentViewer = await initViewer(container);
          await currentViewer.loadExtension("Autodesk.Viewing.MarkupsCore");
          await loadModel(currentViewer, urn);
          viewerInstanceRef.current = currentViewer;
          currentViewer.resize?.();
        } catch (error) {
          console.error("Autodesk viewer initialization failed:", error);
        }
      }

      start();

      return () => {
        currentViewer?.finish();
        viewerInstanceRef.current = null;
      };
    }, [urn]);

    return (
      <div
        className="h-full min-h-0 w-full relative"
        style={{ minHeight: "32rem" }}
      >
        <div
          ref={viewerRef}
          className="h-full min-h-0 w-full"
          onClick={handleViewerClick}
        />

        {placement.phase === "editing" && placement.dataUrl && (
          <div
            className="placement-overlay"
            style={{
              position: "absolute",
              left: placement.x,
              top: placement.y,
              width: placement.w,
              height: placement.h,
              border: "2px dashed #2563EB",
              background: "rgba(255,255,255,0.8)",
              zIndex: 50,
              cursor: "move",
            }}
            onMouseDown={startMove}
          >
            <img
              src={placement.dataUrl}
              alt="placement preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                pointerEvents: "none",
              }}
            />
            {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map((dir) => (
              <div
                key={dir}
                className="placement-handle"
                data-dir={dir}
                style={{
                  position: "absolute",
                  width: 12,
                  height: 12,
                  background: "#2563EB",
                  borderRadius: 2,
                  cursor: `${dir}-resize`,
                  ...{
                    nw: { left: -6, top: -6 },
                    n: { left: "50%", top: -6, transform: "translateX(-50%)" },
                    ne: { right: -6, top: -6 },
                    e: { right: -6, top: "50%", transform: "translateY(-50%)" },
                    se: { right: -6, bottom: -6 },
                    s: {
                      left: "50%",
                      bottom: -6,
                      transform: "translateX(-50%)",
                    },
                    sw: { left: -6, bottom: -6 },
                    w: { left: -6, top: "50%", transform: "translateY(-50%)" },
                  }[dir],
                }}
                onMouseDown={(e) =>
                  startResize(e as unknown as MouseEvent<HTMLDivElement>, dir)
                }
              />
            ))}
            <div
              className="placement-toolbar"
              style={{
                position: "absolute",
                left: 8,
                bottom: -44,
                display: "flex",
                gap: 8,
                background: "rgba(255,255,255,0.95)",
                borderRadius: 8,
                padding: "6px 8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
              }}
            >
              <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
                W
                <input
                  type="number"
                  value={placement.w}
                  onChange={(e) =>
                    setPlacement((prev) => ({
                      ...prev,
                      w: Math.max(MIN_SIZE, Number(e.target.value) || MIN_SIZE),
                    }))
                  }
                  style={{
                    width: 56,
                    padding: 4,
                    borderRadius: 4,
                    border: "1px solid #CBD5E1",
                  }}
                />
              </label>
              <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
                H
                <input
                  type="number"
                  value={placement.h}
                  onChange={(e) =>
                    setPlacement((prev) => ({
                      ...prev,
                      h: Math.max(MIN_SIZE, Number(e.target.value) || MIN_SIZE),
                    }))
                  }
                  style={{
                    width: 56,
                    padding: 4,
                    borderRadius: 4,
                    border: "1px solid #CBD5E1",
                  }}
                />
              </label>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmPlacement();
                }}
                style={{
                  background: "#10B981",
                  color: "#fff",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: 6,
                }}
              >
                Confirm
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelPlacement();
                }}
                style={{
                  background: "#EF4444",
                  color: "#fff",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: 6,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default AutodeskViewer;
