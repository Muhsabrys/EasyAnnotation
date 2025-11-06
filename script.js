// ===== LANGUAGE ACCESS CONTROL =====
const validCodes = {
  "DE-L1-2025-NLI": "German",
  "AR-L2-2025-NLI": "Arabic",
  "ES-L3-2025-NLI": "Spanish",
  "PT-L4-2025-NLI": "Portuguese",
  "ZH-L5-2025-NLI": "Chinese"
};

function requestLanguageAccess() {
  const entered = prompt("Enter your language access code:");
  if (!entered || !validCodes[entered.trim()]) {
    alert("Invalid code. Please contact the project admin.");
    document.body.innerHTML = "<h2>Access denied.</h2>";
    throw new Error("Unauthorized");
  } else {
    const lang = validCodes[entered.trim()];
    localStorage.setItem("AnnotatorLanguage", lang);
    document.title = `NLI Annotation – ${lang}`;
    alert(`Access granted for ${lang} annotators.`);
  }
}

// Run access check before anything else
requestLanguageAccess();

let annotationOptions = ["Entailment", "Contradiction", "Neutral", "NoneSense"];
let currentPage = 0;
const pageSize = 150;
const GITHUB_FILE_URL = "https://raw.githubusercontent.com/Muhsabrys/ArabicSimplified/main/ML/Fundamentals/abstracts.xlsx";
const GITHUB_REPO = "Muhsabrys/ArabicSimplified";
const OUTPUT_FILE = "ML/Fundamentals/annotations.csv";

// Save data to localStorage
function saveProgress(data) {
  localStorage.setItem("Data", JSON.stringify(data));
}

// Load saved data
function loadProgress() {
  const saved = localStorage.getItem("Data");
  return saved ? JSON.parse(saved) : null;
}

// Build the table
function buildTable(data) {
  const tableContainer = document.getElementById("tableContainer");
  let html = `<table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hypothesis</th>
                    <th>Premise</th>
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
              <td class="arabic">${row.hypothesis}</td>
              <td class="arabic">${row.premise}</td>
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

document.getElementById("loadBtn").addEventListener("click", loadFromGitHub);

function loadFromGitHub() {
  fetch(GITHUB_FILE_URL)
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
        alert("Missing 'hypothesis' or 'premise' columns");
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

// Download CSV
document.getElementById("downloadBtn").addEventListener("click", () => {
  const data = loadProgress();
  if (!data) return alert("No data available.");

  let csv = "id,hypothesis,premise,relation\n";
  data.forEach(r => {
    csv += `"${r.id}","${r.hypothesis}","${r.premise}","${r.relation}"\n`;
  });

  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  link.download = "annotations.csv";
  link.click();
});

// Save to GitHub
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

  const resp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${OUTPUT_FILE}`, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Update annotations file",
      content: content,
      branch: "main"
    })
  });

  if (resp.ok) alert("Saved to GitHub successfully!");
  else alert("Error saving to GitHub: " + (await resp.text()));
});

// Pagination
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
