
import fs from 'fs/promises';
import { GetGameDownloadDir, getProcessList } from './../utils';
import path from 'path';
import { mainWindow } from '..';

import * as Sentry from "@sentry/electron/main";
import { GAME_PROCESS_NAME } from '../configs';
import { shell, dialog } from 'electron';


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
  
  try { await fs.access(exePath); }
  catch {
    await dialog.showMessageBox({ type: "error", message: `Game executable not found:\n${exePath}`});
    return;
  }
  
  if(mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
  
  // exec(`"${exePath}"`, (error, stdout, stderr) => {
  //   if (error) {
  //     Sentry.captureException(error);
  //     console.error(`exec error: ${error}`);
  //     return;
  //   }
  //   console.log(`stdout: ${stdout}`);
  //   console.error(`stderr: ${stderr}`);
  // });

  const err = await shell.openPath(exePath);
  if (err) {
    Sentry.captureMessage(`shell.openPath failed: ${err}`);
    await dialog.showMessageBox({ type: "error", message: `Failed to launch game:\n${err}` });
  }
}
