// import { IGameUpdateProgressCallback } from "../../preload/index.d";
import { HomeHTML, initHome } from "./home";
// import { bytesToGB } from "./utils";
import { init as SentryInit } from "@sentry/electron/renderer";
import "./../assets/main.css";

SentryInit({
  dsn: import.meta.env.VITE_SENTRY_DSN,
});

document.querySelector<HTMLDivElement>('#app')!.innerHTML = HomeHTML()
initHome()

// function initListeners(): void {
//   window.addEventListener('DOMContentLoaded', () => {
//     doAThing()
//   })

//   window.api.receiveMessage('game-update-progress', (progressData: IGameUpdateProgressCallback) => {
//     if (progressData.type === 'download') {
//       replaceText('.electron-version', `
//         ${progressData.percent}% | Download progress:${progressData.completed} / ${progressData.total} file | TotalSize: ${bytesToGB(progressData.totalSize)} GB | CompletedSize: ${bytesToGB(progressData.completedSize)} GB
//         `)
//     } else if (progressData.type === 'delete') {
//         // updateStatus.innerText = `${progressData.file}`;
//     }
//   });
// }
// initListeners()

// async function doAThing(): Promise<void> {
  // const response = await window.electron.ipcRenderer.invoke('show-gamedir')
  // replaceText('.electron-version', `check update`)
 
  // const repairBtn = document.getElementById("repairHandler")
  // repairBtn?.addEventListener('click', async () => {
  //   await window.api.repair()
  //   const { error } = await window.api.checkUpdate()
  //   if (error === ""){
  //     replaceText('.electron-version', `up-to-date`)
  //   }else{
  //     replaceText('.electron-version', `error: ${error}`)
  //   }
  // })




  // const { error } = await window.api.checkUpdate()
  // if (error === ""){
  //   replaceText('.electron-version', `up-to-date`)
  // }else{
  //   replaceText('.electron-version', `error: ${error}`)
  // }
// }



// function replaceText(selector: string, text: string): void {
//   const element = document.querySelector<HTMLElement>(selector)
//   if (element) {
//     element.innerText = text
//   }
// }
