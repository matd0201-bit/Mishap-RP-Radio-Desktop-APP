'use strict';

const path = require('path');
const { app, BrowserWindow, session, ipcMain } = require('electron');

let mainWindow = null;
let hook = null;
let hookStarted = false;
let pttConfig = { key: null, mode: 'hold' };
let pttCapturing = false;
let pttIsDown = false;

app.setAppUserModelId('com.mishaprp.radio');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

const CODE_MAP = {
  Escape:0x0001,
  Digit1:0x0002, Digit2:0x0003, Digit3:0x0004, Digit4:0x0005, Digit5:0x0006,
  Digit6:0x0007, Digit7:0x0008, Digit8:0x0009, Digit9:0x000A, Digit0:0x000B,
  Minus:0x000C, Equal:0x000D, Backspace:0x000E, Tab:0x000F,
  KeyQ:0x0010, KeyW:0x0011, KeyE:0x0012, KeyR:0x0013, KeyT:0x0014,
  KeyY:0x0015, KeyU:0x0016, KeyI:0x0017, KeyO:0x0018, KeyP:0x0019,
  BracketLeft:0x001A, BracketRight:0x001B, Enter:0x001C,
  ControlLeft:0x001D, KeyA:0x001E, KeyS:0x001F, KeyD:0x0020,
  KeyF:0x0021, KeyG:0x0022, KeyH:0x0023, KeyJ:0x0024, KeyK:0x0025,
  KeyL:0x0026, Semicolon:0x0027, Quote:0x0028, Backquote:0x0029,
  ShiftLeft:0x002A, Backslash:0x002B, KeyZ:0x002C, KeyX:0x002D,
  KeyC:0x002E, KeyV:0x002F, KeyB:0x0030, KeyN:0x0031, KeyM:0x0032,
  Comma:0x0033, Period:0x0034, Slash:0x0035, ShiftRight:0x0036,
  NumpadMultiply:0x0037, AltLeft:0x0038, Space:0x0039, CapsLock:0x003A,
  F1:0x003B, F2:0x003C, F3:0x003D, F4:0x003E, F5:0x003F, F6:0x0040,
  F7:0x0041, F8:0x0042, F9:0x0043, F10:0x0044, NumLock:0x0045,
  ScrollLock:0x0046, Numpad7:0x0047, Numpad8:0x0048, Numpad9:0x0049,
  NumpadSubtract:0x004A, Numpad4:0x004B, Numpad5:0x004C, Numpad6:0x004D,
  NumpadAdd:0x004E, Numpad1:0x004F, Numpad2:0x0050, Numpad3:0x0051,
  Numpad0:0x0052, NumpadDecimal:0x0053, NumpadComma:0x007E,
  F11:0x0057, F12:0x0058, F13:0x005B, F14:0x005C, F15:0x005D,
  F16:0x0063, F17:0x0064, F18:0x0065, F19:0x0066, F20:0x0067,
  F21:0x0068, F22:0x0069, F23:0x006A, F24:0x006B,
  PrintScreen:0x0E37, Pause:0x0E45, IntlBackslash:0x0E46,
  NumpadEqual:0x0E0D, IntlYen:0x007D, KanaMode:0x0070,
  Convert:0x0079, NonConvert:0x007B,
  NumpadEnter:0x0E1C, ControlRight:0x0E1D, NumpadDivide:0x0E35,
  AltRight:0x0E38, Home:0x0E47, ArrowUp:0xE048, PageUp:0x0E49,
  ArrowLeft:0xE04B, ArrowRight:0xE04D, End:0x0E4F, ArrowDown:0xE050,
  PageDown:0x0E51, Insert:0x0E52, Delete:0x0E53,
  MetaLeft:0x0E5B, MetaRight:0x0E5C, ContextMenu:0x0E5D
};

function modifierKey(code) {
  return /^(Control|Shift|Alt|Meta)(Left|Right)$/.test(code || '');
}
function configMatches(event, key) {
  if (!key || !key.code || CODE_MAP[key.code] === undefined) return false;
  if (event.keycode !== CODE_MAP[key.code]) return false;
  if (modifierKey(key.code)) return true;
  return !!event.ctrlKey === !!key.ctrl &&
         !!event.shiftKey === !!key.shift &&
         !!event.altKey === !!key.alt &&
         !!event.metaKey === !!key.meta;
}
function sendPtt(state) {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) return;
  mainWindow.webContents.send('mishap-global-ptt', state);
}
function onKeyDown(event) {
  // Au premier plan, le renderer traite lui-même le clavier pour garder le PTT réactif.
  // Le hook global ne prend le relais que lorsque la fenêtre n'a plus le focus.
  if (pttCapturing || (mainWindow && !mainWindow.isDestroyed() && mainWindow.isFocused()) || !configMatches(event, pttConfig.key)) return;
  if (pttIsDown) return;
  pttIsDown = true;
  // En mode bascule, chaque nouvel appui physique inverse l'état d'émission.
  sendPtt(pttConfig.mode === 'toggle' ? 'toggle' : 'down');
}
function onKeyUp(event) {
  // Le relâchement physique ne coupe pas l'émission en mode bascule.
  if (!pttConfig.key || CODE_MAP[pttConfig.key.code] === undefined) return;
  if (event.keycode !== CODE_MAP[pttConfig.key.code] || !pttIsDown) return;
  pttIsDown = false;
  if (pttConfig.mode !== 'toggle') sendPtt('up');
}
function startKeyboardHook() {
  try {
    const { uIOhook } = require('uiohook-napi');
    hook = uIOhook;
    hook.on('keydown', onKeyDown);
    hook.on('keyup', onKeyUp);
    hook.start();
    hookStarted = true;
    console.log('[MISHAP] Global keyboard hook started');
  } catch (error) {
    console.error('[MISHAP] Global PTT unavailable:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mishap-global-ptt-error',
        'Le raccourci clavier global n’a pas pu démarrer : ' + error.message);
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 860,
    minHeight: 640,
    backgroundColor: '#0a0c0f',
    title: 'MISHAP RP RADIO',
    icon: path.join(__dirname, 'assets', 'MishapRP.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('blur', () => {
    if (pttConfig.mode !== 'toggle' && pttIsDown) {
      pttIsDown = false;
      sendPtt('up');
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    const audioOnly = !details || !details.mediaTypes || details.mediaTypes.includes('audio');
    callback(permission === 'media' && audioOnly);
  });
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => permission === 'media');
  startKeyboardHook();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.on('mishap-ptt-config', (_event, config) => {
  if (!config || typeof config !== 'object') return;
  const key = config.key && typeof config.key === 'object' ? config.key : null;
  pttConfig = {
    key: key && typeof key.code === 'string' ? {
      code: key.code, ctrl: !!key.ctrl, shift: !!key.shift, alt: !!key.alt, meta: !!key.meta
    } : null,
    mode: config.mode === 'toggle' ? 'toggle' : 'hold'
  };
  if (!pttConfig.key && pttIsDown) {
    pttIsDown = false;
    sendPtt('up');
  }
});
ipcMain.on('mishap-ptt-capturing', (_event, value) => {
  pttCapturing = !!value;
  if (pttCapturing && pttIsDown) {
    pttIsDown = false;
    sendPtt('up');
  }
});

app.on('before-quit', () => {
  try { if (hookStarted && hook) hook.stop(); }
  catch (error) { console.warn('[MISHAP] Could not stop keyboard hook:', error); }
});
app.on('window-all-closed', () => app.quit());
