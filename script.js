// Configuration & Constants
const FECHA_NACIMIENTO = "2002-09-07T00:00:00";
const FOTOS = ["fotos/mama-1.jpg", "fotos/mama-2.jpg", "fotos/mama-3.jpg"];

// DOM Elements
const startBtn = document.getElementById("startBtn");
const introScreen = document.getElementById("introScreen");
const storyScreen = document.getElementById("storyScreen");
const canvasContainer = document.getElementById("canvasContainer");
const leftContent = document.getElementById("leftContent");
const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");

const counterDays = document.getElementById("counterDays");
const counterHours = document.getElementById("counterHours");
const counterMins = document.getElementById("counterMins");
const counterSecs = document.getElementById("counterSecs");

const togglePhotosBtn = document.getElementById("togglePhotosBtn");
const photoFrameWrapper = document.getElementById("photoFrameWrapper");
const photo = document.getElementById("photo");
const dotsContainer = document.getElementById("dots");
const prevPhoto = document.getElementById("prevPhoto");
const nextPhoto = document.getElementById("nextPhoto");
const replayBtn = document.getElementById("replayBtn");

// State variables
let animationStartTime = 0;
let animationFrameId = null;
let counterIntervalId = null;
let photoIndex = 0;

// Canvas dimensions
const W = 800;
const H = 520;
const GROUND_Y = 450;
const SEED_START_Y = 190;
const SEED_X = 400;

// Generated Structures
let treeBranches = [];
let heartFlowers = [];
let fallingPetals = [];

// -------------------------------------------------------------
// 1. HEART & TREE GENERATION
// -------------------------------------------------------------

function generateTreeBranches() {
  // Define organic tree branch skeleton curving naturally under the heart canopy
  treeBranches = [
    // Main Trunk Base
    { start: [400, 450], control: [398, 400], end: [400, 340], widthStart: 22, widthEnd: 14, delay: 1.2, duration: 1.0 },

    // Primary Left Bough (Curving out & up into left heart lobe)
    { start: [400, 370], control: [345, 345], end: [305, 300], widthStart: 13, widthEnd: 8, delay: 1.9, duration: 1.0 },
    { start: [305, 300], control: [260, 265], end: [225, 220], widthStart: 8, widthEnd: 4, delay: 2.7, duration: 0.9 },
    { start: [305, 300], control: [315, 250], end: [310, 190], widthStart: 7, widthEnd: 3, delay: 2.8, duration: 0.9 },
    { start: [225, 220], control: [200, 185], end: [195, 150], widthStart: 4, widthEnd: 2, delay: 3.4, duration: 0.7 },

    // Primary Right Bough (Curving out & up into right heart lobe)
    { start: [400, 370], control: [455, 345], end: [495, 300], widthStart: 13, widthEnd: 8, delay: 1.9, duration: 1.0 },
    { start: [495, 300], control: [540, 265], end: [575, 220], widthStart: 8, widthEnd: 4, delay: 2.7, duration: 0.9 },
    { start: [495, 300], control: [485, 250], end: [490, 190], widthStart: 7, widthEnd: 3, delay: 2.8, duration: 0.9 },
    { start: [575, 220], control: [600, 185], end: [605, 150], widthStart: 4, widthEnd: 2, delay: 3.4, duration: 0.7 },

    // Center Vertical Extensions (Reaching into middle & top of heart)
    { start: [400, 340], control: [385, 280], end: [365, 220], widthStart: 10, widthEnd: 5, delay: 2.2, duration: 0.9 },
    { start: [400, 340], control: [415, 280], end: [435, 220], widthStart: 10, widthEnd: 5, delay: 2.2, duration: 0.9 },
    { start: [365, 220], control: [345, 175], end: [340, 135], widthStart: 5, widthEnd: 2, delay: 3.0, duration: 0.8 },
    { start: [435, 220], control: [455, 175], end: [460, 135], widthStart: 5, widthEnd: 2, delay: 3.0, duration: 0.8 }
  ];
}

