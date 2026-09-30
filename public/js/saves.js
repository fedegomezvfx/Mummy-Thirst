// ==========================================================
// MUMMY THIRST — SERVER SAVES & PRESETS MANAGER
// Cumple con el requerimiento:
// - Guardar composiciones/partidas en el servidor (Node.js)
// - Mostrar lista de todos los presets guardados
// - Indexar automáticamente al recargar la página
// ==========================================================

class SavesManager {
  constructor() {
    this.saves = [];
    this.isLoading = false;
    this.onLoadSaveCallback = null;
    this.initUI();
  }

  initUI() {
    this.presetsListEl = document.getElementById('presets-list');
    this.inputPresetName = document.getElementById('input-preset-name');
    this.statusMsgEl = document.getElementById('save-status-msg');
    this.modalPresets = document.getElementById('modal-presets');

    // Botón refrescar
    const btnRefresh = document.getElementById('btn-refresh-presets');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => this.fetchSaves());
    }

    // Botón guardar en el formulario modal
    const btnSubmitSave = document.getElementById('btn-submit-save');
    if (btnSubmitSave) {
      btnSubmitSave.addEventListener('click', () => {
        const customName = this.inputPresetName.value.trim();
        this.saveCurrentGame(customName);
      });
    }

    // Cargar automáticamente todos los presets al iniciar / recargar la página
    this.fetchSaves();
  }

  // Obtener presets guardados desde el servidor Node.js
  async fetchSaves() {
    this.isLoading = true;
    if (this.presetsListEl) {
      this.presetsListEl.innerHTML = '<div class="loading-spinner">Indexando presets desde el servidor...</div>';
    }

    try {
      const res = await fetch('/api/saves');
      if (!res.ok) throw new Error('Error al conectar con el servidor');
      const data = await res.json();
      this.saves = data.saves || [];
      this.renderPresetsList();
      console.log(`[SAVES] ${this.saves.length} presets indexados desde el servidor.`);
    } catch (err) {
      console.warn('[SAVES] Error al cargar partidas:', err.message);
      if (this.presetsListEl) {
        this.presetsListEl.innerHTML = `
          <div class="preset-error">
            No se pudo contactar al servidor local en /api/saves.<br>
            Asegúrate de haber iniciado el servidor con <strong>run.bat</strong>.
          </div>
        `;
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Renderizar la lista de presets indexados
  renderPresetsList() {
    if (!this.presetsListEl) return;

    if (this.saves.length === 0) {
      this.presetsListEl.innerHTML = '<div class="preset-empty">No hay presets guardados aún. ¡Crea el primero!</div>';
      return;
    }

    this.presetsListEl.innerHTML = '';

    this.saves.forEach(save => {
      const card = document.createElement('div');
      card.className = 'preset-card-item';

      const dateStr = new Date(save.date).toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short'
      });

      card.innerHTML = `
        <div class="preset-info-col">
          <h4>${this.escapeHtml(save.name)}</h4>
          <div class="preset-stats-line">
            <span>🏛️ Nivel: <strong>${save.level}</strong></span>
            <span>❤️ Vidas: <strong>${save.lives}/5</strong></span>
            <span>💧 Botellas: <strong>${save.bottlesCollected}/10</strong></span>
          </div>
          <div class="preset-date">📅 Guardado: ${dateStr}</div>
        </div>
        <div class="preset-actions-col">
          <button class="stone-btn primary-btn preset-btn btn-load-item" data-id="${save.id}">
            CARGAR
          </button>
          <button class="stone-btn danger-btn preset-btn btn-delete-item" data-id="${save.id}">
            🗑️
          </button>
        </div>
      `;

      // Event listeners para cargar y borrar
      const loadBtn = card.querySelector('.btn-load-item');
      loadBtn.addEventListener('click', () => {
        this.loadSave(save);
      });

      const delBtn = card.querySelector('.btn-delete-item');
      delBtn.addEventListener('click', () => {
        this.deleteSave(save.id);
      });

      this.presetsListEl.appendChild(card);
    });
  }

  // Guardar partida actual en el servidor
  async saveCurrentGame(customName = '') {
    if (!window.gameInstance) {
      this.showStatus('Inicia una partida antes de guardar', 'error');
      return;
    }

    const state = window.gameInstance.getCurrentState();
    const payload = {
      name: customName || `Nivel ${state.level} (${state.bottlesCollected}/10 botellas) - ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      level: state.level,
      lives: state.lives,
      bottlesCollected: state.bottlesCollected,
      energy: state.energy,
      cameraAngle: state.cameraAngle,
      scenarioConfig: {
        mummyX: state.mummyX,
        mummyZ: state.mummyZ
      },
      notes: 'Guardado por el usuario'
    };

    try {
      this.showStatus('Enviando al servidor...', '');
      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        this.showStatus('¡Preset guardado con éxito en el servidor!', 'success');
        if (this.inputPresetName) this.inputPresetName.value = '';
        if (window.soundManager) window.soundManager.playHeal();
        await this.fetchSaves();
      } else {
        this.showStatus('Error: ' + data.message, 'error');
      }
    } catch (err) {
      this.showStatus('Error al conectar con el servidor: ' + err.message, 'error');
    }
  }

  // Cargar preset seleccionado
  loadSave(save) {
    if (!window.gameInstance) return;
    this.closeModal();
    window.gameInstance.loadState(save);
    if (window.soundManager) window.soundManager.playBottlePickup();
  }

  // Eliminar preset del servidor
  async deleteSave(id) {
    if (!confirm('¿Deseas eliminar este preset guardado del servidor?')) return;

    try {
      const res = await fetch(`/api/saves/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await this.fetchSaves();
      }
    } catch (err) {
      alert('Error al eliminar preset: ' + err.message);
    }
  }

  openModal() {
    if (this.modalPresets) {
      this.modalPresets.classList.remove('hidden');
      this.fetchSaves(); // Actualizar indexado
    }
  }

  closeModal() {
    if (this.modalPresets) {
      this.modalPresets.classList.add('hidden');
      if (this.statusMsgEl) this.statusMsgEl.textContent = '';
    }
  }

  showStatus(msg, type = '') {
    if (!this.statusMsgEl) return;
    this.statusMsgEl.textContent = msg;
    this.statusMsgEl.className = 'status-msg ' + type;
    setTimeout(() => {
      if (this.statusMsgEl) this.statusMsgEl.textContent = '';
    }, 4000);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
}

window.SavesManager = SavesManager;
