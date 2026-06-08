#!/usr/bin/env node
/**
 * Convert a Cognito Forms CSV export of the DEAL form into INSERT SQL
 * for the FormCraft `entries` table.
 *
 * Usage:
 *   node supabase/import_entries.js <export.csv> <FORM_ID> > entries.sql
 *
 * Then paste entries.sql into the Supabase SQL Editor.
 *
 * Maps Cognito column headers -> FormCraft field ids. Header matching is
 * case-insensitive and ignores extra spaces. Unmapped columns are ignored.
 * Edit COLUMN_MAP if your CSV headers differ.
 */
const fs = require("fs");

const COLUMN_MAP = {
  "month": "month",
  "date created": "date_created",
  "collection location": "collection_location",
  "quote no": "quote_no",
  "sales rep": "sales_rep",
  "pop": "pop",
  "total": "total",
};
for (let n = 1; n <= 8; n++) {
  COLUMN_MAP[`part no ${n}`] = `part_no_${n}`;
  COLUMN_MAP[`line ${n}`] = `line_${n}`;
}
const NUMERIC = new Set(["total"]);
const CHECKBOX = new Set(["collection_location"]); // becomes an array

// --- tiny RFC-4180 CSV parser (handles quotes, commas, newlines) ---
function parseCSV(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i+1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\r") { /* skip */ }
      else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x !== ""));
}

const sqlStr = v => "'" + String(v).replace(/'/g, "''") + "'";

function main() {
  const [csvPath, formId] = process.argv.slice(2);
  if (!csvPath || !formId) {
    console.error("Usage: node import_entries.js <export.csv> <FORM_ID>");
    process.exit(1);
  }
  const rows = parseCSV(fs.readFileSync(csvPath, "utf8"));
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const idx = {};
  headers.forEach((h, i) => { if (COLUMN_MAP[h]) idx[COLUMN_MAP[h]] = i; });

  const mapped = Object.keys(idx);
  console.error("Mapped columns: " + mapped.join(", "));
  const unmapped = headers.filter(h => !COLUMN_MAP[h] && h);
  if (unmapped.length) console.error("Ignored columns: " + unmapped.join(", "));

  const values = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const data = {};
    for (const fid of mapped) {
      let raw = (row[idx[fid]] ?? "").trim();
      if (raw === "") continue;
      if (NUMERIC.has(fid)) {
        const num = Number(raw.replace(/[^0-9.\-]/g, ""));
        if (!Number.isNaN(num)) data[fid] = num;
      } else if (CHECKBOX.has(fid)) {
        // Cognito multi-select usually comes comma/semicolon separated
        data[fid] = raw.split(/[;,]/).map(s => s.trim()).filter(Boolean);
      } else {
        data[fid] = raw;
      }
    }
    if (Object.keys(data).length === 0) continue;
    values.push(`  (${sqlStr(formId)}, ${sqlStr(JSON.stringify(data))}::jsonb)`);
  }

  console.log("-- " + values.length + " entries for form " + formId);
  console.log("insert into public.entries (form_id, data) values");
  console.log(values.join(",\n") + ";");
  console.error("Generated " + values.length + " entry rows.");
}
main();
