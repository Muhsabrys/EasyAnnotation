// scripts/stats_utils.js
// Custom statistical helpers for contingency tables
import * as ss from "simple-statistics";

/**
 * Computes Chi-square test (approximation)
 * Input: 2D object matrix like {Entailment:{Entailment:10,...}, ...}
 */
export function chiSquareTest(matrixObj) {
  const labels = Object.keys(matrixObj);
  const table = labels.map(r => labels.map(c => matrixObj[r][c] || 0));

  const n = table.flat().reduce((a, b) => a + b, 0);
  const rowSums = table.map(r => r.reduce((a, b) => a + b, 0));
  const colSums = table[0].map((_, j) => table.reduce((a, b) => a + b[j], 0));

  let chi2 = 0;
  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < table[i].length; j++) {
      const expected = (rowSums[i] * colSums[j]) / n;
      if (expected > 0) chi2 += Math.pow(table[i][j] - expected, 2) / expected;
    }
  }

  const df = (rowSums.length - 1) * (colSums.length - 1);
  const p = 1 - ss.chiSquaredDistributionCdf(chi2, df);

  return { chi2, p };
}

/**
 * Computes Cramér’s V effect size
 */
export function cramersV(matrixObj) {
  const labels = Object.keys(matrixObj);
  const table = labels.map(r => labels.map(c => matrixObj[r][c] || 0));
  const n = table.flat().reduce((a, b) => a + b, 0);
  const rows = table.length;
  const cols = table[0].length;

  const rowSums = table.map(r => r.reduce((a, b) => a + b, 0));
  const colSums = table[0].map((_, j) => table.reduce((a, b) => a + b[j], 0));

  let chi2 = 0;
  for (let i = 0; i < table.length; i++) {
    for (let j = 0; j < table[i].length; j++) {
      const expected = (rowSums[i] * colSums[j]) / n;
      if (expected > 0) chi2 += Math.pow(table[i][j] - expected, 2) / expected;
    }
  }

  return Math.sqrt(chi2 / (n * (Math.min(rows, cols) - 1)));
}
