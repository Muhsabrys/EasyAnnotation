/***************************************************
 * EASYANNOTATION NLI TOOL – XLSX PERSISTENT VERSION
 * Repo: Muhsabrys/EasyAnnotation
 * Each language has ONE .xlsx file on GitHub.
 * Annotators can recall and update it seamlessly.
 ***************************************************/

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
let fileSHA = null;

// ====== LANGUAGE ACCESS ======
function requestLanguageAccess() {
  const entered = prompt("Enter your language access code:");
  if (!entered || !validCodes[entered.trim()]) {
    alert("❌ Invalid code. Please contact the project admin.");
    document.body.innerHTML = "<h2>Access denied.</h2>";
    throw new Error("Unauthorized");
  } else {
    userLanguage = validCodes[entered.trim()];
    localStorage.setItem("AnnotatorLanguage", userLanguage);
    document.title = `NLI Annotation – ${userLanguage}`;
    alert(`✅ Access granted for ${userLanguage} annotators.`);
  }
}

// ====== GLOBALS ======
const annotationOptions = ["Entailment", "Contradiction", "Neutral", "NoneSense"];
let currentPage = 0;
const pageSize = 150;
const GITHUB_REPO = "Muhsabrys/EasyAnnotation";
const DATA_PATH = "datasets/NLI/";
const ANNO_PATH = "Annotations/";

function getTextDirection() {
  if (userLanguage === "Arabic" || userLanguage === "Urdu") return "rtl";
  return "ltr";
}

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
  let html = `<table>
    <thead><tr><th>ID</th><th>Premise</th><th>Hypothesis</th><th>Relation</th></tr></thead>
    <tbody>`;
  const start = currentPage * pageSize;
  const end = Math.min(data.length, start + pageSize);

  for (let i = start; i < end; i++) {
    const row = data[i];
    html += `<tr>
      <td>${row.id}</td>
      <td style="direction:${getTextDirection()}; text-align:${getTextDirection() === 'rtl' ? 'right' : 'left'};">${row.premise}</td>
      <td style="direction:${getTextDirection()}; text-align:${getTextDirection() === 'rtl' ? 'right' : 'left'};">${row.hypothesis}</td>
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
  document.getElementById("pageIndicator").textContent = `Page ${currentPage + 1} of ${totalPages}`;
  document.getElementById("prevBtn").disabled = currentPage === 0;
  document.getElementById("nextBtn").disabled = currentPage >= totalPages - 1;
}

// ====== LOAD FUNCTION ======
async function loadFromGitHub() {
  const code = langCodeMap[userLanguage];
  const annoFileURL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${ANNO_PATH}annotations_${code}.xlsx`;

  try {
    const resp = await fetch(annoFileURL);
    if (resp.ok) {
      const json = await resp.json();
      fileSHA = json.sha;
      const binary = atob(json.content);
      const buffer = new ArrayBuffer(binary.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);

      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      saveProgress(rows);
      buildTable(rows);
      alert("✅ Loaded existing annotations from GitHub.");
    } else {
      // load fresh dataset
      const dataURL = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${DATA_PATH}NLI_${code}.xlsx`;
      const res = await fetch(dataURL);
      const buffer = await res.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      rows.forEach(r => (r.relation = "NoneSense"));
      saveProgress(rows);
      buildTable(rows);
      alert("📄 Started a new annotation file.");
    }
  } catch (err) {
    alert("❌ Error loading: " + err);
  }
}

// ====== SAVE TO GITHUB (XLSX UPDATE) ======
document.getElementById("saveGithubBtn").addEventListener("click", async () => {
  const token = document.getElementById("githubToken").value.trim();
  if (!token) return alert("Please enter your GitHub token.");

  const data = loadProgress();
  if (!data) return alert("No data to upload.");

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Annotations");
  const xlsxBinary = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

  const code = langCodeMap[userLanguage];
  const filePath = `${ANNO_PATH}annotations_${code}.xlsx`;

  const payload = {
    message: `Update ${filePath} (${userLanguage})`,
    content: xlsxBinary,
    branch: "main"
  };
  if (fileSHA) payload.sha = fileSHA;

  const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (resp.ok) {
    const json = await resp.json();
    fileSHA = json.content.sha;
    alert(`✅ Annotations updated successfully for ${userLanguage}.`);
  } else {
    const err = await resp.text();
    alert("❌ GitHub update failed:\n" + err);
  }
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

// ====== PAGE LOAD ======
document.addEventListener("DOMContentLoaded", () => {
  requestLanguageAccess();
  document.getElementById("loadBtn").addEventListener("click", loadFromGitHub);
});
