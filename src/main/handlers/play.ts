
import { exec } from 'child_process';
import { GetGameDownloadDir, getProcessList } from './../utils';
import path from 'path';
import { mainWindow } from '..';

import * as Sentry from "@sentry/electron/main";
import { GAME_PROCESS_NAME } from '../configs';
import { dialog } from 'electron';


export async function play() {

  const ProcessList = await getProcessList()

  if (ProcessList.toLowerCase().indexOf(GAME_PROCESS_NAME.toLowerCase()) > -1) {
    dialog.showMessageBox({
      type: "warning",
      title: "Game Already Running",
      message: "The game is already running. Please do not open it multiple times.",
    });
    return
  }

  const exePath = path.join(GetGameDownloadDir(), 'fusionist.exe'); //GetGameDownloadDir() + "fusionist.exe"// path.join(__dirname, 'your-executable.exe'); 
  if(mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
  exec(`"${exePath}"`, (error, stdout, stderr) => {
    if (error) {
      Sentry.captureException(error);
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });
}
