/***************************************************
 * EASYANNOTATION NLI TOOL – CLEAN, STABLE, XLSX-ONLY
 * Repo: Muhsabrys/EasyAnnotation
 * Always saves and loads XLSX with columns:
 * ID | Premise | Hypothesis | Relation
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

// ====== LANGUAGE ACCESS PROMPT ======
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

// ====== FILE URL BUILDER ======
function getFileURLForLanguage(lang) {
  const code = langCodeMap[lang];
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${OUTPUT_FOLDER}annotations_${code}.xlsx`;
}

// ====== TABLE BUILDER ======
function buildTable(data) {
  const tableContainer = document.getElementById("tableContainer");
  let html = `<table style="width:100%; text-align:left;">
    <thead>
      <tr>
        <th>ID</th>
        <th>Premise</th>
        <th>Hypothesis</th>
        <th>Relation</th>
      </tr>
    </thead>
    <tbody>`;

  const start = currentPage * pageSize;
  const end = Math.min(data.length, start + pageSize);

  for (let i = start; i < end; i++) {
    const row = data[i];
    html += `
      <tr>
        <td>${row.id || ""}</td>
        <td>${row.premise || ""}</td>
        <td>${row.hypothesis || ""}</td>
        <td>
          <div class="radio-group">`;

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
  const pagCont = document.getElementById("paginationContainer");
  pagCont.style.display = data.length > pageSize ? "block" : "none";
  document.getElementById("pageIndicator").textContent = `Page ${currentPage + 1} of ${totalPages}`;
  document.getElementById("prevBtn").disabled = currentPage === 0;
  document.getElementById("nextBtn").disabled = currentPage >= totalPages - 1;
}

// ====== LOAD DATA FROM GITHUB (ANNOTATION FILE) ======
function loadFromGitHub() {
  if (!userLanguage) {
    alert("Please enter your access code first.");
    return;
  }

  const fileURL = getFileURLForLanguage(userLanguage);
  fetch(fileURL)
    .then(res => {
      if (!res.ok) throw new Error("File not found or access issue.");
      return res.arrayBuffer();
    })
    .then(buffer => {
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = rows[0].map(h => h.toLowerCase());
      const idIdx = headers.indexOf("id");
      const premIdx = headers.indexOf("premise");
      const hypIdx = headers.indexOf("hypothesis");
      const relIdx = headers.indexOf("relation");

      if (premIdx === -1 || hypIdx === -1) {
        alert("❌ Missing 'Premise' or 'Hypothesis' columns.");
        return;
      }

      const data = rows.slice(1).map(r => ({
        id: r[idIdx] || "",
        premise: r[premIdx] || "",
        hypothesis: r[hypIdx] || "",
        relation: relIdx !== -1 ? (r[relIdx] || "NonSense") : "NonSense"
      }));

      saveProgress(data);
      currentPage = 0;
      buildTable(data);
    })
    .catch(err => alert("⚠️ Error loading data: " + err.message));
}

// ====== SAVE XLSX TO GITHUB (UPDATE SAME FILE + BACKUP) ======
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
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const code = langCodeMap[userLanguage];
  const mainFile = `${OUTPUT_FOLDER}annotations_${code}.xlsx`;
  const backupFile = `${BACKUP_FOLDER}backup_${code}_${timestamp}.xlsx`;

  async function uploadFile(path, msg) {
    const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: msg,
        content: wbout,
        branch: "main"
      })
    });
    return resp.ok;
  }

  const okMain = await uploadFile(mainFile, `Update ${userLanguage} annotations`);
  const okBackup = await uploadFile(backupFile, `Backup ${userLanguage} annotations at ${timestamp}`);

  if (okMain && okBackup)
    alert(`✅ Saved main and backup XLSX for ${userLanguage}.`);
  else alert("❌ Error saving files to GitHub.");
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