function generateHeartFlowers() {
  heartFlowers = [];
  const count = 160;
  const centerX = 400;
  const centerY = 190;

  for (let i = 0; i < count; i++) {
    // Parametric heart formula
    let t = Math.random() * Math.PI * 2;
    // Distribute points both along border and inside interior
    let rDist = Math.sqrt(Math.random());
    if (i < 50) rDist = 0.95 + Math.random() * 0.1; // outline focus

    // Heart parametric equations scaled to tree canopy dimensions
    let hx = 16 * Math.pow(Math.sin(t), 3);
    let hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

    let scaleX = 11.5 * rDist;
    let scaleY = 10.5 * rDist;

    let x = centerX + hx * scaleX + (Math.random() - 0.5) * 8;
    let y = centerY + hy * scaleY + (Math.random() - 0.5) * 8;

    // Stagger bloom delay based on Y position (bottom flowers bloom first, top last)
    let bloomDelay = 4.0 + ((GROUND_Y - y) / 380) * 2.2 + Math.random() * 0.6;
    let size = 11 + Math.random() * 6;
    let rotation = Math.random() * Math.PI * 2;

    heartFlowers.push({
      x, y, size, rotation,
      bloomDelay,
      bloomed: false
    });
  }

  // Sort by Y so lower flowers draw first for natural layering
  heartFlowers.sort((a, b) => a.y - b.y);
}

// -------------------------------------------------------------
// 2. RENDERING FUNCTIONS
// -------------------------------------------------------------

