import { BrowserWindow } from "electron";
import { getProcessList } from "./utils";
import { GAME_PROCESS_NAME } from "./configs";

export function initSender(mainWindow:BrowserWindow) {
  // watcher
  mainWindow.on('focus', async () => {
    let isRuning = false
    const ProcessList = await getProcessList()
    if (ProcessList.toLowerCase().indexOf(GAME_PROCESS_NAME.toLowerCase()) > -1) {
      isRuning = true
    }
    if(mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("game-runing", isRuning)
    }
  });
}