/* script.js */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 20;
const ROWS = canvas.height / TILE_SIZE;
const COLS = canvas.width / TILE_SIZE;

// 1 = Wall, 0 = Pellet, 2 = Empty Space
const mazeMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2], // Ghost house area
    [1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1],
    [2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2], // Tunnel
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const pellets = [];
let score = 0;
let lives = 3;
let gameOver = false;

// Load Sprite Image
const spriteImage = new Image();
spriteImage.src = 'assets/your_sprite.png'; // Make sure this matches your file name

// Game Objects
const player = {
    x: TILE_SIZE * 9,
    y: TILE_SIZE * 13,
    size: TILE_SIZE - 2,
    speed: 2,
    dirX: 0,
    dirY: 0
};

// Simplified Ghost Setup (Mechanically similar)
const ghosts = [
    { x: TILE_SIZE * 8, y: TILE_SIZE * 7, color: 'red', speed: 1.5, dirX: 1, dirY: 0 },
    { x: TILE_SIZE * 10, y: TILE_SIZE * 7, color: 'pink', speed: 1.5, dirX: -1, dirY: 0 }
];

// Initialize Pellets
function initMap() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (mazeMap[r][c] === 0) {
                pellets.push({ r, c, eated: false });
            }
        }
    }
}

// Drawing Functions
function drawMaze() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (mazeMap[r][c] === 1) {
                ctx.fillStyle = '#1919A6'; // Dark blue walls
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function drawPellets() {
    ctx.fillStyle = '#fff';
    pellets.forEach(p => {
        if (!p.eated) {
            ctx.beginPath();
            ctx.arc(p.c * TILE_SIZE + TILE_SIZE / 2, p.r * TILE_SIZE + TILE_SIZE / 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    });
}

function drawPlayer() {
    // Draw the custom sprite instead of a circle
    if (spriteImage.complete) {
        ctx.drawImage(spriteImage, player.x, player.y, player.size, player.size);
    } else {
        // Fallback circle if image isn't loaded
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(player.x + player.size/2, player.y + player.size/2, player.size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}

function drawGhosts() {
    ghosts.forEach(g => {
        ctx.fillStyle = g.color;
        ctx.fillRect(g.x, g.y, player.size, player.size); // Simple square ghosts
    });
}

// Move Functions
function movePlayer() {
    let nextX = player.x + player.dirX * player.speed;
    let nextY = player.y + player.dirY * player.speed;

    // Check Wall Collision
    let gridX = Math.floor(nextX / TILE_SIZE);
    let gridY = Math.floor(nextY / TILE_SIZE);

    if (mazeMap[gridY][gridX] !== 1 &&
        mazeMap[gridY][Math.floor((nextX + player.size - 1) / TILE_SIZE)] !== 1 &&
        mazeMap[Math.floor((nextY + player.size - 1) / TILE_SIZE)][gridX] !== 1 &&
        mazeMap[Math.floor((nextY + player.size - 1) / TILE_SIZE)][Math.floor((nextX + player.size - 1) / TILE_SIZE)] !== 1
    ) {
        player.x = nextX;
        player.y = nextY;
    }

    // Tunnel Effect (Seamless wrap around)
    if (player.x < -player.size) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -player.size;

    // Eat Pellets
    let pGridX = Math.round(player.x / TILE_SIZE);
    let pGridY = Math.round(player.y / TILE_SIZE);
    let pelletIndex = pellets.findIndex(p => p.r === pGridY && p.c === pGridX && !p.eated);
    if (pelletIndex !== -1) {
        pellets[pelletIndex].eated = true;
        score += 10;
        console.log("Score: " + score);
    }
}

// Basic Ghost movement logic
function moveGhosts() {
    ghosts.forEach(g => {
        let nextX = g.x + g.dirX * g.speed;
        let nextY = g.y + g.dirY * g.speed;

        let gridX = Math.floor(nextX / TILE_SIZE);
        let gridY = Math.floor(nextY / TILE_SIZE);

        if (mazeMap[gridY][gridX] !== 1 &&
            mazeMap[gridY][Math.floor((nextX + player.size - 1) / TILE_SIZE)] !== 1
        ) {
            g.x = nextX;
            g.y = nextY;
        } else {
            // Change direction randomly on collision
            let dirs = [{x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}];
            let newDir = dirs[Math.floor(Math.random() * dirs.length)];
            g.dirX = newDir.x;
            g.dirY = newDir.y;
        }

        // Simple Player Collision
        if (player.x < g.x + player.size &&
            player.x + player.size > g.x &&
            player.y < g.y + player.size &&
            player.y + player.size > g.y) {
                lives--;
                console.log("Lives left: " + lives);
                if (lives <= 0) gameOver = true;
                else resetPositions();
        }
    });
}

function resetPositions() {
    player.x = TILE_SIZE * 9;
    player.y = TILE_SIZE * 13;
    ghosts[0].x = TILE_SIZE * 8; ghosts[0].y = TILE_SIZE * 7;
    ghosts[1].x = TILE_SIZE * 10; ghosts[1].y = TILE_SIZE * 7;
}

// Main Game Loop
function update() {
    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '30px Courier New';
        ctx.fillText("GAME OVER", canvas.width/4, canvas.height/2);
        return;
    }

    movePlayer();
    moveGhosts();
    drawMaze();
    drawPellets();
    drawPlayer();
    drawGhosts();

    requestAnimationFrame(update);
}

// Controls Input
function setDirection(dx, dy) {
    player.dirX = dx;
    player.dirY = dy;
}

// Keyboard Controls (Desktop)
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') setDirection(0, -1);
    else if (e.key === 'ArrowDown') setDirection(0, 1);
    else if (e.key === 'ArrowLeft') setDirection(-1, 0);
    else if (e.key === 'ArrowRight') setDirection(1, 0);
});

// Mobile Touch Controls (Virtual D-Pad)
const controls = {
    up: document.getElementById('upBtn'),
    down: document.getElementById('downBtn'),
    left: document.getElementById('leftBtn'),
    right: document.getElementById('rightBtn')
};

function addTouchControl(element, dx, dy) {
    // Handling both touch and mouse click for testing
    element.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevents scrolling
        setDirection(dx, dy);
    });
    element.addEventListener('mousedown', () => setDirection(dx, dy));
}

addTouchControl(controls.up, 0, -1);
addTouchControl(controls.down, 0, 1);
addTouchControl(controls.left, -1, 0);
addTouchControl(controls.right, 1, 0);


// Start the game
initMap();
update();
  
