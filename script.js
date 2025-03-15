// Save the data array to localStorage.
function saveProgress(data) {
  localStorage.setItem("nliData", JSON.stringify(data));
}

// Retrieve the saved data array from localStorage.
function loadProgress() {
  const saved = localStorage.getItem("nliData");
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
}

// Create the table from the data array.
function buildTable(data) {
  let tableHTML = `<table>
                     <thead>
                       <tr>
                         <th>Hypothesis</th>
                         <th>Premise</th>
                         <th>NLI Relation</th>
                       </tr>
                     </thead>
                     <tbody>`;
  data.forEach((row, i) => {
    tableHTML += `<tr>
                    <td>${row.hypothesis}</td>
                    <td>${row.premise}</td>
                    <td>
                      <div class="radio-group">
                        <label><input type="radio" name="relation${i}" value="entailment" ${row.relation === "entailment" ? "checked" : ""}> Entailment</label>
                        <label><input type="radio" name="relation${i}" value="contradiction" ${row.relation === "contradiction" ? "checked" : ""}> Contradiction</label>
                        <label><input type="radio" name="relation${i}" value="neutral" ${row.relation === "neutral" ? "checked" : ""}> Neutral</label>
                      </div>
                    </td>
                  </tr>`;
  });
  tableHTML += `</tbody></table>`;
  document.getElementById("tableContainer").innerHTML = tableHTML;

  // Attach event listeners to radio buttons.
  data.forEach((row, i) => {
    const radios = document.getElementsByName("relation" + i);
    radios.forEach((radio) => {
      radio.addEventListener("change", function() {
        data[i].relation = this.value;
        saveProgress(data);
      });
    });
  });

  // Reveal the download button.
  document.getElementById("downloadBtn").style.display = "block";
}

// Load saved work on page load.
document.addEventListener("DOMContentLoaded", function() {
  const savedData = loadProgress();
  if (savedData) {
    buildTable(savedData);
  }
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
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Locate the 'hypothesis' and 'premise' columns.
    const headers = jsonData[0];
    const hypIndex = headers.findIndex(header => header.toLowerCase() === "hypothesis");
    const premIndex = headers.findIndex(header => header.toLowerCase() === "premise");

    if (hypIndex === -1 || premIndex === -1) {
      alert("Columns 'hypothesis' and 'premise' must exist.");
      return;
    }

    // Build the data array.
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
