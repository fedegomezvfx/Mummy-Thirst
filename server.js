const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const SAVES_FILE = path.join(DATA_DIR, 'saves.json');

// Ensure data directory and saves.json exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SAVES_FILE)) {
  const initialSaves = [
    {
      id: 'default-save-1',
      name: 'Comienzo de Aventura (Nivel 1)',
      level: 1,
      lives: 5,
      bottlesCollected: 0,
      totalBottlesNeeded: 10,
      energy: 100,
      cameraAngle: 0,
      date: new Date().toISOString(),
      notes: 'Partida inicial recomendada'
    }
  ];
  fs.writeFileSync(SAVES_FILE, JSON.stringify(initialSaves, null, 2), 'utf-8');
}

function readSaves() {
  try {
    if (!fs.existsSync(SAVES_FILE)) return [];
    const raw = fs.readFileSync(SAVES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[MUMMY THIRST] Error al leer saves.json:', err.message);
    return [];
  }
}

function writeSaves(saves) {
  try {
    fs.writeFileSync(SAVES_FILE, JSON.stringify(saves, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[MUMMY THIRST] Error al escribir saves.json:', err.message);
    return false;
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL with standard URL API
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // REST API Routes
  if (pathname === '/api/saves' && req.method === 'GET') {
    const saves = readSaves();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, saves }));
    return;
  }

  if (pathname === '/api/saves' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const saves = readSaves();

        const newSave = {
          id: 'save_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: data.name || `Guardado Nivel ${data.level || 1} - ${new Date().toLocaleTimeString()}`,
          level: Number(data.level) || 1,
          lives: Math.min(5, Math.max(1, Number(data.lives) || 5)),
          bottlesCollected: Number(data.bottlesCollected) || 0,
          totalBottlesNeeded: 10,
          energy: (data.energy !== undefined && data.energy !== null) ? Number(data.energy) : 100,
          cameraAngle: Number(data.cameraAngle) || 0,
          scenarioConfig: data.scenarioConfig || null,
          notes: data.notes || 'Progreso guardado desde la aplicacion',
          date: new Date().toISOString()
        };

        saves.unshift(newSave);
        writeSaves(saves);

        console.log(`[SERVIDOR] Nueva partida guardada: "${newSave.name}" (Nivel ${newSave.level}, Vidas ${newSave.lives})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Partida guardada con éxito', save: newSave }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Datos invalidos' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/saves/') && req.method === 'DELETE') {
    const saveId = pathname.replace('/api/saves/', '');
    let saves = readSaves();
    const initialLen = saves.length;
    saves = saves.filter(s => s.id !== saveId);

    if (saves.length === initialLen) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Preset no encontrado' }));
      return;
    }

    writeSaves(saves);
    console.log(`[SERVIDOR] Partida eliminada: ID ${saveId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Partida eliminada' }));
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Acceso denegado');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA if not found
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Error al leer el archivo');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// Auto-recovery if port is in use
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[AVISO] El puerto ${PORT} está ocupado por otra instancia. Intentando puerto ${PORT + 1}...`);
    PORT += 1;
    setTimeout(() => {
      server.listen(PORT);
    }, 300);
  } else {
    console.error('[ERROR]', err);
  }
});

function startServer(portToTry) {
  server.listen(portToTry, () => {
    console.log('====================================================');
    console.log('             MUMMY THIRST - SERVIDOR ACTIVO         ');
    console.log('====================================================');
    console.log(`   Puerto de la aplicacion : ${PORT}`);
    console.log(`   Accede en tu navegador  : http://localhost:${PORT}`);
    console.log('====================================================');
  });
}

startServer(PORT);
