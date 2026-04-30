import { useTranslation } from "react-i18next";
import { useProject } from "../../store/projectStore";

export function CanvasToolbar() {
  const { t } = useTranslation();
  const drawMode = useProject((s) => s.drawMode);
  const closed = useProject((s) => s.closed);
  const segCount = useProject((s) => s.segments.length);
  const setDrawMode = useProject((s) => s.setDrawMode);
  const undo = useProject((s) => s.undo);
  const clear = useProject((s) => s.clear);
  const closePerimeter = useProject((s) => s.closePerimeter);

  return (
    <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
      <button
        type="button"
        className={`px-3 py-1.5 rounded text-sm font-medium ${
          drawMode === "draw"
            ? "bg-brand-700 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => setDrawMode("draw")}
      >
        {t("sketch.addSegment")}
      </button>
      <button
        type="button"
        className={`px-3 py-1.5 rounded text-sm font-medium ${
          drawMode === "select"
            ? "bg-brand-700 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        onClick={() => setDrawMode("select")}
      >
        {t("sketch.select")}
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button
        type="button"
        className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        onClick={undo}
        disabled={segCount === 0}
      >
        {t("sketch.undo")}
      </button>
      <button
        type="button"
        className="px-3 py-1.5 rounded text-sm bg-brand-50 text-brand-900 border border-brand-200 hover:bg-brand-100 disabled:opacity-50"
        onClick={() => setDrawMode("select")}
        disabled={segCount === 0 || drawMode === "select"}
        title={t("sketch.finish")}
      >
        ✓ {t("sketch.finish")}
      </button>
      <button
        type="button"
        className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        onClick={closePerimeter}
        disabled={segCount < 2 || closed}
      >
        {t("sketch.close")}
      </button>
      <div className="flex-1" />
      <button
        type="button"
        className="px-3 py-1.5 rounded text-sm bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
        onClick={clear}
        disabled={segCount === 0}
      >
        {t("sketch.clear")}
      </button>
    </div>
  );
}
