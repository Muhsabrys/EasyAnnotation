<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>NLI Annotation Interface</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.19.3/xlsx.full.min.js"></script>
<style>
  body {
    font-family: Arial, sans-serif;
    margin: 20px;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th, td {
    border: 1px solid #ccc;
    padding: 8px;
    vertical-align: top;
  }
  th {
    background-color: #f0f0f0;
  }
  .radio-group label {
    margin-right: 10px;
  }
</style>
</head>
<body>

<h2>NLI Annotation Interface</h2>
<p id="statusMsg">Please enter your access code to begin.</p>

<button id="loadBtn" style="display:none;">Load Data from GitHub</button>
<button id="downloadBtn" style="display:none;">Download XLSX</button>
<button id="saveGithubBtn" style="display:none;">Save to GitHub</button>
<input type="password" id="githubToken" placeholder="GitHub Token" style="display:none;margin-top:10px;width:300px;">

<div id="tableContainer"></div>

<div id="paginationContainer" style="display:none;margin-top:20px;">
  <button id="prevBtn">Previous</button>
  <span id="pageIndicator"></span>
  <button id="nextBtn">Next</button>
</div>

<script>
/***************************************************
 * EASYANNOTATION NLI TOOL – FINAL SHA-SAFE VERSION
 * Author: Muhammad S. Abdo
 * Repo: Muhsabrys/EasyAnnotation
 * Features:
 *  • XLSX-only annotations
 *  • Secure SHA-based GitHub updates
 *  • Smart recall (annotation_DE.xlsx first, else NLI_DE.xlsx)
 ***************************************************/

// ====== LANGUAGE ACCESS CONTROL ======
const validCodes = {
  "DE-L1-2025-NLI": "German",
  "AR-L2-2025-NLI": "Arabic",
  "ES-L3-2025-NLI": "Spanish",
  "PT-L4-2025-NLI": "Portuguese",
  "ZH-L5-2025-NLI": "Chinese",
  "HI-L6-2025-NLI": "Hindi",
  "TH-L7-2025-NLI": "Thai",
  "UR-L8-2025-NLI": "Urdu"
};

const langCodeMap = {
  "German": "DE",
  "Arabic": "AR",
  "Spanish": "ES",
  "Portuguese": "PT",
  "Chinese": "ZH",
  "Hindi": "HI",
  "Thai": "TH",
  "Urdu": "UR"
};

let userLanguage = null;

// ====== GLOBAL VARIABLES ======
const annotationOptions = ["Entailment", "Contradiction", "Neutral", "NonSense"];
let currentPage = 0;
const pageSize = 150;
const GITHUB_REPO = "Muhsabrys/EasyAnnotation";
const BASE_DATA_PATH = "datasets/NLI/";
const OUTPUT_FOLDER = "Annotations/";
const BACKUP_FOLDER = "Backups/";

// ====== LOCAL STORAGE HELPERS ======
function saveProgress(data) {
  localStorage.setItem("Data", JSON.stringify(data));
}
function loadProgress() {
  const saved = localStorage.getItem("Data");
  return saved ? JSON.parse(saved) : null;
}

// ====== BUILD TABLE ======
function buildTable(data) {
  const tableContainer = document.getElementById("tableContainer");
  let html = `<table><thead><tr>
    <th>ID</th><th>Premise</th><th>Hypothesis</th><th>Relation</th>
  </tr></thead><tbody>`;

  const start = currentPage * pageSize;
  const end = Math.min(data.length, start + pageSize);

  for (let i = start; i < end; i++) {
    const row = data[i];
    html += `<tr>
      <td>${row.id || ""}</td>
      <td>${row.premise || ""}</td>
      <td>${row.hypothesis || ""}</td>
      <td><div class="radio-group">`;

    annotationOptions.forEach(opt => {
      const checked = row.relation === opt ? "checked" : "";
      html += `<label><input type="radio" name="rel${i}" value="${opt}" ${checked}> ${opt}</label>`;
    });

    html += `</div></td></tr>`;
  }

  html += `</tbody></table>`;
  tableContainer.innerHTML = html;
  attachListeners(data, start, end);
  updatePagination(data);
  document.getElementById("downloadBtn").style.display = "block";
  document.getElementById("saveGithubBtn").style.display = "block";
  document.getElementById("githubToken").style.display = "block";
}

function attachListeners(data, start, end) {
  for (let i = start; i < end; i++) {
    const radios = document.getElementsByName("rel" + i);
    radios.forEach(radio => {
      radio.addEventListener("change", () => {
        data[i].relation = radio.value;
        saveProgress(data);
      });
    });
  }
}

function updatePagination(data) {
  const totalPages = Math.ceil(data.length / pageSize);
  const pagCont = document.getElementById("paginationContainer");
  pagCont.style.display = data.length > pageSize ? "block" : "none";
  document.getElementById("pageIndicator").textContent = `Page ${currentPage + 1} of ${totalPages}`;
  document.getElementById("prevBtn").disabled = currentPage === 0;
  document.getElementById("nextBtn").disabled = currentPage >= totalPages - 1;
}

// ====== SMART FILE LOAD ======
async function loadFromGitHub() {
  if (!userLanguage) {
    alert("Please enter your access code first.");
    return;
  }

  const code = langCodeMap[userLanguage];
  const annotationFile = `${OUTPUT_FOLDER}annotations_${code}.xlsx`;
  const baseFile = `${BASE_DATA_PATH}NLI_${code}.xlsx`;

  async function tryLoad(path) {
    const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_REPO}/main/${path}`);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  }

  let rows = await tryLoad(annotationFile);
  if (!rows) {
    alert(`⚠️ No saved annotations found for ${userLanguage}. Loading original dataset.`);
    rows = await tryLoad(baseFile);
    if (!rows) return alert("❌ Failed to load dataset.");
  } else {
    alert(`✅ Loaded annotations for ${userLanguage}.`);
  }

  const headers = rows[0].map(h => h.toLowerCase());
  const idIdx = headers.indexOf("id");
  const premIdx = headers.indexOf("premise");
  const hypIdx = headers.indexOf("hypothesis");
  const relIdx = headers.indexOf("relation");

  const data = rows.slice(1).map(r => ({
    id: r[idIdx] || "",
    premise: r[premIdx] || "",
    hypothesis: r[hypIdx] || "",
    relation: relIdx !== -1 ? (r[relIdx] || "NonSense") : "NonSense"
  }));

  saveProgress(data);
  currentPage = 0;
  buildTable(data);
}

// ====== GET FILE SHA ======
async function getFileSHA(path, token) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
    headers: { "Authorization": `token ${token}` }
  });
  if (!res.ok) return null;
  const meta = await res.json();
  return meta.sha;
}

// ====== SAVE TO GITHUB (SHA-SAFE) ======
document.getElementById("saveGithubBtn").addEventListener("click", async () => {
  const token = document.getElementById("githubToken").value.trim();
  if (!token) return alert("Please enter your GitHub token.");
  const data = loadProgress();
  if (!data) return alert("No data to upload.");

  const worksheetData = [
    ["ID", "Premise", "Hypothesis", "Relation"],
    ...data.map(r => [r.id, r.premise, r.hypothesis, r.relation])
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(wb, ws, "Annotations");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

  const code = langCodeMap[userLanguage];
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const mainPath = `${OUTPUT_FOLDER}annotations_${code}.xlsx`;
  const backupPath = `${BACKUP_FOLDER}backup_${code}_${timestamp}.xlsx`;

  async function uploadFile(path, msg) {
    const sha = await getFileSHA(path, token);
    const body = {
      message: msg,
      content: wbout,
      branch: "main"
    };
    if (sha) body.sha = sha;

    const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    return resp.ok;
  }

  const okMain = await uploadFile(mainPath, `Update ${userLanguage} annotations`);
  const okBackup = await uploadFile(backupPath, `Backup ${userLanguage} annotations`);

  if (okMain && okBackup)
    alert(`✅ Saved main + backup XLSX for ${userLanguage}.`);
  else alert("❌ Error saving to GitHub.");
});

// ====== LOCAL XLSX DOWNLOAD ======
document.getElementById("downloadBtn").addEventListener("click", () => {
  const data = loadProgress();
  if (!data) return alert("No data to download.");

  const worksheetData = [
    ["ID", "Premise", "Hypothesis", "Relation"],
    ...data.map(r => [r.id, r.premise, r.hypothesis, r.relation])
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(wb, ws, "Annotations");
  XLSX.writeFile(wb, `annotations_${langCodeMap[userLanguage]}.xlsx`);
});

// ====== PAGINATION ======
document.getElementById("prevBtn").addEventListener("click", () => {
  const data = loadProgress();
  if (currentPage > 0) {
    currentPage--;
    buildTable(data);
  }
});
document.getElementById("nextBtn").addEventListener("click", () => {
  const data = loadProgress();
  const totalPages = Math.ceil(data.length / pageSize);
  if (currentPage < totalPages - 1) {
    currentPage++;
    buildTable(data);
  }
});

// ====== INIT ======
window.addEventListener("DOMContentLoaded", () => {
  const entered = prompt("Enter your language access code:");
  if (!entered || !validCodes[entered.trim()]) {
    document.body.innerHTML = "<h2>❌ Access Denied: Invalid Code.</h2>";
    return;
  }
  userLanguage = validCodes[entered.trim()];
  document.title = `NLI Annotation – ${userLanguage}`;
  document.getElementById("statusMsg").innerText = `✅ Access granted for ${userLanguage}. Click 'Load Data from GitHub' to begin.`;
  document.getElementById("loadBtn").style.display = "inline-block";
  document.getElementById("loadBtn").addEventListener("click", loadFromGitHub);
});
</script>
</body>
</html>
