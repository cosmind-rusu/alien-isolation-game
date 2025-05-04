const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
canvas.width = 960;
canvas.height = 640;

// Game constants
const TILE_SIZE = 32;
const ROWS = 20;
const COLS = 30;
const FPS = 60;
const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'gameOver',
  WIN: 'win',
  PAUSED: 'paused'
};

// Game variables
let gameState = GAME_STATES.MENU;
let difficulty = 1; // 1-3: Easy, Medium, Hard
let score = 0;
let gameTime = 0;
let frameCount = 0;

// Map definition (0: empty, 1: wall, 2: hiding spot)
const map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 1],
  [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 2, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Sound effects
const sounds = {
  footstep: new Audio('https://assets.codepen.io/21542/footstep2.mp3'),
  alienScream: new Audio('https://assets.codepen.io/21542/alien.mp3'),
  heartbeat: new Audio('https://assets.codepen.io/21542/heartbeat.mp3'),
  victory: new Audio('https://assets.codepen.io/21542/level-complete.mp3'),
  death: new Audio('https://assets.codepen.io/21542/death.mp3'),
  ambience: new Audio('https://assets.codepen.io/21542/space-ambience.mp3'),
  menu: new Audio('https://assets.codepen.io/21542/menu-ambience.mp3')
};

// Set up sound properties
for (const sound in sounds) {
  sounds[sound].volume = 0.3;
  sounds[sound].load();
  
  // Loop background sounds
  if (sound === 'ambience' || sound === 'menu') {
    sounds[sound].loop = true;
  }
}

// Sound manager function
function playSound(soundName, volume = 0.3) {
  // Check global mute state from HTML
  if (window.isMuted) return;
  
  const sound = sounds[soundName];
  if (sound) {
    sound.volume = volume;
    sound.currentTime = 0;
    sound.play().catch(error => {
      // Handle autoplay policy issues
      console.log("Audio playback error: " + error);
    });
  }
}

// Player entity
const player = {
  x: 1 * TILE_SIZE + TILE_SIZE / 2,
  y: 3 * TILE_SIZE + TILE_SIZE / 2,
  r: 10,
  baseSpeed: 2,
  speed: 2,
  alive: true,
  escaped: false,
  hidden: false,
  stamina: 100,
  maxStamina: 100,
  staminaRegenRate: 0.3,
  staminaUseRate: 0.8,
  running: false,
  lastFootstepTime: 0,
  footstepInterval: 20,
  lastPos: { x: 0, y: 0 },
  moved: false
};

// Alien entity with enhanced AI states
const alien = {
  x: 28 * TILE_SIZE + TILE_SIZE / 2,
  y: 3 * TILE_SIZE + TILE_SIZE / 2,
  r: 10,
  baseSpeed: 1.6,     // Increased base speed
  speed: 1.6,         // Increased initial speed
  state: 'patrolling',
  previousStates: [],
  path: [],
  pathIndex: 0,
  recalcTimer: 0,
  patrolPoints: [
    { x: 28, y: 15 },
    { x: 26, y: 15 },
    { x: 24, y: 13 },
    { x: 20, y: 13 },
    { x: 15, y: 10 },
    { x: 10, y: 10 },
    { x: 5, y: 7 },
    { x: 2, y: 12 },
    { x: 5, y: 17 },
    { x: 10, y: 17 },
    { x: 15, y: 15 },
    { x: 20, y: 16 }
  ],
  currentPatrolIndex: 0,
  lastKnownPlayerPos: null,
  searchRadius: 3,
  detectionRange: 150,
  sightRange: 200,
  alertLevel: 0,
  maxAlertLevel: 100,
  alertDecayRate: 0.2,
  investigationTime: 180,
  stateTimer: 0,
  animation: {
    frame: 0,
    maxFrames: 8,
    frameSpeed: 5,
    frameCounter: 0
  }
};

// Possible goal spawn points
const goalSpawnPoints = [
  { x: 28, y: 1 },   // Top-right corner
  { x: 3, y: 18 },   // Bottom-left area
  { x: 26, y: 16 },  // Bottom-right area
  { x: 15, y: 3 },   // Upper-middle area
  { x: 1, y: 10 }    // Left-middle area
];

// Goal entity
const goal = {
  x: 0,
  y: 0,
  r: 12,
  pulseSize: 0,
  pulseDirection: 1
};

// Particle systems
const particles = {
  player: [],
  alien: [],
  detection: []
};

// Input handling
const keys = {};
let lastKeyPressed = null;

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  lastKeyPressed = e.key;
  
  // Toggle running with Shift
  if (e.key === 'Shift') {
    player.running = true;
  }
  
  // Pause game with Escape
  if (e.key === 'Escape' && gameState === GAME_STATES.PLAYING) {
    gameState = GAME_STATES.PAUSED;
  } else if (e.key === 'Escape' && gameState === GAME_STATES.PAUSED) {
    gameState = GAME_STATES.PLAYING;
  }
  
  // Start game from menu with Enter
  if (e.key === 'Enter' && gameState === GAME_STATES.MENU) {
    startGame();
  }
  
  // Restart game after game over or win with Enter
  if ((gameState === GAME_STATES.GAME_OVER || gameState === GAME_STATES.WIN) && e.key === 'Enter') {
    resetGame();
    gameState = GAME_STATES.PLAYING;
  }
});

