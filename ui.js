// ui.js - Interfaz de usuario y pantallas de menú

// Dibujar elementos de UI y información del juego
export function drawUI(ctx, player, alien, goal, gameTime, difficulty, canvas) {
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
                   alien.state === 'investigating' ? 'rgba(255,255,0,0.7)' : 
                   alien.state === 'ambushing' ? 'rgba(150,0,0,0.7)' : 'rgba(255,0,0,0.7)';
    ctx.fillText(`Alien: ${alien.state.toUpperCase()}`, canvas.width - 150, 30);
    
    // Mostrar modo cazador si está activo
    if (alien.hunterMode) {
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255,0,0,0.9)';
      ctx.fillText('¡MODO CAZADOR ACTIVO!', canvas.width - 200, 50);
      
      // Añadir efecto pulsante
      if (Math.floor(Date.now() / 500) % 2 === 0) {
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
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('Flechas/WASD: Moverse | Shift: Correr | ESC: Pausa', canvas.width / 2 - 150, canvas.height - 10);
  }
  
  // Dibujar pantalla de pausa
  export function drawPaused(ctx, canvas) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText('PAUSED', canvas.width / 2 - 60, canvas.height / 2);
    
    ctx.font = '16px Arial';
    ctx.fillText('Press ESC to resume', canvas.width / 2 - 80, canvas.height / 2 + 40);
  }
  
  // Dibujar pantalla de game over
  export function drawGameOver(ctx, canvas, gameTime) {
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
  export function drawWin(ctx, canvas, gameTime) {
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
  export function drawMenu(ctx, canvas, difficulty, frameCount) {
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
  
  // Mostrar una notificación temporal en pantalla
  export function showNotification(ctx, message, x, y, color = 'white', duration = 60, frameCount = 0, totalFrames = 60) {
    const alpha = Math.min(1, 1 - (frameCount / totalFrames));
    
    if (frameCount < totalFrames) {
      ctx.font = '18px Arial';
      ctx.fillStyle = color.replace(')', `,${alpha})`);
      ctx.fillText(message, x, y);
      return true;
    }
    
    return false;
  }