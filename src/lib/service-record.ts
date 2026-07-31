import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
  type RGB,
} from "pdf-lib";
import type { Finding, RepairOrder, Severity } from "./types";
import { CUSTOMER_LABELS, orderTotalCents, vehicleName } from "./pitcrew-ui";

// Builds the printable service record a customer takes away at the end of a
// repair: what was found, what they authorised, what was declined, what was
// paid, and a timestamped history of every step. Everything on the page comes
// from the stored order — nothing is invented here. If a field is missing the
// section is omitted rather than filled in with a plausible-looking default.

const PAGE_W = 612; // US Letter, the format an American shop prints on
const PAGE_H = 792;
const MARGIN = 54;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = rgb(0.09, 0.09, 0.08);
const MUTED = rgb(0.44, 0.43, 0.4);
const RULE = rgb(0.85, 0.84, 0.81);
const PAPER = rgb(0.99, 0.985, 0.975);
const RED = rgb(0.72, 0.21, 0.16);
const AMBER = rgb(0.71, 0.47, 0.09);
const GREEN = rgb(0.16, 0.45, 0.28);

const SEVERITY_COLOR: Record<Severity, RGB> = {
  red: RED,
  amber: AMBER,
  green: GREEN,
};
const SEVERITY_LABEL: Record<Severity, string> = {
  red: "Urgent",
  amber: "Soon",
  green: "Healthy",
};

const SHOP_TZ = "America/Los_Angeles";

function fmtUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    timeZone: SHOP_TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Helvetica is WinAnsi-encoded: anything it can't represent would throw at
// draw time, so unsupported characters are dropped before they get there.
const ENCODABLE = new Set([
  0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2020, 0x2021, 0x2022,
  0x2026, 0x2030, 0x20ac, 0x2039, 0x203a, 0x2122,
]);

function safe(text: string): string {
  return [...(text ?? "")]
    .filter((ch) => {
      const code = ch.codePointAt(0)!;
      return code === 10 || (code >= 32 && code < 256) || ENCODABLE.has(code);
    })
    .join("");
}

/** Layout cursor: owns pagination so section code never tracks page breaks. */
class Doc {
  pages: PDFPage[] = [];
  page!: PDFPage;
  y = 0;

  constructor(
    private pdf: PDFDocument,
    readonly regular: PDFFont,
    readonly bold: PDFFont,
  ) {
    this.newPage();
  }

  newPage() {
    this.page = this.pdf.addPage([PAGE_W, PAGE_H]);
    this.page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: PAGE_H,
      color: PAPER,
    });
    this.pages.push(this.page);
    this.y = PAGE_H - MARGIN;
  }

  /** Break to a new page unless `height` still fits above the footer. */
  need(height: number) {
    if (this.y - height < MARGIN + 24) this.newPage();
  }

  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const lines: string[] = [];
    for (const paragraph of safe(text).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(next, size) > width && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  text(
    value: string,
    opts: {
      x?: number;
      size?: number;
      font?: PDFFont;
      color?: RGB;
      width?: number;
      leading?: number;
    } = {},
  ) {
    const size = opts.size ?? 10;
    const font = opts.font ?? this.regular;
    const leading = opts.leading ?? size * 1.42;
    const lines = this.wrap(value, font, size, opts.width ?? CONTENT_W);
    for (const line of lines) {
      this.need(leading);
      this.page.drawText(line, {
        x: opts.x ?? MARGIN,
        y: this.y - size,
        size,
        font,
        color: opts.color ?? INK,
      });
      this.y -= leading;
    }
  }

  /** Single line at an absolute x — for table columns and right-aligned money. */
  line(
    value: string,
    x: number,
    opts: { size?: number; font?: PDFFont; color?: RGB; alignRight?: boolean } = {},
  ) {
    const size = opts.size ?? 10;
    const font = opts.font ?? this.regular;
    const clean = safe(value);
    const drawX = opts.alignRight ? x - font.widthOfTextAtSize(clean, size) : x;
    this.page.drawText(clean, {
      x: drawX,
      y: this.y - size,
      size,
      font,
      color: opts.color ?? INK,
    });
  }

  rule(color = RULE) {
    this.need(10);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 0.75,
      color,
    });
    this.y -= 1;
  }

  gap(px: number) {
    this.y -= px;
  }

  heading(label: string) {
    this.need(44);
    this.gap(14);
    this.text(label.toUpperCase(), {
      size: 8.5,
      font: this.bold,
      color: MUTED,
      leading: 13,
    });
    this.rule();
    this.gap(9);
  }
}

