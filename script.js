// Global variable for annotation options.
let annotationOptions = [];

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
  // Return default if none saved.
  return ["entailment", "contradiction", "neutral"];
}

// Build the table from the data array.
function buildTable(data) {
  // Set start time for each row if not already set.
  data.forEach(row => {
    if (!row.annotationStart) {
      row.annotationStart = Date.now();
    }
  });

  let tableHTML = `<table>
                     <thead>
                       <tr>
                         <th>Hypothesis</th>
                         <th>Premise</th>
                         <th>NLI Relation</th>
                         <th>Annotation Time (sec)</th>
                       </tr>
                     </thead>
                     <tbody>`;
  data.forEach((row, i) => {
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
                    <td>${row.annotationTime ? (row.annotationTime/1000).toFixed(2) : "N/A"}</td>
                  </tr>`;
  });
  tableHTML += `</tbody></table>`;
  document.getElementById("tableContainer").innerHTML = tableHTML;

  // Attach event listeners to radio buttons.
  data.forEach((row, i) => {
    const radios = document.getElementsByName("relation" + i);
    radios.forEach(radio => {
      radio.addEventListener("change", function() {
        // Compute the elapsed time since the previous annotation event (or row creation).
        const elapsed = Date.now() - row.annotationStart;
        row.annotationTime = elapsed;
        // Reset the timer for the next annotation.
        row.annotationStart = Date.now();
        row.relation = this.value;
        saveProgress(data);
        // Rebuild the table to update the displayed annotation time.
        buildTable(data);
      });
    });
  });

  // Show the download button.
  document.getElementById("downloadBtn").style.display = "block";
}
  // Attach event listeners to radio buttons.
  data.forEach((row, i) => {
    const radios = document.getElementsByName("relation" + i);
    radios.forEach(radio => {
      radio.addEventListener("change", function() {
        // If no annotationTime recorded, compute the time difference.
        if (!row.annotationTime) {
          row.annotationTime = Date.now() - row.annotationStart;
        }
        row.relation = this.value;
        saveProgress(data);
        // Rebuild the table to update the annotation time display.
        buildTable(data);
      });
    });
  });

  // Show the download button.
  document.getElementById("downloadBtn").style.display = "block";
}

// Load saved work on page load.
document.addEventListener("DOMContentLoaded", function() {
  annotationOptions = loadOptions();
  // Set the input value in the configuration panel.
  document.getElementById("annotationOptions").value = annotationOptions.join(", ");
  const savedData = loadProgress();
  if (savedData) {
    buildTable(savedData);
  }
});

// Save new annotation options.
document.getElementById("saveConfigBtn").addEventListener("click", function() {
  const input = document.getElementById("annotationOptions").value;
  // Split the input on commas and trim spaces.
  annotationOptions = input.split(",").map(item => item.trim()).filter(item => item !== "");
  saveOptions(annotationOptions);
  // If a table exists, rebuild it to use new options.
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
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Find 'hypothesis' and 'premise' columns.
    const headers = jsonData[0];
    const hypIndex = headers.findIndex(header => header.toLowerCase() === "hypothesis");
    const premIndex = headers.findIndex(header => header.toLowerCase() === "premise");

    if (hypIndex === -1 || premIndex === -1) {
      alert("Columns 'hypothesis' and 'premise' must exist.");
      return;
    }

    // Build data array.
    let dataArray = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const hypothesis = row[hypIndex] || "";
      const premise = row[premIndex] || "";
      dataArray.push({
        hypothesis: hypothesis,
        premise: premise,
        relation: "none",
        annotationStart: Date.now(),
        annotationTime: null
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
  csvContent += "hypothesis,premise,relation,annotation_time_sec\n";
  data.forEach(row => {
    const timeSec = row.annotationTime ? (row.annotationTime/1000).toFixed(2) : "N/A";
    csvContent += `"${row.hypothesis}","${row.premise}",${row.relation},${timeSec}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "annotations.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
