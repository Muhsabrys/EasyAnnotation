/**
 * EASYANNOTATION – INTER-ANNOTATOR AGREEMENT REPORT
 * Aggregates all annotation files to compute agreement per item ID.
 * Outputs a per-item table and overall agreement rate.
 */

import fs from "fs";
import fetch from "node-fetch";
import * as XLSX from "xlsx";

const GITHUB_REPO = "Muhsabrys/EasyAnnotation";
const ANNOT_PATH = "Annotations/";
const REPORT_PATH = "Reports/inter_annotator_agreement.md";

const LANGS = ["DE","AR","ES","PT","ZH","HI","TH","UR"];

async function fetchXLSX(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

function mostCommon(arr) {
  if (!arr.length) return null;
  const freq = {};
  arr.forEach(a => freq[a] = (freq[a] || 0) + 1);
  let max = 0, label = null;
  for (const [k,v] of Object.entries(freq)) if (v>max){ max=v; label=k; }
  return {label, count:max};
}

async function main() {
  const allData = {};

  // ---- Load each annotation file
  for (const code of LANGS) {
    const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${ANNOT_PATH}annotations_${code}.xlsx`;
    const rows = await fetchXLSX(url);
    if (!rows) continue;

    const headers = rows[0].map(h => h.toLowerCase());
    const idIdx = headers.indexOf("id");
    const relIdx = headers.indexOf("relation");

    rows.slice(1).forEach(r => {
      const id = r[idIdx];
      const rel = r[relIdx];
      if (!id || !rel) return;
      if (!allData[id]) allData[id] = [];
      allData[id].push(rel);
    });
  }

  // ---- Compute per-item agreement
  let report = `# 🤝 Inter-Annotator Agreement Report\n\nUpdated: ${new Date().toUTCString()}\n\n`;
  report += `| ID | Entailment | Contradiction | Neutral | NonSense | Annotators | Agreement % | Dominant Label |\n`;
  report += `|----|-------------|---------------|----------|-----------|-------------|--------------|----------------|\n`;

  let totalAgree = 0, totalItems = 0;

  for (const [id, labels] of Object.entries(allData)) {
    const counts = {Entailment:0, Contradiction:0, Neutral:0, NonSense:0};
    labels.forEach(l => { if(counts[l]!==undefined) counts[l]++; });
    const {label, count} = mostCommon(labels);
    const agreePct = (count / labels.length) * 100;
    report += `| ${id} | ${counts.Entailment} | ${counts.Contradiction} | ${counts.Neutral} | ${counts.NonSense} | ${labels.length} | ${agreePct.toFixed(1)}% | ${label} |\n`;
    totalAgree += agreePct;
    totalItems++;
  }

  const avgAgreement = totalAgree / totalItems;
  report += `\n**Average Agreement:** ${avgAgreement.toFixed(2)}%\n`;

  fs.mkdirSync("Reports", { recursive: true });
  fs.writeFileSync(REPORT_PATH, report);
  console.log(report);
}

await main();
