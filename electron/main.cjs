const { app, BrowserWindow, Menu, shell, utilityProcess, dialog } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const DEV_URL = 'http://127.0.0.1:3000';
const PACKAGED_URL = 'http://127.0.0.1:43127';
function readDesktopConfig() {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const url = typeof config.supabaseUrl === 'string' ? config.supabaseUrl.trim() : '';
    const anonKey = typeof config.supabaseAnonKey === 'string' ? config.supabaseAnonKey.trim() : '';
    if (url && !/^https:\/\//i.test(url)) throw new Error('Supabase URL must use HTTPS.');
    return { url, anonKey };
  } catch (error) {
    if (error && error.code !== 'ENOENT') dialog.showErrorBox('Invalid desktop configuration', error instanceof Error ? error.message : String(error));
    return { url: '', anonKey: '' };
  }
}
let mainWindow;
let serverProcess;
let quitting = false;
function allowed(url) { try { const u = new URL(url); return u.origin === DEV_URL || u.origin === PACKAGED_URL; } catch { return false; } }
function waitForServer(url, timeoutMs = 60000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(url, response => { response.resume(); if (response.statusCode && response.statusCode < 500) resolve(); else retry(); });
      request.setTimeout(1500, () => request.destroy()); request.on('error', retry);
      function retry() { if (Date.now() - started >= timeoutMs) return reject(new Error('Time Machine Mail took too long to start.')); setTimeout(check, 400); }
    }; check();
  });
}
async function createWindow() {
  mainWindow = new BrowserWindow({ width: 1440, height: 920, minWidth: 780, minHeight: 600, show: false, title: 'Time Machine Mail', backgroundColor: '#f4f6f3', icon: app.isPackaged ? path.join(process.resourcesPath, 'icons', 'icon.png') : path.join(__dirname, '..', 'build', 'icons', 'icon.png'), webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { if (url.startsWith('https://') || url.startsWith('mailto:')) shell.openExternal(url); return { action: 'deny' }; });
  mainWindow.webContents.on('will-navigate', (event, url) => { if (!allowed(url)) event.preventDefault(); });
  mainWindow.once('ready-to-show', () => mainWindow.show()); mainWindow.on('closed', () => { mainWindow = null; });
  await mainWindow.loadURL(app.isPackaged ? PACKAGED_URL : DEV_URL);
}
function installMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'File', submenu: [{ role: 'reload' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, ...(!app.isPackaged ? [{ role: 'toggleDevTools' }] : []), { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }] },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
  ]));
}
app.whenReady().then(async () => {
  app.setPath('userData', path.join(app.getPath('appData'), 'time-machine-mail'));
  app.setAppUserModelId('dev.timemachinemail.desktop'); installMenu();
  try {
    if (app.isPackaged) {
      const serverPath = path.join(process.resourcesPath, 'app', 'server.js');
      const desktopConfig = readDesktopConfig();
      serverProcess = utilityProcess.fork(serverPath, [], { cwd: path.dirname(serverPath), serviceName: 'Time Machine Mail local web server', env: { ...process.env, NODE_ENV: 'production', HOSTNAME: '127.0.0.1', PORT: '43127', TMM_SUPABASE_URL: desktopConfig.url, TMM_SUPABASE_ANON_KEY: desktopConfig.anonKey } });
      serverProcess.on('exit', code => { if (!quitting && code !== 0 && mainWindow) dialog.showErrorBox('Time Machine Mail stopped', 'The local application server stopped unexpectedly. Please restart the app.'); });
      await waitForServer(PACKAGED_URL);
    }
    await createWindow();
  } catch (error) { dialog.showErrorBox('Unable to start Time Machine Mail', error instanceof Error ? error.message : String(error)); app.quit(); }
});
app.on('before-quit', () => { quitting = true; if (serverProcess) serverProcess.kill(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
