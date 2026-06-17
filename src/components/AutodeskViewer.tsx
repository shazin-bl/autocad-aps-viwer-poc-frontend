"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  initViewer,
  loadModel,
} from "@/hooks/useAutodeskViewer";

export default function AutodeskViewer({
  urn,
}: {
  urn: string;
}) {
  const viewerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    let viewer: any;

    async function start() {
      viewer = await initViewer(
        viewerRef.current!
      );

      await loadModel(viewer, urn);
    }

    start();

    return () => {
      viewer?.finish();
    };
  }, [urn]);

  return (
    <div
      ref={viewerRef}
      className="h-full min-h-0 w-full"
    />
  );
}