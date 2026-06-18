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
        viewer.loadExtension("Autodesk.DocumentBrowser");
        resolve(viewer);
      }
    );
  });
}

export async function loadModel(
  viewer: any,
  urn: string
) {
  const urnValue = urn.startsWith("urn:") ? urn : `urn:${urn}`;

  return new Promise((resolve, reject) => {
    window.Autodesk.Viewing.Document.load(
      urnValue,
      (doc: any) => {
        const root = doc.getRoot();
        let viewable = root.getDefaultGeometry();

        if (!viewable) {
          const viewables = root.search({ type: "geometry" });
          if (viewables && viewables.length > 0) {
            viewable = viewables[0];
            console.warn(
              "Default geometry missing, falling back to first geometry viewable.",
              viewable
            );
          }
        }

        if (!viewable) {
          const message = `No geometry viewable found for model ${urnValue}`;
          console.error(message, root);
          reject(new Error(message));
          return;
        }

        resolve(viewer.loadDocumentNode(doc, viewable));
      },
      (error: any) => {
        console.error(`Autodesk Document.load failed for ${urnValue}:`, error);
        reject(error);
      }
    );
  });
}