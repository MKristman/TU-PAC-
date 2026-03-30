const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 380;
canvas.height = 400;

const TILE_SIZE = 20;
const sprite = new Image();
sprite.src = 'assets/sprite.png';

const bgMusic = new Audio('assets/music.mp3');
bgMusic.loop = true;

const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
    [0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0],
    [1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,1],
    [0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let player = {
    x: 9 * TILE_SIZE,
    y: 13 * TILE_SIZE,
    dx: 0,
    dy: 0,
    nextDx: 0,
    nextDy: 0
};

function drawMaze() {
    for (let r = 0; r < maze.length; r++) {
        for (let c = 0; c < maze[r].length; c++) {
            if (maze[r][c] === 1) {
                ctx.fillStyle = '#0000ff';
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (maze[r][c] === 0) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(c * TILE_SIZE + TILE_SIZE / 2, r * TILE_SIZE + TILE_SIZE / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

function canMove(x, y) {
    let gridX = Math.floor(x / TILE_SIZE);
    let gridY = Math.floor(y / TILE_SIZE);
    
    // Check all four corners of the sprite for collision
    const padding = 2;
    const corners = [
        {x: x + padding, y: y + padding},
        {x: x + TILE_SIZE - padding, y: y + padding},
        {x: x + padding, y: y + TILE_SIZE - padding},
        {x: x + TILE_SIZE - padding, y: y + TILE_SIZE - padding}
    ];

    return corners.every(c => {
        let cx = Math.floor(c.x / TILE_SIZE);
        let cy = Math.floor(c.y / TILE_SIZE);
        return maze[cy] && maze[cy][cx] !== 1;
    });
}

function update() {
    // Attempt to turn
    if (player.nextDx !== 0 || player.nextDy !== 0) {
        if (canMove(player.x + player.nextDx, player.y + player.nextDy)) {
            player.dx = player.nextDx;
            player.dy = player.nextDy;
        }
    }

    // Move
    if (canMove(player.x + player.dx, player.y + player.dy)) {
        player.x += player.dx;
        player.y += player.dy;
    }

    // Wrap around (Tunnel)
    if (player.x < 0) player.x = canvas.width - TILE_SIZE;
    if (player.x >= canvas.width) player.x = 0;

    // Eat pellets
    let pX = Math.floor((player.x + TILE_SIZE / 2) / TILE_SIZE);
    let pY = Math.floor((player.y + TILE_SIZE / 2) / TILE_SIZE);
    if (maze[pY][pX] === 0) {
        maze[pY][pX] = 2;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze();
    ctx.drawImage(sprite, player.x, player.y, TILE_SIZE, TILE_SIZE);
    requestAnimationFrame(() => {
        update();
        draw();
    });
}

// Input Handling
const setDir = (x, y) => {
    player.nextDx = x * 2;
    player.nextDy = y * 2;
    if (bgMusic.paused) bgMusic.play().catch(() => {});
};

document.getElementById('btn-up').addEventListener('touchstart', (e) => { e.preventDefault(); setDir(0, -1); });
document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); setDir(0, 1); });
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); setDir(-1, 0); });
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); setDir(1, 0); });

// Mouse click fallback for D-pad
document.getElementById('btn-up').addEventListener('mousedown', () => setDir(0, -1));
document.getElementById('btn-down').addEventListener('mousedown', () => setDir(0, 1));
document.getElementById('btn-left').addEventListener('mousedown', () => setDir(-1, 0));
document.getElementById('btn-right').addEventListener('mousedown', () => setDir(1, 0));

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') setDir(0, -1);
    if (e.key === 'ArrowDown') setDir(0, 1);
    if (e.key === 'ArrowLeft') setDir(-1, 0);
    if (e.key === 'ArrowRight') setDir(1, 0);
});

sprite.onload = draw;
