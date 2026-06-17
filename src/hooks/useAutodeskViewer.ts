// hooks/useAutodeskViewer.ts
import { getViewerToken } from "@/api/authApi";

declare global {
  interface Window {
    Autodesk?: any;
  }
}

export async function initViewer(
  container: HTMLDivElement
) {
  return new Promise<any>((resolve) => {
    window.Autodesk.Viewing.Initializer(
      {
        env: "AutodeskProduction",

        getAccessToken: async (
          callback: any
        ) => {
          const token =
            await getViewerToken();

          callback(
            token.access_token,
            token.expires_in
          );
        },
      },

      () => {
        const viewer =
          new window.Autodesk.Viewing.GuiViewer3D(
            container
          );

        viewer.start();

        resolve(viewer);
      }
    );
  });
}

export async function loadModel(
  viewer: any,
  urn: string
) {
  return new Promise((resolve, reject) => {
    window.Autodesk.Viewing.Document.load(
      `urn:${urn}`,

      (doc: any) => {
        resolve(
          viewer.loadDocumentNode(
            doc,
            doc
              .getRoot()
              .getDefaultGeometry()
          )
        );
      },

      reject
    );
  });
}