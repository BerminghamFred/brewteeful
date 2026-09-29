/**
 * Parses a Google Ads report export (campaign / ad group / keyword level) into ad_spend rows.
 * Tolerates the title rows Google puts above the header, quoted fields, "£1,234.56" and
 * "--" values, and a trailing "Total" row.
 */
export type SpendImportRow = {
  date: string;
  campaign: string | null;
  ad_group: string | null;
  keyword: string | null;
  spend_pence: number;
  clicks: number | null;
  impressions: number | null;
};

export function parseCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === sep) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const num = (v: string | undefined) => {
  if (!v || v === "--") return null;
  const n = Number(v.replace(/[£$€,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

function toIsoDate(v: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v); // UK dd/mm/yyyy
  if (m) return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function parseSpendCsv(text: string, fallbackDate?: string): { rows: SpendImportRow[]; errors: string[] } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const sep = (lines.find((l) => /cost/i.test(l)) ?? "").includes("\t") ? "\t" : ",";
  const headerIdx = lines.findIndex((l) => /(^|[,\t"])\s*cost\s*("|[,\t]|$)/i.test(l));
  if (headerIdx < 0) return { rows: [], errors: ["Couldn't find a header row with a 'Cost' column."] };
  const header = parseCsvLine(lines[headerIdx]!, sep).map((h) => h.toLowerCase());
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const iDate = col("day", "date");
  const iCampaign = col("campaign");
  const iAdGroup = col("ad group");
  const iKeyword = col("keyword", "search keyword", "search term");
  const iCost = col("cost");
  const iClicks = col("clicks");
  const iImpr = col("impr.", "impressions", "impr");
  const rows: SpendImportRow[] = [];
  const errors: string[] = [];
  for (const line of lines.slice(headerIdx + 1)) {
    const f = parseCsvLine(line, sep);
    if (/^total/i.test(f[0] ?? "") || f.every((x) => !x)) continue;
    const cost = num(f[iCost]);
    const date = iDate >= 0 ? toIsoDate(f[iDate] ?? "") : fallbackDate ?? null;
    if (cost == null || !date) {
      errors.push(`Skipped: ${line.slice(0, 80)}`);
      continue;
    }
    const txt = (i: number) => (i >= 0 && f[i] && f[i] !== "--" ? f[i]! : null);
    rows.push({
      date,
      campaign: txt(iCampaign),
      ad_group: txt(iAdGroup),
      keyword: txt(iKeyword)?.replace(/^[[+"]|[\]"]$/g, "") ?? null,
      spend_pence: Math.round(cost * 100),
      clicks: num(f[iClicks]),
      impressions: num(f[iImpr]),
    });
  }
  return { rows, errors };
}
