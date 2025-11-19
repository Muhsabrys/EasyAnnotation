/**
 * EASYANNOTATION – GOLD STANDARD EVALUATION SCRIPT (UPDATED)
 * Compares annotators' outputs with the gold standard CSV.
 * Excludes "NonSense" from F1/accuracy metrics but reports its frequency.
 */

import fs from "fs";
import fetch from "node-fetch";
import * as XLSX from "xlsx";

const GITHUB_REPO = "Muhsabrys/EasyAnnotation";
const GOLD_PATH = "GoldStandard/gold_standard.csv";
const ANNOT_PATH = "Annotations/";
const REPORT_PATH = "Reports/evaluation.md";

const LANGS = {
  DE: "German",
  AR: "Arabic",
  ES: "Spanish",
  PT: "Portuguese",
  ZH: "Chinese",
  HI: "Hindi",
  TH: "Thai",
  UR: "Urdu",
  TR: "Turkish",
  CN: "Cantonese"
};

async function fetchFile(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.text();
}

async function fetchXLSX(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

function computeMetrics(yTrue, yPred) {
  const labels = ["Entailment", "Contradiction", "Neutral"];
  let tp = {}, fp = {}, fn = {};
  labels.forEach(l => { tp[l]=0; fp[l]=0; fn[l]=0; });

  for (let i = 0; i < yTrue.length; i++) {
    const gold = yTrue[i];
    const pred = yPred[i];
    if (!labels.includes(pred)) continue; // skip NonSense or invalid
    if (gold === pred) tp[gold]++;
    else {
      fp[pred] = (fp[pred] || 0) + 1;
      fn[gold] = (fn[gold] || 0) + 1;
    }
  }

  const results = {};
  let totalCorrect = 0;
  labels.forEach(l => {
    const p = tp[l] + fp[l] ? tp[l] / (tp[l] + fp[l]) : 0;
    const r = tp[l] + fn[l] ? tp[l] / (tp[l] + fn[l]) : 0;
    const f1 = p + r ? (2 * p * r) / (p + r) : 0;
    results[l] = { precision: p, recall: r, f1: f1 };
    totalCorrect += tp[l];
  });

  const accuracy = totalCorrect / yTrue.length;
  return { results, accuracy };
}

async function main() {
  // Load gold standard
  const goldURL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GOLD_PATH}`;
  const goldCSV = await fetchFile(goldURL);
  if (!goldCSV) throw new Error("Gold standard file not found.");
  const gold = {};
  goldCSV.split("\n").slice(1).forEach(line => {
    const [id, label] = line.trim().split(",");
    if (id && label) gold[id.trim()] = label.trim();
  });

  // Prepare report
  let report = `# 🧪 Gold Standard Evaluation Report\n\nUpdated: ${new Date().toUTCString()}\n\n`;
  report += `| Language | Accuracy | Entailment F1 | Contradiction F1 | Neutral F1 | NonSense % |\n`;
  report += `|-----------|-----------|----------------|------------------|-------------|-------------|\n`;

  let totalAll = 0, correctAll = 0;

  for (const code of Object.keys(LANGS)) {
    const lang = LANGS[code];
    const annURL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${ANNOT_PATH}annotations_${code}.xlsx`;
    const rows = await fetchXLSX(annURL);
    if (!rows) {
      report += `| ${lang} | ⚠️ Missing file | - | - | - | - |\n`;
      continue;
    }

    const headers = rows[0].map(h => h.toLowerCase());
    const idIdx = headers.indexOf("id");
    const relIdx = headers.indexOf("relation");

    const goldLabels = [], predLabels = [];
    let nonsenseCount = 0;
    let totalCount = 0;

    rows.slice(1).forEach(r => {
      const id = r[idIdx];
      const pred = r[relIdx]?.trim();
      if (!id || !pred) return;
      totalCount++;
      if (pred === "NonSense") {
        nonsenseCount++;
        return;
      }
      if (gold[id]) {
        goldLabels.push(gold[id]);
        predLabels.push(pred);
      }
    });

    if (goldLabels.length === 0) {
      report += `| ${lang} | 0% | - | - | - | ${(nonsenseCount/totalCount*100).toFixed(1)}% |\n`;
      continue;
    }

    const { results, accuracy } = computeMetrics(goldLabels, predLabels);
    totalAll += goldLabels.length;
    correctAll += Math.round(accuracy * goldLabels.length);

    report += `| ${lang} | ${(accuracy*100).toFixed(2)}% | ${(results.Entailment.f1*100).toFixed(1)} | ${(results.Contradiction.f1*100).toFixed(1)} | ${(results.Neutral.f1*100).toFixed(1)} | ${(nonsenseCount/totalCount*100).toFixed(1)}% |\n`;
  }

  const overallAcc = (correctAll / totalAll) * 100;
  report += `\n**Overall Accuracy (excluding NonSense):** ${overallAcc.toFixed(2)}%\n`;

  fs.mkdirSync("Reports", { recursive: true });
  fs.writeFileSync(REPORT_PATH, report);
  console.log(report);
}

await main();