document.addEventListener('keyup', e => {
  keys[e.key] = false;
  
  // Stop running when Shift is released
  if (e.key === 'Shift') {
    player.running = false;
  }
});

// Reset button functionality
resetBtn.addEventListener('click', () => {
  resetGame();
  gameState = GAME_STATES.PLAYING;
});

// Check if a position contains a wall
function isWall(x, y) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  return map[row] && map[row][col] === 1;
}

// Check if a position contains a hiding spot
function isHidingSpot(x, y) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  return map[row] && map[row][col] === 2;
}

// Move an entity with collision detection
function moveEntity(entity, dx, dy) {
  const newX = entity.x + dx;
  const newY = entity.y + dy;
  
  // Check for collisions
  if (!isWall(newX, newY)) {
    entity.x = newX;
    entity.y = newY;
    return true;
  }
  
  // Try sliding along walls
  if (!isWall(entity.x + dx, entity.y)) {
    entity.x += dx;
    return true;
  }
  
  if (!isWall(entity.x, entity.y + dy)) {
    entity.y += dy;
    return true;
  }
  
  return false;
}

// Update player movement and status
function movePlayer() {
  if (!player.alive || player.escaped || gameState !== GAME_STATES.PLAYING) return;
  
  // Save last position to detect movement
  player.lastPos = { x: player.x, y: player.y };
  
  // Handle speed based on running/walking
  player.speed = player.running && player.stamina > 0 ? player.baseSpeed * 1.7 : player.baseSpeed;
  
  // Process movement inputs
  let moved = false;
  if (keys['ArrowUp'] || keys['w']) {
    moved = moveEntity(player, 0, -player.speed);
  }
  if (keys['ArrowDown'] || keys['s']) {
    moved = moveEntity(player, 0, player.speed);
  }
  if (keys['ArrowLeft'] || keys['a']) {
    moved = moveEntity(player, -player.speed, 0);
  }
  if (keys['ArrowRight'] || keys['d']) {
    moved = moveEntity(player, player.speed, 0);
  }
  
  player.moved = moved;
  
  // Handle stamina
  if (player.running && moved) {
    player.stamina = Math.max(0, player.stamina - player.staminaUseRate);
    
    // Create footstep particles when running
    if (frameCount % 10 === 0) {
      createParticles('player', player.x, player.y, 1, 2, 'rgba(255,255,255,0.3)', 20);
    }
    
    // Play footstep sound at intervals
    if (frameCount - player.lastFootstepTime > player.footstepInterval / 2) {
      sounds.footstep.currentTime = 0;
      sounds.footstep.play();
      player.lastFootstepTime = frameCount;
    }
  } else {
    player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRegenRate);
    
    // Play footsteps less frequently when walking
    if (moved && frameCount - player.lastFootstepTime > player.footstepInterval) {
      sounds.footstep.currentTime = 0;
      sounds.footstep.volume = 0.1;
      sounds.footstep.play();
      player.lastFootstepTime = frameCount;
    }
  }
  
  // Check if player is in a hiding spot
  player.hidden = isHidingSpot(player.x, player.y);
  
  // Generate small particles when moving
  if (moved && frameCount % 20 === 0) {
    createParticles('player', player.x, player.y, 1, 1, 'rgba(100,255,255,0.2)', 10);
  }
}

