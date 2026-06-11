document.addEventListener('DOMContentLoaded', () => {
    // Initialize Chart.js
    const ctx = document.getElementById('trafficChart').getContext('2d');
    
    // Gradient for the chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    const trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [{
                label: 'Global Telemetry Ingestion (TB)',
                data: [120, 190, 300, 450, 380, 250, 160],
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#1e293b',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            }
        }
    });

    // Simulate Live Data Updates
    setInterval(() => {
        // Update Active Flights
        const flightEl = document.getElementById('active-flights');
        let flights = parseInt(flightEl.innerText.replace(',', ''));
        const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
        flights += change;
        flightEl.innerText = flights.toLocaleString();

        // Update API Requests
        const apiEl = document.getElementById('api-reqs');
        let reqs = parseInt(apiEl.innerText.replace(',', ''));
        const reqChange = Math.floor(Math.random() * 101) - 50;
        reqs += reqChange;
        apiEl.innerText = reqs.toLocaleString();

    }, 3000);

    // Simulate Log Stream
    const logMessages = [
        '<span class="info">INFO</span> [baggage-ops] Baggage routed for flight UA102',
        '<span class="info">INFO</span> [passenger-ops] Boarding completed gate A12',
        '<span class="warn">WARN</span> [weather-intel] High turbulence detected over NATLA',
        '<span class="info">INFO</span> [telemetry] Received 1024 engine readouts from fleet',
        '<span class="error">ERROR</span> [flight-ops] Timeout connecting to legacy ATC system'
    ];

    const logStream = document.getElementById('log-stream');
    setInterval(() => {
        const msg = logMessages[Math.floor(Math.random() * logMessages.length)];
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        
        const line = document.createElement('div');
        line.className = 'log-line';
        line.innerHTML = `<span class="timestamp">[${time}]</span> ${msg}`;
        
        logStream.appendChild(line);
        logStream.scrollTop = logStream.scrollHeight;

        // Keep only last 50 logs
        if (logStream.children.length > 50) {
            logStream.removeChild(logStream.firstChild);
        }
    }, 4500);
});
