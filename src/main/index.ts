import { app, shell, BrowserWindow, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initSelfUpdater } from './selfUpdater'
import { AppUserModelId } from './configs'
import { initHandlers } from './handlers/handlers'
import { CacheLocalManifestFiles, checkForGameUpdate, writeLocalManifest } from './handlers/gameUpdater'
import { globalVars } from './vars'
import { windowFocus } from './handlers/focus'
import { initSender } from './sender'
import * as Sentry from "@sentry/electron/main";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
});

export let mainWindow:BrowserWindow | undefined

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}else{
  app.on('second-instance', () => {
    windowFocus()
  });
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    
    // Set app user model id for windows
    electronApp.setAppUserModelId(AppUserModelId)
    initSelfUpdater()
    initHandlers()
    createWindow()

  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', async (event) => {
    if (!globalVars.IsUpdated) {
      event.preventDefault()
      const Manifest = {
        Total: 0,
        Files: CacheLocalManifestFiles
      }
      await writeLocalManifest(Manifest)
      globalVars.IsUpdated = true
      console.log('before-quit save success!')
      app.quit()
    }
  })
}


function createWindow(): void {
  // Create the browser window.
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: Math.min(1920, width),
    height: Math.min(1080, height),
    frame: false,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    
    checkForGameUpdate();
  })
  initSender(mainWindow)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Open url with external browser
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }  
}