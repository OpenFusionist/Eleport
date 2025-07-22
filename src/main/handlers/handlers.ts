import { app, dialog, ipcMain } from "electron"
import { play } from "./play"
import { checkForGameUpdate } from "./gameUpdater"
import { generateManifest } from "./manifest"
import { GetGameDownloadDir } from "./../utils"
import { globalVars } from "../vars"
import { mainWindow } from ".."
import { getLOCAL_Version } from "../version"
import { windowFocus } from "./focus"

export function initHandlers(): void {
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('play', play)
  ipcMain.on('close', app.quit)
  ipcMain.on('window-mini',() => {
    if(mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  })
  ipcMain.on('window-focus', windowFocus)

  ipcMain.handle('check-update', checkForGameUpdate) // download game2
  ipcMain.handle('repair', async () => {
    const response = await dialog.showMessageBox({
      type: "question",
      title: "Repairing",
      buttons: ["yes", "no"],
      message: "Are you sure you want to fix the application?",
    });
    if (response.response === 0) {
      mainWindow?.webContents.send("show-loading")
      await generateManifest(GetGameDownloadDir())
      mainWindow?.webContents.send("hide-loading")
      app.relaunch();
      app.quit();
    }
  })
  ipcMain.handle('mainVars', () => {
    return globalVars
  })
  ipcMain.handle('version', () => {
    return getLOCAL_Version()
  })
}