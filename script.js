/***************************************************
 * EASYANNOTATION NLI TOOL – SMART XLSX VERSION
 * Workflow:
 * 1. Access Control
 * 2. Smart Load (Annotations -> datasets fallback)
 * 3. Annotate with Radio Buttons
 * 4. Auto-save (LocalStorage)
 * 5. Save to GitHub (with SHA + Backup)
 * 6. Download XLSX
 * 7. Pagination (150 per page)
 ***************************************************/

// ===== CONFIGURATION =====
const GITHUB_REPO = "Muhsabrys/EasyAnnotation";
const BASE_PATH = "datasets/NLI/";
const OUTPUT_PATH = "Annotations/";
const BACKUP_PATH = "Backups/";
const PAGE_SIZE = 150;

// ===== LANGUAGE ACCESS CONTROL =====
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
let currentPage = 0;
let allData = [];

// ===== ACCESS PROMPT =====
function requestAccess() {
  const code = prompt("Enter your language access code:");
  if (!code || !validCodes[code.trim()]) {
    alert("❌ Invalid code. Contact admin.");
    document.body.innerHTML = "<h2>Access denied.</h2>";
    throw new Error("Unauthorized");
  }
  userLanguage = validCodes[code.trim()];
  document.title = `NLI Annotation – ${userLanguage}`;
  alert(`✅ Access granted for ${userLanguage} annotators.`);
}

// ===== LOCAL STORAGE =====
function saveLocal(data) {
  localStorage.setItem(`NLI_${userLanguage}`, JSON.stringify(data));
}
function loadLocal() {
  const saved = localStorage.getItem(`NLI_${userLanguage}`);
  return saved ? JSON.parse(saved) : null;
}

// ===== XLSX HELPERS =====
async function fetchXLSX(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = await res.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1 });
}

async function loadSmart() {
  const code = langCodeMap[userLanguage];
  const annURL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${OUTPUT_PATH}annotations_${code}.xlsx`;
  const baseURL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${BASE_PATH}NLI_${code}.xlsx`;

  let rows = await fetchXLSX(annURL);
  if (!rows) {
    alert(`⚠️ No saved annotations found. Loading base dataset.`);
    rows = await fetchXLSX(baseURL);
    if (!rows) {
      alert("❌ Could not load any data.");
      return [];
    }
  } else {
    alert(`✅ Loaded saved annotations for ${userLanguage}.`);
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

  saveLocal(data);
  return data;
}

// ===== TABLE DISPLAY =====
function renderTable() {
  const container = document.getElementById("tableContainer");
  if (!container) return;

  const start = currentPage * PAGE_SIZE;
  const end = Math.min(allData.length, start + PAGE_SIZE);
  let html = `<table style="width:100%; border-collapse:collapse;">
  <thead><tr>
  <th>ID</th><th>Premise</th><th>Hypothesis</th><th>Relation</th>
  </tr></thead><tbody>`;

  for (let i = start; i < end; i++) {
    const row = allData[i];
    html += `<tr>
      <td>${row.id}</td>
      <td>${row.premise}</td>
      <td>${row.hypothesis}</td>
      <td>
        <div class="radio-group" style="display:flex;gap:20px;align-items:center;">
          ${["Entailment", "Contradiction", "Neutral", "NonSense"].map(opt => {
            const checked = row.relation === opt ? "checked" : "";
            return `
              <label style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">
                <input type="radio" name="rel${i}" value="${opt}" ${checked}>
                <span>${opt}</span>
              </label>`;
          }).join("")}
        </div>
      </td>
      </tr>`;

  }

  html += `</tbody></table>
  <div style="margin-top:10px; text-align:center;">
    <button id="prevBtn">Previous</button>
    <span> Page ${currentPage + 1} of ${Math.ceil(allData.length / PAGE_SIZE)} </span>
    <button id="nextBtn">Next</button>
  </div>`;

  container.innerHTML = html;
  bindRadios(start, end);
  bindPagination();
}

function bindRadios(start, end) {
  for (let i = start; i < end; i++) {
    const radios = document.getElementsByName("rel" + i);
    radios.forEach(r => {
      r.addEventListener("change", () => {
        allData[i].relation = r.value;
        saveLocal(allData);
      });
    });
  }
}

function bindPagination() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage >= Math.ceil(allData.length / PAGE_SIZE) - 1;
  prevBtn.onclick = () => {
    if (currentPage > 0) {
      currentPage--;
      renderTable();
    }
  };
  nextBtn.onclick = () => {
    if (currentPage < Math.ceil(allData.length / PAGE_SIZE) - 1) {
      currentPage++;
      renderTable();
    }
  };
}

// ===== XLSX SAVE (LOCAL DOWNLOAD) =====
function downloadXLSX() {
  const ws = XLSX.utils.json_to_sheet(allData, { header: ["id", "premise", "hypothesis", "relation"] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Annotations");
  XLSX.writeFile(wb, `annotations_${langCodeMap[userLanguage]}_local.xlsx`);
}

// ===== GITHUB SAVE (WITH SHA & BACKUP) =====
async function saveToGitHub() {
  const token = prompt("Enter your GitHub token:");
  if (!token) return alert("GitHub token required.");

  const code = langCodeMap[userLanguage];
  const mainPath = `${OUTPUT_PATH}annotations_${code}.xlsx`;
  const backupPath = `${BACKUP_PATH}backup_${code}_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;

  const ws = XLSX.utils.json_to_sheet(allData, { header: ["id", "premise", "hypothesis", "relation"] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Annotations");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

  async function getSHA(path) {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
  }

  const sha = await getSHA(mainPath);
  async function upload(path, msg, sha) {
    const body = {
      message: msg,
      content: wbout,
      branch: "main"
    };
    if (sha) body.sha = sha;
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      method: "PUT",
      headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return res.ok;
  }

  const mainOK = await upload(mainPath, `Update ${userLanguage} annotations`, sha);
  const backupOK = await upload(backupPath, `Backup ${userLanguage} annotations`, null);

  if (mainOK && backupOK) alert("✅ Saved to GitHub (main + backup)");
  else alert("❌ GitHub save failed.");
}

// ===== MAIN INIT =====
document.addEventListener("DOMContentLoaded", async () => {
  requestAccess();
  const local = loadLocal();
  if (local) {
    allData = local;
    alert("📦 Loaded progress from local storage.");
  } else {
    allData = await loadSmart();
  }
  if (allData.length) renderTable();

  // Bind buttons if exist
  const loadBtn = document.getElementById("loadBtn");
  const saveBtn = document.getElementById("saveBtn");

  if (loadBtn) loadBtn.onclick = async () => {
    allData = await loadSmart();
    renderTable();
  };
  if (saveBtn) saveBtn.onclick = saveToGitHub;
  if (downloadBtn) downloadBtn.onclick = downloadXLSX;
});
