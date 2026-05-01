import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SketchCanvas, useResizeObserver } from "./components/Canvas/SketchCanvas";
import { CanvasToolbar } from "./components/Canvas/CanvasToolbar";
import { SegmentElevation } from "./components/Canvas/SegmentElevation";
import { SegmentPanel } from "./components/Sidebar/SegmentPanel";
import { ModuleConfig } from "./components/Sidebar/ModuleConfig";
import { ProjectSummary } from "./components/Sidebar/ProjectSummary";
import { QuoteView } from "./components/Quote/QuoteView";
import { CuttingPlanView } from "./components/Quote/CuttingPlanView";
import { SuggestionsView } from "./components/SuggestionsView";
import { LangSwitcher } from "./components/LangSwitcher";
import { Modal } from "./components/Modal";
import { useProject } from "./store/projectStore";
import { APP_VERSION } from "./version";

type Overlay = "none" | "cutting" | "quote";

function App() {
  const { t } = useTranslation();
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(canvasContainerRef);

  const selectedSegmentId = useProject((s) => s.selectedSegmentId);
  const selectedModuleId = useProject((s) => s.selectedModuleId);

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="h-14 bg-brand-50 text-brand-900 flex items-center px-5 justify-between shrink-0 border-b border-brand-200/70 shadow-sm">
        <div>
          <div className="text-base font-semibold tracking-tight flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="group relative hover:underline focus:outline-none focus:underline cursor-pointer"
            >
              {t("app.title")}
              <span className="pointer-events-none absolute left-0 top-full mt-1 whitespace-nowrap text-[11px] font-normal bg-brand-900 text-brand-100 px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                ({t("app.titleHint")})
              </span>
            </button>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-brand-200 text-brand-900 rounded">
              {APP_VERSION}
            </span>
          </div>
          <div className="text-[11px] text-brand-700/80">{t("app.subtitle")}</div>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher />
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 flex flex-col min-w-0">
          <CanvasToolbar
            onOpenCutting={() => setOverlay("cutting")}
            onOpenQuote={() => setOverlay("quote")}
            onOpenSuggestions={() => setShowSuggestions(true)}
          />
          <div ref={canvasContainerRef} className="flex-1 relative min-h-0">
            <SketchCanvas width={width} height={height} />
            <SegmentElevation />
          </div>
        </main>

        <aside className="w-[340px] border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
          {showSuggestions ? (
            <SuggestionsView onClose={() => setShowSuggestions(false)} />
          ) : (
            <>
              <ProjectSummary />
              <div className="flex-1 overflow-y-auto">
                {selectedModuleId ? (
                  <ModuleConfig />
                ) : selectedSegmentId ? (
                  <SegmentPanel />
                ) : (
                  <div className="p-4 text-sm text-gray-500">
                    {t("sketch.noSegmentSelected")}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      <Modal
        open={overlay === "cutting"}
        onClose={() => setOverlay("none")}
        title={t("nav.cutting")}
      >
        <CuttingPlanView />
      </Modal>
      <Modal
        open={overlay === "quote"}
        onClose={() => setOverlay("none")}
        title={t("nav.quote")}
      >
        <QuoteView />
      </Modal>
    </div>
  );
}

export default App;