// Update alien movement and AI state
function moveAlien() {
  if (player.escaped || gameState !== GAME_STATES.PLAYING) return;
  
  // Get tile positions
  const ax = Math.floor(alien.x / TILE_SIZE);
  const ay = Math.floor(alien.y / TILE_SIZE);
  const px = Math.floor(player.x / TILE_SIZE);
  const py = Math.floor(player.y / TILE_SIZE);
  
  // Calculate distance to player
  const dist = Math.hypot(alien.x - player.x, alien.y - player.y);
  
  // Update alien's alert level based on player proximity and visibility
  if (dist < alien.detectionRange && player.moved && !player.hidden) {
    // Check line of sight
    if (hasLineOfSight(ax, ay, px, py)) {
      alien.alertLevel = Math.min(alien.maxAlertLevel, alien.alertLevel + 5);
      
      if (alien.alertLevel >= 70 && alien.state !== 'hunting') {
        alien.state = 'hunting';
        alien.stateTimer = 0;
        alien.recalcTimer = 0;
        alien.previousStates.push('hunting');
        
        // Play alien scream when it starts hunting
        playSound('alienScream', 0.4);
        
        // Create alert particles
        createParticles('detection', alien.x, alien.y, 20, 3, 'rgba(255,0,0,0.5)', 60);
      } else if (alien.alertLevel >= 30 && alien.state !== 'hunting' && alien.state !== 'investigating') {
        alien.state = 'investigating';
        alien.stateTimer = alien.investigationTime;
        alien.lastKnownPlayerPos = { x: px, y: py };
        alien.previousStates.push('investigating');
      }
    }
  }
  
  // Decrease alert level over time
  if (alien.alertLevel > 0) {
    alien.alertLevel = Math.max(0, alien.alertLevel - alien.alertDecayRate * (player.hidden ? 3 : 1));
  }
  
  // Update alien behavior based on its current state
  switch (alien.state) {
    case 'patrolling':
      // Move between patrol points
      if (alien.recalcTimer <= 0) {
        const target = alien.patrolPoints[alien.currentPatrolIndex];
        alien.path = findPath({ x: ax, y: ay }, target, map);
        alien.pathIndex = 0;
        alien.recalcTimer = 60;
        
        // Move to next patrol point if close to current target
        if (Math.hypot((target.x * TILE_SIZE + TILE_SIZE / 2) - alien.x, 
                      (target.y * TILE_SIZE + TILE_SIZE / 2) - alien.y) < TILE_SIZE) {
          alien.currentPatrolIndex = (alien.currentPatrolIndex + 1) % alien.patrolPoints.length;
        }
      } else {
        alien.recalcTimer--;
      }
      
      // Occasionally create small particles
      if (frameCount % 40 === 0) {
        createParticles('alien', alien.x, alien.y, 1, 1, 'rgba(255,150,150,0.2)', 20);
      }
      break;
      
    case 'investigating':
      // Move toward last known player position
      if (alien.recalcTimer <= 0) {
        if (alien.lastKnownPlayerPos) {
          alien.path = findPath({ x: ax, y: ay }, alien.lastKnownPlayerPos, map);
          alien.pathIndex = 0;
        }
        alien.recalcTimer = 30;
      } else {
        alien.recalcTimer--;
      }
      
      // Decrease investigation timer
      alien.stateTimer--;
      
      // Create investigation particles
      if (frameCount % 20 === 0) {
        createParticles('alien', alien.x, alien.y, 2, 2, 'rgba(255,200,150,0.3)', 30);
      }
      
      // Return to patrolling after investigation time is over
      if (alien.stateTimer <= 0) {
        alien.state = 'patrolling';
        alien.previousStates.push('patrolling');
      }
      
      // If player is spotted during investigation, switch to hunting
      if (dist < alien.sightRange && !player.hidden && hasLineOfSight(ax, ay, px, py)) {
        alien.state = 'hunting';
        alien.stateTimer = 0;
        alien.recalcTimer = 0;
        alien.previousStates.push('hunting');
        sounds.alienScream.play();
      }
      break;
      
    case 'hunting':
      // Directly chase player
      if (alien.recalcTimer <= 0) {
        if (!player.hidden) {
          alien.path = findPath({ x: ax, y: ay }, { x: px, y: py }, map);
          alien.lastKnownPlayerPos = { x: px, y: py };
        } else if (alien.lastKnownPlayerPos) {
          // Move to last known position if player is hidden
          alien.path = findPath({ x: ax, y: ay }, alien.lastKnownPlayerPos, map);
        }
        alien.pathIndex = 0;
        alien.recalcTimer = 15;  // Recalculate path more frequently when hunting
      } else {
        alien.recalcTimer--;
      }
      
      // Create hunting particles
      if (frameCount % 10 === 0) {
        createParticles('alien', alien.x, alien.y, 3, 2, 'rgba(255,50,50,0.4)', 40);
      }
      
      // If player stays hidden and alert level drops, return to investigating
      if (player.hidden && alien.alertLevel < 30) {
        alien.state = 'investigating';
        alien.stateTimer = alien.investigationTime;
        alien.previousStates.push('investigating');
      }
      
      // Increase alien speed when hunting
      alien.speed = alien.baseSpeed * (1.4 + (difficulty * 0.15));
      break;
  }
  
  // Follow the calculated path
  if (alien.path && alien.pathIndex < alien.path.length) {
    const target = alien.path[alien.pathIndex];
    const tx = target.x * TILE_SIZE + TILE_SIZE / 2;
    const ty = target.y * TILE_SIZE + TILE_SIZE / 2;
    const dx = tx - alien.x;
    const dy = ty - alien.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist < 2) {
      alien.pathIndex++;
    } else {
      alien.x += (dx / dist) * alien.speed;
      alien.y += (dy / dist) * alien.speed;
    }
  }
  
  // Update animation
  alien.animation.frameCounter++;
  if (alien.animation.frameCounter >= alien.animation.frameSpeed) {
    alien.animation.frame = (alien.animation.frame + 1) % alien.animation.maxFrames;
    alien.animation.frameCounter = 0;
  }
  
  // Check for collision with player
  const collisionDist = player.r + alien.r;
  if (dist < collisionDist && player.alive && !player.hidden) {
    player.alive = false;
    gameState = GAME_STATES.GAME_OVER;
    playSound('death', 0.5);
    createParticles('player', player.x, player.y, 30, 3, 'rgba(0,255,255,0.6)', 80);
    resetBtn.style.display = 'inline-block';
  }
}

