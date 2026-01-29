const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');
const messageBox = document.getElementById('message');
const bgm = document.getElementById('bgm');
const godRays = document.getElementById('god-rays');
const clockElement = document.getElementById('relationship-clock');
const ageElement = document.getElementById('age-display');
const titleElement = document.querySelector('.title');

let config = {};
let messages = [];
let messageDurations = [];
let startDate, birthDate;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
let targetMousePos = { x: canvas.width / 2, y: canvas.height / 2 };

// Audio Analysis Setup
let audioCtx, analyser, dataArray, source;
let audioFreq = 0;
let analysisEnabled = false;

async function initApp() {
    // Try to load from global variable first (config.js for offline)
    // Fallback to config.json if offline data is not present
    if (typeof birthdayConfig !== 'undefined') {
        config = birthdayConfig;
        console.log("Loaded config from config.js (Offline mode)");
    } else {
        try {
            const response = await fetch('config.json');
            config = await response.json();
            console.log("Loaded config from config.json (Online mode)");
        } catch (err) {
            console.error("Failed to load any configuration:", err);
            return;
        }
    }

    applyConfig();
}

function applyConfig() {
    messages = config.messages;
    messageDurations = config.messageDurations;
    startDate = new Date(config.relationshipStartDate);
    birthDate = new Date(config.birthDate);

    // Populate names
    titleElement.textContent = config.name;
    document.title = `Chúc mừng sinh nhật ${config.name}`;

    // Start loops
    updateAge();
    setInterval(updateRelationshipClock, 1000);
    updateRelationshipClock();
    initStars();
    initDust();
    initNebula();
    initHearts();
    draw();
}

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();

        try {
            source = audioCtx.createMediaElementSource(bgm);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            analysisEnabled = true;
        } catch (corsError) {
            console.warn("Audio analysis blocked (CORS).");
            analysisEnabled = false;
        }

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    } catch (e) {
        console.error("Audio Context failed:", e);
    }
}

function updateAge() {
    if (!birthDate) return;
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
        age--;
    }
    ageElement.innerHTML = `Mừng sinh nhật lần thứ <b>${age}</b> của em`;
}

function updateRelationshipClock() {
    if (!startDate) return;
    const now = new Date();
    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();
    let hours = now.getHours() - startDate.getHours();
    let minutes = now.getMinutes() - startDate.getMinutes();
    let seconds = now.getSeconds() - startDate.getSeconds();

    if (seconds < 0) { seconds += 60; minutes--; }
    if (minutes < 0) { minutes += 60; hours--; }
    if (hours < 0) { hours += 24; days--; }
    if (days < 0) {
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonth.getDate();
        months--;
    }
    if (months < 0) { months += 12; years--; }

    const pad = (n) => n.toString().padStart(2, '0');

    clockElement.innerHTML = `
        <b>${pad(years)}</b> năm <b>${pad(months)}</b> tháng <b>${pad(days)}</b> ngày<br>
        <b>${pad(hours)}</b> giờ <b>${pad(minutes)}</b> phút <b>${pad(seconds)}</b> giây
    `;
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
    initDust();
    initHearts();
});

window.addEventListener('mousemove', (e) => {
    targetMousePos.x = e.clientX;
    targetMousePos.y = e.clientY;
});

let stars = [];
let dust = [];
let shootingStars = [];
let trailParticles = [];
let fireworks = [];
let nebulaParticles = [];
let hearts = [];

let currentIndex = 0;
let currentCharIndex = 0;
let typingInterval = null;
let currentTimeout = null;
let sequenceStarted = false;
let isPaused = false;
let isFinale = false;
let finaleT = 0;
let pulse = 0;
let skyShift = 0;
let musicPlaying = false;

class Heart {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 50;
        this.size = Math.random() * 8 + 4;
        this.speed = Math.random() * 0.5 + 0.2;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.alpha = Math.random() * 0.4 + 0.1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }
    update() {
        if (isPaused) return;
        this.y -= this.speed;
        this.x += this.vx;
        this.rotation += this.rotationSpeed;
        if (this.y < -50) this.reset();
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        const d = this.size;
        ctx.moveTo(0, d / 4);
        ctx.bezierCurveTo(d / 2, -d / 2, d, d / 3, 0, d);
        ctx.bezierCurveTo(-d, d / 3, -d / 2, -d / 2, 0, d / 4);
        ctx.fill();
        ctx.restore();
    }
}

