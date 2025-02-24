import path from "path";
import { app } from "electron";
import { GAME_DOWNLOAD_DIR_NAME } from "./configs";
import { exec } from "child_process";


export function GetResourceDir(): string {
  let resourcePath
  
  if (app.isPackaged) {
    resourcePath = path.join(app.getAppPath(), "../");
  } else {
    resourcePath = path.join(__dirname, '../../../');
  }

  return resourcePath
}

export function GetGameDownloadDir(): string {
  return path.join(GetResourceDir(), GAME_DOWNLOAD_DIR_NAME)
}

export function wait(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getProcessList():Promise<string> {
  return new Promise((resolve, reject) => {
    // Windows 系统
    const command = process.platform === 'win32' ? 'tasklist' : 'ps aux';
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`exec error: ${error}`);
        return;
      }
      if (stderr) {
        reject(`stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}