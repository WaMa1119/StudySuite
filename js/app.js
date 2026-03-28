let quizData = [];
let currentIdx = 0;
let score = 0;
let streak = 0;
let corrects = 0;
let isAnswered = false;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const materia = params.get('materia');
    
    if(!materia) return window.location.href = 'index.html';
    document.getElementById('materia-tag').innerText = `🧠 ${materia}`;

    const res = await fetch('data/questions.json');
    const data = await res.json();
    
    if(data[materia]) {
        prepareQuiz(data[materia]);
        renderQuestion();
    }
});

function prepareQuiz(temasObj) {
    let allSelected = [];
    const temas = Object.keys(temasObj);

    temas.forEach(tema => {
        let preguntas = temasObj[tema].map(p => ({ ...p, temaNombre: tema }));
        // Mix questions by topic
        preguntas.sort(() => Math.random() - 0.5);
        // Pick no more then 15 questions by topic
        allSelected = allSelected.concat(preguntas.slice(0, 8));
    });

    // Mix all
    quizData = allSelected.sort(() => Math.random() - 0.5);
}

function renderQuestion() {
    isAnswered = false;
    const q = quizData[currentIdx];
    
    // UI Reset
    document.getElementById('q-text').innerText = q.pregunta;
    document.getElementById('topic-tag').innerText = q.temaNombre;
    document.getElementById('q-counter').innerText = `Pregunta ${currentIdx + 1}/${quizData.length}`;
    document.getElementById('bar-fill').style.width = `${(currentIdx / quizData.length) * 100}%`;
    
    document.getElementById('btn-next').classList.add('hidden');
    document.getElementById('btn-explain').classList.add('hidden');
    document.getElementById('hint-text').classList.add('hidden');
    document.getElementById('explain-text').classList.add('hidden');

    handleMedia(q);

    const list = document.getElementById('options-list');
    list.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    q.opciones.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerHTML = `<span class="letter">${letters[i]}</span> <span class="txt">${opt}</span>`;
        btn.onclick = () => checkAnswer(i, q.respuestaCorrecta, btn);
        list.appendChild(btn);
    });
}

function checkAnswer(idx, correct, btn) {
    if(isAnswered) return;
    isAnswered = true;

    const q = quizData[currentIdx];
    if(idx === correct) {
        btn.classList.add('correct');
        score += 10;
        streak++;
        corrects++;
    } else {
        btn.classList.add('wrong');
        document.querySelectorAll('.opt-btn')[correct].classList.add('correct');
        streak = 0;
    }

    document.getElementById('score-val').innerText = score;
    document.getElementById('streak').innerText = streak;
    if(q.explicacion) document.getElementById('btn-explain').classList.remove('hidden');
    document.getElementById('btn-next').classList.remove('hidden');
}

// Dinamic grafics
function handleMedia(q) {
    const box = document.getElementById('media-box');
    const canvas = document.getElementById('q-canvas');
    const img = document.getElementById('q-img');
    
    // Hide all by default
    box.classList.add('hidden');
    img.classList.add('hidden');
    canvas.classList.add('hidden');

    if (q.imagen) {
        box.classList.remove('hidden');
        img.src = q.imagen;
        img.classList.remove('hidden');
    } else if (q.grafico) {
        box.classList.remove('hidden');
        canvas.classList.remove('hidden');
        // Call function that draw numbers and axis
        drawSimpleGraph(canvas, q.grafico);
    }
}

function drawGraph(canv, data) {
    const ctx = canv.getContext('2d');
    ctx.clearRect(0,0,300,200);
    // axis
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(150,0); ctx.lineTo(150,200);
    ctx.moveTo(0,100); ctx.lineTo(300,100);
    ctx.stroke();
    // Point
    if(data.tipo === 'punto') {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(150 + (data.x*20), 100 - (data.y*20), 5, 0, Math.PI*2);
        ctx.fill();
    }
}

function toggleInfo(type) {
    const q = quizData[currentIdx];
    const el = document.getElementById(type === 'hint' ? 'hint-text' : 'explain-text');
    el.innerText = type === 'hint' ? q.pista : q.explicacion;
    el.classList.toggle('hidden');
}

function nextQuestion() {
    currentIdx++;
    if(currentIdx < quizData.length) renderQuestion();
    else showResults();
}

