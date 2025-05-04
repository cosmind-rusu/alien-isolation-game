// goal.js - Gestión de la meta o punto de escape
import { TILE_SIZE } from './map.js';

// Crear entidad meta
export function createGoal() {
  return {
    x: 0,
    y: 0,
    r: 12,
    pulseSize: 0,
    pulseDirection: 1
  };
}

// Establecer una posición aleatoria para la meta
export function setRandomGoalPosition(goal, goalSpawnPoints) {
  const randomIndex = Math.floor(Math.random() * goalSpawnPoints.length);
  const spawnPoint = goalSpawnPoints[randomIndex];
  
  goal.x = spawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
  goal.y = spawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
}

// Actualizar efecto visual de la meta
export function updateGoal(goal) {
  goal.pulseSize += 0.05 * goal.pulseDirection;
  if (goal.pulseSize > 5) goal.pulseDirection = -1;
  if (goal.pulseSize < 0) {
    goal.pulseSize = 0;
    goal.pulseDirection = 1;
  }
}

// Dibujar la meta
export function drawGoal(ctx, goal) {
  // Dibujar efecto de brillo
  const gradient = ctx.createRadialGradient(goal.x, goal.y, goal.r, goal.x, goal.y, goal.r * 2 + goal.pulseSize);
  gradient.addColorStop(0, 'rgba(0,255,0,0.3)');
  gradient.addColorStop(1, 'rgba(0,255,0,0)');
  
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, goal.r * 2 + goal.pulseSize, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Dibujar círculo principal
  ctx.beginPath();
  ctx.arc(goal.x, goal.y, goal.r + goal.pulseSize, 0, Math.PI * 2);
  ctx.fillStyle = 'lime';
  ctx.fill();
}