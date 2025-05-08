import { mainWindow } from "..";

export function windowFocus() {
  try{
    if(!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
  } catch(e){
    console.error('windowFocus error:', e);
    // Sentry.captureException(e);
  }
}