let globalData = {};
let wordChart = null;

function showLoading() {
  const loading = document.createElement('div');
  loading.id = 'loading-overlay';
  loading.className = 'loading-overlay';
  loading.innerHTML = '<div class="spinner"></div><p>🔄 Processing MapReduce...</p>';
  document.body.appendChild(loading);
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.remove();
}

function populateTopWords(reduced) {
  const list = document.getElementById("resultList");
  list.innerHTML = '';
  const sorted = Object.entries(reduced).sort(([,a],[,b]) => b - a).slice(0,10);
  sorted.forEach(([word, count], index) => {
    const li = document.createElement('li');
    li.className = 'top-word';
    li.style.animationDelay = `${index * 0.1}s`;
    li.innerHTML = `${word} → ${count}`;
    list.appendChild(li);
  });
}

function renderMapCards(mapped) {
  const container = document.getElementById("mapOutput");
  container.innerHTML = '';
  container.classList.add('map-container');
  const sample = mapped.slice(0, 20);
  sample.forEach(([word, count], i) => {
    const card = document.createElement('div');
    card.className = 'map-card';
    card.style.animationDelay = `${i * 0.05}s`;
    card.innerHTML = `
      <div class="card-front"><strong>${word}</strong></div>
      <div class="card-back"><strong>${count}</strong></div>
    `;
    container.appendChild(card);
  });
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function processData() {
    const text = document.getElementById("textInput").value;
    const fileInput = document.getElementById("fileInput").files[0];

    let formData = new FormData();
    formData.append("text", text);
    if (fileInput) formData.append("file", fileInput);

    showLoading();
    fetch('/process', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        hideLoading();
        globalData = data.reduced;

        // Chart - fixed gradient as array for top colors
        const colors = ['#36d1dc', '#5b86e5', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'];
        
        const sortedData = Object.entries(data.reduced).sort(([,a],[,b]) => b - a).slice(0,10);
        let labels = sortedData.map(item => item[0]);
        let values = sortedData.map(item => item[1]);

        if (wordChart) {
            wordChart.destroy();
        }
        wordChart = new Chart(document.getElementById("chart"), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: "Word Count",
                    data: values,
                    backgroundColor: colors.slice(0, values.length)
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true } }
            }
        });

        populateTopWords(data.reduced);
        renderMapCards(data.mapped);
    });
}

function downloadPDF() {
    if (Object.keys(globalData).length === 0) {
        alert("No data available to download!");
        return;
    }

    // Capture Chart canvas and convert it to a Base64 image
    const chartCanvas = document.getElementById("chart");
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = chartCanvas.width;
    tempCanvas.height = chartCanvas.height;
    const ctx = tempCanvas.getContext("2d");
    
    ctx.fillStyle = "white"; // Prevent transparent background rendering as black in PDF
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(chartCanvas, 0, 0);
    
    const chartImage = tempCanvas.toDataURL("image/png");

    fetch('/download/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequencies: globalData, chart_image: chartImage })
    })
    .then(res => res.blob())
    .then(blob => {
        let a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "result.pdf";
        a.click();
    });
}

function initFallingLeaves() {
    const style = document.createElement('style');
    style.innerHTML = `
        #leaves-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        }
        .bg-tree {
            position: absolute;
            bottom: -5vh;
            right: 8vw;
            height: 85vh;
            width: auto;
            z-index: 1;
            filter: drop-shadow(0 10px 15px rgba(0,0,0,0.2)) blur(1px);
        }
        .glass-leaf {
            position: absolute;
            top: -15%;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
            animation: falling linear infinite;
            z-index: 2;
        }
        /* Leaf shapes using border-radius magic */
        .leaf-shape-1 { border-radius: 0 60% 0 60%; }
        .leaf-shape-2 { border-radius: 60% 0 60% 0; }
        .leaf-shape-3 { border-radius: 0 70% 10% 70%; }
        .leaf-shape-4 { border-radius: 70% 0% 70% 10%; }
        
        @keyframes falling {
            0% { top: -15%; transform: translateX(0px) rotate(0deg); }
            50% { transform: translateX(60px) rotate(180deg); }
            100% { top: 110%; transform: translateX(-40px) rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'leaves-container';
    
    // Add the single realistic autumn tree with a glass finish
    container.innerHTML = `
        <svg class="bg-tree" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="tree-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(204,85,0,0.85)" />
                    <stop offset="50%" stop-color="rgba(139,0,0,0.65)" />
                    <stop offset="100%" stop-color="rgba(101,67,33,0.45)" />
                </linearGradient>
            </defs>
            <!-- Trunk -->
            <path d="M85,300 C85,220 95,150 100,100 C105,150 115,220 115,300 Z" fill="#4a3219" opacity="0.9"/>
            <!-- Left Branch -->
            <path d="M98,180 C80,150 50,120 30,110 C50,130 80,160 92,185 Z" fill="#4a3219" opacity="0.9"/>
            <!-- Right Branch -->
            <path d="M102,150 C120,120 150,100 170,90 C150,110 120,130 108,155 Z" fill="#4a3219" opacity="0.9"/>
            <!-- Canopy -->
            <path d="M100,20 C30,20 10,90 40,130 C10,160 60,200 100,160 C140,200 190,160 160,130 C190,90 170,20 100,20 Z" fill="url(#tree-grad)" opacity="0.85"/>
            <!-- Inner canopy highlights -->
            <path d="M100,40 C55,40 40,90 60,115 C45,135 75,165 100,140 C125,165 155,135 140,115 C160,90 145,40 100,40 Z" fill="rgba(255,165,0,0.2)"/>
        </svg>
    `;

    document.body.appendChild(container);

    // Realistic leaf colors
    const leafColors = [
        'linear-gradient(135deg, rgba(204, 85, 0, 0.45), rgba(153, 51, 0, 0.1))',   // Burnt Orange
        'linear-gradient(135deg, rgba(139, 0, 0, 0.45), rgba(89, 0, 0, 0.1))',      // Deep Red
        'linear-gradient(135deg, rgba(218, 165, 32, 0.45), rgba(184, 134, 11, 0.1))', // Goldenrod
        'linear-gradient(135deg, rgba(85, 107, 47, 0.45), rgba(47, 79, 79, 0.1))',   // Olive Green
        'linear-gradient(135deg, rgba(139, 69, 19, 0.45), rgba(101, 67, 33, 0.1))'    // Saddle Brown
    ];

    // Generate leaves with random shapes, sizes, and delays
    for (let i = 0; i < 25; i++) {
        const leaf = document.createElement('div');
        const shape = Math.floor(Math.random() * 4) + 1;
        leaf.className = `glass-leaf leaf-shape-${shape}`;
        
        const size = Math.random() * 30 + 20; // Between 20px and 50px
        leaf.style.width = `${size}px`;
        leaf.style.height = `${size}px`;
        
        leaf.style.left = `${Math.random() * 100}%`;
        leaf.style.animationDuration = `${Math.random() * 12 + 8}s`; // Slower, relaxed fall
        leaf.style.animationDelay = `${Math.random() * 8}s`;
        leaf.style.background = leafColors[Math.floor(Math.random() * leafColors.length)];
        
        container.appendChild(leaf);
    }
}

// Init
document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('darkMode') === 'true') {
    toggleDarkMode();
  }
  document.querySelector('.dark-toggle').addEventListener('click', toggleDarkMode);
  initFallingLeaves();
});
