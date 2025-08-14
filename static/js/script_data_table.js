console.log("✅ script_data_table.js loaded");

let currentData = [];
let currentPage = 1;
let pageSize = 100;
let totalRecords = 0;

document.getElementById("dataTableForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const deviceId = document.getElementById("device_id").value;
  const startDate = document.getElementById("start_date").value;
  const endDate = document.getElementById("end_date").value;
  pageSize = parseInt(document.getElementById("page_size").value);
  
  const resultDiv = document.getElementById("result");
  const tableContainer = document.getElementById("tableContainer");
  
  // Convert datetime-local to required format
  const startFormatted = startDate.replace("T", " ") + ":00";
  const endFormatted = endDate.replace("T", " ") + ":00";

  resultDiv.innerHTML = "⏳ Loading data...";
  tableContainer.style.display = "none";

  try {
    const response = await fetch(`/api/get-data?device_id=${encodeURIComponent(deviceId)}&start_date=${encodeURIComponent(startFormatted)}&end_date=${encodeURIComponent(endFormatted)}`);
    const data = await response.json();

    if (data.error) {
      resultDiv.innerHTML = `<p style="color:red;">❌ ${data.error}</p>`;
      return;
    }

    if (!data.records || data.records.length === 0) {
      resultDiv.innerHTML = `<p style="color:orange;">⚠️ No records found for the specified criteria.</p>`;
      return;
    }

    currentData = data.records;
    totalRecords = data.count;
    currentPage = 1;

    resultDiv.innerHTML = `<p style="color:green;">✅ Successfully loaded ${totalRecords} records</p>`;
    
    displayTable();
    tableContainer.style.display = "block";

  } catch (err) {
    resultDiv.innerHTML = `<p style="color:red;">❌ Error: ${err.message}</p>`;
  }
});

function displayTable() {
  const tableBody = document.getElementById("tableBody");
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, currentData.length);
  const pageData = currentData.slice(startIndex, endIndex);

  // Clear existing rows
  tableBody.innerHTML = "";

  // Add rows
  pageData.forEach(record => {
    const row = document.createElement("tr");
    
    // Extract data safely
    const deviceId = record.deviceid || "N/A";
    const deviceTime = record.devicetime ? new Date(record.devicetime).toLocaleString() : "N/A";
    const etm = record.data?.evt?.etm || "N/A";
    const csm = record.data?.evt?.csm || "N/A";
    const bvt = record.data?.binfo?.bvt || "N/A";
    const bpon = record.data?.binfo?.bpon !== undefined ? (record.data.binfo.bpon ? "On" : "Off") : "N/A";

    row.innerHTML = `
      <td>${deviceId}</td>
      <td>${deviceTime}</td>
      <td>${etm}</td>
      <td>${csm}</td>
      <td>${bvt}${bvt !== "N/A" ? "V" : ""}</td>
      <td>${bpon}</td>
    `;

    tableBody.appendChild(row);
  });

  // Update info
  document.getElementById("totalRecords").textContent = totalRecords;
  document.getElementById("showingRecords").textContent = `${startIndex + 1}-${endIndex}`;
  document.getElementById("currentPage").textContent = currentPage;
  document.getElementById("totalPages").textContent = Math.ceil(currentData.length / pageSize);

  // Update pagination
  updatePagination();
}

function updatePagination() {
  const pagination = document.getElementById("pagination");
  const totalPages = Math.ceil(currentData.length / pageSize);
  
  pagination.innerHTML = "";

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "« Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      displayTable();
    }
  };
  pagination.appendChild(prevBtn);

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    const firstBtn = document.createElement("button");
    firstBtn.textContent = "1";
    firstBtn.onclick = () => {
      currentPage = 1;
      displayTable();
    };
    pagination.appendChild(firstBtn);

    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.style.margin = "0 10px";
      pagination.appendChild(ellipsis);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    pageBtn.className = i === currentPage ? "active" : "";
    pageBtn.onclick = () => {
      currentPage = i;
      displayTable();
    };
    pagination.appendChild(pageBtn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.textContent = "...";
      ellipsis.style.margin = "0 10px";
      pagination.appendChild(ellipsis);
    }

    const lastBtn = document.createElement("button");
    lastBtn.textContent = totalPages;
    lastBtn.onclick = () => {
      currentPage = totalPages;
      displayTable();
    };
    pagination.appendChild(lastBtn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next »";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayTable();
    }
  };
  pagination.appendChild(nextBtn);
}

function exportToCSV() {
  if (currentData.length === 0) {
    alert("No data to export");
    return;
  }

  let csv = "Device ID,Device Time,ETM,CSM,Battery Voltage,Battery Power\n";
  
  currentData.forEach(record => {
    const deviceId = record.deviceid || "";
    const deviceTime = record.devicetime || "";
    const etm = record.data?.evt?.etm || "";
    const csm = record.data?.evt?.csm || "";
    const bvt = record.data?.binfo?.bvt || "";
    const bpon = record.data?.binfo?.bpon !== undefined ? (record.data.binfo.bpon ? "On" : "Off") : "";

    csv += `"${deviceId}","${deviceTime}","${etm}","${csm}","${bvt}","${bpon}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aquesa_data_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function exportToJSON() {
  if (currentData.length === 0) {
    alert("No data to export");
    return;
  }

  const jsonData = JSON.stringify(currentData, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `aquesa_data_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Set default dates (last 24 hours)
window.addEventListener("load", function() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  document.getElementById("end_date").value = now.toISOString().slice(0, 16);
  document.getElementById("start_date").value = yesterday.toISOString().slice(0, 16);
});
