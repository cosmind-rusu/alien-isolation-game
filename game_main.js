// game_main.js - Módulo principal del juego Alien Isolation

// Importar elementos del mapa
import {
    TILE_SIZE,
    gameMap,
    goalSpawnPoints,
    alienPatrolPoints,
    initialPositions,
    drawMap,
    drawPath
  } from './map.js';
  
  // Importar módulos de juego
  import { createAlien, setPatrolPoints, updateAlien, drawAlien } from './alien.js';
  import { createPlayer, movePlayer, checkGoal, drawPlayer } from './player.js';
  import { createGoal, setRandomGoalPosition, updateGoal, drawGoal } from './goal.js';
  import { createParticleSystems, createParticles, updateParticles } from './effects.js';
  import { initAudio, playSound, playAmbientSound, setupMuteHandler } from './audio.js';
  import { drawUI, drawPaused, drawGameOver, drawWin, drawMenu } from './ui.js';
  
  // Constantes del juego
  const FPS = 60;
  const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    WIN: 'win',
    PAUSED: 'paused'
  };
  
  // Inicializar el juego
  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const resetBtn = document.getElementById('resetBtn');
    
    // Ajustar tamaño del canvas
    canvas.width = 960;
    canvas.height = 640;
    
    // Variables del juego
    let gameState = GAME_STATES.MENU;
    let difficulty = 2; // 1-3: Fácil, Normal, Difícil
    let score = 0;
    let gameTime = 0;
    let frameCount = 0;
    
    // Inicializar sistema de audio
    const sounds = initAudio();
    setupMuteHandler(sounds);
    
    // Inicializar sistemas de partículas
    const particles = createParticleSystems();
    
    // Inicializar entidades del juego
    const player = createPlayer(initialPositions.player);
    const alien = createAlien(initialPositions.alien, difficulty);
    const goal = createGoal();
    
    // Establecer puntos de patrulla para el alien
    setPatrolPoints(alien, alienPatrolPoints);
    
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
    
    // Función para crear partículas delegada a effects.js
    const particleCreator = (type, x, y, count, speed, color, lifespan) => {
      createParticles(particles, type, x, y, count, speed, color, lifespan);
    };
    
    // Función para reproducir sonidos delegada a audio.js
    const playSoundFn = (soundName, volume = 0.3) => {
      playSound(sounds, soundName, volume);
    };
    
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
      alien.hunterMode = false;
      alien.hunterModeTimer = 0;
      alien.hunterModeCooldownTimer = 0;
      alien.ambushCooldownTimer = 0;
      
      // Establecer velocidad del alien según dificultad
      alien.baseSpeed = 1.6 + (difficulty * 0.15);  // La velocidad aumenta con la dificultad
      alien.speed = alien.baseSpeed;
      
      // Establecer posición aleatoria para la meta
      setRandomGoalPosition(goal, goalSpawnPoints);
      
      // Reiniciar estado del juego
      gameState = GAME_STATES.PLAYING;
      gameTime = 0;
      resetBtn.style.display = 'none';
      
      // Borrar partículas
      for (const type in particles) {
        particles[type] = [];
      }
      
      // Reproducir sonido de ambiente
      playAmbientSound(sounds, 'playing');
    }
    
    // Iniciar el juego
    function startGame() {
      gameState = GAME_STATES.PLAYING;
      resetGame();
    }
    
    // Actualizar la dificultad del juego
    window.setDifficulty = function(level) {
      difficulty = level;
      
      // Actualizar parámetros del alien basados en la dificultad
      if (gameState !== GAME_STATES.PLAYING) {
        alien.baseSpeed = 1.6 + (difficulty * 0.15);
        alien.speed = alien.baseSpeed;
        alien.predictionSkill = 0.5 + (difficulty * 0.1);
        alien.hunterModeChance = 0.1 + (difficulty * 0.05);
        alien.ambushChance = 0.15 + (difficulty * 0.1);
      }
    };
    
    // Bucle principal del juego
    function gameLoop() {
      frameCount++;
      
      // Limpiar el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Actualizar según estado del juego
      switch (gameState) {
        case GAME_STATES.MENU:
          drawMenu(ctx, canvas, difficulty, frameCount);
          break;
          
        case GAME_STATES.PLAYING:
          // Actualizar tiempo de juego
          gameTime += 1/FPS;
          
          // Dibujar mapa
          drawMap(ctx);
          
          // Actualizar jugador
          movePlayer(player, keys, frameCount, particleCreator, playSoundFn);
          
          // Actualizar la meta
          updateGoal(goal);
          
          // Comprobar si el jugador ha llegado a la meta
          if (checkGoal(player, goal)) {
            gameState = GAME_STATES.WIN;
            playSoundFn('victory', 0.5);
            particleCreator('player', goal.x, goal.y, 50, 2, 'rgba(0,255,100,0.7)', 100);
            resetBtn.style.display = 'inline-block';
          }
          
          // Actualizar alien e inteligencia artificial
          if (updateAlien(alien, player, goal, frameCount, difficulty, particleCreator, playSoundFn)) {
            // Si updateAlien devuelve true, hay colisión con el jugador
            player.alive = false;
            gameState = GAME_STATES.GAME_OVER;
            playSoundFn('death', 0.5);
            particleCreator('player', player.x, player.y, 30, 3, 'rgba(0,255,255,0.6)', 80);
            resetBtn.style.display = 'inline-block';
          }
          
          // Dibujar camino del alien para efecto visual basado en estado
          const pathColor = alien.state === 'patrolling' ? 'rgba(100,100,255,0.1)' : 
                           alien.state === 'investigating' ? 'rgba(255,200,0,0.2)' : 
                           alien.state === 'ambushing' ? 'rgba(100,0,0,0.2)' : 
                           'rgba(255,0,0,0.2)';
          drawPath(ctx, alien.path, pathColor);
          
          // Dibujar entidades
          drawGoal(ctx, goal);
          drawPlayer(ctx, player);
          drawAlien(ctx, alien, frameCount);
          
          // Reproducir sonido de latido del corazón cuando el alien está cerca y cazando
          const distToAlien = Math.hypot(player.x - alien.x, player.y - alien.y);
          if (alien.state === 'hunting' && distToAlien < 200 && frameCount % 40 === 0) {
            const volume = 0.3 * (1 - distToAlien / 200);
            playSoundFn('heartbeat', volume);
          }
          
          // Actualizar y dibujar partículas
          updateParticles(ctx, particles);
          
          // Dibujar elementos de UI
          drawUI(ctx, player, alien, goal, gameTime, difficulty, canvas);
          break;
          
        case GAME_STATES.PAUSED:
          // Dibujar el juego (pero no actualizarlo)
          drawMap(ctx);
          drawPath(ctx, alien.path, 'rgba(255,0,255,0.2)');
          drawGoal(ctx, goal);
          drawPlayer(ctx, player);
          drawAlien(ctx, alien, frameCount);
          updateParticles(ctx, particles);
          drawUI(ctx, player, alien, goal, gameTime, difficulty, canvas);
          
          // Dibujar superpuesto de pausa
          drawPaused(ctx, canvas);
          break;
          
        case GAME_STATES.GAME_OVER:
          // Dibujar el estado final
          drawMap(ctx);
          drawPath(ctx, alien.path, 'rgba(255,0,255,0.2)');
          drawGoal(ctx, goal);
          
          // Dibujar jugador "muerto"
          ctx.beginPath();
          ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
          ctx.fillStyle = 'gray';
          ctx.fill();
          
          drawAlien(ctx, alien, frameCount);
          updateParticles(ctx, particles);
          
          // Dibujar pantalla de game over
          drawGameOver(ctx, canvas, gameTime);
          break;
          
        case GAME_STATES.WIN:
          // Dibujar el estado final
          drawMap(ctx);
          
          // Efecto de meta más brillante
          const goalPulse = 2 + Math.sin(frameCount * 0.1) * 2;
          ctx.beginPath();
          ctx.arc(goal.x, goal.y, goal.r + goalPulse, 0, Math.PI * 2);
          ctx.fillStyle = 'lime';
          ctx.fill();
          
          // Dibujar jugador 
          ctx.beginPath();
          ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,255,150,0.8)';
          ctx.fill();
          
          updateParticles(ctx, particles);
          
          // Dibujar pantalla de victoria
          drawWin(ctx, canvas, gameTime);
          break;
      }
      
      // Continuar el bucle del juego
      requestAnimationFrame(gameLoop);
    }
    
    // Inicializar y comenzar el juego
    resetGame();
    setRandomGoalPosition(goal, goalSpawnPoints); // Establecer posición inicial de la meta
    gameState = GAME_STATES.MENU;
    playAmbientSound(sounds, 'menu');
    
    // Iniciar el bucle del juego
    gameLoop();
  });