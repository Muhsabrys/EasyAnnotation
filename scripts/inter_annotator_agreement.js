/**
 * EASYANNOTATION – INTER-ANNOTATOR AGREEMENT REPORT (WITH FLEISS' KAPPA)
 * Excludes NonSense and empty rows.
 * Calculates per-item agreement, average agreement, chi-square, Fleiss' kappa.
 * Outputs clean Markdown report.
 */

import fs from "fs";
import fetch from "node-fetch";
import * as XLSX from "xlsx";

const GITHUB_REPO = "Muhsabrys/EasyAnnotation";
const ANNOT_PATH = "Annotations/";
const REPORT_PATH = "Reports/inter_annotator_agreement.md";
const LANGS = ["DE", "AR", "ES", "PT", "ZH", "HI", "TH", "UR"];
const VALID_LABELS = ["Entailment", "Contradiction", "Neutral"];

// ============ Helper Functions ============

// Fetch XLSX file and return rows
async function fetchXLSX(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

// Return the most common label and its count
function mostCommon(arr) {
  if (!arr.length) return { label: "-", count: 0 };
  const freq = {};
  arr.forEach(a => (freq[a] = (freq[a] || 0) + 1));
  let max = 0,
    label = null;
  for (const [k, v] of Object.entries(freq))
    if (v > max) {
      max = v;
      label = k;
    }
  return { label, count: max };
}

// Compute chi-square test safely
function chiSquareTest(observed) {
  const total = observed.reduce((a, b) => a + b, 0);
  const expected = observed.map(() => total / observed.length);
  const chi2 = observed.reduce(
    (s, obs, i) => s + Math.pow(obs - expected[i], 2) / expected[i],
    0
  );
  const df = observed.length - 1;

  // Safe p-value approximation
  let p;
  if (chi2 > 20) p = 0;
  else p = Math.exp(-0.5 * chi2);
  return { chi2, df, p };
}

function interpretP(p) {
  if (p < 0.001) return "Statistically significant (p < 0.001)";
  if (p < 0.01) return "Statistically significant (p < 0.01)";
  if (p < 0.05) return "Significant (p < 0.05)";
  return "Not statistically significant (p ≥ 0.05)";
}

// Compute Fleiss' Kappa
function fleissKappa(itemLabels, labelSet = VALID_LABELS) {
  const nItems = itemLabels.length;
  if (nItems === 0) return 0;

  const nCategories = labelSet.length;

  // 1. Count category proportions across all items
  const totalLabelCounts = Array(nCategories).fill(0);
  let totalRatings = 0;

  // 2. Compute per-item agreement (Pi)
  const Pi = [];

  for (const labels of itemLabels) {
    const counts = labelSet.map(lbl => labels.filter(x => x === lbl).length);
    const nAnnotators = counts.reduce((a, b) => a + b, 0);
    totalRatings += nAnnotators;

    // Add to total counts
    counts.forEach((c, i) => (totalLabelCounts[i] += c));

    // Compute Pi for this item
    if (nAnnotators > 1) {
      const sumSquares = counts.reduce((s, c) => s + c * (c - 1), 0);
      Pi.push(sumSquares / (nAnnotators * (nAnnotators - 1)));
    }
  }

  // 3. Compute mean of Pi
  const Pbar = Pi.reduce((a, b) => a + b, 0) / Pi.length;

  // 4. Compute overall label distribution
  const Pj = totalLabelCounts.map(c => c / totalRatings);
  const PbarE = Pj.reduce((a, b) => a + b * b, 0);

  // 5. Fleiss' Kappa formula
  const kappa = (Pbar - PbarE) / (1 - PbarE);
  return kappa;
}

// ============ Main ============

async function main() {
  const allData = {};

  // Load all annotation files
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
      if (!id || !VALID_LABELS.includes(rel)) return; // skip NonSense / empty
      if (!allData[id]) allData[id] = [];
      allData[id].push(rel);
    });
  }

  // Per-item agreement
  let report = `# 🤝 Inter-Annotator Agreement Report (Valid Labels Only)\n\nUpdated: ${new Date().toUTCString()}\n\n`;
  report += `| ID | Entailment | Contradiction | Neutral | Annotators | Agreement % | Dominant Label |\n`;
  report += `|----|-------------|---------------|----------|-------------|--------------|----------------|\n`;

  let totalAgree = 0,
    totalItems = 0;
  const allLabels = [];
  const itemLabels = [];

  for (const [id, labels] of Object.entries(allData)) {
    if (labels.length === 0) continue;

    const counts = { Entailment: 0, Contradiction: 0, Neutral: 0 };
    labels.forEach(l => counts[l]++);
    const { label, count } = mostCommon(labels);
    const agreePct = (count / labels.length) * 100;

    report += `| ${id} | ${counts.Entailment} | ${counts.Contradiction} | ${counts.Neutral} | ${labels.length} | ${agreePct.toFixed(
      1
    )}% | ${label} |\n`;

    totalAgree += agreePct;
    totalItems++;
    allLabels.push(...labels);
    itemLabels.push(labels);
  }

  const avgAgreement = totalItems > 0 ? totalAgree / totalItems : 0;

  // Chi-square
  const observed = VALID_LABELS.map(lbl => allLabels.filter(x => x === lbl).length);
  const { chi2, df, p } = chiSquareTest(observed);
  const interpretation = interpretP(p);

  // Fleiss' Kappa
  const kappa = fleissKappa(itemLabels, VALID_LABELS);

  report += `\n**Average Agreement:** ${avgAgreement.toFixed(2)}% (${totalItems} items)\n`;
  report += `**Chi-square test:** χ² = ${chi2.toFixed(2)}, df = ${df}, p ≈ ${p.toFixed(4)} → ${interpretation}\n`;
  report += `**Fleiss’ κ (Kappa):** ${kappa.toFixed(3)} ${interpretKappa(kappa)}\n`;

  fs.mkdirSync("Reports", { recursive: true });
  fs.writeFileSync(REPORT_PATH, report);
  console.log(report);
}

function interpretKappa(kappa) {
  if (kappa >= 0.81) return "→ Almost perfect agreement";
  if (kappa >= 0.61) return "→ Substantial agreement";
  if (kappa >= 0.41) return "→ Moderate agreement";
  if (kappa >= 0.21) return "→ Fair agreement";
  if (kappa >= 0.01) return "→ Slight agreement";
  return "→ Poor agreement";
}

await main();
