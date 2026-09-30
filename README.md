# Mummy Thirst 🏜️💧

**Mummy Thirst** es una aventura de acción 3D con estética voxel ambientada en un desierto egipcio con ruinas milenarias, templos, columnas, caminos elevados y pequeñas arañas enemigas.

Desarrollado con **Three.js** para los gráficos 3D y **Node.js** para el servidor local y la persistencia de presets y partidas guardadas.

---

## 🎮 Concepto y Mecánicas

- **Protagonista**: Una momia divertida y extremadamente sedienta.
- **Cámara Isométrica 3D**:
  - La momia permanece siempre en el centro visual de la pantalla.
  - El escenario se desplaza y puede rotarse alrededor de ella (`Q` y `E` o botón `🔄`).
  - Distancia e inclinación isométrica constantes.
- **Objetivo**: Recoger **10 botellas de agua** en cada uno de los **10 niveles**.
- **Dificultad Progresiva**:
  - A mayor nivel, más arañas patrullan el templo y menos botellas aparecen simultáneamente en el mapa (reapareciendo en nuevos rincones al recogerlas).
- **Sistema de Vidas**:
  - Máximo 5 vidas.
  - Cada 3 botellas recogidas = **+1 vida recuperada** (a las 3, 6 y 9 botellas).
  - Picadura de araña = **-1 vida** con período de invulnerabilidad post-daño.
- **Combate Arcade**:
  - Ataque torbellino con la barra de **Espacio** o botón táctil para aplastar arañas cercanas expulsando polvo y arena.
- **Barra de Energía**:
  - Manten presionado `Shift` para correr más rápido. La energía se regenera al caminar o detenerse.
- **Guardado y Presets en el Servidor**:
  - Guarda tus partidas y composiciones en el servidor mediante el botón `💾 GUARDAR`.
  - Al recargar la página, se indexan automáticamente todos los presets guardados.

---

## 🕹️ Controles

| Acción | Teclado | Táctil / Pantalla |
| :--- | :--- | :--- |
| **Mover a la Momia** | `W`, `A`, `S`, `D` o Flechas | Joystick Virtual |
| **Girar Cámara Isométrica** | `Q` (Izquierda) / `E` (Derecha) | Botones `↺ Q` / `↻ E` / `🔄` |
| **Atacar Arañas** | `Barra Espaciadora` / Click | Botón `⚔️ ATACAR` |
| **Correr** | `Shift` (mientras te mueves) | Botón `⚡ CORRER` |
| **Pausar Juego** | `Escape` | Botón `⏸️` |

---

## 🚀 Instalación y Ejecución

### Requisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior).

### Pasos rápidos (Windows):
1. **Instalación**: Haz doble clic en `install.bat` (o ejecuta `npm install`).
2. **Ejecutar servidor**: Haz doble clic en `run.bat` (o ejecuta `node server.js`).
3. **Jugar**: Abre tu navegador en **http://localhost:3000**.

---

## 📁 Estructura del Proyecto

```text
├── server.js              # Servidor HTTP nativo en Node.js con API REST de guardado
├── install.bat            # Script de instalación automática
├── run.bat                # Script para arrancar el servidor local
├── package.json           # Configuración del proyecto
├── data/
│   └── saves.json         # Almacenamiento persistente de partidas y presets
├── public/
│   ├── index.html         # Estructura principal y HUD
│   ├── css/
│   │   └── style.css      # Estilos egipcios sandstone, HUD y menús
│   ├── libs/
│   │   └── three.min.js   # Motor 3D Three.js
│   ├── assets/            # Diseños y referencias visuales oficiales
│   │   ├── Menu.png
│   │   ├── grafica juego.png
│   │   ├── personaje momia.png
│   │   ├── escenario A.png
│   │   ├── escenario B.png
│   │   └── escenario C.png
│   └── js/
│       ├── audio.js       # Sintetizador de audio Web Audio API
│       ├── models.js      # Fábrica de modelos 3D voxel (momia, arañas, botellas)
│       ├── levels.js      # Generador de los 10 niveles y progresiones
│       ├── engine.js      # Cámara isométrica ortográfica, luces y partículas
│       ├── saves.js       # Comunicación con la API REST del servidor
│       ├── game.js        # Bucle y lógica de juego
│       └── app.js         # Orquestación de interfaz y menús
└── README.md
```

---

*Proyecto desarrollado para Image Campus &bull; Mummy Thirst.*
