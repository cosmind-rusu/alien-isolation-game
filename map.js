// map.js - Define el mapa del juego Alien Isolation

// Constantes del mapa
const TILE_SIZE = 32;
const ROWS = 20;
const COLS = 30;

// Definición del mapa (0: vacío, 1: pared, 2: escondite)
const gameMap = [
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

// Posibles puntos de aparición para la meta
const goalSpawnPoints = [
  { x: 28, y: 1 },   // Esquina superior derecha
  { x: 3, y: 18 },   // Área inferior izquierda
  { x: 26, y: 16 },  // Área inferior derecha
  { x: 15, y: 3 },   // Área superior central
  { x: 1, y: 10 }    // Área central izquierda
];

// Puntos de patrulla para el alien
const alienPatrolPoints = [
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
];

// Posiciones iniciales
const initialPositions = {
  player: { x: 1, y: 3 },
  alien: { x: 28, y: 3 }
};

// Comprueba si una posición contiene una pared
function isWall(x, y) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  return gameMap[row] && gameMap[row][col] === 1;
}

// Comprueba si una posición contiene un escondite
function isHidingSpot(x, y) {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  return gameMap[row] && gameMap[row][col] === 2;
}

// Algoritmo de pathfinding A* para encontrar caminos en el mapa
function findPath(start, goal, map) {
  const cols = map[0].length;
  const rows = map.length;

  function heuristic(a, b) {
    // Distancia Manhattan como heurística
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
    // Ordenar por puntuación f y tomar la mejor opción
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    const currKey = nodeKey(current);

    // Comprobar si hemos llegado al objetivo
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

    // Comprobar las cuatro celdas vecinas
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];

    for (const neighbor of neighbors) {
      const nKey = nodeKey(neighbor);
      
      // Omitir si está fuera de los límites o es una pared
      if (
        neighbor.x < 0 || neighbor.x >= cols ||
        neighbor.y < 0 || neighbor.y >= rows ||
        map[neighbor.y][neighbor.x] === 1
      ) continue;

      // Calcular nueva puntuación
      const tentativeG = gScore[currKey] + 1;
      
      // Si encontramos un camino mejor, actualizarlo
      if (tentativeG < (gScore[nKey] ?? Infinity)) {
        cameFrom.set(nKey, currKey);
        gScore[nKey] = tentativeG;
        fScore[nKey] = tentativeG + heuristic(neighbor, goal);
        
        // Añadir al conjunto abierto si no está ya allí
        if (!openSet.some(n => nodeKey(n) === nKey)) {
          openSet.push({ ...neighbor, f: fScore[nKey] });
        }
      }
    }
  }

  // No se encontró camino
  return [];
}

// Dibujar el mapa en el contexto del canvas
function drawMap(ctx) {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tileType = gameMap[row][col];
      
      if (tileType === 1) {
        // Baldosa de pared
        ctx.fillStyle = '#444';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Añadir sombreado simple a las paredes
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE + TILE_SIZE - 2, TILE_SIZE, 2);
      } else if (tileType === 2) {
        // Escondite
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Añadir patrón a los escondites
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

// Dibujar un camino en el mapa para visualizar rutas
function drawPath(ctx, path, color = 'rgba(255,0,255,0.2)') {
  ctx.fillStyle = color;
  path.forEach(p => {
    ctx.fillRect(p.x * TILE_SIZE + 8, p.y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  });
}

// Verificar línea de visión entre dos puntos
function hasLineOfSight(x1, y1, x2, y2) {
  // Algoritmo de línea de Bresenham para comprobar si hay paredes entre puntos
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let x = x1;
  let y = y1;
  
  while (x !== x2 || y !== y2) {
    if (gameMap[y] && gameMap[y][x] === 1) {
      return false; // La pared está bloqueando la vista
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
  
  return true; // Línea de visión clara
}

// Obtener una posición aleatoria cercana que no sea una pared
function getRandomNearbyPosition(x, y, radius) {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  
  for (let attempts = 0; attempts < 10; attempts++) {
    const offsetX = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const offsetY = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    
    const newX = tileX + offsetX;
    const newY = tileY + offsetY;
    
    // Comprobar límites y si no es una pared
    if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS && gameMap[newY][newX] !== 1) {
      return { x: newX, y: newY };
    }
  }
  
  // Si no se encuentra una posición válida, devolver la original
  return { x: tileX, y: tileY };
}

// Exportar todos los elementos necesarios
export {
  TILE_SIZE,
  ROWS,
  COLS,
  gameMap,
  goalSpawnPoints,
  alienPatrolPoints,
  initialPositions,
  isWall,
  isHidingSpot,
  findPath,
  drawMap,
  drawPath,
  hasLineOfSight,
  getRandomNearbyPosition
};