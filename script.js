if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("Service Worker Active"))
    .catch(err => console.log("SW Error", err));
}

let protocols = []; 
let myChart;

window.onload = () => {
    updateTracker();
    const achInput = document.getElementById('achInput');
    if (achInput) {
        achInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && achInput.value.trim() !== "") {
                const li = document.createElement('li');
                li.innerText = achInput.value;
                document.getElementById('achievementList').appendChild(li);
                achInput.value = "";
            }
        });
    }
};

function updateTracker() {
    const selector = document.getElementById('monthSelector');
    if (!selector.value) return;
    const [year, month] = selector.value.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const header = document.getElementById('tableHeader');
    header.innerHTML = '<th>PROTOCOLS</th>';
    for (let i = 1; i <= daysInMonth; i++) header.innerHTML += `<th>${i}</th>`;
    header.innerHTML += '<th>⚙️</th>';
    
    renderTable(daysInMonth);
}

function renderTable(days) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    protocols.forEach((p, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${p.name}</td>`;
        for (let d = 1; d <= days; d++) {
            const td = document.createElement('td');
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = p.data[d] || false;
            cb.onchange = () => { p.data[d] = cb.checked; renderGraph(days); };
            td.appendChild(cb);
            row.appendChild(td);
        }
        row.innerHTML += `<td><button onclick="deleteProtocol(${index})">🗑️</button></td>`;
        tbody.appendChild(row);
    });
    renderGraph(days);
}

function renderGraph(days) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const labels = Array.from({length: days}, (_, i) => i + 1);
    const data = labels.map(day => {
        let count = 0;
        protocols.forEach(p => { if (p.data[day]) count++; });
        return count;
    });
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Completed', data, borderColor: '#b29471', tension: 0, fill: true, backgroundColor: 'rgba(178,148,113,0.1)' }]},
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function addprotocol() {
    const name = prompt("Task Name:");
    if (name) { protocols.push({ name, data: {} }); updateTracker(); }
}

function deleteProtocol(index) {
    if (confirm("Delete?")) { protocols.splice(index, 1); updateTracker(); }
}

function calculatePrediction() {
    const now = new Date();
    const endDay = now.getDate();
    let totalPossible = protocols.length * endDay;
    let totalMarked = 0;
    protocols.forEach(p => { for (let d = 1; d <= endDay; d++) if (p.data[d]) totalMarked++; });
    const score = totalPossible === 0 ? 0 : (totalMarked / totalPossible) * 100;
    document.getElementById('reportDetails').innerHTML = `<h3>Score: ${score.toFixed(1)}%</h3><p>Marked: ${totalMarked} / ${totalPossible}</p>`;
    document.getElementById('reportModal').style.display = "block";
}

function closeModal() { document.getElementById('reportModal').style.display = "none"; }