// ==========================================================
// MUMMY THIRST — APPLICATION BOOTSTRAP & UI BINDINGS
// Inicialización, Menú Principal, HUD, Modales y Servidor
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const mainMenu = document.getElementById('main-menu');
  const gameHud = document.getElementById('game-hud');

  // Inicializar Gestor de Partidas / Presets en el Servidor
  const savesManager = new SavesManager();
  window.savesManager = savesManager;

  // Inicializar Motor del Juego
  const game = new MummyGame(canvas);
  window.gameInstance = game;

  // ==========================================================
  // MENÚ PRINCIPAL (Basado fielmente en Menu.png)
  // ==========================================================
  const btnStartGame = document.getElementById('btn-start-game');
  const btnLoadGame = document.getElementById('btn-load-game');
  const btnHowToPlay = document.getElementById('btn-how-to-play');

  // 1. Iniciar Juego (Nivel 1)
  btnStartGame.addEventListener('click', () => {
    if (window.soundManager) {
      window.soundManager.ensureContext();
      window.soundManager.playBottlePickup();
    }
    mainMenu.classList.add('hidden');
    gameHud.classList.remove('hidden');
    game.startLevel(1);
  });

  // 2. Cargar Partida / Presets Guardados
  btnLoadGame.addEventListener('click', () => {
    savesManager.openModal();
  });

  // 3. Cómo Jugar (Tutorial)
  const modalTutorial = document.getElementById('modal-tutorial');
  const btnCloseTutorial = document.getElementById('btn-close-tutorial');
  const btnStartFromTut = document.getElementById('btn-start-from-tut');

  btnHowToPlay.addEventListener('click', () => {
    modalTutorial.classList.remove('hidden');
  });

  if (btnCloseTutorial) {
    btnCloseTutorial.addEventListener('click', () => modalTutorial.classList.add('hidden'));
  }
  if (btnStartFromTut) {
    btnStartFromTut.addEventListener('click', () => {
      modalTutorial.classList.add('hidden');
      mainMenu.classList.add('hidden');
      gameHud.classList.remove('hidden');
      game.startLevel(1);
    });
  }

  // ==========================================================
  // HUD BUTTONS & QUICK ACTIONS
  // ==========================================================
  const btnQuickSave = document.getElementById('btn-quick-save');
  const btnOpenPresets = document.getElementById('btn-open-presets');
  const btnRotateCam = document.getElementById('btn-rotate-cam');
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const btnPauseGame = document.getElementById('btn-pause-game');

  if (btnQuickSave) {
    btnQuickSave.addEventListener('click', () => {
      savesManager.openModal();
    });
  }

  if (btnOpenPresets) {
    btnOpenPresets.addEventListener('click', () => {
      savesManager.openModal();
    });
  }

  if (btnRotateCam) {
    btnRotateCam.addEventListener('click', () => {
      game.engine.rotateCamera(1);
    });
  }

  if (btnToggleSound) {
    btnToggleSound.addEventListener('click', () => {
      const isMuted = window.soundManager.toggleMute();
      btnToggleSound.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  if (btnPauseGame) {
    btnPauseGame.addEventListener('click', () => {
      game.togglePause();
    });
  }

  // ==========================================================
  // MODAL DE PRESETS / GUARDADOS
  // ==========================================================
  const btnClosePresets = document.getElementById('btn-close-presets');
  const btnDismissPresets = document.getElementById('btn-dismiss-presets');

  if (btnClosePresets) btnClosePresets.addEventListener('click', () => savesManager.closeModal());
  if (btnDismissPresets) btnDismissPresets.addEventListener('click', () => savesManager.closeModal());

  // ==========================================================
  // MENÚ DE PAUSA
  // ==========================================================
  const pauseOverlay = document.getElementById('pause-overlay');
  const btnResumeGame = document.getElementById('btn-resume-game');
  const btnPauseSave = document.getElementById('btn-pause-save');
  const btnPausePresets = document.getElementById('btn-pause-presets');
  const btnQuitToMenu = document.getElementById('btn-quit-to-menu');

  if (btnResumeGame) {
    btnResumeGame.addEventListener('click', () => game.togglePause());
  }

  if (btnPauseSave) {
    btnPauseSave.addEventListener('click', () => {
      savesManager.openModal();
    });
  }

  if (btnPausePresets) {
    btnPausePresets.addEventListener('click', () => {
      savesManager.openModal();
    });
  }

  if (btnQuitToMenu) {
    btnQuitToMenu.addEventListener('click', () => {
      pauseOverlay.classList.add('hidden');
      gameHud.classList.add('hidden');
      mainMenu.classList.remove('hidden');
      game.isPaused = false;
    });
  }

  // ==========================================================
  // MENÚ DE DERROTA (GAME OVER)
  // ==========================================================
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const btnRetryLevel = document.getElementById('btn-retry-level');
  const btnGameOverLoad = document.getElementById('btn-game-over-load');
  const btnGameOverMenu = document.getElementById('btn-game-over-menu');

  if (btnRetryLevel) {
    btnRetryLevel.addEventListener('click', () => {
      gameOverOverlay.classList.add('hidden');
      game.lives = 5;
      game.startLevel(game.currentLevel);
    });
  }

  if (btnGameOverLoad) {
    btnGameOverLoad.addEventListener('click', () => {
      gameOverOverlay.classList.add('hidden');
      savesManager.openModal();
    });
  }

  if (btnGameOverMenu) {
    btnGameOverMenu.addEventListener('click', () => {
      gameOverOverlay.classList.add('hidden');
      gameHud.classList.add('hidden');
      mainMenu.classList.remove('hidden');
    });
  }

  // ==========================================================
  // MENÚ DE VICTORIA DE NIVEL & JUEGO
  // ==========================================================
  const levelCompleteOverlay = document.getElementById('level-complete-overlay');
  const btnNextLevel = document.getElementById('btn-next-level');
  const btnVictorySave = document.getElementById('btn-victory-save');

  if (btnNextLevel) {
    btnNextLevel.addEventListener('click', () => {
      levelCompleteOverlay.classList.add('hidden');
      game.startLevel(game.currentLevel + 1);
    });
  }

  if (btnVictorySave) {
    btnVictorySave.addEventListener('click', () => {
      savesManager.openModal();
    });
  }

  const gameWinOverlay = document.getElementById('game-win-overlay');
  const btnWinMenu = document.getElementById('btn-win-menu');
  if (btnWinMenu) {
    btnWinMenu.addEventListener('click', () => {
      gameWinOverlay.classList.add('hidden');
      gameHud.classList.add('hidden');
      mainMenu.classList.remove('hidden');
    });
  }
});
