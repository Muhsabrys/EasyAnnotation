/**
 * ============================================================
 *  EasyAnnotation — Phenomenon Effect Analysis
 * ============================================================
 * This script evaluates how specific linguistic phenomena
 * (conditionality, modality, etc.) influence label variation.
 *
 * It uses:
 *  - Gold standard labels (GoldStandard/gold_standard.csv)
 *  - Annotator outputs (Annotations/annotations_LANG.xlsx)
 *  - Phenomena mapping (GoldStandard/Phenomena.xlsx)
 *
 * Output:
 *  - Markdown summary: Reports/Phenomena_Report.md
 *  - Contains per-phenomenon confusion + F1 and deviation stats
 * ============================================================
 */

import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import Papa from "papaparse";

const ROOT = process.cwd();
const GOLD_STANDARD_PATH = path.join(ROOT, "GoldStandard/gold_standard.csv");
const PHENOMENA_PATH = path.join(ROOT, "GoldStandard/Phenomena.xlsx");
const ANNOTATIONS_DIR = path.join(ROOT, "Annotations/");
const REPORT_PATH = path.join(ROOT, "Reports/Phenomena_Report.md");

// =============================
// Helper Functions
// =============================
function loadCSV(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  return Papa.parse(text, { header: true }).data.filter(r => r.ID && r.Annotation);
}

function loadPhenomena() {
  const wb = XLSX.readFile(PHENOMENA_PATH);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet);
  const map = {};
  json.forEach(r => {
    map[r.ID] = r.assigned_phenomenon?.trim().toLowerCase() || "unknown";
  });
  return map;
}

function loadAnnotations() {
  const files = fs.readdirSync(ANNOTATIONS_DIR).filter(f => f.endsWith(".xlsx"));
  const allLangData = {};

  for (const file of files) {
    const wb = XLSX.readFile(path.join(ANNOTATIONS_DIR, file));
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const lang = file.split("_")[1].split(".")[0]; // annotations_LANG.xlsx
    allLangData[lang] = data
      .filter(r => r.id && r.relation && r.relation !== "NonSense")
      .map(r => ({ id: String(r.id).trim(), relation: r.relation.trim() }));
  }
  return allLangData;
}

function confusionStats(gold, annot) {
  const validLabels = ["Entailment", "Contradiction", "Neutral"];
  let total = 0,
    match = 0;
  const counts = { Entailment: 0, Contradiction: 0, Neutral: 0 };
  for (const g of gold) {
    const a = annot.find(x => x.id === g.ID);
    if (!a) continue;
    if (!validLabels.includes(a.relation)) continue;
    total++;
    if (a.relation === g.Annotation) match++;
    counts[a.relation]++;
  }
  const acc = total ? (match / total) * 100 : 0;
  return { total, match, acc, counts };
}

// =============================
// Main Analysis
// =============================
function analyzePhenomena() {
  const gold = loadCSV(GOLD_STANDARD_PATH);
  const phenomenaMap = loadPhenomena();
  const annots = loadAnnotations();

  const phenomena = ["conditionality", "modality", "comparatives|quantifier_scope", "intensionality"];
  const results = [];

  for (const lang of Object.keys(annots)) {
    for (const pheno of phenomena) {
      const relevant = gold.filter(g => phenomenaMap[g.ID] === pheno);
      const stats = confusionStats(relevant, annots[lang] || []);
      results.push({
        language: lang,
        phenomenon: pheno,
        total: stats.total,
        matched: stats.match,
        accuracy: stats.acc.toFixed(2),
        entailment: stats.counts.Entailment,
        contradiction: stats.counts.Contradiction,
        neutral: stats.counts.Neutral,
      });
    }
  }

  return results;
}

// =============================
// Report Generation
// =============================
function generateMarkdown(results) {
  let md = `# 🧩 Phenomenon Sensitivity Report\n`;
  md += `Generated: ${new Date().toUTCString()}\n\n`;
  md += `This report analyzes how specific linguistic phenomena affected annotation-label stability across languages.\n\n`;

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.language]) acc[r.language] = [];
    acc[r.language].push(r);
    return acc;
  }, {});

  for (const [lang, rows] of Object.entries(grouped)) {
    md += `## ${lang.toUpperCase()}\n\n`;
    md += `| Phenomenon | Samples | Accuracy (%) | Entailment | Contradiction | Neutral |\n`;
    md += `|-------------|----------|---------------|-------------|----------------|----------|\n`;
    for (const r of rows) {
      md += `| ${r.phenomenon} | ${r.total} | ${r.accuracy} | ${r.entailment} | ${r.contradiction} | ${r.neutral} |\n`;
    }

    const avg = rows.reduce((a, b) => a + parseFloat(b.accuracy), 0) / rows.length;
    md += `\n**Average Accuracy across phenomena:** ${avg.toFixed(2)}%\n\n`;
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, md);
  console.log("✅ Phenomena report generated at:", REPORT_PATH);
}

// =============================
// Run
// =============================
generateMarkdown(analyzePhenomena());
