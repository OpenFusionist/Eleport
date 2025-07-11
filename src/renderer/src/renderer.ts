// import { IGameUpdateProgressCallback } from "../../preload/index.d";
import {  initHome } from "./home";
// import { bytesToGB } from "./utils";
import * as Sentry from "@sentry/electron/renderer";
import "./../assets/main.css";
import { init } from "./init";

Sentry.init({
  sendDefaultPii: true,
  integrations: [
  ],
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1.0,
});

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = HomeHTML()
init()
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
