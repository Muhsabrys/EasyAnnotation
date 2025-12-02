// scripts/stats_utils.js
import chi2test from "@stdlib/stats-chi2test";

/**
 * Performs a chi-square test for independence on a contingency table.
 * Input format: { label1: { label1: count, label2: count, ... }, ... }
 */
export function chiSquareTest(matrixObj) {
  const labels = Object.keys(matrixObj);
  const table = labels.map(r => labels.map(c => matrixObj[r][c] || 0));

  const result = chi2test(table);
  const { statistic: chi2, pValue: p } = result;

  const df = (table.length - 1) * (table[0].length - 1);
  return { chi2, p, df };
}

/**
 * Computes Cramér’s V for effect size of chi-square test
 */
export function cramersV(matrixObj) {
  const labels = Object.keys(matrixObj);
  const table = labels.map(r => labels.map(c => matrixObj[r][c] || 0));

  const n = table.flat().reduce((a, b) => a + b, 0);
  const rows = table.length;
  const cols = table[0].length;

  const { chi2 } = chiSquareTest(matrixObj);
  return Math.sqrt(chi2 / (n * (Math.min(rows, cols) - 1)));
}