class ShootingStar {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = 0;
        this.len = Math.random() * 80 + 50;
        this.speed = Math.random() * 10 + 5;
        this.opacity = 1;
        this.active = false;
        this.wait = Math.random() * 500;
    }
    update() {
        if (isPaused) return;
        if (!this.active) {
            this.wait--;
            if (this.wait <= 0) this.active = true;
            return;
        }
        this.x -= this.speed;
        this.y += this.speed;
        this.opacity -= 0.01;
        if (this.opacity <= 0 || this.x < 0 || this.y > canvas.height) {
            this.reset();
        }
    }
    draw() {
        if (!this.active) return;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.len, this.y - this.len);
        ctx.stroke();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, speedScale = 1) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2 * speedScale;
        this.vy = (Math.random() - 0.5) * 2 * speedScale;
        this.alpha = 1;
        this.size = Math.random() * 2 + 1;
        this.color = color;
    }
    update() {
        if (isPaused) return;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function initStars() {
    stars = [];
    if (!messages.length) return;
    for (let i = 0; i < messages.length; i++) {
        stars.push({
            x: Math.random() * canvas.width * 0.6 + canvas.width * 0.2,
            y: Math.random() * canvas.height * 0.4 + canvas.height * 0.25,
            r: 2 + Math.random() * 1.5,
            alpha: Math.random(),
            message: messages[i]
        });
    }
}

function initDust() {
    dust = [];
    for (let i = 0; i < 70; i++) {
        dust.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.2,
            alpha: Math.random() * 0.5,
            parallax: Math.random() * 0.5 + 0.2
        });
    }
}

function initNebula() {
    nebulaParticles = [];
    for (let i = 0; i < 5; i++) {
        nebulaParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 250 + 150,
            color: i % 2 === 0 ? 'rgba(100, 50, 255, 0.05)' : 'rgba(255, 50, 150, 0.04)',
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2
        });
    }
}

function initHearts() {
    hearts = [];
    for (let i = 0; i < 15; i++) {
        hearts.push(new Heart());
    }
}

for (let i = 0; i < 2; i++) shootingStars.push(new ShootingStar());

