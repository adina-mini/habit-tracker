//  1. GLOBAL DATA STORAGE 
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("App ready for mobile installation!"))
    .catch((err) => console.log("Service Worker failed", err));
}
let protocols = []; 
let myChart;

//  2. INITIALIZATION
window.onload = () => {
    updateTracker(); // Build the initial calendar

    // ACHIEVEMENT LOGIC: Listens for the "Enter" key
    const achInput = document.getElementById('achInput');
    if (achInput) {
        achInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const val = achInput.value.trim();
                if (val !== "") {
                    const li = document.createElement('li');
                    li.innerText = val;
                    document.getElementById('achievementList').appendChild(li);
                    achInput.value = ""; // Clear input after adding
                }
            }
        });
    }
};

// 3. CALENDAR LOGIC (28, 30, 31 DAYS)
function updateTracker() {
    const selector = document.getElementById('monthSelector');
    if (!selector.value) return;

    const [year, month] = selector.value.split('-');
    // Calculate exact days for the selected month
    const daysInMonth = new Date(year, month, 0).getDate(); 

    // Update the UI Month Title
    const dateObj = new Date(year, month - 1);
    document.getElementById('monthTitle').innerText = 
        dateObj.toLocaleString('default', { month: 'long' }).toUpperCase() + " " + year;

    // Build Table Header
    const header = document.getElementById('tableHeader');
    header.innerHTML = '<th>PROTOCOLS</th>';
    for (let i = 1; i <= daysInMonth; i++) {
        header.innerHTML += `<th>${i}</th>`;
    }
    header.innerHTML += '<th>ACTIONS</th>'; // Column for Edit/Delete

    renderTable(daysInMonth);
}

// 4. TABLE & TASK RENDERING 
function renderTable(days) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    protocols.forEach((p, index) => {
        const row = document.createElement('tr');
        
        // Task Name Cell
        const nameCell = document.createElement('td');
        nameCell.innerText = p.name;
        row.appendChild(nameCell);

        // Daily Checkboxes
        for (let d = 1; d <= days; d++) {
            const td = document.createElement('td');
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = p.data[d] || false;
            
            // Auto-update graph on every click
            cb.onchange = () => { 
                p.data[d] = cb.checked; 
                renderGraph(days); 
            };
            
            td.appendChild(cb);
            row.appendChild(td);
        }

        // Actions: Rename and Delete buttons
        const actionTd = document.createElement('td');
        actionTd.innerHTML = `
            <button class="action-btn edit-btn" onclick="renameProtocol(${index})" title="Rename">✏️</button>
            <button class="action-btn delete-btn" onclick="deleteProtocol(${index})" title="Delete">🗑️</button>
        `;
        row.appendChild(actionTd);

        tbody.appendChild(row);
    });

    renderGraph(days); // Draw graph based on current month length
}

// --- 5. THE SHARP ZIG-ZAG GRAPH ---
function renderGraph(days) {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = Array.from({length: days}, (_, i) => i + 1);
    const dailyData = labels.map(day => {
        let count = 0;
        protocols.forEach(p => { if (p.data[day]) count++; });
        return count;
    });

    if (myChart) myChart.destroy(); // Prevent graph glitches
    
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks Completed',
                data: dailyData,
                borderColor: '#b29471', 
                tension: 0, // SHARP EDGES
                pointRadius: 5,
                fill: true,
                backgroundColor: 'rgba(178, 148, 113, 0.1)'
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: { 
                y: { beginAtZero: true, max: protocols.length || 5, ticks: { stepSize: 1 } } 
            }
        }
    });
}

// --- 6. ADAPTIVE REPORT POPUP (IMAGE-STYLE) ---
function calculatePrediction() {
    if (protocols.length === 0) return;

    const now = new Date();
    const selector = document.getElementById('monthSelector');
    const [year, month] = selector.value.split('-');
    
    // Check if showing current month
    const isCurrent = (now.getFullYear() == year && (now.getMonth() + 1) == month);
    const endDay = isCurrent ? now.getDate() : new Date(year, month, 0).getDate();

    // FIND ADAPTIVE START: First day anything was ever checked
    let startDay = 32;
    protocols.forEach(p => {
        for (let d = 1; d <= 31; d++) {
            if (p.data[d] === true && d < startDay) startDay = d;
        }
    });

    if (startDay > 31) {
        alert("No tasks have been marked yet.");
        return;
    }

    // CALCULATE PERFORMANCE WINDOW
    let totalPossible = protocols.length * (endDay - startDay + 1);
    let totalMarked = 0;

    protocols.forEach(p => {
        for (let d = startDay; d <= endDay; d++) {
            if (p.data[d] === true) totalMarked++;
        }
    });

    let unmarked = totalPossible - totalMarked;
    let score = (totalMarked / totalPossible) * 100;

    // INJECT INTO MODAL
    const details = document.getElementById('reportDetails');
    details.innerHTML = `
        <p class="report-item"><b>Tracked Since:</b> Day ${startDay}</p>
        <p class="report-item"><b>Report Date:</b> Day ${endDay}</p>
        <hr>
        <p class="report-item" style="color: #27ae60;"><b>Marked Tasks:</b> ${totalMarked}</p>
        <p class="report-item" style="color: #e74c3c;"><b>Unmarked Slots:</b> ${unmarked}</p>
        <hr>
        <h2 style="color: #b29471;">Overall Score: ${score.toFixed(1)}%</h2>
    `;

    document.getElementById('reportModal').style.display = "block";
}

// --- 7. HELPER FUNCTIONS ---
function closeModal() {
    document.getElementById('reportModal').style.display = "none";
}

function addprotocol() {
    const name = prompt("Enter Task Name:");
    if (name) {
        protocols.push({ name: name, data: {} });
        updateTracker(); // Rebuild table
    }
}

function renameProtocol(index) {
    const newName = prompt("Rename task:", protocols[index].name);
    if (newName && newName.trim() !== "") {
        protocols[index].name = newName.trim();
        updateTracker(); // Refresh name
    }
}

function deleteProtocol(index) {
    if (confirm(`Delete "${protocols[index].name}"?`)) {
        protocols.splice(index, 1);
        updateTracker(); // Re-sync data
    }
}