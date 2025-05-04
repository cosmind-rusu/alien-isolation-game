// audio.js - Sistema de audio y gestión de sonidos

// Inicializar efectos de sonido
export function initAudio() {
    const sounds = {
      footstep: new Audio('footstep.mp3'),
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
    
    return sounds;
  }
  
  // Reproducir un sonido
  export function playSound(sounds, soundName, volume = 0.3) {
    // Comprobar estado global de silencio
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
  
  // Pausar todos los sonidos
  export function pauseAllSounds(sounds) {
    for (const sound in sounds) {
      sounds[sound].pause();
    }
  }
  
  // Reanudar sonido de ambiente
  export function playAmbientSound(sounds, gameState) {
    if (window.isMuted) return;
    
    pauseAllSounds(sounds);
    
    if (gameState === 'menu') {
      sounds.menu.currentTime = 0;
      sounds.menu.play().catch(e => console.log("Error de reproducción de audio: " + e));
    } else if (gameState === 'playing') {
      sounds.ambience.currentTime = 0;
      sounds.ambience.play().catch(e => console.log("Error de reproducción de audio: " + e));
    }
  }
  
  // Gestionar cambio de estado de silencio
  export function setupMuteHandler(sounds) {
    // Crear evento personalizado para cambio de estado de silencio
    const mutedChangeEvent = new Event('isMutedChanged');
    
    // Sobrescribir funcionalidad del botón de silencio
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
    
    // Añadir event listener al botón de silencio para controlar música
    window.addEventListener('isMutedChanged', () => {
      if (window.isMuted) {
        pauseAllSounds(sounds);
      } else {
        // La lógica para reanudar sonidos específicos se maneja en otros lugares
      }
    });
  }