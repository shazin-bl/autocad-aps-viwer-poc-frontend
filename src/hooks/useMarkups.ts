// hooks/useMarkups.ts
export function useMarkups(
//   viewer: Autodesk.Viewing.GuiViewer3D
  viewer: any
) {
  const drawArrow = () => {
    const ext =
      viewer.getExtension(
        "Autodesk.Viewing.MarkupsCore"
      );

    ext.show();
    ext.enterEditMode();

    ext.changeEditMode(
      new window.Autodesk.Viewing.Extensions
        .Markups.Core.EditModeArrow(ext)
    );
  };

  return {
    drawArrow,
  };
}