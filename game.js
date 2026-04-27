const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Doodle Style Setup
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// Game State
const state = {
    cameraX: 0,
    isAccelerating: false,
    inverted: false,
    score: 0
};

// Player (Doodle Ball)
const player = {
    x: 200,
    y: 0,
    vx: 5,
    vy: 0,
    radius: 15,
    mass: 1
};

// Terrain (Sine-based for smooth Tiny Wings style hills)
const terrain = {
    getElevation(x) {
        // Combination of sine waves for irregular hills
        return height * 0.6 + 
               Math.sin(x * 0.003) * 100 + 
               Math.sin(x * 0.007) * 40 +
               Math.sin(x * 0.015) * 20;
    },
    getSlope(x) {
        // Derivative (approximate difference)
        return (this.getElevation(x + 1) - this.getElevation(x - 1)) / 2;
    }
};

// Input
window.addEventListener('mousedown', () => state.isAccelerating = true);
window.addEventListener('mouseup', () => state.isAccelerating = false);
window.addEventListener('touchstart', () => state.isAccelerating = true);
window.addEventListener('touchend', () => state.isAccelerating = false);

// Physics Constants
const gravity = 0.4;
const diveForce = 0.8;
const friction = 0.99;

function update() {
    let slope = terrain.getSlope(player.x);
    let angle = Math.atan(slope);
    let groundY = terrain.getElevation(player.x) - player.radius;

    // Apply gravity
    let currentGravity = state.isAccelerating ? gravity + diveForce : gravity;
    player.vy += currentGravity;

    // Basic mechanics: acceleration on downslopes
    if (state.isAccelerating && slope > 0) {
        player.vx += 0.2; // Gain speed on downslopes
    } else if (state.isAccelerating && slope < 0) {
        player.vx -= 0.1; // Lose slightly less speed on upslopes but still bad to dive
    }

    // Move player
    player.x += player.vx;
    player.y += player.vy;
    
    // Collision with ground
    if (player.y > groundY) {
        player.y = groundY;
        
        // Project velocity along the slope constraints
        let speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        
        // Preserve speed, direct along slope
        player.vx = speed * Math.cos(angle);
        player.vy = speed * Math.sin(angle);
        
        // Tiny wings mechanic: If we land perfectly on a downslope, speed boosts
        if (state.isAccelerating && slope > 0.1 && player.vy > 0) {
            player.vx *= 1.02;
        }
    }

    // Friction & bounds caps
    player.vx *= friction;
    if (player.vx < 3) player.vx = 3; // Minimum forward speed
    
    // Camera follows player
    state.cameraX = player.x - 200;
}

function drawRoughLine(x1, y1, x2, y2, roughness = 2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.floor(len / 10));
    for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        let nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * roughness;
        let ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * roughness;
        ctx.lineTo(nx, ny);
    }
    ctx.stroke();
}

function drawRoughCircle(x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < Math.PI * 2; i += 0.5) {
        let xr = x + Math.cos(i) * (r + (Math.random() - 0.5) * 3);
        let yr = y + Math.sin(i) * (r + (Math.random() - 0.5) * 3);
        if (i === 0) ctx.moveTo(xr, yr);
        else ctx.lineTo(xr, yr);
    }
    ctx.closePath();
    ctx.stroke();
}

function render() {
    ctx.clearRect(0, 0, width, height);
    
    // Set style for drawing
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;

    // Draw Terrain
    ctx.beginPath();
    let startX = Math.floor(state.cameraX);
    let endX = startX + width;
    
    ctx.moveTo(0, height);
    
    for (let x = startX; x <= endX + 20; x += 20) {
        let scX = x - state.cameraX;
        let el = terrain.getElevation(x);
        
        // Add scribble roughness
        let roughY = el + (Math.random() - 0.5) * 4;
        ctx.lineTo(scX, roughY);
    }
    
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.stroke();
    
    // Hatching under terrain
    ctx.strokeStyle = 'rgba(44, 62, 80, 0.3)';
    ctx.lineWidth = 1;
    for (let x = startX; x <= endX; x += 30) {
        let scX = x - state.cameraX;
        let el = terrain.getElevation(x);
        drawRoughLine(scX, el, scX - 20, height, 3);
    }

    // Draw Player
    ctx.strokeStyle = '#e74c3c'; // Red ink
    ctx.lineWidth = 3;
    drawRoughCircle(player.x - state.cameraX, player.y, player.radius);
    
    // Draw center dot
    ctx.beginPath();
    ctx.arc(player.x - state.cameraX, player.y, 2, 0, Math.PI * 2);
    ctx.fill();
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

// Start
player.y = terrain.getElevation(player.x) - 100;
loop();
