/***************************************************
 * EASYANNOTATION NLI TOOL – FINAL VERSION (Updated)
 * Repo: Muhsabrys/EasyAnnotation
 * Adds Hindi and corrects Premise → Hypothesis order
 * Saves language-based annotation CSVs to /Annotations/
 ***************************************************/

// ====== LANGUAGE ACCESS CONTROL ======
const validCodes = {
  "DE-L1-2025-NLI": "German",
  "AR-L2-2025-NLI": "Arabic",
  "ES-L3-2025-NLI": "Spanish",
  "PT-L4-2025-NLI": "Portuguese",
  "ZH-L5-2025-NLI": "Chinese",
  "HI-L6-2025-NLI": "Hindi"
  "TH-L7-2025-NLI": "Thai"
};

const langCodeMap = {
  "German": "DE",
  "Arabic": "AR",
  "Spanish": "ES",
  "Portuguese": "PT",
  "Chinese": "ZH",
  "Hindi": "HI"
  "Thai": "TH"
};

let userLanguage = null;

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
const annotationOptions = ["Entailment", "Contradiction", "Neutral", "NoneSense"];
let currentPage = 0;
const pageSize = 150;

const GITHUB_REPO = "Muhsabrys/EasyAnnotation";
const BASE_DATA_PATH = "datasets/NLI/";
const OUTPUT_FOLDER = "Annotations/";

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
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${BASE_DATA_PATH}NLI_${code}.xlsx`;
}

// ====== TEXT DIRECTION HANDLER ======
function getTextDirection() {
  // Only Arabic is RTL
  if (userLanguage === "Arabic") return "rtl";
  return "ltr";
}

// ====== TABLE BUILDER ======
function buildTable(data) {
  const tableContainer = document.getElementById("tableContainer");
  let html = `<table>
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
    html += `<tr>
              <td>${row.id}</td>
              <td style="direction:${getTextDirection()}; text-align:${getTextDirection() === 'rtl' ? 'right' : 'left'};">
                ${row.premise}
              </td>
              <td style="direction:${getTextDirection()}; text-align:${getTextDirection() === 'rtl' ? 'right' : 'left'};">
                ${row.hypothesis}
              </td>
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
  const pagCont = document.getElementById("paginationContainer");
  pagCont.style.display = data.length > pageSize ? "block" : "none";
  document.getElementById("pageIndicator").textContent = `Page ${currentPage + 1} of ${totalPages}`;
  document.getElementById("prevBtn").disabled = currentPage === 0;
  document.getElementById("nextBtn").disabled = currentPage >= totalPages - 1;
}

// ====== LOAD DATA FROM GITHUB ======
function loadFromGitHub() {
  if (!userLanguage) {
    alert("Please enter a valid access code first.");
    return;
  }
  const fileURL = getFileURLForLanguage(userLanguage);
  fetch(fileURL)
    .then(res => res.arrayBuffer())
    .then(buffer => {
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headers = rows[0].map(h => h.toLowerCase());
      const idIdx = headers.indexOf("id");
      const hypIdx = headers.indexOf("hypothesis");
      const premIdx = headers.indexOf("premise");

      if (hypIdx === -1 || premIdx === -1) {
        alert("Missing 'Hypothesis' or 'Premise' columns");
        return;
      }

      const data = rows.slice(1).map(r => ({
        id: idIdx !== -1 ? r[idIdx] || "" : "",
        hypothesis: r[hypIdx] || "",
        premise: r[premIdx] || "",
        relation: "NoneSense"
      }));

      saveProgress(data);
      currentPage = 0;
      buildTable(data);
    })
    .catch(err => alert("Error loading file: " + err));
}

// ====== DOWNLOAD CSV LOCALLY ======
document.getElementById("downloadBtn").addEventListener("click", () => {
  const data = loadProgress();
  if (!data) return alert("No data available.");

  let csv = "id,hypothesis,premise,relation\n";
  data.forEach(r => {
    csv += `"${r.id}","${r.hypothesis}","${r.premise}","${r.relation}"\n`;
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const code = langCodeMap[userLanguage];
  const filename = `annotations_${code}_${timestamp}.csv`;

  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  link.download = filename;
  link.click();
});

// ====== SAVE TO GITHUB (New File Each Time) ======
document.getElementById("saveGithubBtn").addEventListener("click", async () => {
  const token = document.getElementById("githubToken").value.trim();
  if (!token) return alert("Please enter your GitHub token.");

  const data = loadProgress();
  if (!data) return alert("No data to upload.");

  let csv = "id,hypothesis,premise,relation\n";
  data.forEach(r => {
    csv += `"${r.id}","${r.hypothesis}","${r.premise}","${r.relation}"\n`;
  });

  const content = btoa(unescape(encodeURIComponent(csv))); // base64 encode
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const code = langCodeMap[userLanguage];
  const filePath = `${OUTPUT_FOLDER}annotations_${code}_${timestamp}.csv`;

  const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `New annotation upload (${userLanguage}) at ${timestamp}`,
      content: content,
      branch: "main"
    })
  });

  if (resp.ok) {
    alert(`✅ Uploaded successfully to GitHub as ${filePath}`);
  } else {
    const err = await resp.text();
    alert("❌ Error saving to GitHub:\n" + err);
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
