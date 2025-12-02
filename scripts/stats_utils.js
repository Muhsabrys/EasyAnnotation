// Minimal chi-square + Cramér’s V helpers
import { chiSquaredTest } from "simple-statistics";

export function chiSquareTest(matrixObj) {
  const labels = Object.keys(matrixObj);
  const table = labels.map(r => labels.map(c => matrixObj[r][c] || 0));
  const { pValue, chiSquared } = chiSquaredTest(table);
  return { chi2: chiSquared, p: pValue };
}

export function cramersV(matrixObj) {
  const labels = Object.keys(matrixObj);
  const table = labels.map(r => labels.map(c => matrixObj[r][c] || 0));
  const n = table.flat().reduce((a,b)=>a+b,0);
  const rows = table.length, cols = table[0].length;
  const rowSums = table.map(r => r.reduce((a,b)=>a+b,0));
  const colSums = table[0].map((_,j)=>table.reduce((a,b)=>a+b[j],0));
  const exp = table.map((r,i)=>r.map((_,j)=>(rowSums[i]*colSums[j])/n));
  const chi2 = table.reduce((s,r,i)=>s+r.reduce((t,v,j)=>t+((v-exp[i][j])**2)/(exp[i][j]||1),0),0);
  return Math.sqrt(chi2/(n*(Math.min(rows,cols)-1)));
}
