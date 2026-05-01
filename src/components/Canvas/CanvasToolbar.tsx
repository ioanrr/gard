import { useTranslation } from "react-i18next";
import { useProject } from "../../store/projectStore";

interface Props {
  onOpenCutting: () => void;
  onOpenQuote: () => void;
  onOpenSuggestions: () => void;
}

export function CanvasToolbar({ onOpenCutting, onOpenQuote, onOpenSuggestions }: Props) {
  const { t } = useTranslation();
  const closed = useProject((s) => s.closed);
  const segCount = useProject((s) => s.segments.length);
  const undo = useProject((s) => s.undo);
  const clear = useProject((s) => s.clear);
  const closePerimeter = useProject((s) => s.closePerimeter);

  const hasSegments = segCount > 0;

  return (
    <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200 flex-wrap">
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
        className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        onClick={closePerimeter}
        disabled={segCount < 2 || closed}
      >
        {t("sketch.close")}
      </button>

      {hasSegments && (
        <>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            type="button"
            onClick={onOpenCutting}
            className="px-3 py-1.5 rounded text-sm font-medium bg-brand-700 text-white hover:bg-brand-900"
          >
            {t("nav.cutting")}
          </button>
          <button
            type="button"
            onClick={onOpenQuote}
            className="px-3 py-1.5 rounded text-sm font-medium bg-brand-700 text-white hover:bg-brand-900"
          >
            {t("nav.quote")}
          </button>
          <button
            type="button"
            onClick={onOpenSuggestions}
            className="px-3 py-1.5 rounded text-sm font-bold text-white bg-gradient-to-r from-amber-400 via-orange-500 to-orange-600 hover:from-amber-500 hover:via-orange-600 hover:to-orange-700 shadow ring-1 ring-orange-300/60"
          >
            ✨ {t("nav.suggestions")}
          </button>
        </>
      )}

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
