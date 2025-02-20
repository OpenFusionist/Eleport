import { ipcMain } from "electron"
import { play } from "./play"
import { checkForGameUpdate } from "./gameUpdater"
import { generateManifest } from "./manifest"
import { GetGameDownloadDir } from "./../utils"

export function initHandlers(): void {
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('play', play)
  ipcMain.handle('check-update', checkForGameUpdate) // download game2
  ipcMain.handle('repair', async () => {
    return await generateManifest(GetGameDownloadDir())
  })
}