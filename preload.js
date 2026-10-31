'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mishapPTT', {
  setConfig: (config) => ipcRenderer.send('mishap-ptt-config', config),
  setCapturing: (capturing) => ipcRenderer.send('mishap-ptt-capturing', !!capturing)
});

ipcRenderer.on('mishap-global-ptt', (_event, state) => {
  window.dispatchEvent(new CustomEvent('mishap-radio-extension-ptt', { detail: state }));
});
ipcRenderer.on('mishap-global-ptt-error', (_event, message) => {
  console.error('[MISHAP PTT]', message);
});
