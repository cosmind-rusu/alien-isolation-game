// effects.js - Sistema de partículas y efectos visuales

// Inicializar sistemas de partículas
export function createParticleSystems() {
    return {
      player: [],
      alien: [],
      detection: []
    };
  }
  
  // Crear partículas para efectos visuales
  export function createParticles(particles, type, x, y, count, speed, color, lifespan) {
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
  export function updateParticles(ctx, particles) {
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
  export function drawCircle(ctx, x, y, r, color, pulseSize = 0, glowColor = null) {
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
  
  // Dibujar un pulso de radar
  export function drawRadarPulse(ctx, x, y, radius, color, angle = 0, arcWidth = Math.PI * 0.5) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Crear un gradiente radial para el pulso
    const gradient = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius);
    gradient.addColorStop(0, color.replace(')', ',0.3)'));
    gradient.addColorStop(1, color.replace(')', ',0)'));
    
    // Dibujar arco
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, -arcWidth / 2, arcWidth / 2);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.restore();
  }
  
  // Crear un efecto de flash en pantalla
  export function screenFlash(ctx, color, alpha, width, height) {
    ctx.fillStyle = color.replace(')', `,${alpha})`);
    ctx.fillRect(0, 0, width, height);
  }
  
  // Dibujar línea discontinua (para efectos de línea de visión)
  export function drawDashedLine(ctx, x1, y1, x2, y2, dashLength = 5, color = 'rgba(255,0,0,0.3)') {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dashCount = Math.floor(distance / dashLength);
    const dashX = dx / dashCount;
    const dashY = dy / dashCount;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    
    let draw = true;
    let x = x1;
    let y = y1;
    
    ctx.moveTo(x1, y1);
    
    for (let i = 0; i < dashCount; i++) {
      if (draw) {
        x += dashX;
        y += dashY;
        ctx.lineTo(x, y);
      } else {
        x += dashX;
        y += dashY;
        ctx.moveTo(x, y);
      }
      draw = !draw;
    }
    
    ctx.stroke();
  }