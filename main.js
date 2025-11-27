const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const dataPath = path.join(app.getPath('userData'), 'sleepData.json');
let cachedData;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function ensureDataFile() {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataPath)) {
    const initial = { settings: {}, sleepSessions: [] };
    fs.writeFileSync(dataPath, JSON.stringify(initial, null, 2));
  }
}

function loadData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.sleepSessions) parsed.sleepSessions = [];
    if (!parsed.settings) parsed.settings = {};
    cachedData = { settings: parsed.settings, sleepSessions: parsed.sleepSessions };
    return cachedData;
  } catch (err) {
    console.error('Failed to read data file, using fallback', err);
    cachedData = { settings: {}, sleepSessions: [] };
    return cachedData;
  }
}

function saveData(updated) {
  cachedData = updated;
  ensureDataFile();
  fs.writeFileSync(dataPath, JSON.stringify(cachedData, null, 2));
  return cachedData;
}

app.whenReady().then(() => {
  loadData();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('get-data', () => {
  if (!cachedData) loadData();
  return cachedData;
});

ipcMain.handle('save-data', (event, updated) => {
  return saveData(updated);
});
