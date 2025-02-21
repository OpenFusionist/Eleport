import path from "path";
import { app } from "electron";
import { GAME_DOWNLOAD_DIR_NAME } from "./configs";


export function GetGameDownloadDir(): string {
  return path.join(app.getPath('userData'), "./"+ GAME_DOWNLOAD_DIR_NAME)
}

export function wait(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}