// Check for line of sight between two positions
function hasLineOfSight(x1, y1, x2, y2) {
  // Bresenham's line algorithm to check for walls between points
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let x = x1;
  let y = y1;
  
  while (x !== x2 || y !== y2) {
    if (map[y] && map[y][x] === 1) {
      return false; // Wall is blocking the view
    }
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  
  return true; // Clear line of sight
}

// Create particles for visual effects
function createParticles(type, x, y, count, speed, color, lifespan) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * speed;
    
    particles[type].push({
      x: x,
      y: y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      radius: Math.random() * 3 + 1,
      color: color,
      life: lifespan,
      maxLife: lifespan
    });
  }
}

// Update and render all particle systems
function updateParticles() {
  for (const type in particles) {
    for (let i = particles[type].length - 1; i >= 0; i--) {
      const p = particles[type][i];
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Decrease life
      p.life--;
      
      // Remove dead particles
      if (p.life <= 0) {
        particles[type].splice(i, 1);
        continue;
      }
      
      // Draw the particle
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace(')', `,${alpha})`);
      ctx.fill();
    }
  }
}

// Draw the game map
function drawMap() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tileType = map[row][col];
      
      if (tileType === 1) {
        // Wall tile
        ctx.fillStyle = '#444';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Add simple shading to walls
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE + TILE_SIZE - 2, TILE_SIZE, 2);
      } else if (tileType === 2) {
        // Hiding spot
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Add pattern to hiding spots
        ctx.fillStyle = '#222';
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            ctx.fillRect(
              col * TILE_SIZE + i * 10 + 2, 
              row * TILE_SIZE + j * 10 + 2, 
              6, 6
            );
          }
        }
      }
    }
  }
}

