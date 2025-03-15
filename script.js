// Trigger a click on the hidden file input when the button is clicked
document.getElementById('uploadBtn').addEventListener('click', function() {
  document.getElementById('fileInput').click();
});

// Process the file when a user selects it
document.getElementById('fileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    // Assume the data lies in the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Assume the first row holds headers; check for "hypothesis" and "premise" columns
    const headers = jsonData[0];
    const hypIndex = headers.findIndex(header => header.toLowerCase() === 'hypothesis');
    const premIndex = headers.findIndex(header => header.toLowerCase() === 'premise');

    if (hypIndex === -1 || premIndex === -1) {
      alert("Columns 'hypothesis' and 'premise' must exist.");
      return;
    }

    // Create table rows from data (skip header row)
    let tableHTML = '<table><thead><tr><th>Hypothesis</th><th>Premise</th><th>NLI Relation</th></tr></thead><tbody>';
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const hypothesis = row[hypIndex] || "";
      const premise = row[premIndex] || "";
      tableHTML += `<tr>
                      <td>${hypothesis}</td>
                      <td>${premise}</td>
                      <td>
                        <div class="radio-group">
                          <label><input type="radio" name="relation${i}" value="entailment"> Entailment</label>
                          <label><input type="radio" name="relation${i}" value="contradiction"> Contradiction</label>
                          <label><input type="radio" name="relation${i}" value="neutral"> Neutral</label>
                        </div>
                      </td>
                    </tr>`;
    }
    tableHTML += '</tbody></table>';
    document.getElementById('tableContainer').innerHTML = tableHTML;
  };

  reader.readAsArrayBuffer(file);
});
