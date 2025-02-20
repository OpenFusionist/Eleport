import path from "path";
import { app } from "electron";
import { GAME_DOWNLOAD_DIR_NAME } from "./configs";


export function GetResourceDir(): string {
  let resourcePath
  
  if (app.isPackaged) {
    resourcePath = path.join(app.getAppPath(), "../");
  } else {
    resourcePath = path.join(__dirname, '../resources');
  }

  return resourcePath
}

export function GetGameDownloadDir(): string {
  return path.join(GetResourceDir(), GAME_DOWNLOAD_DIR_NAME)
}

export function bytesToGB(bytes): string {
  return (bytes / (1024 ** 3)).toFixed(2);
}