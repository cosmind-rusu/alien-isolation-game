// player.js - Lógica del jugador y controles
import { TILE_SIZE, isWall, isHidingSpot } from './map.js';

// Crear instancia del jugador
export function createPlayer(initialPosition) {
  return {
    x: initialPosition.x * TILE_SIZE + TILE_SIZE / 2,
    y: initialPosition.y * TILE_SIZE + TILE_SIZE / 2,
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
}

// Manejar movimiento del jugador
export function movePlayer(player, keys, frameCount, createParticles, playSound) {
  if (!player.alive || player.escaped) return;
  
  // Guardar última posición para detectar movimiento
  player.lastPos = { x: player.x, y: player.y };
  
  // Gestionar velocidad basada en correr/caminar
  player.speed = player.running && player.stamina > 0 ? player.baseSpeed * 1.7 : player.baseSpeed;
  
  // Procesar entradas de movimiento
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
  
  // Gestionar stamina
  if (player.running && moved) {
    player.stamina = Math.max(0, player.stamina - player.staminaUseRate);
    
    // Crear partículas de pisadas al correr
    if (frameCount % 10 === 0) {
      createParticles('player', player.x, player.y, 1, 2, 'rgba(255,255,255,0.3)', 20);
    }
    
    // Reproducir sonido de pisadas a intervalos
    if (frameCount - player.lastFootstepTime > player.footstepInterval / 2) {
      playSound('footstep', 0.2);
      player.lastFootstepTime = frameCount;
    }
  } else {
    player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRegenRate);
    
    // Reproducir pisadas con menos frecuencia al caminar
    if (moved && frameCount - player.lastFootstepTime > player.footstepInterval) {
      playSound('footstep', 0.1);
      player.lastFootstepTime = frameCount;
    }
  }
  
  // Comprobar si el jugador está en un escondite
  player.hidden = isHidingSpot(player.x, player.y);
  
  // Generar pequeñas partículas al moverse
  if (moved && frameCount % 20 === 0) {
    createParticles('player', player.x, player.y, 1, 1, 'rgba(100,255,255,0.2)', 10);
  }
  
  return moved;
}

// Mover una entidad con detección de colisiones
function moveEntity(entity, dx, dy) {
  const newX = entity.x + dx;
  const newY = entity.y + dy;
  
  // Comprobar colisiones
  if (!isWall(newX, newY)) {
    entity.x = newX;
    entity.y = newY;
    return true;
  }
  
  // Intentar deslizarse a lo largo de las paredes
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

// Comprobar si el jugador ha llegado a la meta
export function checkGoal(player, goal) {
  const dx = player.x - goal.x;
  const dy = player.y - goal.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < player.r + goal.r) {
    player.escaped = true;
    return true;
  }
  
  return false;
}

// Dibujar el jugador
export function drawPlayer(ctx, player, hidden) {
  // Dibujar jugador con efecto basado en si está escondido
  const playerColor = player.hidden ? 'rgba(0,200,255,0.5)' : 'cyan';
  const playerGlow = player.hidden ? 'rgba(0,100,150,0.2)' : 'rgba(0,200,255,0.3)';
  
  drawCircle(ctx, player.x, player.y, player.r, playerColor, 0, playerGlow);
}

// Función auxiliar para dibujar círculos con efectos
function drawCircle(ctx, x, y, r, color, pulseSize = 0, glowColor = null) {
  // Dibujar efecto de brillo
  if (glowColor) {
    const gradient = ctx.createRadialGradient(x, y, r, x, y, r * 2 + pulseSize);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.beginPath();
    ctx.arc(x, y, r * 2 + pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  
  // Dibujar círculo principal
  ctx.beginPath();
  ctx.arc(x, y, r + pulseSize, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}