function drawGround(progress) {
  if (progress <= 0) return;
  const endX = 50 + (700 * Math.min(progress, 1.0));
  ctx.beginPath();
  ctx.moveTo(50, GROUND_Y);
  ctx.lineTo(endX, GROUND_Y);
  ctx.strokeStyle = "#4E3629";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawSeed(elapsed) {
  if (elapsed < 0.2) return;

  // Seed drops from 0.2s to 1.1s
  const dropDuration = 0.9;
  const dropProgress = Math.min(1.0, Math.max(0, (elapsed - 0.2) / dropDuration));

  // Quadratic gravity acceleration ease-in
  const easeIn = dropProgress * dropProgress;
  const currentY = SEED_START_Y + (GROUND_Y - SEED_START_Y) * easeIn;

  ctx.save();
  ctx.beginPath();
  ctx.arc(SEED_X, currentY, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#5C2D12";
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 4;
  ctx.fill();

  // Highlight on seed
  ctx.beginPath();
  ctx.arc(SEED_X - 2, currentY - 2, 2, 0, Math.PI * 2);
  ctx.fillStyle = "#8C4A18";
  ctx.fill();
  ctx.restore();

  // Dirt impact burst when landing
  if (dropProgress >= 1.0 && elapsed < 1.6) {
    const impactProgress = (elapsed - 1.1) / 0.5;
    ctx.save();
    ctx.strokeStyle = `rgba(92, 45, 18, ${1 - impactProgress})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(SEED_X, GROUND_Y, 4 + impactProgress * 16, 2 + impactProgress * 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function getQuadraticBezierPoint(p0, p1, p2, t) {
  const invT = 1 - t;
  const x = invT * invT * p0[0] + 2 * invT * t * p1[0] + t * t * p2[0];
  const y = invT * invT * p0[1] + 2 * invT * t * p1[1] + t * t * p2[1];
  return [x, y];
}

function drawBranch(branch, elapsed) {
  if (elapsed < branch.delay) return;

  const bProgress = Math.min(1.0, (elapsed - branch.delay) / branch.duration);
  if (bProgress <= 0) return;

  const steps = 30;
  const currentSteps = Math.floor(steps * bProgress);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let i = 0; i < currentSteps; i++) {
    const t1 = i / steps;
    const t2 = (i + 1) / steps;

    const pt1 = getQuadraticBezierPoint(branch.start, branch.control, branch.end, t1);
    const pt2 = getQuadraticBezierPoint(branch.start, branch.control, branch.end, t2);

    const currentWidth = branch.widthStart + (branch.widthEnd - branch.widthStart) * t1;

    ctx.beginPath();
    ctx.moveTo(pt1[0], pt1[1]);
    ctx.lineTo(pt2[0], pt2[1]);
    ctx.lineWidth = currentWidth;
    ctx.strokeStyle = "#5C3218";
    ctx.stroke();
  }

  ctx.restore();
}

function drawSunflower(x, y, radius, rotation, scale = 1.0) {
  if (scale <= 0.01) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);

  const petalCount = 12;
  const petalLen = radius * 1.1;
  const petalWidth = radius * 0.45;

  // Petals
  for (let i = 0; i < petalCount; i++) {
    const angle = (i * Math.PI * 2) / petalCount;
    ctx.save();
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.ellipse(0, -petalLen * 0.7, petalWidth, petalLen, 0, 0, Math.PI * 2);

    const grad = ctx.createLinearGradient(0, 0, 0, -petalLen * 1.5);
    grad.addColorStop(0, "#FFB700");
    grad.addColorStop(0.7, "#FFD000");
    grad.addColorStop(1, "#FFE600");
    ctx.fillStyle = grad;
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 3;
    ctx.fill();

    ctx.strokeStyle = "#E5A000";
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();
  }

  // Dark Center Disc
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
  const centerGrad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 0.5);
  centerGrad.addColorStop(0, "#54290E");
  centerGrad.addColorStop(0.8, "#381907");
  centerGrad.addColorStop(1, "#260F03");
  ctx.fillStyle = centerGrad;
  ctx.fill();

  ctx.strokeStyle = "#6B3818";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}

function drawFlowers(elapsed) {
  heartFlowers.forEach(flower => {
    if (elapsed < flower.bloomDelay) return;

    const bloomProgress = Math.min(1.0, (elapsed - flower.bloomDelay) / 0.6);

    // Elastic spring bounce effect (scale 0 -> 1.15 -> 1.0)
    let scale = 0;
    if (bloomProgress < 0.7) {
      scale = (bloomProgress / 0.7) * 1.18;
    } else {
      scale = 1.18 - ((bloomProgress - 0.7) / 0.3) * 0.18;
    }

    drawSunflower(flower.x, flower.y, flower.size, flower.rotation, scale);
  });
}

// Particle system for falling petals/flowers drifting leftwards
function updateAndDrawFallingPetals(dt, elapsed) {
  if (elapsed < 6.5) return;

  // Emit new petal randomly
  if (Math.random() < 0.35) {
    // Pick random bloomed flower position
    const sourceFlower = heartFlowers[Math.floor(Math.random() * heartFlowers.length)];
    fallingPetals.push({
      x: sourceFlower.x,
      y: sourceFlower.y,
      vx: -(1.5 + Math.random() * 2.0), // Drift left
      vy: 1.0 + Math.random() * 1.5,    // Gravity down
      size: 4 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.08,
      swayFreq: 1.5 + Math.random() * 2,
      swayAmp: 0.8 + Math.random() * 1.2,
      age: 0,
      maxAge: 4.5 + Math.random() * 2.5
    });
  }

  // Update & draw particles
  for (let i = fallingPetals.length - 1; i >= 0; i--) {
    const p = fallingPetals[i];
    p.age += dt;
    if (p.age >= p.maxAge) {
      fallingPetals.splice(i, 1);
      continue;
    }

    p.x += p.vx + Math.sin(p.age * p.swayFreq) * p.swayAmp;
    p.y += p.vy;
    p.rotation += p.vRot;

    const alpha = Math.min(1, Math.min(p.age / 0.5, (p.maxAge - p.age) / 1.0));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    // Draw single petal or mini sunflower
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD000";
    ctx.fill();

    ctx.restore();
  }
}

// -------------------------------------------------------------
// 3. MASTER ANIMATION LOOP
// -------------------------------------------------------------

let lastTime = 0;

function animate(currentTime) {
  if (!lastTime) lastTime = currentTime;
  const dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  const elapsed = (currentTime - animationStartTime) / 1000;

  // Clear Canvas
  ctx.clearRect(0, 0, W, H);

  // STAGE 1: Ground drawing (0.0s - 0.6s)
  drawGround(elapsed / 0.6);

  // STAGE 2: Seed drop (0.2s - 1.2s)
  drawSeed(elapsed);

  // STAGE 3: Tree growth (1.2s - 4.5s)
  treeBranches.forEach(branch => drawBranch(branch, elapsed));

  // STAGE 4: Heart flowers bloom (4.0s - 7.0s)
  drawFlowers(elapsed);

  // STAGE 5: Shift tree right & show left content (Triggered at 7.2s)
  if (elapsed >= 7.2 && !canvasContainer.classList.contains("shifted")) {
    canvasContainer.classList.add("shifted");
    leftContent.classList.remove("hidden");
    // Trigger reflow then add visible class for smooth CSS fade-in
    void leftContent.offsetWidth;
    leftContent.classList.add("visible");
  }

  // STAGE 5 (Continuous): Falling petals drift across screen
  updateAndDrawFallingPetals(dt, elapsed);

  animationFrameId = requestAnimationFrame(animate);
}

// -------------------------------------------------------------
// 4. COUNTER & PHOTO GALLERY FUNCTIONS
// -------------------------------------------------------------

function updateCounter() {
  const birthDate = new Date(FECHA_NACIMIENTO);
  const now = new Date();
  const diffMs = Math.max(0, now - birthDate);
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (counterDays) counterDays.textContent = days;
  if (counterHours) counterHours.textContent = String(hours).padStart(2, '0');
  if (counterMins) counterMins.textContent = String(minutes).padStart(2, '0');
  if (counterSecs) counterSecs.textContent = String(seconds).padStart(2, '0');
}

function renderPhotoDots() {
  dotsContainer.innerHTML = "";
  FOTOS.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `dot${index === photoIndex ? " active" : ""}`;
    dot.setAttribute("aria-label", `Ver foto ${index + 1}`);
    dot.addEventListener("click", () => {
      photoIndex = index;
      showPhoto();
    });
    dotsContainer.appendChild(dot);
  });
}

function showPhoto() {
  if (FOTOS[photoIndex]) {
    photo.src = FOTOS[photoIndex];
  }
  renderPhotoDots();
}

// -------------------------------------------------------------
// 5. START / REPLAY CONTROLLER
// -------------------------------------------------------------

function startAnimation() {
  introScreen.classList.add("hidden");
  storyScreen.classList.remove("hidden");

  // Reset shift & content state
  canvasContainer.classList.remove("shifted");
  leftContent.classList.remove("visible");
  leftContent.classList.add("hidden");

  // Reset particle lists
  fallingPetals = [];

  // Generate new tree & flower distributions
  generateTreeBranches();
  generateHeartFlowers();

  // Start counter
  updateCounter();
  if (counterIntervalId) clearInterval(counterIntervalId);
  counterIntervalId = setInterval(updateCounter, 1000);

  // Cancel previous animation loop if any
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  // Start frame loop
  lastTime = 0;
  animationStartTime = performance.now();
  animationFrameId = requestAnimationFrame(animate);
}

// -------------------------------------------------------------
// 6. EVENT LISTENERS
// -------------------------------------------------------------

startBtn.addEventListener("click", startAnimation);

replayBtn.addEventListener("click", () => {
  startAnimation();
});

togglePhotosBtn.addEventListener("click", () => {
  photoFrameWrapper.classList.toggle("hidden");
  if (!photoFrameWrapper.classList.contains("hidden")) {
    showPhoto();
  }
});

prevPhoto.addEventListener("click", () => {
  photoIndex = (photoIndex - 1 + FOTOS.length) % FOTOS.length;
  showPhoto();
});

nextPhoto.addEventListener("click", () => {
  photoIndex = (photoIndex + 1) % FOTOS.length;
  showPhoto();
});

// Initial photo setup
showPhoto();