function createExplosion(x, y) {
    for (let i = 0; i < 40; i++) {
        fireworks.push(new Particle(x, y, '#ffd700', 2.5));
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (analysisEnabled && analyser) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 15; i++) sum += dataArray[i];
        audioFreq = isPaused ? 0 : sum / 15 / 255;
    } else {
        audioFreq = 0;
    }

    mousePos.x += (targetMousePos.x - mousePos.x) * 0.05;
    mousePos.y += (targetMousePos.y - mousePos.y) * 0.05;

    const offX = (mousePos.x - canvas.width / 2) * 0.02;
    const offY = (mousePos.y - canvas.height / 2) * 0.02;

    if (godRays) {
        const rayScale = 1 + audioFreq * 0.3;
        godRays.style.transform = `translate(-50%, -50%) scale(${rayScale})`;
        godRays.style.opacity = musicPlaying ? 0.3 + audioFreq * 0.7 : 0;
    }

    nebulaParticles.forEach(n => {
        if (!isPaused) {
            n.x += n.vx;
            n.y += n.vy;
            if (n.x < -n.r) n.x = canvas.width + n.r;
            if (n.x > canvas.width + n.r) n.x = -n.r;
            if (n.y < -n.r) n.y = canvas.height + n.r;
            if (n.y > canvas.height + n.r) n.y = -n.r;
        }

        ctx.beginPath();
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
    });

    shootingStars.forEach(s => {
        s.update();
        s.draw();
    });

    hearts.forEach(h => {
        h.update();
        h.draw();
    });

    dust.forEach(d => {
        const pulseScale = 1 + audioFreq * 0.6;
        const dx = d.x + offX * d.parallax;
        const dy = d.y + offY * d.parallax;
        ctx.beginPath();
        ctx.arc(dx, dy, d.r * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${d.alpha + audioFreq * 0.3})`;
        ctx.fill();

        if (!isPaused) {
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0) d.x = canvas.width;
            if (d.x > canvas.width) d.x = 0;
            if (d.y < 0) d.y = canvas.height;
            if (d.y > canvas.height) d.y = 0;
        }
    });

    if (musicPlaying && !isPaused) {
        trailParticles.push(new Particle(targetMousePos.x, targetMousePos.y, 'rgba(255,255,255,0.4)', 0.5));
    }
    trailParticles = trailParticles.filter(p => p.alpha > 0);
    trailParticles.forEach(p => { p.update(); p.draw(); });

    fireworks = fireworks.filter(p => p.alpha > 0);
    fireworks.forEach(p => { p.update(); p.draw(); });

    if (isFinale && !isPaused) {
        // Increment t to move along the heart path
        finaleT += 0.05;
        const pos = getHeartPoint(finaleT);
        // Spawn 2-3 particles at the current position to create a denser trail
        for (let i = 0; i < 3; i++) {
            trailParticles.push(new Particle(pos.x, pos.y, 'rgba(255, 105, 180, 0.8)', 0.8));
        }

        // Occasionally spawn a bigger "bubble"
        if (Math.random() < 0.2) {
            const p = new Particle(pos.x, pos.y, 'rgba(255, 255, 255, 0.6)', 0.4);
            p.size = Math.random() * 4 + 2;
            trailParticles.push(p);
        }
    }

    stars.forEach((star, i) => {
        const sx = star.x + offX;
        const sy = star.y + offY;
        const starAlpha = star.alpha;
        const isActive = (i === currentIndex && sequenceStarted && !isFinale);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.globalAlpha = starAlpha;

        // Base Glow
        ctx.shadowBlur = (isActive ? 35 : 5) + audioFreq * 40;
        ctx.shadowColor = isActive ? "#ffd700" : "white";

        // Star Style - Sharp 4-pointed Star (Twinkle)
        const armLength = (star.r * (isActive ? 4.5 : 2.2)) * (1 + audioFreq * 0.8);
        ctx.fillStyle = isActive ? "#ffd700" : "#fff";

        // Draw Pointed Star Shape
        ctx.beginPath();
        ctx.moveTo(0, -armLength);
        // Using (0,0) as control point creates the inward curve/sharp point effect
        ctx.quadraticCurveTo(0, 0, armLength, 0);
        ctx.quadraticCurveTo(0, 0, 0, armLength);
        ctx.quadraticCurveTo(0, 0, -armLength, 0);
        ctx.quadraticCurveTo(0, 0, 0, -armLength);
        ctx.fill();

        // Extra brightness at center for active star
        if (isActive) {
            ctx.beginPath();
            ctx.arc(0, 0, star.r * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = "#fff";
            ctx.fill();
        }

        ctx.restore();

        if (!isPaused) {
            const flicker = (Math.random() - 0.5) * 0.1;
            star.alpha = Math.max(0.2, Math.min(1, star.alpha + flicker));
        }
    });

    if (!isPaused) {
        skyShift += 0.002;
    }
    const hue = 220 + Math.sin(skyShift) * 20;
    document.body.style.background = `radial-gradient(circle at bottom, hsl(${hue}, 60%, 15%), #020111 80%)`;

    requestAnimationFrame(draw);
}

function getHeartPoint(t) {
    // Standard parametric heart formula
    // x = 16sin^3(t)
    // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    const scale = window.innerWidth < 600 ? 12 : 25;
    return {
        x: x * scale + canvas.width / 2,
        y: y * scale + canvas.height * 0.4
    };
}

function startFinale() {
    isFinale = true;
    messageBox.classList.remove('show'); // Hide messages when heart starts
    console.log("Starting Heart Finale!");
}

function typeMessage() {
    if (isPaused || !sequenceStarted) return;

    if (currentIndex >= messages.length) {
        startFinale();
        return;
    }

    clearInterval(typingInterval);
    const text = messages[currentIndex];

    if (currentCharIndex === 0) {
        messageBox.textContent = '';
        messageBox.classList.add('show');
    }

    typingInterval = setInterval(() => {
        if (isPaused) {
            clearInterval(typingInterval);
            return;
        }

        messageBox.textContent += text.charAt(currentCharIndex);
        currentCharIndex++;

        if (currentCharIndex >= text.length) {
            clearInterval(typingInterval);
            createExplosion(stars[currentIndex].x, stars[currentIndex].y);

            currentTimeout = setTimeout(() => {
                if (isPaused) return;
                currentIndex++;
                currentCharIndex = 0;
                typeMessage(); // Always call to trigger finale check
            }, messageDurations[currentIndex] || 5000);
        }
    }, 50);
}

function startSequence() {
    if (sequenceStarted) return;
    sequenceStarted = true;
    setTimeout(typeMessage, 1000);
}

function toggleExperience() {
    if (window.location.protocol !== 'file:') {
        initAudio();
    }

    if (!sequenceStarted) {
        // Initial Start
        bgm.volume = 0;
        bgm.currentTime = 0;
        const playPromise = bgm.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                let vol = 0;
                const fade = setInterval(() => {
                    vol += 0.1;
                    if (vol >= 1) {
                        bgm.volume = 1;
                        clearInterval(fade);
                    } else {
                        bgm.volume = vol;
                    }
                }, 50);
            }).catch(err => {
                bgm.volume = 1;
                console.error("Audio error:", err);
            });
        }
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        startSequence();
        document.querySelector('.title').classList.add('active');
        musicPlaying = true;
    } else {
        // Pause / Resume
        if (!isPaused) {
            bgm.pause();
            isPaused = true;
            clearInterval(typingInterval);
            if (currentTimeout) clearTimeout(currentTimeout);
            document.querySelector('.title').classList.remove('active');
        } else {
            bgm.play();
            isPaused = false;
            document.querySelector('.title').classList.add('active');

            const text = messages[currentIndex];
            if (currentCharIndex < text.length) {
                typeMessage();
            } else {
                currentIndex++;
                currentCharIndex = 0;
                if (currentIndex < messages.length) {
                    typeMessage();
                }
            }
        }
    }
}

window.addEventListener('click', toggleExperience);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        toggleExperience();
    }
});

initApp();
