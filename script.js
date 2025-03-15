let annotationOptions = [];
let currentPage = 0;
const pageSize = 150;

// Save the data array to localStorage.
function saveProgress(data) {
  localStorage.setItem("nliData", JSON.stringify(data));
}

// Load the data array from localStorage.
function loadProgress() {
  const saved = localStorage.getItem("nliData");
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
}

// Save the annotation options to localStorage.
function saveOptions(options) {
  localStorage.setItem("annotationOptions", JSON.stringify(options));
}

// Load the annotation options from localStorage.
function loadOptions() {
  const saved = localStorage.getItem("annotationOptions");
  if (saved) {
    return JSON.parse(saved);
  }
  return ["entailment", "contradiction", "neutral"];
}

// Build the table from the data array with pagination.
function buildTable(data) {
  const tableContainer = document.getElementById("tableContainer");
  let tableHTML = `<table>
                     <thead>
                       <tr>
                         <th>Hypothesis</th>
                         <th>Premise</th>
                         <th>NLI Relation</th>
                       </tr>
                     </thead>
                     <tbody>`;
  const start = currentPage * pageSize;
  const end = Math.min(data.length, start + pageSize);
  for (let i = start; i < end; i++) {
    const row = data[i];
    tableHTML += `<tr>
                    <td>${row.hypothesis}</td>
                    <td>${row.premise}</td>
                    <td>
                      <div class="radio-group">`;
    annotationOptions.forEach(option => {
      const checked = row.relation === option ? "checked" : "";
      tableHTML += `<label><input type="radio" name="relation${i}" value="${option}" ${checked}> ${option}</label>`;
    });
    tableHTML += `</div>
                    </td>
                  </tr>`;
  }
  tableHTML += `</tbody></table>`;
  tableContainer.innerHTML = tableHTML;
  attachRadioListeners(data, start, end);
  updatePagination(data);
  document.getElementById("downloadBtn").style.display = "block";
}

// Attach event listeners to the radio buttons in the current page.
function attachRadioListeners(data, start, end) {
  for (let i = start; i < end; i++) {
    const radios = document.getElementsByName("relation" + i);
    radios.forEach(radio => {
      radio.addEventListener("change", function() {
        data[i].relation = this.value;
        saveProgress(data);
      });
    });
  }
}

// Update the pagination controls.
function updatePagination(data) {
  const paginationContainer = document.getElementById("paginationContainer");
  if (data.length > pageSize) {
    paginationContainer.style.display = "block";
    const totalPages = Math.ceil(data.length / pageSize);
    document.getElementById("pageIndicator").textContent = `Page ${currentPage + 1} of ${totalPages}`;
    document.getElementById("prevBtn").disabled = (currentPage === 0);
    document.getElementById("nextBtn").disabled = (currentPage >= totalPages - 1);
  } else {
    paginationContainer.style.display = "none";
  }
}

// Load saved work on page load.
document.addEventListener("DOMContentLoaded", function() {
  annotationOptions = loadOptions();
  document.getElementById("annotationOptions").value = annotationOptions.join(", ");
  const savedData = loadProgress();
  if (savedData) {
    buildTable(savedData);
  }
});

// Save new annotation options.
document.getElementById("saveConfigBtn").addEventListener("click", function() {
  const input = document.getElementById("annotationOptions").value;
  annotationOptions = input.split(",").map(item => item.trim()).filter(item => item !== "");
  saveOptions(annotationOptions);
  const data = loadProgress();
  if (data) {
    buildTable(data);
  }
  alert("Annotation options saved.");
});

// Handle the file upload.
document.getElementById("uploadBtn").addEventListener("click", function() {
  document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(event) {
    const rawData = new Uint8Array(event.target.result);
    const workbook = XLSX.read(rawData, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const headers = jsonData[0];
    const hypIndex = headers.findIndex(header => header.toLowerCase() === "hypothesis");
    const premIndex = headers.findIndex(header => header.toLowerCase() === "premise");

    if (hypIndex === -1 || premIndex === -1) {
      alert("Columns 'hypothesis' and 'premise' must exist.");
      return;
    }

    let dataArray = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const hypothesis = row[hypIndex] || "";
      const premise = row[premIndex] || "";
      dataArray.push({
        hypothesis: hypothesis,
        premise: premise,
        relation: "none"
      });
    }
    saveProgress(dataArray);
    currentPage = 0;
    buildTable(dataArray);
  };
  reader.readAsArrayBuffer(file);
});

// Download a CSV file with the annotations.
document.getElementById("downloadBtn").addEventListener("click", function() {
  const data = loadProgress();
  if (!data) {
    alert("No data to download.");
    return;
  }
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "hypothesis,premise,relation\n";
  data.forEach(row => {
    csvContent += `"${row.hypothesis}","${row.premise}",${row.relation}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "annotations.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Pagination event listeners.
document.getElementById("prevBtn").addEventListener("click", function() {
  if (currentPage > 0) {
    currentPage--;
    const data = loadProgress();
    buildTable(data);
  }
});

document.getElementById("nextBtn").addEventListener("click", function() {
  const data = loadProgress();
  const totalPages = Math.ceil(data.length / pageSize);
  if (currentPage < totalPages - 1) {
    currentPage++;
    buildTable(data);
  }
});
