import { mainWindow } from "..";

export function windowFocus() {
  if(!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
}