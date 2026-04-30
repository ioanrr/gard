import { useTranslation } from "react-i18next";
import { useProject, expandedModules } from "../../store/projectStore";
import { calculateModule } from "../../engine/calculations";
import { packCuts } from "../../engine/cutting";
import { buildQuote } from "../../engine/pricing";
import { exportQuotePdf } from "../../pdf/exportPdf";

export function QuoteView() {
  const { t } = useTranslation();
  const segments = useProject((s) => s.segments);
  const modules = useProject((s) => s.modules);
  const all = expandedModules({ segments, modules });

  if (all.length === 0) {
    return <div className="p-4 text-sm text-gray-500">{t("quote.empty")}</div>;
  }

  const calcs = all.map(calculateModule);
  const allPieces = calcs.flatMap((c) => c.pieces);
  const plan = packCuts(allPieces);
  const quote = buildQuote(all, calcs, plan);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-900">{t("quote.title")}</h2>
        <button
          type="button"
          onClick={() => exportQuotePdf(quote, t)}
          className="text-sm bg-brand-700 text-white px-3 py-1.5 rounded hover:bg-brand-900"
        >
          {t("quote.exportPdf")}
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">{t("quote.item")}</th>
              <th className="text-right px-3 py-2">{t("quote.qty")}</th>
              <th className="text-left px-3 py-2">{t("quote.unit")}</th>
              <th className="text-right px-3 py-2">{t("quote.unitPrice")}</th>
              <th className="text-right px-3 py-2">{t("quote.total")}</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((l, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-1.5">{l.name}</td>
                <td className="px-3 py-1.5 text-right">{l.qty}</td>
                <td className="px-3 py-1.5">{l.unit}</td>
                <td className="px-3 py-1.5 text-right">{l.unitPrice.toFixed(2)}</td>
                <td className="px-3 py-1.5 text-right">{l.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 text-sm">
            <tr>
              <td colSpan={4} className="text-right px-3 py-1.5 font-medium">
                {t("quote.subtotal")}
              </td>
              <td className="text-right px-3 py-1.5 font-medium">
                {quote.subtotal.toFixed(2)} {t("quote.currency")}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right px-3 py-1.5">
                {t("quote.vat")}
              </td>
              <td className="text-right px-3 py-1.5">
                {quote.vat.toFixed(2)} {t("quote.currency")}
              </td>
            </tr>
            <tr className="bg-brand-50">
              <td colSpan={4} className="text-right px-3 py-2 font-semibold text-brand-900">
                {t("quote.grandTotal")}
              </td>
              <td className="text-right px-3 py-2 font-semibold text-brand-900">
                {quote.grandTotal.toFixed(2)} {t("quote.currency")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
