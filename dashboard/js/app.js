document.addEventListener('DOMContentLoaded', () => {
    // Initialize Leaflet Map
    const map = L.map('aviationMap', {
        zoomControl: false
    }).setView([30, 0], 2);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Custom airplane icon using HTML and FontAwesome
    const planeIcon = L.divIcon({
        html: '<i class="fa-solid fa-plane" style="color: #3b82f6; font-size: 16px; transform: rotate(45deg);"></i>',
        className: 'custom-plane-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const planes = [
        { marker: L.marker([40.7128, -74.0060], {icon: planeIcon}).addTo(map), lat: 40.7128, lng: -74.0060, dLat: 0.05, dLng: 0.1 }, // NY to Europe
        { marker: L.marker([51.5074, -0.1278], {icon: planeIcon}).addTo(map), lat: 51.5074, lng: -0.1278, dLat: -0.05, dLng: -0.05 }, // London to SA
        { marker: L.marker([35.6762, 139.6503], {icon: planeIcon}).addTo(map), lat: 35.6762, lng: 139.6503, dLat: -0.02, dLng: -0.1 }, // Tokyo to US
        { marker: L.marker([-33.8688, 151.2093], {icon: planeIcon}).addTo(map), lat: -33.8688, lng: 151.2093, dLat: 0.1, dLng: -0.1 }, // Sydney to Asia
        { marker: L.marker([25.2048, 55.2708], {icon: planeIcon}).addTo(map), lat: 25.2048, lng: 55.2708, dLat: 0.05, dLng: 0.05 } // Dubai to Europe
    ];

    // Animate planes
    setInterval(() => {
        planes.forEach(p => {
            p.lat += p.dLat;
            p.lng += p.dLng;
            
            // basic bounds reset
            if (p.lng > 180) p.lng = -180;
            if (p.lng < -180) p.lng = 180;
            if (p.lat > 90) p.lat = -90;
            if (p.lat < -90) p.lat = 90;

            p.marker.setLatLng([p.lat, p.lng]);
        });
    }, 100);

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