// Draw the alien's path for debugging or visual effect
function drawPath(path, color = 'rgba(255,0,255,0.2)') {
  ctx.fillStyle = color;
  path.forEach(p => {
    ctx.fillRect(p.x * TILE_SIZE + 8, p.y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  });
}

// Draw a circular entity with optional effects
function drawCircle(x, y, r, color, pulseSize = 0, glowColor = null) {
  // Draw glow effect
  if (glowColor) {
    const gradient = ctx.createRadialGradient(x, y, r, x, y, r * 2 + pulseSize);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.beginPath();
    ctx.arc(x, y, r * 2 + pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  // Draw main circle
  ctx.beginPath();
  ctx.arc(x, y, r + pulseSize, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

// Check if player has reached the exit
function checkGoal() {
  const dx = player.x - goal.x;
  const dy = player.y - goal.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < player.r + goal.r) {
    player.escaped = true;
    gameState = GAME_STATES.WIN;
    playSound('victory', 0.5);
    createParticles('player', goal.x, goal.y, 50, 2, 'rgba(0,255,100,0.7)', 100);
    resetBtn.style.display = 'inline-block';
  }
}

// Draw UI elements and game info
function drawUI() {
  // Draw stamina bar
  const barWidth = 200;
  const barHeight = 15;
  const barX = 20;
  const barY = canvas.height - 30;
  
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  const staminaWidth = (player.stamina / player.maxStamina) * barWidth;
  const staminaColor = player.stamina > 30 ? 'rgba(0,255,255,0.7)' : 'rgba(255,50,50,0.7)';
  
  ctx.fillStyle = staminaColor;
  ctx.fillRect(barX, barY, staminaWidth, barHeight);
  
  ctx.strokeStyle = 'white';
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.fillText('STAMINA', barX + 5, barY - 5);
  
  // Draw alien alert meter
  const alertX = canvas.width - 220;
  const alertY = canvas.height - 30;
  
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(alertX, alertY, barWidth, barHeight);
  
  const alertWidth = (alien.alertLevel / alien.maxAlertLevel) * barWidth;
  const alertColor = alien.alertLevel < 30 ? 'rgba(0,255,0,0.7)' : 
                    alien.alertLevel < 70 ? 'rgba(255,255,0,0.7)' : 'rgba(255,0,0,0.7)';
  
  ctx.fillStyle = alertColor;
  ctx.fillRect(alertX, alertY, alertWidth, barHeight);
  
  ctx.strokeStyle = 'white';
  ctx.strokeRect(alertX, alertY, barWidth, barHeight);
  
  ctx.fillStyle = 'white';
  ctx.font = '12px Arial';
  ctx.fillText('ALIEN ALERT', alertX + 5, alertY - 5);
  
  // Draw game timer
  const minutes = Math.floor(gameTime / 60);
  const seconds = Math.floor(gameTime % 60);
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  ctx.font = '20px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(timeStr, canvas.width / 2 - 20, 30);
  
  // Draw alien state indicator
  ctx.font = '14px Arial';
  ctx.fillStyle = alien.state === 'patrolling' ? 'rgba(0,255,0,0.7)' : 
                 alien.state === 'investigating' ? 'rgba(255,255,0,0.7)' : 'rgba(255,0,0,0.7)';
  ctx.fillText(`Alien: ${alien.state.toUpperCase()}`, canvas.width - 150, 30);
  
  // Display difficulty level
  ctx.font = '14px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const difficultyText = difficulty === 1 ? 'FÁCIL' : difficulty === 2 ? 'NORMAL' : 'DIFÍCIL';
  ctx.fillText(`Dificultad: ${difficultyText}`, canvas.width - 150, 50);
  
  // Display goal direction indicator
  const dirX = goal.x - player.x;
  const dirY = goal.y - player.y;
  const angle = Math.atan2(dirY, dirX);
  
  // Draw direction arrow
  ctx.save();
  ctx.translate(70, 50);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(0,255,100,0.7)';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(0, 5);
  ctx.lineTo(0, -5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  
  ctx.fillStyle = 'rgba(0,255,100,0.7)';
  ctx.fillText('META', 50, 30);
  
  // Display hiding status
  if (player.hidden) {
    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(0,255,255,0.7)';
    ctx.fillText('HIDDEN', 20, 30);
  }
  
  // Display controls during gameplay
  if (gameState === GAME_STATES.PLAYING) {
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Arrow Keys/WASD: Move | Shift: Run | ESC: Pause', canvas.width / 2 - 150, canvas.height - 10);
  }
}

// Draw the paused game state
function drawPaused() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText('PAUSED', canvas.width / 2 - 60, canvas.height / 2);
  
  ctx.font = '16px Arial';
  ctx.fillText('Press ESC to resume', canvas.width / 2 - 80, canvas.height / 2 + 40);
}

// Draw game over screen
function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'rgba(255,0,0,0.8)';
  ctx.font = '40px Arial';
  ctx.fillText('¡HAS MUERTO!', canvas.width / 2 - 150, canvas.height / 2);
  
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Presiona ENTER para reiniciar', canvas.width / 2 - 120, canvas.height / 2 + 50);
  
  const timeStr = `Tiempo de supervivencia: ${Math.floor(gameTime / 60)}:${Math.floor(gameTime % 60).toString().padStart(2, '0')}`;
  ctx.fillText(timeStr, canvas.width / 2 - 120, canvas.height / 2 + 80);
}

// Draw winning screen
function drawWin() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'rgba(0,255,100,0.8)';
  ctx.font = '40px Arial';
  ctx.fillText('¡HAS ESCAPADO!', canvas.width / 2 - 170, canvas.height / 2);
  
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Presiona ENTER para jugar de nuevo', canvas.width / 2 - 170, canvas.height / 2 + 50);
  
  const timeStr = `Tiempo de escape: ${Math.floor(gameTime / 60)}:${Math.floor(gameTime % 60).toString().padStart(2, '0')}`;
  ctx.fillText(timeStr, canvas.width / 2 - 100, canvas.height / 2 + 80);
}

// Draw menu screen
function drawMenu() {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Game title
  ctx.fillStyle = 'rgba(0,200,255,0.9)';
  ctx.font = '50px Arial';
  ctx.fillText('ALIEN ISOLATION', canvas.width / 2 - 200, canvas.height / 3);
  
  // Instructions
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Escapa del Alien y llega al punto de extracción', canvas.width / 2 - 220, canvas.height / 2);
  
  // Controls
  ctx.font = '16px Arial';
  ctx.fillText('Controles:', canvas.width / 2 - 150, canvas.height / 2 + 50);
  ctx.fillText('- Flechas/WASD: Moverse', canvas.width / 2 - 150, canvas.height / 2 + 80);
  ctx.fillText('- Shift: Correr', canvas.width / 2 - 150, canvas.height / 2 + 105);
  ctx.fillText('- Escóndete en las áreas sombreadas', canvas.width / 2 - 150, canvas.height / 2 + 130);
  
  // Difficulty selection
  ctx.fillStyle = 'rgba(200,200,200,0.8)';
  ctx.fillText('Dificultad:', canvas.width / 2 - 150, canvas.height / 2 + 170);
  
  const difficulties = ['Fácil', 'Normal', 'Difícil'];
  difficulties.forEach((diff, i) => {
    if (i + 1 === difficulty) {
      ctx.fillStyle = 'rgba(0,255,255,0.9)';
    } else {
      ctx.fillStyle = 'rgba(150,150,150,0.8)';
    }
    ctx.fillText(`- ${diff}`, canvas.width / 2 - 150, canvas.height / 2 + 200 + i * 25);
  });
  
  // Start prompt
  ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(Date.now() / 500)) + ')';
  ctx.font = '24px Arial';
  ctx.fillText('Presiona ENTER para comenzar', canvas.width / 2 - 170, canvas.height - 100);
}

// Find path using A* algorithm
function findPath(start, goal, map) {
  const cols = map[0].length;
  const rows = map.length;

  function heuristic(a, b) {
    // Manhattan distance as heuristic
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function nodeKey(node) {
    return `${node.x},${node.y}`;
  }

  const openSet = [];
  const cameFrom = new Map();
  const gScore = {};
  const fScore = {};

  const startKey = nodeKey(start);
  const goalKey = nodeKey(goal);
  gScore[startKey] = 0;
  fScore[startKey] = heuristic(start, goal);

  openSet.push({ ...start, f: fScore[startKey] });

  while (openSet.length > 0) {
    // Sort by f-score and take the best option
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    const currKey = nodeKey(current);

    // Check if we've reached the goal
    if (currKey === goalKey) {
      const path = [];
      let curr = currKey;
      while (cameFrom.has(curr)) {
        const [cx, cy] = curr.split(',').map(Number);
        path.unshift({ x: cx, y: cy });
        curr = cameFrom.get(curr);
      }
      return path;
    }

    // Check all four neighboring cells
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];

    for (const neighbor of neighbors) {
      const nKey = nodeKey(neighbor);
      
      // Skip if out of bounds or wall
      if (
        neighbor.x < 0 || neighbor.x >= cols ||
        neighbor.y < 0 || neighbor.y >= rows ||
        map[neighbor.y][neighbor.x] === 1
      ) continue;

      // Calculate new score
      const tentativeG = gScore[currKey] + 1;
      
      // If we found a better path, update it
      if (tentativeG < (gScore[nKey] ?? Infinity)) {
        cameFrom.set(nKey, currKey);
        gScore[nKey] = tentativeG;
        fScore[nKey] = tentativeG + heuristic(neighbor, goal);
        
        // Add to open set if not already there
        if (!openSet.some(n => nodeKey(n) === nKey)) {
          openSet.push({ ...neighbor, f: fScore[nKey] });
        }
      }
    }
  }

  // No path found
  return [];
}

// Set a random goal position
function setRandomGoalPosition() {
  const randomIndex = Math.floor(Math.random() * goalSpawnPoints.length);
  const spawnPoint = goalSpawnPoints[randomIndex];
  
  goal.x = spawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
  goal.y = spawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
}

// Reset the game to initial state
function resetGame() {
  // Reset player
  player.x = 1 * TILE_SIZE + TILE_SIZE / 2;
  player.y = 3 * TILE_SIZE + TILE_SIZE / 2;
  player.alive = true;
  player.escaped = false;
  player.hidden = false;
  player.stamina = player.maxStamina;
  player.running = false;
  
  // Reset alien
  alien.x = 28 * TILE_SIZE + TILE_SIZE / 2;
  alien.y = 3 * TILE_SIZE + TILE_SIZE / 2;
  alien.state = 'patrolling';
  alien.path = [];
  alien.pathIndex = 0;
  alien.recalcTimer = 0;
  alien.currentPatrolIndex = 0;
  alien.alertLevel = 0;
  
  // Set alien speed based on difficulty
  alien.baseSpeed = 1.6 + (difficulty * 0.15);  // Speed increases with difficulty
  alien.speed = alien.baseSpeed;
  
  // Set random goal position
  setRandomGoalPosition();
  
  // Reset game state
  gameState = GAME_STATES.PLAYING;
  gameTime = 0;
  resetBtn.style.display = 'none';
  
  // Reset game state
  gameState = GAME_STATES.PLAYING;
  gameTime = 0;
  resetBtn.style.display = 'none';
  
  // Clear particles
  for (const type in particles) {
    particles[type] = [];
  }
  
  // Stop menu music and start game ambience
  sounds.menu.pause();
  sounds.ambience.currentTime = 0;
  if (!window.isMuted) {
    sounds.ambience.play().catch(e => console.log("Audio playback error: " + e));
  }
}

// Start the game
function startGame() {
  gameState = GAME_STATES.PLAYING;
  resetGame();
  
  // Add event listener to mute button to control music
  window.addEventListener('isMutedChanged', () => {
    if (window.isMuted) {
      sounds.ambience.pause();
      sounds.menu.pause();
    } else {
      if (gameState === GAME_STATES.MENU) {
        sounds.menu.play().catch(e => console.log("Audio playback error: " + e));
      } else if (gameState === GAME_STATES.PLAYING) {
        sounds.ambience.play().catch(e => console.log("Audio playback error: " + e));
      }
    }
  });
}

// Main game loop
function gameLoop() {
  frameCount++;
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update based on game state
  switch (gameState) {
    case GAME_STATES.MENU:
      drawMenu();
      break;
      
    case GAME_STATES.PLAYING:
      // Update game time
      gameTime += 1/FPS;
      
      // Draw map and entities
      drawMap();
      movePlayer();
      moveAlien();
      checkGoal();
      
      // Update goal pulse effect
      goal.pulseSize += 0.05 * goal.pulseDirection;
      if (goal.pulseSize > 5) goal.pulseDirection = -1;
      if (goal.pulseSize < 0) {
        goal.pulseSize = 0;
        goal.pulseDirection = 1;
      }
      
      // Draw alien path for visual effect based on state
      const pathColor = alien.state === 'patrolling' ? 'rgba(100,100,255,0.1)' : 
                       alien.state === 'investigating' ? 'rgba(255,200,0,0.2)' : 'rgba(255,0,0,0.2)';
      drawPath(alien.path, pathColor);
      
      // Draw entities
      drawCircle(goal.x, goal.y, goal.r, 'lime', goal.pulseSize, 'rgba(0,255,0,0.2)');
      
      // Draw player with effect based on whether hidden
      const playerColor = player.hidden ? 'rgba(0,200,255,0.5)' : 'cyan';
      const playerGlow = player.hidden ? 'rgba(0,100,150,0.2)' : 'rgba(0,200,255,0.3)';
      drawCircle(player.x, player.y, player.r, playerColor, 0, playerGlow);
      
      // Draw alien with effect based on state
      const alienColor = alien.state === 'patrolling' ? 'rgba(255,100,100,0.8)' : 
                        alien.state === 'investigating' ? 'rgba(255,150,0,0.8)' : 'red';
      const alienGlow = alien.state === 'hunting' ? 'rgba(255,0,0,0.3)' : 'rgba(200,0,0,0.1)';
      const alienPulse = alien.state === 'hunting' ? Math.sin(frameCount * 0.2) * 2 : 0;
      drawCircle(alien.x, alien.y, alien.r, alienColor, alienPulse, alienGlow);
      
      // Update and draw particles
      updateParticles();
      
      // Draw UI elements
      drawUI();
      
      // Play heartbeat sound when alien is close and hunting
      const distToAlien = Math.hypot(player.x - alien.x, player.y - alien.y);
      if (alien.state === 'hunting' && distToAlien < 200 && frameCount % 40 === 0) {
        const volume = 0.3 * (1 - distToAlien / 200);
        playSound('heartbeat', volume);
      }
      break;
      
    case GAME_STATES.PAUSED:
      // Draw the game (but don't update it)
      drawMap();
      drawPath(alien.path);
      drawCircle(goal.x, goal.y, goal.r, 'lime');
      drawCircle(player.x, player.y, player.r, player.hidden ? 'rgba(0,200,255,0.5)' : 'cyan');
      drawCircle(alien.x, alien.y, alien.r, alien.state === 'hunting' ? 'red' : 'rgba(255,100,100,0.8)');
      updateParticles();
      drawUI();
      
      // Draw pause overlay
      drawPaused();
      break;
      
    case GAME_STATES.GAME_OVER:
      // Draw the final state
      drawMap();
      drawPath(alien.path);
      drawCircle(goal.x, goal.y, goal.r, 'lime');
      drawCircle(player.x, player.y, player.r, 'gray');
      drawCircle(alien.x, alien.y, alien.r, 'red');
      updateParticles();
      
      // Draw game over screen
      drawGameOver();
      break;
      
    case GAME_STATES.WIN:
      // Draw the final state
      drawMap();
      drawCircle(goal.x, goal.y, goal.r, 'lime', 2 + Math.sin(frameCount * 0.1) * 2);
      drawCircle(player.x, player.y, player.r, 'rgba(0,255,150,0.8)');
      updateParticles();
      
      // Draw win screen
      drawWin();
      break;
  }
  
  // Continue the game loop
  requestAnimationFrame(gameLoop);
}

// Initialize and start the game
resetGame();
setRandomGoalPosition(); // Set initial goal position
gameState = GAME_STATES.MENU;

// Initialize global sound mute status
window.isMuted = false;

// Play menu music
sounds.ambience.pause();
sounds.menu.currentTime = 0;
if (!window.isMuted) {
  // Wait for user interaction to play sounds (browser policy)
  const startMusic = () => {
    sounds.menu.play().catch(e => console.log("Audio playback error: " + e));
    document.removeEventListener('click', startMusic);
    document.removeEventListener('keydown', startMusic);
  };
  
  document.addEventListener('click', startMusic);
  document.addEventListener('keydown', startMusic);
}

// Game difficulty
window.difficulty = 2; // Default: Normal

// Create custom event for mute status change
const mutedChangeEvent = new Event('isMutedChanged');

// Override mute button functionality from HTML
const originalMuteFunction = window.isMuted;
Object.defineProperty(window, 'isMuted', {
  get: function() {
    return originalMuteFunction;
  },
  set: function(value) {
    originalMuteFunction = value;
    window.dispatchEvent(mutedChangeEvent);
  }
});

// Start the game loop
gameLoop();