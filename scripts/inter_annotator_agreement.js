/**
 * EASYANNOTATION – INTER-ANNOTATOR AGREEMENT REPORT (PURE JS)
 * Excludes NonSense and empty rows.
 * Calculates per-item agreement, overall stats, and chi-square test (no deps).
 */

import fs from "fs";
import fetch from "node-fetch";
import * as XLSX from "xlsx";

const GITHUB_REPO = "Muhsabrys/EasyAnnotation";
const ANNOT_PATH = "Annotations/";
const REPORT_PATH = "Reports/inter_annotator_agreement.md";
const LANGS = ["DE","AR","ES","PT","ZH","HI","TH","UR"];
const VALID_LABELS = ["Entailment", "Contradiction", "Neutral"];

// ---- Helpers ----
async function fetchXLSX(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

function mostCommon(arr) {
  if (!arr.length) return { label: "-", count: 0 };
  const freq = {};
  arr.forEach(a => freq[a] = (freq[a] || 0) + 1);
  let max = 0, label = null;
  for (const [k,v] of Object.entries(freq)) if (v > max){ max=v; label=k; }
  return { label, count:max };
}

function chiSquareTest(observed) {
  const total = observed.reduce((a,b) => a+b, 0);
  const expected = observed.map(() => total / observed.length);
  const chi2 = observed.reduce((s,obs,i) => s + Math.pow(obs - expected[i], 2) / expected[i], 0);
  const df = observed.length - 1;

  // p-value approximation using incomplete gamma function (simplified)
  function gammaIncomplete(a, x) {
    let sum = 1 / a, value = 1 / a, n = 1;
    while (value > sum * 1e-8) {
      value *= x / (a + n);
      sum += value;
      n++;
    }
    return sum * Math.exp(-x + a * Math.log(x));
  }

  function gamma(a) {
    return Math.sqrt(2 * Math.PI / a) * Math.pow(a / Math.E, a);
  }

  const p = 1 - gammaIncomplete(df / 2, chi2 / 2) / gamma(df / 2);
  return { chi2, df, p };
}

// ---- Main ----
async function main() {
  const allData = {};

  // Load all annotation XLSX files
  for (const code of LANGS) {
    const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${ANNOT_PATH}annotations_${code}.xlsx`;
    const rows = await fetchXLSX(url);
    if (!rows) continue;

    const headers = rows[0].map(h => h.toLowerCase());
    const idIdx = headers.indexOf("id");
    const relIdx = headers.indexOf("relation");

    rows.slice(1).forEach(r => {
      const id = r[idIdx];
      const rel = r[relIdx]?.trim();
      if (!id || !VALID_LABELS.includes(rel)) return; // skip NonSense or empty
      if (!allData[id]) allData[id] = [];
      allData[id].push(rel);
    });
  }

  // Compute per-item agreement
  let report = `# 🤝 Inter-Annotator Agreement Report (Valid Labels Only)\n\nUpdated: ${new Date().toUTCString()}\n\n`;
  report += `| ID | Entailment | Contradiction | Neutral | Annotators | Agreement % | Dominant Label |\n`;
  report += `|----|-------------|---------------|----------|-------------|--------------|----------------|\n`;

  let totalAgree = 0, totalItems = 0;
  const allLabels = [];

  for (const [id, labels] of Object.entries(allData)) {
    if (labels.length === 0) continue;

    const counts = {Entailment:0, Contradiction:0, Neutral:0};
    labels.forEach(l => counts[l]++);
    const {label, count} = mostCommon(labels);
    const agreePct = (count / labels.length) * 100;

    report += `| ${id} | ${counts.Entailment} | ${counts.Contradiction} | ${counts.Neutral} | ${labels.length} | ${agreePct.toFixed(1)}% | ${label} |\n`;

    totalAgree += agreePct;
    totalItems++;
    allLabels.push(...labels);
  }

  const avgAgreement = totalItems > 0 ? totalAgree / totalItems : 0;

  // Chi-square test across all labels
  const observed = VALID_LABELS.map(lbl => allLabels.filter(x => x === lbl).length);
  const { chi2, df, p } = chiSquareTest(observed);

  report += `\n**Average Agreement:** ${avgAgreement.toFixed(2)}% (${totalItems} items)\n`;
  report += `**Chi-square test:** χ² = ${chi2.toFixed(2)}, df = ${df}, p ≈ ${p.toFixed(4)}\n`;

  fs.mkdirSync("Reports", { recursive: true });
  fs.writeFileSync(REPORT_PATH, report);
  console.log(report);
}

await main();
