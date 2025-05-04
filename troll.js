const trollBtn = document.getElementById('trollBtn');
const screamer = document.getElementById('screamer');
const screamerAudio = document.getElementById('screamerAudio');

trollBtn.addEventListener('click', () => {
  screamer.style.display = 'flex';
  screamer.style.opacity = 0;
  screamer.style.transition = 'opacity 0.3s ease-in';
  
  // Mostrar screamer visualmente
  setTimeout(() => {
    screamer.style.opacity = 1;
  }, 50);
  
  // Reproducir audio si no está silenciado
  if (!window.isMuted) {
    screamerAudio.currentTime = 0;
    screamerAudio.play();
  }
  
  // Quitar screamer después de unos segundos
  setTimeout(() => {
    screamer.style.opacity = 0;
    setTimeout(() => {
      screamer.style.display = 'none';
    }, 500);
  }, 3000);
});
