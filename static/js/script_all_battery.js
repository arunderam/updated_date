document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("batteryForm");
    const resultDiv = document.getElementById("batteryResult");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      resultDiv.innerHTML = `<p style="color:blue; font-weight:bold;">Processing... please wait</p>`;

      try {
        const response = await fetch("/api/all_battery_status");
        const data = await response.json();
  
        if (!response.ok) {
          resultDiv.innerHTML = `<p style="color:red;">Error: ${data.error || "Unknown error"}</p>`;
          return;
        }
  
        // Build table
        let tableHTML = `
          <table border="1" cellpadding="5" cellspacing="0">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Battery Status</th>
                <th>Last Data Send Time</th>
                
                <th>Battery Voltage</th>
                <th>Battery Intervals</th>
              </tr>
            </thead>
            <tbody>
        `;
  
        data.devices.forEach((device) => {
          let intervals = "";
          if (device.battery_intervals && device.battery_intervals.length > 0) {
            intervals = "<ul>";
            device.battery_intervals.forEach((interval) => {
              intervals += `<li><strong>From:</strong> ${interval.battery_start} <br><strong>To:</strong> ${interval.battery_end}</li>`;
            });
            intervals += "</ul>";
          } else {
            intervals = "No battery intervals";
          }
  
          // 🔹 Apply color based on battery_status
          let statusColor = "black";
          if (device.battery_status === "Power") {
            statusColor = "green";
          } else if (device.battery_status === "Battery") {
            statusColor = "red";
          } else {
            statusColor = "gray";
          }
  
          tableHTML += `
            <tr>
              <td>${device.device_id}</td>
              
              <td style="color:${statusColor}; font-weight:bold;">
                ${device.battery_status}
              </td>
              <td>${device.last_data_send_time || "N/A"}</td>
              <td>${device.battery_voltage !== null ? device.battery_voltage : "N/A"}</td>
              <td>${intervals}</td>
            </tr>
          `;
        });
  
        tableHTML += `
            </tbody>
          </table>
        `;
  
        resultDiv.innerHTML = tableHTML;
      } catch (error) {
        resultDiv.innerHTML = `<p style="color:red;">Fetch error: ${error.message}</p>`;
      }
    });
  });
  