function showResults() {
    document.getElementById('quiz-screen').classList.add('hidden');
    const screen = document.getElementById('result-screen');
    screen.classList.remove('hidden');

    const percent = Math.round((corrects / quizData.length) * 100);
    document.getElementById('res-percent').innerText = `${percent}%`;
    document.getElementById('res-ok').innerText = corrects;
    document.getElementById('res-bad').innerText = quizData.length - corrects;

    const msg = document.getElementById('res-msg');
    if(percent >= 90) msg.innerText = "¡Eres increíble! ¡Te amo, genia! 💖";
    else if(percent >= 70) msg.innerText = "¡Vas súper bien! Sigue así mi cielo. ✨";
    else msg.innerText = "¡No te desanimes! A repasar un poquito más. 💪";
}
function drawSimpleGraph(canvas, config) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Scale configuration
const scale = 25; // Pixels per unit (adjust this if you want more zoom)
const centerX = w / 2;
const centerY = h / 2;

// Clear previous drawing
ctx.clearRect(0, 0, w, h);

// --- 1. DRAW AXES AND NUMBERS ---
ctx.strokeStyle = "#bcbcbc"; // Soft gray color for axes
ctx.lineWidth = 2;
ctx.font = "10px Arial";
ctx.fillStyle = "#666"; // Color for numbers

// X Axis (Horizontal)
ctx.beginPath();
ctx.moveTo(0, centerY); ctx.lineTo(w, centerY);
ctx.stroke();

// Y Axis (Vertical)
ctx.beginPath();
ctx.moveTo(centerX, 0); ctx.lineTo(centerX, h);
ctx.stroke();

// Loop to draw automatic ticks and numbers (-10 to 10)
for (let i = -10; i <= 10; i++) {
    let posX = centerX + i * scale;
    let posY = centerY - i * scale;

    // Numbers and ticks on X
    if (i !== 0) {
        ctx.fillText(i, posX - 5, centerY + 15);
        ctx.beginPath(); ctx.moveTo(posX, centerY - 3); ctx.lineTo(posX, centerY + 3); ctx.stroke();
    }

    // Numbers and ticks on Y
    if (i !== 0) {
        ctx.fillText(i, centerX - 18, posY + 4);
        ctx.beginPath(); ctx.moveTo(centerX - 3, posY); ctx.lineTo(centerX + 3, posY); ctx.stroke();
    }
}

// --- 2. DRAW BASED ON QUESTION TYPE ---

// If it is a POINT (like your reference image)
if (config.tipo === "punto") {
    const px = centerX + config.x * scale;
    const py = centerY - config.y * scale;

    // Draw dashed guide lines (Red)
    if (config.guias) {
        ctx.setLineDash([4, 4]); // Dashed style
        ctx.strokeStyle = "#ff4d4d";
        ctx.beginPath();
        ctx.moveTo(px, centerY); ctx.lineTo(px, py); // Vertical line
        ctx.moveTo(centerX, py); ctx.lineTo(px, py); // Horizontal line
        ctx.stroke();
        ctx.setLineDash([]); // Remove dash for the rest
    }

    // Draw the point (pink circle style)
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#ff74a4";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add the label (A, B, C...)
    if (config.etiqueta) {
        ctx.fillStyle = "#333";
        ctx.font = "bold 14px Arial";
        ctx.fillText(config.etiqueta, px + 10, py - 10);
    }
}

// If it is a FUNCTION (mathematical equations)
if (config.tipo === "funcion") {
    ctx.strokeStyle = config.color || "#af4c8e";
    ctx.lineWidth = 3;
    ctx.beginPath();

    // Detect vertical line like "x=2"
    if (config.ecuacion.startsWith("x=")) {
        const val = parseFloat(config.ecuacion.split("=")[1]);
        const cx = centerX + val * scale;

        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.stroke();
        return;
    }

    // Detect horizontal line like "y=2"
    if (config.ecuacion.startsWith("y=") && !config.ecuacion.includes("x")) {
        const val = parseFloat(config.ecuacion.split("=")[1]);
        const cy = centerY - val * scale;

        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.stroke();
        return;
    }

    // Normal function like y=x , y=-x , y=x*2
    let expr = config.ecuacion.replace("y=", "");

    for (let x = -10; x <= 10; x += 0.1) {
        let y = eval(expr.replace(/x/g, `(${x})`));
        let cx = centerX + x * scale;
        let cy = centerY - y * scale;

        if (x === -10) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
}
}