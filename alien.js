// alien.js - Inteligencia artificial y comportamiento del alien
import {
    TILE_SIZE,
    gameMap as map,
    findPath,
    hasLineOfSight,
    getRandomNearbyPosition
  } from './map.js';
  
  // Función para crear el alien con todas sus propiedades
  export function createAlien(initialPosition, difficulty) {
    return {
      x: initialPosition.x * TILE_SIZE + TILE_SIZE / 2,
      y: initialPosition.y * TILE_SIZE + TILE_SIZE / 2,
      r: 10,
      baseSpeed: 1.6 + (difficulty * 0.15),     // Velocidad base aumentada según dificultad
      speed: 1.6 + (difficulty * 0.15),         // Velocidad inicial aumentada
      state: 'patrolling',
      previousStates: [],
      path: [],
      pathIndex: 0,
      recalcTimer: 0,
      patrolPoints: [],
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
      // Propiedades de comportamiento de IA
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
      hunterModeChance: 0.2,      // 20% de probabilidad de entrar en modo cazador cuando está alerta
      
      // Nuevos estados para emboscadas
      ambushChance: 0.15 + (difficulty * 0.1), // 15-45% de probabilidad según dificultad
      ambushTimer: 0,
      ambushDuration: 300, // 5 segundos en emboscada
      ambushCooldown: 1200, // 20 segundos de enfriamiento
      ambushCooldownTimer: 0,
      lastAmbushPosition: null
    };
  }
  
  // Establecer puntos de patrulla
  export function setPatrolPoints(alien, patrolPoints) {
    alien.patrolPoints = patrolPoints;
  }
  
  // Añadir posición del jugador a la memoria del alien
  export function updateAlienMemory(alien, playerX, playerY, frameCount) {
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
  export function predictPlayerMovement(alien) {
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
    prediction.x = Math.max(0, Math.min(Math.floor(prediction.x), map[0].length - 1));
    prediction.y = Math.max(0, Math.min(Math.floor(prediction.y), map.length - 1));
    
    // Si es una pared, usar la última posición conocida en su lugar
    if (map[Math.floor(prediction.y)] && map[Math.floor(prediction.y)][Math.floor(prediction.x)] === 1) {
      return { x: last.x, y: last.y };
    }
    
    return prediction;
  }
  
  // Comprobar si el alien debe entrar en modo cazador
  export function checkHunterMode(alien, difficulty) {
    // No comprobar si ya está en modo cazador o en enfriamiento
    if (alien.hunterMode || alien.hunterModeCooldownTimer > 0) return;
    
    // Probabilidad aleatoria de entrar en modo cazador cuando está alerta
    if (alien.alertLevel > 30 && Math.random() < alien.hunterModeChance * (difficulty / 2)) {
      alien.hunterMode = true;
      alien.hunterModeTimer = alien.hunterModeDuration;
      
      return true; // Indica que se activó el modo cazador
    }
    
    return false;
  }
  
  // Comprobar si el alien debe iniciar una emboscada
  export function checkAmbush(alien, player, goal, frameCount) {
    // No emboscar si ya está en emboscada o enfriamiento
    if (alien.state === 'ambushing' || alien.ambushCooldownTimer > 0) {
      if (alien.ambushCooldownTimer > 0) alien.ambushCooldownTimer--;
      return false;
    }
    
    // Chance aleatorio de emboscar basado en dificultad
    if (Math.random() < alien.ambushChance * (alien.alertLevel > 20 ? 1.5 : 1)) {
      let ambushPosition = null;
      
      // Priorizar cerca de la meta a veces
      if (Math.random() < 0.3) {
        const goalDir = Math.atan2(goal.y - alien.y, goal.x - alien.x);
        const distance = Math.min(200, Math.hypot(goal.x - alien.x, goal.y - alien.y) * 0.7);
        
        const targetX = alien.x + Math.cos(goalDir) * distance;
        const targetY = alien.y + Math.sin(goalDir) * distance;
        
        ambushPosition = getRandomNearbyPosition(targetX, targetY, 5);
      } 
      // Intentar emboscar cerca de un escondite conocido
      else if (alien.areaMemory.length > 0 && Math.random() < 0.5) {
        const randomMemory = alien.areaMemory[Math.floor(Math.random() * alien.areaMemory.length)];
        const [memX, memY] = randomMemory.split(',').map(Number);
        
        ambushPosition = { x: memX, y: memY };
      }
      // Emboscar en una posición aleatoria en el camino del jugador al objetivo
      else {
        const px = Math.floor(player.x / TILE_SIZE);
        const py = Math.floor(player.y / TILE_SIZE);
        const gx = Math.floor(goal.x / TILE_SIZE);
        const gy = Math.floor(goal.y / TILE_SIZE);
        
        // Obtener un camino posible del jugador a la meta
        const possiblePath = findPath({ x: px, y: py }, { x: gx, y: gy }, map);
        
        // Elegir un punto aleatorio en ese camino
        if (possiblePath.length > 5) {
          const randomIndex = Math.floor(Math.random() * (possiblePath.length - 4)) + 2;
          ambushPosition = possiblePath[randomIndex];
        } else {
          // Si no hay un camino claro, elegir un punto aleatorio
          ambushPosition = getRandomNearbyPosition(alien.x, alien.y, 8);
        }
      }
      
      if (ambushPosition) {
        // Establecer el punto de emboscada
        alien.lastAmbushPosition = ambushPosition;
        alien.path = findPath({ x: Math.floor(alien.x / TILE_SIZE), y: Math.floor(alien.y / TILE_SIZE) }, ambushPosition, map);
        alien.pathIndex = 0;
        
        // Cambiar estado a 'moverse a emboscada'
        alien.state = 'moveToAmbush';
        alien.previousStates.push('moveToAmbush');
        return true;
      }
    }
    
    return false;
  }
  
  // Actualizar movimiento del alien y estado de IA
  export function updateAlien(alien, player, goal, frameCount, difficulty, createParticles, playSound) {
    if (player.escaped) return;
    
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
        updateAlienMemory(alien, player.x, player.y, frameCount);
        
        if (alien.alertLevel >= 70 && alien.state !== 'hunting') {
          alien.state = 'hunting';
          alien.stateTimer = 0;
          alien.recalcTimer = 0;
          alien.previousStates.push('hunting');
          
          // Comprobar modo cazador
          if (checkHunterMode(alien, difficulty)) {
            // Crear partículas de alerta
            createParticles('alien', alien.x, alien.y, 30, 3, 'rgba(255,0,0,0.8)', 60);
            
            // Reproducir un sonido especial
            playSound('alienScream', 0.6);
          }
          
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
        
        // Comprobar si debemos iniciar una emboscada
        checkAmbush(alien, player, goal, frameCount);
        break;
        
      case 'investigating':
        // Moverse hacia la última posición conocida del jugador o posición predicha
        if (alien.recalcTimer <= 0) {
          let targetPos = null;
          
          // Usar predicción si tenemos memoria y el modo correcto
          if (alien.senses.memory && alien.memory.length > 0 && Math.random() < alien.predictionSkill) {
            const prediction = predictPlayerMovement(alien);
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
            targetPos.x = Math.max(0, Math.min(targetPos.x, map[0].length - 1));
            targetPos.y = Math.max(0, Math.min(targetPos.y, map.length - 1));
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
            updateAlienMemory(alien, player.x, player.y, frameCount);
            
            alien.path = findPath({ x: ax, y: ay }, { x: px, y: py }, map);
            alien.lastKnownPlayerPos = { x: px, y: py };
          } else if (alien.hunterMode) {
            // En modo cazador, intentar predecir movimiento del jugador incluso cuando está escondido
            const prediction = predictPlayerMovement(alien);
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
                  
                  if (newX >= 0 && newX < map[0].length && newY >= 0 && newY < map.length) {
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
        
      case 'moveToAmbush':
        // Moverse hacia la posición de emboscada
        if (alien.recalcTimer <= 0) {
          if (alien.lastAmbushPosition) {
            alien.path = findPath(
              { x: Math.floor(alien.x / TILE_SIZE), y: Math.floor(alien.y / TILE_SIZE) },
              alien.lastAmbushPosition,
              map
            );
            alien.pathIndex = 0;
          }
          alien.recalcTimer = 30;
        } else {
          alien.recalcTimer--;
        }
        
        // Comprobar si hemos llegado al punto de emboscada
        if (alien.lastAmbushPosition) {
          const ambushX = alien.lastAmbushPosition.x * TILE_SIZE + TILE_SIZE / 2;
          const ambushY = alien.lastAmbushPosition.y * TILE_SIZE + TILE_SIZE / 2;
          const distToAmbush = Math.hypot(alien.x - ambushX, alien.y - ambushY);
          
          if (distToAmbush < TILE_SIZE / 2) {
            // Iniciar emboscada
            alien.state = 'ambushing';
            alien.ambushTimer = alien.ambushDuration;
            
            // Crear partículas sutiles
            createParticles('alien', alien.x, alien.y, 5, 1, 'rgba(255,0,0,0.2)', 30);
          }
        }
        
        // Si el jugador aparece a la vista durante el movimiento a emboscada, cazarlo
        if (dist < alien.sightRange && !player.hidden && hasLineOfSight(
          Math.floor(alien.x / TILE_SIZE), Math.floor(alien.y / TILE_SIZE),
          Math.floor(player.x / TILE_SIZE), Math.floor(player.y / TILE_SIZE)
        )) {
          alien.state = 'hunting';
          alien.alertLevel = alien.maxAlertLevel;
          playSound('alienScream', 0.4);
        }
        break;
        
      case 'ambushing':
        // Permanecer inmóvil y esperar
        alien.ambushTimer--;
        
        // Crear efecto visual sutil de emboscada
        if (frameCount % 30 === 0) {
          createParticles('alien', alien.x, alien.y, 1, 0.5, 'rgba(255,0,0,0.1)', 20);
        }
        
        // Comprobar si el jugador está cerca
        const ambushDist = Math.hypot(player.x - alien.x, player.y - alien.y);
        
        // Si el jugador viene hacia la emboscada y está cerca, atacar
        if (ambushDist < alien.detectionRange * 0.7 && !player.hidden) {
          alien.state = 'hunting';
          alien.speed = alien.baseSpeed * 1.8; // Velocidad extra en el ataque sorpresa
          alien.alertLevel = alien.maxAlertLevel;
          playSound('alienScream', 0.5);
          
          // Crear efecto visual de emboscada
          createParticles('alien', alien.x, alien.y, 30, 3, 'rgba(255,0,0,0.7)', 60);
        }
        
        // Finalizar emboscada si ha pasado el tiempo
        if (alien.ambushTimer <= 0) {
          alien.state = 'patrolling';
          alien.ambushCooldownTimer = alien.ambushCooldown;
        }
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
      return true; // Indica colisión con el jugador
    }
    
    return false; // No hay colisión
  }
  
  // Función para dibujar el alien
  export function drawAlien(ctx, alien, frameCount) {
    // Determinar color basado en estado
    const alienColor = alien.state === 'patrolling' ? 'rgba(255,100,100,0.8)' : 
                       alien.state === 'investigating' ? 'rgba(255,150,0,0.8)' : 
                       alien.state === 'ambushing' ? 'rgba(150,0,0,0.8)' : 'red';
    
    const alienGlow = alien.state === 'hunting' ? 
                      (alien.hunterMode ? 'rgba(255,0,0,0.5)' : 'rgba(255,0,0,0.3)') : 
                      alien.state === 'ambushing' ? 'rgba(100,0,0,0.2)' :
                      'rgba(200,0,0,0.1)';
    
    // Hacer que el alien pulse más intensamente en modo cazador
    const alienPulse = alien.hunterMode ? 
                      Math.sin(frameCount * 0.3) * 3 + 1 : 
                      (alien.state === 'hunting' ? Math.sin(frameCount * 0.2) * 2 : 
                      alien.state === 'ambushing' ? Math.sin(frameCount * 0.1) * 1 : 0);
    
    // Dibujar el alien
    drawCircle(ctx, alien.x, alien.y, alien.r, alienColor, alienPulse, alienGlow);
    
    // Añadir "cono de visión" para el alien cuando está cazando o emboscando
    if (alien.state === 'hunting' || alien.hunterMode || alien.state === 'ambushing') {
      const visionAngle = Math.atan2(
        alien.path && alien.pathIndex < alien.path.length ? 
        alien.path[alien.pathIndex].y * TILE_SIZE - alien.y : 0, 
        alien.path && alien.pathIndex < alien.path.length ? 
        alien.path[alien.pathIndex].x * TILE_SIZE - alien.x : 0
      );
      
      ctx.save();
      ctx.translate(alien.x, alien.y);
      ctx.rotate(visionAngle);
      
      // Crear un gradiente para el cono de visión
      const coneGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, alien.hunterMode ? 170 : 
                                                  alien.state === 'ambushing' ? 90 : 120);
                                                  
      const coneColor = alien.state === 'ambushing' ? 
                       'rgba(100,0,0,0.3)' : 
                       (alien.hunterMode ? 'rgba(255,0,0,0.4)' : 'rgba(255,50,50,0.3)');
                       
      coneGradient.addColorStop(0, coneColor);
      coneGradient.addColorStop(1, 'rgba(255,0,0,0)');
      
      // Dibujar el cono de visión
      ctx.fillStyle = coneGradient;
      ctx.beginPath();
      
      // Hacer el cono más estrecho durante la emboscada
      const arcAngle = alien.state === 'ambushing' ? Math.PI/6 : Math.PI/4;
      
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, alien.hunterMode ? 170 : 
             alien.state === 'ambushing' ? 90 : 120, 
             -arcAngle, arcAngle);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
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