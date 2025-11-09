/**
 * EASYANNOTATION – PROGRESS REPORT (GitHub-native)
 * Compares base vs annotated XLSX files and outputs progress table.
 */

import fs from "fs";
import fetch from "node-fetch";
import * as XLSX from "xlsx";

const GITHUB_REPO = "Muhsabrys/EasyAnnotation";
const BASE_PATH = "datasets/NLI/";
const ANNOT_PATH = "Annotations/";
const REPORT_PATH = "Reports/progress.md";

const LANGS = {
  DE: "German",
  AR: "Arabic",
  ES: "Spanish",
  PT: "Portuguese",
  ZH: "Chinese",
  HI: "Hindi",
  TH: "Thai",
  UR: "Urdu"
};

async function loadXLSX(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

async function compareLang(code) {
  const baseURL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${BASE_PATH}NLI_${code}.xlsx`;
  const annotURL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${ANNOT_PATH}annotations_${code}.xlsx`;

  const base = await loadXLSX(baseURL);
  const ann = await loadXLSX(annotURL);

  if (!base || !ann) return { code, done: 0, total: 0, pct: 0 };

  const headers = ann[0].map(h => h.toLowerCase());
  const relIdx = headers.indexOf("relation");
  const annotated = ann.slice(1).filter(r => r[relIdx] && r[relIdx] !== "NonSense").length;
  const total = base.length - 1;
  const pct = total ? ((annotated / total) * 100).toFixed(2) : 0;
  return { code, done: annotated, total, pct };
}

async function main() {
  const results = [];
  for (const code of Object.keys(LANGS)) results.push(await compareLang(code));

  let report = `# 🧮 NLI Annotation Progress Report\n\nUpdated: ${new Date().toUTCString()}\n\n`;
  report += `| Language | Annotated | Total | Progress |\n|-----------|------------|--------|-----------|\n`;
  for (const r of results)
    report += `| ${LANGS[r.code]} | ${r.done} | ${r.total} | ${r.pct}% |\n`;

  fs.mkdirSync("Reports", { recursive: true });
  fs.writeFileSync(REPORT_PATH, report);
  console.log(report);
}

await main();
