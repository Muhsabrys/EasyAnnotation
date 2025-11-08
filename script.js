/***************************************************
 * EASYANNOTATION NLI TOOL – PERSISTENT FILE VERSION
 * Repo: Muhsabrys/EasyAnnotation
 * Each language has one annotation file on GitHub.
 * Annotators can recall and update the same file.
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
let fileSHA = null; // needed for GitHub updates

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
const DATA_PATH = "datasets/NLI/";
const ANNO_PATH = "Annotations/";

// ====== LOCAL STORAGE HELPERS ======
function saveProgress(data) {
  localStorage.setItem("Data", JSON.stringify(data));
}

function loadProgress() {
  const saved = localStorage.getItem("Data");
  return saved ? JSON.parse(saved) : null;
}

// ====== TEXT DIRECTION HANDLER ======
function getTextDirection() {
  if (userLanguage === "Arabic" || userLanguage === "Urdu") return "rtl";
  return "ltr";
}

// ====== FILE HELPERS ======
function getDataFileURL() {
  const code = langCodeMap[userLanguage];
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${DATA_PATH}NLI_${code}.xlsx`;
}

function getAnnotationFileURL() {
  const code = langCodeMap[userLanguage];
  return `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${ANNO_PATH}annotations_${code}.csv`;
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
  document.getElementById("pageIndicator").textContent = `Page ${currentPage + 1} of ${totalPages}`;
  document.getElementById("prevBtn").disabled = currentPage === 0;
  document.getElementById("nextBtn").disabled = currentPage >= totalPages - 1;
}

// ====== LOAD FROM GITHUB ======
async function loadFromGitHub() {
  if (!userLanguage) {
    alert("Please enter a valid access code first.");
    return;
  }

  const code = langCodeMap[userLanguage];
  const annotationFileURL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${ANNO_PATH}annotations_${code}.csv`;

  try {
    const response = await fetch(annotationFileURL);
    if (response.ok) {
      // File exists → load it
      const json = await response.json();
      fileSHA = json.sha; // store for updates
      const csvText = atob(json.content);
      const rows = csvText.split("\n").slice(1).filter(Boolean).map(line => {
        const [id, hyp, prem, rel] = line.split(",").map(v => v.replace(/^"|"$/g, ""));
        return { id, hypothesis: hyp, premise: prem, relation: rel || "NoneSense" };
      });
      saveProgress(rows);
      buildTable(rows);
      alert("✅ Loaded existing annotation file from GitHub.");
    } else {
      // File doesn't exist → load dataset instead
      const datasetURL = getDataFileURL();
      const res = await fetch(datasetURL);
      const buffer = await res.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headers = raw[0].map(h => h.toLowerCase());
      const idIdx = headers.indexOf("id");
      const hypIdx = headers.indexOf("hypothesis");
      const premIdx = headers.indexOf("premise");
      const data = raw.slice(1).map(r => ({
        id: idIdx !== -1 ? r[idIdx] || "" : "",
        hypothesis: r[hypIdx] || "",
        premise: r[premIdx] || "",
        relation: "NoneSense"
      }));
      saveProgress(data);
      buildTable(data);
      alert("📄 No existing annotations found. Loaded fresh dataset.");
    }
  } catch (err) {
    alert("❌ Error loading data: " + err);
  }
}

// ====== SAVE (UPDATE) TO GITHUB ======
document.getElementById("saveGithubBtn").addEventListener("click", async () => {
  const token = document.getElementById("githubToken").value.trim();
  if (!token) return alert("Please enter your GitHub token.");

  const data = loadProgress();
  if (!data) return alert("No data to upload.");

  let csv = "id,hypothesis,premise,relation\n";
  data.forEach(r => {
    csv += `"${r.id}","${r.hypothesis}","${r.premise}","${r.relation}"\n`;
  });

  const content = btoa(unescape(encodeURIComponent(csv)));
  const code = langCodeMap[userLanguage];
  const filePath = `${ANNO_PATH}annotations_${code}.csv`;

  const payload = {
    message: `Update ${filePath} (${userLanguage})`,
    content: content,
    branch: "main"
  };
  if (fileSHA) payload.sha = fileSHA; // add SHA for update

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
    alert(`✅ Annotations updated for ${userLanguage}.`);
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
