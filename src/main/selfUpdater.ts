import { dialog } from "electron";
import { SELF_UPDATE_SERVER } from "./configs";
import { autoUpdater } from 'electron-updater'


export function initSelfUpdater(): void {
  const feedURL = SELF_UPDATE_SERVER
  autoUpdater.setFeedURL(feedURL);
  autoUpdater.autoDownload = true
  autoUpdater.checkForUpdates()

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
    console.error('update error:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const log_message = 'download-progress: ' + progressObj.percent + '%';
    console.log(log_message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('update-downloaded:', info);
    dialog.showMessageBox({
      type: "info",
      title: "update completed",
      message: "The new version has been downloaded, the application will automatically restart and install the update.",
    }).then(() => {
      autoUpdater.quitAndInstall();
    });
  });
}