import { dialog } from "electron";
import { SELF_UPDATE_SERVER } from "./configs";
import { autoUpdater } from 'electron-updater'
import * as Sentry from "@sentry/electron/main";
import { mainWindow } from ".";

export function initSelfUpdater(): void {
  const feedURL = SELF_UPDATE_SERVER
  autoUpdater.setFeedURL(feedURL);
  autoUpdater.autoDownload = true
  // autoUpdater.forceDevUpdateConfig = true
  autoUpdater.checkForUpdates()

  // let alwaysOnTopWindow = new BrowserWindow({
  //   width: 400,
  //   height: 300,
  //   show: false,
  //   alwaysOnTop: true,
  //   skipTaskbar: true,
  //   frame: false,
  //   transparent: true,
  // });

  // Listener
  autoUpdater.on('checking-for-update', () => {
    console.log('checking-for-update...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('update-available:', info);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('update-not-available');
  });

  autoUpdater.on('error', (err) => {
    Sentry.captureException(err);
    console.error('update error:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const log_message = 'download-progress: ' + progressObj.percent + '%';
    console.log(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('update-downloaded:', info);
    if(mainWindow) {
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "[Fusionist Launcher] Update Ready to Install!",
        message: "The latest version of the launcher has been downloaded successfully. The app will now restart to apply the update.",
      }).then(() => {
        autoUpdater.quitAndInstall(true, true);
      });
    }
  });
}