import { chiSquare, chiSquareCriticalValue } from "@folge3/chi-square";

/**
 * Perform chi-square test on a contingency table matrixObj
 */
export function chiSquareTest(matrixObj) {
  const labels = Object.keys(matrixObj);
  const table = labels.map(r => labels.map(c => matrixObj[r][c] ?? 0));
  const result = chiSquare({
    rows: labels,
    columns: labels,
    data: table
  }, 0.05);
  // result has statistic, df, pValue etc.
  return {
    chi2: result.statistic,
    df: result.df,
    p: result.pValue
  };
}
