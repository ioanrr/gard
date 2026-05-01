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
import { LangSwitcher } from "./components/LangSwitcher";
import { useProject } from "./store/projectStore";
import { APP_VERSION } from "./version";

type Tab = "sketch" | "quote" | "cutting";

function App() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("sketch");
  const [view, setView] = useState<"client" | "internal">("client");
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
          <div className="flex items-center gap-1 text-xs bg-brand-200/60 rounded p-0.5">
            <button
              type="button"
              onClick={() => setView("client")}
              className={`px-2 py-1 rounded ${
                view === "client" ? "bg-brand-700 text-white" : "text-brand-900"
              }`}
            >
              {t("view.client")}
            </button>
            <button
              type="button"
              onClick={() => setView("internal")}
              className={`px-2 py-1 rounded ${
                view === "internal" ? "bg-brand-700 text-white" : "text-brand-900"
              }`}
            >
              {t("view.internal")}
            </button>
          </div>
          <LangSwitcher />
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <main className="flex-1 flex flex-col min-w-0">
          <nav className="bg-white border-b border-gray-200 flex">
            <TabBtn active={tab === "sketch"} onClick={() => setTab("sketch")}>
              {t("nav.sketch")}
            </TabBtn>
            <TabBtn active={tab === "quote"} onClick={() => setTab("quote")}>
              {t("nav.quote")}
            </TabBtn>
            {view === "internal" && (
              <TabBtn active={tab === "cutting"} onClick={() => setTab("cutting")}>
                {t("nav.cutting")}
              </TabBtn>
            )}
          </nav>

          <div className="flex-1 min-h-0 overflow-auto">
            {tab === "sketch" && (
              <div className="flex flex-col h-full">
                <CanvasToolbar />
                <div ref={canvasContainerRef} className="flex-1 relative">
                  <SketchCanvas width={width} height={height} />
                  <SegmentElevation />
                </div>
              </div>
            )}
            {tab === "quote" && <QuoteView />}
            {tab === "cutting" && view === "internal" && <CuttingPlanView />}
          </div>
        </main>

        <aside className="w-[340px] border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
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
        </aside>
      </div>
    </div>
  );
}

function TabBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm border-b-2 ${
        active
          ? "border-brand-700 text-brand-900 font-medium"
          : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

export default App;
