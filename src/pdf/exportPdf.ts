import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CuttingPlan, Quote } from "../engine/types";
import { PROFILES, STOCK_LENGTH_MM } from "../data/profiles";
import { colorById } from "../data/colors";

type T = (key: string) => string;

export function exportQuotePdf(quote: Quote, t: T) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(t("quote.title"), 14, 18);
  doc.setFontSize(10);
  doc.text(`${t("quote.date")}: ${new Date().toLocaleDateString()}`, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [
      [
        t("quote.item"),
        t("quote.qty"),
        t("quote.unit"),
        t("quote.unitPrice"),
        t("quote.total"),
      ],
    ],
    body: quote.lines.map((l) => [
      l.name,
      l.qty.toString(),
      l.unit,
      l.unitPrice.toFixed(2),
      l.total.toFixed(2),
    ]),
    foot: [
      ["", "", "", t("quote.subtotal"), `${quote.subtotal.toFixed(2)} ${t("quote.currency")}`],
      ["", "", "", t("quote.vat"), `${quote.vat.toFixed(2)} ${t("quote.currency")}`],
      ["", "", "", t("quote.grandTotal"), `${quote.grandTotal.toFixed(2)} ${t("quote.currency")}`],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 59, 45] },
    footStyles: { fillColor: [241, 246, 243], textColor: [14, 31, 23] },
  });

  doc.save(`harmonya_oferta_${Date.now()}.pdf`);
}

export function exportCuttingPdf(plan: CuttingPlan, t: T) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(t("cutting.title"), 14, 18);
  doc.setFontSize(10);
  doc.text(t("cutting.subtitle"), 14, 26);

  doc.text(`${t("cutting.totalBars")}: ${plan.totalBars}`, 14, 36);
  doc.text(`${t("cutting.totalWaste")}: ${(plan.totalWasteMm / 1000).toFixed(2)} m`, 14, 42);
  doc.text(`${t("cutting.wasteRatio")}: ${(plan.wasteRatio * 100).toFixed(1)}%`, 14, 48);

  autoTable(doc, {
    startY: 56,
    head: [
      [
        t("cutting.barNo"),
        t("cutting.profile"),
        t("cutting.color"),
        t("cutting.cuts"),
        t("cutting.waste"),
      ],
    ],
    body: plan.bars.map((bar, i) => [
      `#${i + 1}`,
      PROFILES[bar.profileId].name,
      colorById(bar.colorId).name,
      bar.cuts.map((c) => c.lengthMm).join(" + "),
      `${bar.wasteMm} mm`,
    ]),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [31, 59, 45] },
    columnStyles: {
      3: { cellWidth: 80 },
    },
  });

  doc.save(`harmonya_plan_taiere_${Date.now()}.pdf`);
}

export const STOCK_FOR_PDF = STOCK_LENGTH_MM;
