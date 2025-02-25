import { contextBridge, ipcRenderer } from 'electron'
import { IUpdateResult, TApi } from "./index.d"

export const validChannels = ["game-update-progress", "repair", "play", "close", "show-loading", "hide-loading", "window-mini", "window-focus", "game-runing"];

// Custom APIs for renderer
const api:TApi = {
  sendMessage: (channel, data):void => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`Blocked unauthorized channel: ${channel}`);
    }
  },

  receiveMessage: (channel, callback):void => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    } else {
      console.warn(`Blocked unauthorized channel: ${channel}`);
    }
  },

  repair: ():Promise<void> => ipcRenderer.invoke('repair'),
  
  checkUpdate: ():Promise<IUpdateResult> => ipcRenderer.invoke('check-update'),

  mainVars: () => ipcRenderer.invoke('mainVars'),

  version: ():Promise<string> => ipcRenderer.invoke('version')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    // contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  // window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
