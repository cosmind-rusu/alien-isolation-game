// game.js - Juego Alien Isolation

// Importar elementos del mapa
import {
    TILE_SIZE,
    ROWS,
    COLS,
    gameMap as map,
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
  } from './map.js';
  
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const resetBtn = document.getElementById('resetBtn');
  canvas.width = 960;
  canvas.height = 640;
  
  // Constantes del juego
  const FPS = 60;
  const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    WIN: 'win',
    PAUSED: 'paused'
  };
  
  // Variables del juego
  let gameState = GAME_STATES.MENU;
  let difficulty = 2; // 1-3: Fácil, Normal, Difícil
  let score = 0;
  let gameTime = 0;
  let frameCount = 0;
  
  // Efectos de sonido
  const sounds = {
    footstep: new Audio('https://assets.codepen.io/21542/footstep2.mp3'),
    alienScream: new Audio('https://assets.codepen.io/21542/alien.mp3'),
    heartbeat: new Audio('https://assets.codepen.io/21542/heartbeat.mp3'),
    victory: new Audio('https://assets.codepen.io/21542/level-complete.mp3'),
    death: new Audio('https://assets.codepen.io/21542/death.mp3'),
    ambience: new Audio('https://assets.codepen.io/21542/space-ambience.mp3'),
    menu: new Audio('https://assets.codepen.io/21542/menu-ambience.mp3')
  };
  
  // Configurar propiedades de sonido
  for (const sound in sounds) {
    sounds[sound].volume = 0.3;
    sounds[sound].load();
    
    // Reproducir sonidos de fondo en bucle
    if (sound === 'ambience' || sound === 'menu') {
      sounds[sound].loop = true;
    }
  }
  
  // Función de gestión de sonido
  function playSound(soundName, volume = 0.3) {
    // Comprobar estado global de silencio desde HTML
    if (window.isMuted) return;
    
    const sound = sounds[soundName];
    if (sound) {
      sound.volume = volume;
      sound.currentTime = 0;
      sound.play().catch(error => {
        // Gestionar problemas de política de reproducción automática
        console.log("Error de reproducción de audio: " + error);
      });
    }
  }
  
  // Entidad jugador
  const player = {
    x: initialPositions.player.x * TILE_SIZE + TILE_SIZE / 2,
    y: initialPositions.player.y * TILE_SIZE + TILE_SIZE / 2,
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
  
  // Entidad alien con estados de IA mejorados
  const alien = {
    x: initialPositions.alien.x * TILE_SIZE + TILE_SIZE / 2,
    y: initialPositions.alien.y * TILE_SIZE + TILE_SIZE / 2,
    r: 10,
    baseSpeed: 1.6,     // Velocidad base aumentada
    speed: 1.6,         // Velocidad inicial aumentada
    state: 'patrolling',
    previousStates: [],
    path: [],
    pathIndex: 0,
    recalcTimer: 0,
    patrolPoints: alienPatrolPoints,
    currentPatrolIndex: 0,
    lastKnownPlayerPos: null,
    searchRadius: 3,
    detectionRange: 170,       // Rango de detección aumentado
    sightRange: 220,          // Rango de visión aumentado
    alertLevel: 0,
    maxAlertLevel: 100,
    alertDecayRate: 0.15,      // Tasa de decaimiento de alerta más lenta
    investigationTime: 220,    // Tiempo de investigación más largo
    stateTimer: 0,
    animation: {
      frame: 0,
      maxFrames: 8,
      frameSpeed: 5,
      frameCounter: 0
    },
    // Nuevas propiedades de comportamiento de IA
    senses: {
      vision: true,
      hearing: true,
      memory: true
    },
    memory: [],
    memoryCapacity: 5,         // Recordar las últimas 5 posiciones del jugador
    predictionSkill: 0.7,      // 0.0 a 1.0, mayor significa mejor predicción de movimiento
    patrolMode: 'adaptive',    // 'fixed' o 'adaptive'
    areaMemory: [],            // Recordar áreas donde se vio al jugador
    hunterMode: false,         // Modo especial donde el alien caza activamente al jugador
    hunterModeTimer: 0,
    hunterModeDuration: 600,   // 10 segundos en modo cazador
    hunterModeCooldown: 1800,  // 30 segundos de tiempo de reutilización entre modos cazador
    hunterModeCooldownTimer: 0,
    hunterModeChance: 0.2      // 20% de probabilidad de entrar en modo cazador cuando está alerta
  };
  
  // Entidad meta
  const goal = {
    x: 0,
    y: 0,
    r: 12,
    pulseSize: 0,
    pulseDirection: 1
  };
  
  // Sistemas de partículas
  const particles = {
    player: [],
    alien: [],
    detection: []
  };
  
  // Gestión de entrada
  const keys = {};
  let lastKeyPressed = null;
  
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    lastKeyPressed = e.key;
    
    // Alternar correr con Shift
    if (e.key === 'Shift') {
      player.running = true;
    }
    
    // Pausar juego con Escape
    if (e.key === 'Escape' && gameState === GAME_STATES.PLAYING) {
      gameState = GAME_STATES.PAUSED;
    } else if (e.key === 'Escape' && gameState === GAME_STATES.PAUSED) {
      gameState = GAME_STATES.PLAYING;
    }
    
    // Iniciar juego desde menú con Enter
    if (e.key === 'Enter' && gameState === GAME_STATES.MENU) {
      startGame();
    }
    
    // Reiniciar juego después de game over o victoria con Enter
    if ((gameState === GAME_STATES.GAME_OVER || gameState === GAME_STATES.WIN) && e.key === 'Enter') {
      resetGame();
      gameState = GAME_STATES.PLAYING;
    }
  });
  
  document.addEventListener('keyup', e => {
    keys[e.key] = false;
    
    // Dejar de correr cuando se suelta Shift
    if (e.key === 'Shift') {
      player.running = false;
    }
  });
  
  // Funcionalidad del botón de reinicio
  resetBtn.addEventListener('click', () => {
    resetGame();
    gameState = GAME_STATES.PLAYING;
  });
  
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
  
  // Actualizar movimiento y estado del jugador
  function movePlayer() {
    if (!player.alive || player.escaped || gameState !== GAME_STATES.PLAYING) return;
    
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
  }
  
  // Añadir posición del jugador a la memoria del alien
  function updateAlienMemory(playerX, playerY) {
    // Convertir a coordenadas de baldosas
    const px = Math.floor(playerX / TILE_SIZE);
    const py = Math.floor(playerY / TILE_SIZE);
    
    // Añadir a la memoria si no está ya allí
    const posStr = `${px},${py}`;
    if (!alien.areaMemory.includes(posStr)) {
      alien.areaMemory.push(posStr);
      
      // Mantener la memoria en capacidad
      if (alien.areaMemory.length > 10) {
        alien.areaMemory.shift();
      }
    }
    
    // Añadir a la memoria reciente para predicción
    alien.memory.push({ x: px, y: py, time: frameCount });
    
    // Mantener la memoria en capacidad
    if (alien.memory.length > alien.memoryCapacity) {
      alien.memory.shift();
    }
  }
  
  // Predecir hacia dónde podría ir el jugador
  function predictPlayerMovement() {
    if (alien.memory.length < 2) return null;
    
    // Obtener las dos últimas posiciones
    const last = alien.memory[alien.memory.length - 1];
    const secondLast = alien.memory[alien.memory.length - 2];
    
    // Calcular dirección de movimiento
    const dx = last.x - secondLast.x;
    const dy = last.y - secondLast.y;
    
    // Si el jugador no se estaba moviendo, devolver posición actual
    if (dx === 0 && dy === 0) return { x: last.x, y: last.y };
    
    // Predecir siguiente posición basada en dirección de movimiento
    const prediction = {
      x: last.x + dx * (1 + Math.random() * alien.predictionSkill),
      y: last.y + dy * (1 + Math.random() * alien.predictionSkill)
    };
    
    // Asegurarse de que la predicción está en el mapa y no es una pared
    prediction.x = Math.max(0, Math.min(Math.floor(prediction.x), COLS - 1));
    prediction.y = Math.max(0, Math.min(Math.floor(prediction.y), ROWS - 1));
    
    // Si es una pared, usar la última posición conocida en su lugar
    if (map[Math.floor(prediction.y)] && map[Math.floor(prediction.y)][Math.floor(prediction.x)] === 1) {
      return { x: last.x, y: last.y };
    }
    
    return prediction;
  }
  
  // Comprobar si el alien debe entrar en modo cazador
  function checkHunterMode() {
    // No comprobar si ya está en modo cazador o en enfriamiento
    if (alien.hunterMode || alien.hunterModeCooldownTimer > 0) return;
    
    // Probabilidad aleatoria de entrar en modo cazador cuando está alerta
    if (alien.alertLevel > 30 && Math.random() < alien.hunterModeChance * (difficulty / 2)) {
      alien.hunterMode = true;
      alien.hunterModeTimer = alien.hunterModeDuration;
      
      // Crear efecto visual especial para modo cazador
      createParticles('alien', alien.x, alien.y, 30, 3, 'rgba(255,0,0,0.8)', 60);
      
      // Reproducir un sonido especial
      playSound('alienScream', 0.6);
    }
  }
  
  // Actualizar movimiento del alien y estado de IA
  function moveAlien() {
    if (player.escaped || gameState !== GAME_STATES.PLAYING) return;
    
    // Obtener posiciones de baldosas
    const ax = Math.floor(alien.x / TILE_SIZE);
    const ay = Math.floor(alien.y / TILE_SIZE);
    const px = Math.floor(player.x / TILE_SIZE);
    const py = Math.floor(player.y / TILE_SIZE);
    
    // Calcular distancia al jugador
    const dist = Math.hypot(alien.x - player.x, alien.y - player.y);
    
    // Actualizar temporizadores de enfriamiento
    if (alien.hunterModeCooldownTimer > 0) {
      alien.hunterModeCooldownTimer--;
    }
    
    // Actualizar temporizador de modo cazador
    if (alien.hunterMode) {
      alien.hunterModeTimer--;
      
      if (alien.hunterModeTimer <= 0) {
        alien.hunterMode = false;
        alien.hunterModeCooldownTimer = alien.hunterModeCooldown;
      }
    }
    
    // Actualizar nivel de alerta del alien basado en proximidad y visibilidad del jugador
    if (dist < alien.detectionRange && player.moved && !player.hidden) {
      // Comprobar línea de visión
      if (hasLineOfSight(ax, ay, px, py)) {
        alien.alertLevel = Math.min(alien.maxAlertLevel, alien.alertLevel + 5);
        
        // Actualizar memoria del alien con posición del jugador
        updateAlienMemory(player.x, player.y);
        
        if (alien.alertLevel >= 70 && alien.state !== 'hunting') {
          alien.state = 'hunting';
          alien.stateTimer = 0;
          alien.recalcTimer = 0;
          alien.previousStates.push('hunting');
          
          // Comprobar modo cazador
          checkHunterMode();
          
          // Reproducir grito de alien cuando empieza a cazar
          playSound('alienScream', 0.4);
          
          // Crear partículas de alerta
          createParticles('detection', alien.x, alien.y, 20, 3, 'rgba(255,0,0,0.5)', 60);
        } else if (alien.alertLevel >= 30 && alien.state !== 'hunting' && alien.state !== 'investigating') {
          alien.state = 'investigating';
          alien.stateTimer = alien.investigationTime;
          alien.lastKnownPlayerPos = { x: px, y: py };
          alien.previousStates.push('investigating');
        }
      }
    }
    
    // Incluso si está escondido, el alien podría detectar al jugador a muy corta distancia
    if (dist < alien.detectionRange * 0.3 && player.hidden && Math.random() < 0.05 * difficulty) {
      alien.alertLevel = Math.min(alien.maxAlertLevel, alien.alertLevel + 2);
      
      if (alien.alertLevel >= 70) {
        alien.state = 'hunting';
        alien.stateTimer = 0;
        alien.recalcTimer = 0;
        playSound('alienScream', 0.4);
      }
    }
    
    // Detectar sonidos de correr desde más lejos
    if (player.running && player.moved && dist < alien.detectionRange * 1.5 && Math.random() < 0.1) {
      alien.alertLevel = Math.min(alien.maxAlertLevel, alien.alertLevel + 3);
      
      if (alien.alertLevel >= 30 && alien.state !== 'hunting' && alien.state !== 'investigating') {
        alien.state = 'investigating';
        alien.stateTimer = alien.investigationTime;
        
        // Moverse hacia el sonido pero no hacia la posición exacta del jugador
        const direction = Math.atan2(player.y - alien.y, player.x - alien.x);
        const distance = dist * 0.7; // Ir 70% del camino hacia el jugador
        
        alien.lastKnownPlayerPos = { 
          x: Math.floor((alien.x + Math.cos(direction) * distance) / TILE_SIZE), 
          y: Math.floor((alien.y + Math.sin(direction) * distance) / TILE_SIZE) 
        };
        
        alien.previousStates.push('investigating');
      }
    }
    
    // Disminuir nivel de alerta con el tiempo
    if (alien.alertLevel > 0) {
      alien.alertLevel = Math.max(0, alien.alertLevel - alien.alertDecayRate * (player.hidden ? 3 : 1));
    }
    
    // Actualizar comportamiento del alien basado en su estado actual
    switch (alien.state) {
      case 'patrolling':
        // Moverse entre puntos de patrulla
        if (alien.recalcTimer <= 0) {
          // Elegir método de patrulla basado en modo de patrulla del alien
          if (alien.patrolMode === 'fixed' || alien.areaMemory.length === 0) {
            // Comportamiento de patrulla estándar
            const target = alien.patrolPoints[alien.currentPatrolIndex];
            alien.path = findPath({ x: ax, y: ay }, target, map);
            alien.pathIndex = 0;
            alien.recalcTimer = 60;
            
            // Moverse al siguiente punto de patrulla si está cerca del objetivo actual
            if (Math.hypot((target.x * TILE_SIZE + TILE_SIZE / 2) - alien.x, 
                          (target.y * TILE_SIZE + TILE_SIZE / 2) - alien.y) < TILE_SIZE) {
              alien.currentPatrolIndex = (alien.currentPatrolIndex + 1) % alien.patrolPoints.length;
            }
          } else {
            // Patrulla adaptativa - ocasionalmente comprobar posiciones recordadas del jugador
            if (Math.random() < 0.25) {
              // Elegir una posición recordada aleatoria
              const memoryIndex = Math.floor(Math.random() * alien.areaMemory.length);
              const [memX, memY] = alien.areaMemory[memoryIndex].split(',').map(Number);
              
              alien.path = findPath({ x: ax, y: ay }, { x: memX, y: memY }, map);
              alien.pathIndex = 0;
            } else {
              // Patrulla estándar
              const target = alien.patrolPoints[alien.currentPatrolIndex];
              alien.path = findPath({ x: ax, y: ay }, target, map);
              alien.pathIndex = 0;
              
              // Moverse al siguiente punto de patrulla si está cerca del objetivo actual
              if (Math.hypot((target.x * TILE_SIZE + TILE_SIZE / 2) - alien.x, 
                            (target.y * TILE_SIZE + TILE_SIZE / 2) - alien.y) < TILE_SIZE) {
                alien.currentPatrolIndex = (alien.currentPatrolIndex + 1) % alien.patrolPoints.length;
              }
            }
            alien.recalcTimer = 60;
          }
        } else {
          alien.recalcTimer--;
        }
        
        // Ocasionalmente crear pequeñas partículas
        if (frameCount % 40 === 0) {
          createParticles('alien', alien.x, alien.y, 1, 1, 'rgba(255,150,150,0.2)', 20);
        }
        
        // Cambiar aleatoriamente a estado de investigación para hacerlo impredecible
        if (Math.random() < 0.001 * difficulty) {
          alien.state = 'investigating';
          alien.stateTimer = alien.investigationTime / 2;
          
          // Elegir una posición aleatoria para investigar
          const randomPos = getRandomNearbyPosition(player.x, player.y, 8);
          alien.lastKnownPlayerPos = randomPos;
          alien.previousStates.push('investigating');
        }
        break;
        
      case 'investigating':
        // Moverse hacia la última posición conocida del jugador o posición predicha
        if (alien.recalcTimer <= 0) {
          let targetPos = null;
          
          // Usar predicción si tenemos memoria y el modo correcto
          if (alien.senses.memory && alien.memory.length > 0 && Math.random() < alien.predictionSkill) {
            const prediction = predictPlayerMovement();
            if (prediction) {
              targetPos = prediction;
            } else if (alien.lastKnownPlayerPos) {
              targetPos = alien.lastKnownPlayerPos;
            }
          } else if (alien.lastKnownPlayerPos) {
            targetPos = alien.lastKnownPlayerPos;
          }
          
          // Si no hay objetivo, buscar alrededor de la última área conocida
          if (!targetPos && alien.lastKnownPlayerPos) {
            const randomOffset = {
              x: Math.floor(Math.random() * 5) - 2,
              y: Math.floor(Math.random() * 5) - 2
            };
            
            targetPos = {
              x: alien.lastKnownPlayerPos.x + randomOffset.x,
              y: alien.lastKnownPlayerPos.y + randomOffset.y
            };
            
            // Asegurarse de que está en el mapa
            targetPos.x = Math.max(0, Math.min(targetPos.x, COLS - 1));
            targetPos.y = Math.max(0, Math.min(targetPos.y, ROWS - 1));
          }
          
          // Si tenemos un objetivo, encontrar camino hacia él
          if (targetPos) {
            alien.path = findPath({ x: ax, y: ay }, targetPos, map);
            alien.pathIndex = 0;
          }
          
          alien.recalcTimer = 30;
        } else {
          alien.recalcTimer--;
        }
        
        // Comprobar si estamos cerca del objetivo de investigación
        if (alien.lastKnownPlayerPos) {
          const targetX = alien.lastKnownPlayerPos.x * TILE_SIZE + TILE_SIZE / 2;
          const targetY = alien.lastKnownPlayerPos.y * TILE_SIZE + TILE_SIZE / 2;
          const distToTarget = Math.hypot(alien.x - targetX, alien.y - targetY);
          
          // Si hemos llegado al objetivo, buscar cerca
          if (distToTarget < TILE_SIZE * 1.5) {
            // 50% de probabilidad de elegir un nuevo lugar para investigar
            if (Math.random() < 0.5) {
              const randomPos = getRandomNearbyPosition(targetX, targetY, 3);
              alien.lastKnownPlayerPos = randomPos;
              alien.path = findPath({ x: ax, y: ay }, randomPos, map);
              alien.pathIndex = 0;
            }
          }
        }
        
        // Disminuir temporizador de investigación
        alien.stateTimer--;
        
        // Crear partículas de investigación
        if (frameCount % 20 === 0) {
          createParticles('alien', alien.x, alien.y, 2, 2, 'rgba(255,200,150,0.3)', 30);
        }
        
        // Volver a patrullar después de que termine el tiempo de investigación
        if (alien.stateTimer <= 0) {
          alien.state = 'patrolling';
          alien.previousStates.push('patrolling');
        }
        
        // Si se ve al jugador durante la investigación, cambiar a caza
        if (dist < alien.sightRange && !player.hidden && hasLineOfSight(ax, ay, px, py)) {
          alien.state = 'hunting';
          alien.stateTimer = 0;
          alien.recalcTimer = 0;
          alien.previousStates.push('hunting');
          playSound('alienScream', 0.4);
        }
        break;
        
      case 'hunting':
        // Perseguir directamente al jugador
        if (alien.recalcTimer <= 0) {
          if (!player.hidden) {
            // Actualizar memoria para predicción
            updateAlienMemory(player.x, player.y);
            
            alien.path = findPath({ x: ax, y: ay }, { x: px, y: py }, map);
            alien.lastKnownPlayerPos = { x: px, y: py };
          } else if (alien.hunterMode) {
            // En modo cazador, intentar predecir movimiento del jugador incluso cuando está escondido
            const prediction = predictPlayerMovement();
            if (prediction) {
              alien.path = findPath({ x: ax, y: ay }, prediction, map);
            } else if (alien.lastKnownPlayerPos) {
              // Moverse a la última posición conocida si no hay predicción
              alien.path = findPath({ x: ax, y: ay }, alien.lastKnownPlayerPos, map);
            }
          } else if (alien.lastKnownPlayerPos) {
            // Moverse a la última posición conocida si el jugador está escondido
            alien.path = findPath({ x: ax, y: ay }, alien.lastKnownPlayerPos, map);
            
            // Comprobar si se ha llegado a la última posición conocida
            const targetX = alien.lastKnownPlayerPos.x * TILE_SIZE + TILE_SIZE / 2;
            const targetY = alien.lastKnownPlayerPos.y * TILE_SIZE + TILE_SIZE / 2;
            const distToTarget = Math.hypot(alien.x - targetX, alien.y - targetY);
            
            // Si se ha llegado al objetivo, empezar a buscar cerca
            if (distToTarget < TILE_SIZE) {
              // Buscar primero en escondites
              const nearbyHidingSpots = [];
              
              for (let dy = -3; dy <= 3; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                  const newX = alien.lastKnownPlayerPos.x + dx;
                  const newY = alien.lastKnownPlayerPos.y + dy;
                  
                  if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
                    if (map[newY][newX] === 2) { // Escondite
                      nearbyHidingSpots.push({ x: newX, y: newY });
                    }
                  }
                }
              }
              
              // Si se encuentran escondites, ir allí
              if (nearbyHidingSpots.length > 0) {
                const randomSpot = nearbyHidingSpots[Math.floor(Math.random() * nearbyHidingSpots.length)];
                alien.lastKnownPlayerPos = randomSpot;
              } else {
                // De lo contrario, elegir una posición aleatoria cercana
                const randomPos = getRandomNearbyPosition(targetX, targetY, 3);
                alien.lastKnownPlayerPos = randomPos;
              }
            }
          }
          
          alien.pathIndex = 0;
          alien.recalcTimer = alien.hunterMode ? 10 : 15;  // Actualizaciones más frecuentes en modo cazador
        } else {
          alien.recalcTimer--;
        }
        
        // Crear partículas de caza
        if (frameCount % 10 === 0) {
          const particleColor = alien.hunterMode ? 'rgba(255,0,0,0.6)' : 'rgba(255,50,50,0.4)';
          createParticles('alien', alien.x, alien.y, 3, 2, particleColor, 40);
        }
        
        // Si el jugador permanece escondido y el nivel de alerta baja, volver a investigar
        if (player.hidden && alien.alertLevel < 30 && !alien.hunterMode) {
          alien.state = 'investigating';
          alien.stateTimer = alien.investigationTime;
          alien.previousStates.push('investigating');
        }
        
        // Aumentar velocidad del alien durante la caza
        alien.speed = alien.hunterMode ? 
                     alien.baseSpeed * (1.6 + (difficulty * 0.2)) :
                     alien.baseSpeed * (1.4 + (difficulty * 0.15));
        break;
    }
    
    // Seguir el camino calculado
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
    
    // Actualizar animación
    alien.animation.frameCounter++;
    if (alien.animation.frameCounter >= alien.animation.frameSpeed) {
      alien.animation.frame = (alien.animation.frame + 1) % alien.animation.maxFrames;
      alien.animation.frameCounter = 0;
    }
    
    // Comprobar colisión con jugador
    const collisionDist = player.r + alien.r;
    if (dist < collisionDist && player.alive && !player.hidden) {
      player.alive = false;
      gameState = GAME_STATES.GAME_OVER;
      playSound('death', 0.5);
      createParticles('player', player.x, player.y, 30, 3, 'rgba(0,255,255,0.6)', 80);
      resetBtn.style.display = 'inline-block';
    }
  }
  
  // Crear partículas para efectos visuales
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
  
  // Actualizar y renderizar todos los sistemas de partículas
  function updateParticles() {
    for (const type in particles) {
      for (let i = particles[type].length - 1; i >= 0; i--) {
        const p = particles[type][i];
        
        // Actualizar posición
        p.x += p.vx;
        p.y += p.vy;
        
        // Disminuir vida
        p.life--;
        
        // Eliminar partículas muertas
        if (p.life <= 0) {
          particles[type].splice(i, 1);
          continue;
        }
        
        // Dibujar la partícula
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `,${alpha})`);
        ctx.fill();
      }
    }
  }
  
  // Dibujar un círculo con efectos opcionales
  function drawCircle(x, y, r, color, pulseSize = 0, glowColor = null) {
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
  
  // Comprobar si el jugador ha llegado a la salida
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
  
  // Establecer una posición aleatoria para la meta
  function setRandomGoalPosition() {
    const randomIndex = Math.floor(Math.random() * goalSpawnPoints.length);
    const spawnPoint = goalSpawnPoints[randomIndex];
    
    goal.x = spawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
    goal.y = spawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
  }
  
  // Dibujar elementos de UI y información del juego
  function drawUI() {
    // Dibujar barra de stamina
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
    
    // Dibujar medidor de alerta del alien
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
    
    // Dibujar temporizador del juego
    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(timeStr, canvas.width / 2 - 20, 30);
    
    // Dibujar indicador de estado del alien
    ctx.font = '14px Arial';
    ctx.fillStyle = alien.state === 'patrolling' ? 'rgba(0,255,0,0.7)' : 
                   alien.state === 'investigating' ? 'rgba(255,255,0,0.7)' : 'rgba(255,0,0,0.7)';
    ctx.fillText(`Alien: ${alien.state.toUpperCase()}`, canvas.width - 150, 30);
    
    // Mostrar modo cazador si está activo
    if (alien.hunterMode) {
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255,0,0,0.9)';
      ctx.fillText('¡MODO CAZADOR ACTIVO!', canvas.width - 200, 50);
      
      // Añadir efecto pulsante
      if (frameCount % 30 < 15) {
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(canvas.width - 210, 35, 200, 20);
      }
    }
    
    // Mostrar nivel de dificultad
    ctx.font = '14px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const difficultyText = difficulty === 1 ? 'FÁCIL' : difficulty === 2 ? 'NORMAL' : 'DIFÍCIL';
    ctx.fillText(`Dificultad: ${difficultyText}`, canvas.width - 150, alien.hunterMode ? 70 : 50);
    
    // Mostrar indicador de dirección de la meta
    const dirX = goal.x - player.x;
    const dirY = goal.y - player.y;
    const angle = Math.atan2(dirY, dirX);
    
    // Dibujar flecha de dirección
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
    
    // Mostrar estado de escondido
    if (player.hidden) {
      ctx.font = '16px Arial';
      ctx.fillStyle = 'rgba(0,255,255,0.7)';
      ctx.fillText('HIDDEN', 20, 30);
    }
    
    // Mostrar controles durante el juego
    if (gameState === GAME_STATES.PLAYING) {
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('Flechas/WASD: Moverse | Shift: Correr | ESC: Pausa', canvas.width / 2 - 150, canvas.height - 10);
    }
  }
  
  // Dibujar estado de juego pausado
  function drawPaused() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('PAUSED', canvas.width / 2 - 60, canvas.height / 2);
    
    ctx.font = '16px Arial';
    ctx.fillText('Press ESC to resume', canvas.width / 2 - 80, canvas.height / 2 + 40);
  }
  
  // Dibujar pantalla de game over
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
  
  // Dibujar pantalla de victoria
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
  
  // Dibujar pantalla de menú
  function drawMenu() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Título del juego
    ctx.fillStyle = 'rgba(0,200,255,0.9)';
    ctx.font = '50px Arial';
    ctx.fillText('ALIEN ISOLATION', canvas.width / 2 - 200, canvas.height / 3);
    
    // Instrucciones
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Escapa del Alien y llega al punto de extracción', canvas.width / 2 - 220, canvas.height / 2);
    
    // Controles
    ctx.font = '16px Arial';
    ctx.fillText('Controles:', canvas.width / 2 - 150, canvas.height / 2 + 50);
    ctx.fillText('- Flechas/WASD: Moverse', canvas.width / 2 - 150, canvas.height / 2 + 80);
    ctx.fillText('- Shift: Correr', canvas.width / 2 - 150, canvas.height / 2 + 105);
    ctx.fillText('- Escóndete en las áreas sombreadas', canvas.width / 2 - 150, canvas.height / 2 + 130);
    
    // Selección de dificultad
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
    
    // Indicación de inicio
    ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(Date.now() / 500)) + ')';
    ctx.font = '24px Arial';
    ctx.fillText('Presiona ENTER para comenzar', canvas.width / 2 - 170, canvas.height - 100);
  }
  
  // Reiniciar el juego al estado inicial
  function resetGame() {
    // Reiniciar jugador
    player.x = initialPositions.player.x * TILE_SIZE + TILE_SIZE / 2;
    player.y = initialPositions.player.y * TILE_SIZE + TILE_SIZE / 2;
    player.alive = true;
    player.escaped = false;
    player.hidden = false;
    player.stamina = player.maxStamina;
    player.running = false;
    
    // Reiniciar alien
    alien.x = initialPositions.alien.x * TILE_SIZE + TILE_SIZE / 2;
    alien.y = initialPositions.alien.y * TILE_SIZE + TILE_SIZE / 2;
    alien.state = 'patrolling';
    alien.path = [];
    alien.pathIndex = 0;
    alien.recalcTimer = 0;
    alien.currentPatrolIndex = 0;
    alien.alertLevel = 0;
    
    // Establecer velocidad del alien según dificultad
    alien.baseSpeed = 1.6 + (difficulty * 0.15);  // La velocidad aumenta con la dificultad
    alien.speed = alien.baseSpeed;
    
    // Establecer posición aleatoria para la meta
    setRandomGoalPosition();
    
    // Reiniciar estado del juego
    gameState = GAME_STATES.PLAYING;
    gameTime = 0;
    resetBtn.style.display = 'none';
    
    // Borrar partículas
    for (const type in particles) {
      particles[type] = [];
    }
    
    // Detener música de menú e iniciar ambiente de juego
    sounds.menu.pause();
    sounds.ambience.currentTime = 0;
    if (!window.isMuted) {
      sounds.ambience.play().catch(e => console.log("Error de reproducción de audio: " + e));
    }
  }
  
  // Iniciar el juego
  function startGame() {
    gameState = GAME_STATES.PLAYING;
    resetGame();
    
    // Añadir event listener al botón de silencio para controlar música
    window.addEventListener('isMutedChanged', () => {
      if (window.isMuted) {
        sounds.ambience.pause();
        sounds.menu.pause();
      } else {
        if (gameState === GAME_STATES.MENU) {
          sounds.menu.play().catch(e => console.log("Error de reproducción de audio: " + e));
        } else if (gameState === GAME_STATES.PLAYING) {
          sounds.ambience.play().catch(e => console.log("Error de reproducción de audio: " + e));
        }
      }
    });
  }
  
  // Bucle principal del juego
  function gameLoop() {
    frameCount++;
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Actualizar según estado del juego
    switch (gameState) {
      case GAME_STATES.MENU:
        drawMenu();
        break;
        
      case GAME_STATES.PLAYING:
        // Actualizar tiempo de juego
        gameTime += 1/FPS;
        
        // Dibujar mapa y entidades
        drawMap(ctx);
        movePlayer();
        moveAlien();
        checkGoal();
        
        // Actualizar efecto de pulso de la meta
        goal.pulseSize += 0.05 * goal.pulseDirection;
        if (goal.pulseSize > 5) goal.pulseDirection = -1;
        if (goal.pulseSize < 0) {
          goal.pulseSize = 0;
          goal.pulseDirection = 1;
        }
        
        // Dibujar camino del alien para efecto visual basado en estado
        const pathColor = alien.state === 'patrolling' ? 'rgba(100,100,255,0.1)' : 
                         alien.state === 'investigating' ? 'rgba(255,200,0,0.2)' : 'rgba(255,0,0,0.2)';
        drawPath(ctx, alien.path, pathColor);
        
        // Dibujar entidades
        drawCircle(goal.x, goal.y, goal.r, 'lime', goal.pulseSize, 'rgba(0,255,0,0.2)');
        
        // Dibujar jugador con efecto basado en si está escondido
        const playerColor = player.hidden ? 'rgba(0,200,255,0.5)' : 'cyan';
        const playerGlow = player.hidden ? 'rgba(0,100,150,0.2)' : 'rgba(0,200,255,0.3)';
        drawCircle(player.x, player.y, player.r, playerColor, 0, playerGlow);
        
        // Dibujar alien con efecto basado en estado
        const alienColor = alien.state === 'patrolling' ? 'rgba(255,100,100,0.8)' : 
                          alien.state === 'investigating' ? 'rgba(255,150,0,0.8)' : 'red';
        const alienGlow = alien.state === 'hunting' ? 
                         (alien.hunterMode ? 'rgba(255,0,0,0.5)' : 'rgba(255,0,0,0.3)') : 
                         'rgba(200,0,0,0.1)';
        
        // Hacer que el alien pulse más intensamente en modo cazador
        const alienPulse = alien.hunterMode ? 
                          Math.sin(frameCount * 0.3) * 3 + 1 : 
                          (alien.state === 'hunting' ? Math.sin(frameCount * 0.2) * 2 : 0);
        
        // Dibujar el alien
        drawCircle(alien.x, alien.y, alien.r, alienColor, alienPulse, alienGlow);
        
        // Añadir "cono de visión" para el alien cuando está cazando
        if (alien.state === 'hunting' || alien.hunterMode) {
          const visionAngle = Math.atan2(
            alien.path && alien.pathIndex < alien.path.length ? 
            alien.path[alien.pathIndex].y * TILE_SIZE - alien.y : 
            player.y - alien.y, 
            alien.path && alien.pathIndex < alien.path.length ? 
            alien.path[alien.pathIndex].x * TILE_SIZE - alien.x : 
            player.x - alien.x
          );
          
          ctx.save();
          ctx.translate(alien.x, alien.y);
          ctx.rotate(visionAngle);
          
          // Crear un gradiente para el cono de visión
          const coneGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, alien.hunterMode ? 170 : 120);
          coneGradient.addColorStop(0, alien.hunterMode ? 'rgba(255,0,0,0.4)' : 'rgba(255,50,50,0.3)');
          coneGradient.addColorStop(1, 'rgba(255,0,0,0)');
          
          // Dibujar el cono de visión
          ctx.fillStyle = coneGradient;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, alien.hunterMode ? 170 : 120, -Math.PI/4, Math.PI/4);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        }
        
        // Actualizar y dibujar partículas
        updateParticles();
        
        // Dibujar elementos de UI
        drawUI();
        
        // Reproducir sonido de latido del corazón cuando el alien está cerca y cazando
        const distToAlien = Math.hypot(player.x - alien.x, player.y - alien.y);
        if (alien.state === 'hunting' && distToAlien < 200 && frameCount % 40 === 0) {
          const volume = 0.3 * (1 - distToAlien / 200);
          playSound('heartbeat', volume);
        }
        break;
        
      case GAME_STATES.PAUSED:
        // Dibujar el juego (pero no actualizarlo)
        drawMap(ctx);
        drawPath(ctx, alien.path);
        drawCircle(goal.x, goal.y, goal.r, 'lime');
        drawCircle(player.x, player.y, player.r, player.hidden ? 'rgba(0,200,255,0.5)' : 'cyan');
        drawCircle(alien.x, alien.y, alien.r, alien.state === 'hunting' ? 'red' : 'rgba(255,100,100,0.8)');
        updateParticles();
        drawUI();
        
        // Dibujar superpuesto de pausa
        drawPaused();
        break;
        
      case GAME_STATES.GAME_OVER:
        // Dibujar el estado final
        drawMap(ctx);
        drawPath(ctx, alien.path);
        drawCircle(goal.x, goal.y, goal.r, 'lime');
        drawCircle(player.x, player.y, player.r, 'gray');
        drawCircle(alien.x, alien.y, alien.r, 'red');
        updateParticles();
        
        // Dibujar pantalla de game over
        drawGameOver();
        break;
        
      case GAME_STATES.WIN:
        // Dibujar el estado final
        drawMap(ctx);
        drawCircle(goal.x, goal.y, goal.r, 'lime', 2 + Math.sin(frameCount * 0.1) * 2);
        drawCircle(player.x, player.y, player.r, 'rgba(0,255,150,0.8)');
        updateParticles();
        
        // Dibujar pantalla de victoria
        drawWin();
        break;
    }
    
    // Continuar el bucle del juego
    requestAnimationFrame(gameLoop);
  }
  
  // Inicializar y comenzar el juego
  resetGame();
  setRandomGoalPosition(); // Establecer posición inicial de la meta
  gameState = GAME_STATES.MENU;
  
  // Inicializar estado global de silencio
  window.isMuted = false;
  
  // Reproducir música de menú
  sounds.ambience.pause();
  sounds.menu.currentTime = 0;
  if (!window.isMuted) {
    // Esperar a la interacción del usuario para reproducir sonidos (política del navegador)
    const startMusic = () => {
      sounds.menu.play().catch(e => console.log("Error de reproducción de audio: " + e));
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
    };
    
    document.addEventListener('click', startMusic);
    document.addEventListener('keydown', startMusic);
  }
  
  // Dificultad del juego
  window.difficulty = 2; // Por defecto: Normal
  
  // Crear evento personalizado para cambio de estado de silencio
  const mutedChangeEvent = new Event('isMutedChanged');
  
  // Sobrescribir funcionalidad del botón de silencio desde HTML
  let originalMuteFunction = window.isMuted;
  Object.defineProperty(window, 'isMuted', {
    get: function() {
      return originalMuteFunction;
    },
    set: function(value) {
      originalMuteFunction = value;
      window.dispatchEvent(mutedChangeEvent);
    }
  });
  
  // Iniciar el bucle del juego
  gameLoop();