function decisionLabel(f: Finding): string {
  if (f.severity === "green") return "No action needed";
  if (f.approved === true) return "Authorised";
  if (f.approved === false) return "Declined";
  return "No decision recorded";
}

export interface ServiceRecordMeta {
  shopPhone: string;
  /** Who pressed the button — printed so the copy is traceable. */
  issuedFor: string;
}

export async function buildServiceRecordPdf(
  order: RepairOrder,
  meta: ServiceRecordMeta,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const d = new Doc(pdf, regular, bold);

  const findings = order.report?.findings ?? [];
  const authorised = findings.filter((f) => f.approved === true);
  const declined = findings.filter(
    (f) => f.severity !== "green" && f.approved !== true,
  );
  const healthy = findings.filter(
    (f) => f.severity === "green" && f.approved !== true,
  );
  const authorisedTotal = authorised.reduce((s, f) => s + f.priceCents, 0);
  const declinedTotal = declined.reduce((s, f) => s + f.priceCents, 0);
  const paidCents = order.payment?.amountCents ?? 0;

  pdf.setTitle(`PitCrew service record ${order.id} — ${vehicleName(order)}`);
  pdf.setAuthor(order.shopName);
  pdf.setSubject(`Vehicle service record for ${order.customerName}`);
  pdf.setCreator("PitCrew");

  // ---- Masthead -----------------------------------------------------------
  d.page.drawRectangle({
    x: 0,
    y: PAGE_H - 92,
    width: PAGE_W,
    height: 92,
    color: INK,
  });
  d.page.drawText("PitCrew", {
    x: MARGIN,
    y: PAGE_H - 52,
    size: 21,
    font: bold,
    color: PAPER,
  });
  d.page.drawText("Vehicle service record", {
    x: MARGIN,
    y: PAGE_H - 70,
    size: 10,
    font: regular,
    color: rgb(0.72, 0.71, 0.68),
  });
  const recordNo = `RECORD ${order.id.toUpperCase()}`;
  d.page.drawText(recordNo, {
    x: PAGE_W - MARGIN - bold.widthOfTextAtSize(recordNo, 10),
    y: PAGE_H - 52,
    size: 10,
    font: bold,
    color: PAPER,
  });
  const issued = `Issued ${fmtDateTime(new Date().toISOString())}`;
  d.page.drawText(issued, {
    x: PAGE_W - MARGIN - regular.widthOfTextAtSize(issued, 8.5),
    y: PAGE_H - 68,
    size: 8.5,
    font: regular,
    color: rgb(0.72, 0.71, 0.68),
  });
  d.y = PAGE_H - 92 - 30;

  // ---- Vehicle + parties --------------------------------------------------
  d.text(vehicleName(order), { size: 20, font: bold, leading: 25 });
  d.text(
    `Plate ${order.vehicle.plate}  ·  ${order.vehicle.mileage.toLocaleString("en-US")} mi at check-in  ·  Status: ${CUSTOMER_LABELS[order.status]}`,
    { size: 10, color: MUTED, leading: 15 },
  );

  d.gap(16);
  const colW = CONTENT_W / 3;
  const columns: [string, string[]][] = [
    [
      "Customer",
      [order.customerName, order.customerEmail, order.customerPhone],
    ],
    ["Service centre", [order.shopName, meta.shopPhone]],
    [
      "Dates",
      [
        `In: ${fmtDateTime(order.createdAt)}`,
        `Last update: ${fmtDateTime(order.updatedAt)}`,
      ],
    ],
  ];
  const colTop = d.y;
  let colBottom = d.y;
  columns.forEach(([label, rows], i) => {
    const x = MARGIN + colW * i;
    d.y = colTop;
    d.text(label.toUpperCase(), {
      x,
      size: 7.5,
      font: bold,
      color: MUTED,
      width: colW - 12,
      leading: 12,
    });
    for (const row of rows) {
      d.text(row, { x, size: 9.5, width: colW - 12, leading: 13 });
    }
    colBottom = Math.min(colBottom, d.y);
  });
  d.y = colBottom;

  // ---- Verdict ------------------------------------------------------------
  if (order.report) {
    d.gap(18);
    const verdictText = order.report.verdict.replace(/_/g, " ").toLowerCase();
    const verdictColor =
      order.report.verdict === "STOP_DRIVING"
        ? RED
        : order.report.verdict === "SERVICE_SOON"
          ? AMBER
          : GREEN;
    const summaryLines = d.wrap(order.report.summary, regular, 10.5, CONTENT_W - 32);
    const boxH = 30 + summaryLines.length * 15;
    d.need(boxH);
    d.page.drawRectangle({
      x: MARGIN,
      y: d.y - boxH,
      width: CONTENT_W,
      height: boxH,
      color: rgb(1, 1, 1),
      borderColor: RULE,
      borderWidth: 0.75,
    });
    d.page.drawRectangle({
      x: MARGIN,
      y: d.y - boxH,
      width: 3,
      height: boxH,
      color: verdictColor,
    });
    d.gap(14);
    d.text(`Overall assessment: ${verdictText}`, {
      x: MARGIN + 16,
      size: 9,
      font: bold,
      color: verdictColor,
      width: CONTENT_W - 32,
      leading: 14,
    });
    d.text(order.report.summary, {
      x: MARGIN + 16,
      size: 10.5,
      width: CONTENT_W - 32,
      leading: 15,
    });
    d.gap(14);
  }

  // ---- Work authorised and performed --------------------------------------
  const priceX = PAGE_W - MARGIN;
  d.heading("Work you authorised");
  if (authorised.length === 0) {
    d.text("No repairs were authorised on this visit.", {
      size: 10,
      color: MUTED,
    });
  } else {
    for (const f of authorised) {
      d.need(58);
      d.line(safe(f.title), MARGIN, { size: 11, font: bold });
      d.line(fmtUsd(f.priceCents), priceX, {
        size: 11,
        font: bold,
        alignRight: true,
      });
      d.gap(15);
      d.text(f.plain, { size: 9.5, color: MUTED, width: CONTENT_W - 90, leading: 13 });
      if (f.selectedPart) {
        const p = f.selectedPart;
        d.text(
          `Part fitted: ${p.title} — ${p.vendor}, ${fmtUsd(p.priceCents)}${p.delivery ? ` (${p.delivery})` : ""}`,
          { size: 9, color: INK, width: CONTENT_W - 90, leading: 13 },
        );
      }
      d.gap(9);
    }
    d.rule();
    d.gap(9);
    d.line("Total authorised", MARGIN, { size: 10, font: bold });
    d.line(fmtUsd(authorisedTotal), priceX, {
      size: 10,
      font: bold,
      alignRight: true,
    });
    d.gap(16);
  }

  // ---- Payment ------------------------------------------------------------
  d.heading("Payment");
  if (order.payment) {
    const rows: [string, string][] = [
      ["Amount paid", fmtUsd(paidCents)],
      ["Paid on", fmtDateTime(order.payment.at)],
      ["Processed by", order.payment.processor],
      ["Reference", order.payment.reference],
    ];
    for (const [label, value] of rows) {
      d.need(14);
      d.line(label, MARGIN, { size: 9.5, color: MUTED });
      d.line(value, priceX, { size: 9.5, alignRight: true });
      d.gap(14);
    }
    const balance = authorisedTotal - paidCents;
    if (balance !== 0) {
      d.gap(2);
      d.line(balance > 0 ? "Balance outstanding" : "Credit on account", MARGIN, {
        size: 9.5,
        font: bold,
      });
      d.line(fmtUsd(Math.abs(balance)), priceX, {
        size: 9.5,
        font: bold,
        alignRight: true,
      });
      d.gap(14);
    }
  } else {
    d.text(
      authorisedTotal > 0
        ? `${fmtUsd(authorisedTotal)} authorised, not yet paid.`
        : "Nothing has been charged for this visit.",
      { size: 10, color: MUTED },
    );
  }

  // ---- Declined / deferred ------------------------------------------------
  if (declined.length > 0) {
    d.heading("Recommended, not performed");
    d.text(
      "These items were found during the inspection and were not carried out on this visit. Keep this list for your next service.",
      { size: 9.5, color: MUTED, leading: 13 },
    );
    d.gap(8);
    for (const f of declined) {
      d.need(46);
      d.page.drawCircle({
        x: MARGIN + 3,
        y: d.y - 6,
        size: 3,
        color: SEVERITY_COLOR[f.severity],
      });
      d.line(safe(f.title), MARGIN + 13, { size: 10.5, font: bold });
      d.line(fmtUsd(f.priceCents), priceX, { size: 10.5, alignRight: true });
      d.gap(14);
      d.text(`${SEVERITY_LABEL[f.severity]} · ${decisionLabel(f)} · ${f.urgency}`, {
        x: MARGIN + 13,
        size: 9,
        color: MUTED,
        width: CONTENT_W - 100,
        leading: 12,
      });
      if (f.ifYouWait) {
        d.text(`If left: ${f.ifYouWait}`, {
          x: MARGIN + 13,
          size: 9,
          color: MUTED,
          width: CONTENT_W - 100,
          leading: 12,
        });
      }
      d.gap(8);
    }
    d.rule();
    d.gap(9);
    d.line("Estimated cost if carried out later", MARGIN, { size: 9.5, color: MUTED });
    d.line(fmtUsd(declinedTotal), priceX, { size: 9.5, font: bold, alignRight: true });
    d.gap(14);
  }

  // ---- Checked and healthy ------------------------------------------------
  if (healthy.length > 0) {
    d.heading("Inspected, no action needed");
    for (const f of healthy) {
      d.need(16);
      d.page.drawCircle({ x: MARGIN + 3, y: d.y - 6, size: 3, color: GREEN });
      d.text(`${f.title}${f.plain ? ` — ${f.plain}` : ""}`, {
        x: MARGIN + 13,
        size: 9.5,
        width: CONTENT_W - 13,
        leading: 13,
      });
      d.gap(3);
    }
  }

  // ---- History ------------------------------------------------------------
  const events = [...(order.events ?? [])].sort((a, b) =>
    a.at.localeCompare(b.at),
  );
  if (events.length > 0) {
    d.heading("Service history");
    const timeX = MARGIN;
    const bodyX = MARGIN + 128;
    for (const e of events) {
      d.need(30);
      d.line(fmtDateTime(e.at), timeX, { size: 8.5, color: MUTED });
      d.text(e.label, {
        x: bodyX,
        size: 10,
        font: bold,
        width: PAGE_W - MARGIN - bodyX,
        leading: 13,
      });
      d.text(e.actor, {
        x: bodyX,
        size: 9,
        color: MUTED,
        width: PAGE_W - MARGIN - bodyX,
        leading: 12,
      });
      if (e.detail) {
        d.text(e.detail, {
          x: bodyX,
          size: 9,
          color: MUTED,
          width: PAGE_W - MARGIN - bodyX,
          leading: 12,
        });
      }
      d.gap(9);
    }
  }

  // ---- Technician notes ---------------------------------------------------
  if (order.rawTechNotes.trim()) {
    d.heading("Technician's original notes");
    d.text(
      "Reproduced as written on the shop floor. The plain-English report above was produced from these notes.",
      { size: 9, color: MUTED, leading: 12 },
    );
    d.gap(6);
    d.text(order.rawTechNotes, { size: 8.5, color: MUTED, leading: 11.5 });
  }

  // ---- Footers ------------------------------------------------------------
  const total = d.pages.length;
  d.pages.forEach((page, i) => {
    page.drawLine({
      start: { x: MARGIN, y: MARGIN + 4 },
      end: { x: PAGE_W - MARGIN, y: MARGIN + 4 },
      thickness: 0.75,
      color: RULE,
    });
    const left = safe(
      `${order.shopName} · Record ${order.id} · ${vehicleName(order)}`,
    );
    page.drawText(left, {
      x: MARGIN,
      y: MARGIN - 8,
      size: 7.5,
      font: regular,
      color: MUTED,
    });
    const right = `Page ${i + 1} of ${total}`;
    page.drawText(right, {
      x: PAGE_W - MARGIN - regular.widthOfTextAtSize(right, 7.5),
      y: MARGIN - 8,
      size: 7.5,
      font: regular,
      color: MUTED,
    });
    const note = safe(
      `Issued to ${meta.issuedFor}. Totals reflect the items authorised by the customer; work not listed above was not carried out.`,
    );
    page.drawText(note, {
      x: MARGIN,
      y: MARGIN - 19,
      size: 7,
      font: regular,
      color: MUTED,
    });
  });

  // Full order value is quoted only when it differs from what was authorised,
  // so the customer can see what they chose not to spend.
  const quoted = orderTotalCents(order);
  if (quoted > authorisedTotal) {
    const note = safe(
      `Quoted ${fmtUsd(quoted)} · authorised ${fmtUsd(authorisedTotal)}`,
    );
    d.pages[0].drawText(note, {
      x: PAGE_W - MARGIN - regular.widthOfTextAtSize(note, 8),
      y: PAGE_H - 82,
      size: 8,
      font: regular,
      color: rgb(0.72, 0.71, 0.68),
    });
  }

  return pdf.save();
}
