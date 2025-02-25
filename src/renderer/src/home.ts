import { IGameUpdateProgressCallback } from "../../preload/index.d";
import { bytesToGB, wait } from "./utils";
import PackageJSON from "./../../../package.json"

// export const HomeHTML = ():string => {

//   return `
//     <div class="home">
//       <div class="header">
//         <img id="close" class="close" src="./assets/images/close.png" />
//         <div class="logo">
//           <img src="./assets/images/logo.png" alt="logo" height="63"/>
//         </div>
//       </div>

//       <div class="nav">
//         <div class="nav_item">
//           <a href="">Website</a>
//         </div>
//         <span class="nav_divide"></span>
//         <div class="nav_item">
//           <a href="">Top-up</a>
//         </div>
//         <span class="nav_divide"></span>
//         <div class="nav_item">
//           <a href="">Support</a>
//         </div>
//         <span class="nav_divide"></span>
//         <div class="nav_item">
//           <a href="">JoinDiscord</a>
//         </div>
//       </div>

//       <div class="footer">
//         <div class="progress_wrapper">
//           <div class="progress_text">
//             <div>Downloading resources...</div>
//             <div class="progress_text_right">
//               <span id="download_progress"></span>
              
//               <span id="files_progress"></span>
//             </div>
//           </div>

//           <div class="progress_main_wrapper">
//             <div class="progress_main">
//               <img id="progress_main_per" class="progress_main_per" style="width: 100%;clip-path: inset(0 100% 0 0)" src="./assets/images/process_2.png" height="32"/>
//             </div>
//           </div>
//         </div>
//         <div class="play_wrapper">
//           <div id="play" class="play_btn_disabled">Play</div>
//         </div>
//       </div>
//     <div>
//   `
// }

export const initHome = ():void => {
  loopUpdated()
  const download_progress_elem = document.getElementById("download_progress")
  const files_progress_elem = document.getElementById("files_progress")
  const progress_main_per_elem = document.getElementById("progress_main_per")
  const close_btn = document.getElementById("close")
  const mini_btn = document.getElementById("window-mini")

  updateVersion()

  window.api.receiveMessage('game-update-progress', (progressData: IGameUpdateProgressCallback) => {
    if (progressData.type === 'download') {
      // replaceText('.electron-version', `
      //   ${progressData.percent}% | Download progress:${progressData.completed} / ${progressData.total} file | TotalSize: ${bytesToGB(progressData.totalSize)} GB | CompletedSize: ${bytesToGB(progressData.completedSize)} GB
      //   `)
      if (download_progress_elem)
        download_progress_elem.innerText = `${bytesToGB(progressData.completedSize)}/${bytesToGB(progressData.totalSize)} GB`;
      
      if (files_progress_elem)
        files_progress_elem.innerHTML = `${progressData.completed}/${progressData.total} Files`

      if (progress_main_per_elem)
        progress_main_per_elem.style.clipPath = `inset(0 ${100 - progressData.percent}% 0 0)`
    } else if (progressData.type === 'delete') {
        // updateStatus.innerText = `${progressData.file}`;
    }
  });
  
  document.getElementById("play")?.addEventListener("click", async () => {
    const play_btn = document.getElementById("play")
    if (!play_btn || play_btn?.classList.contains("play_btn_disabled")) return
    if((await window.api.mainVars()).IsUpdated) {
      disablePlayBtn()
      window.api.sendMessage('play')
    }
  })

  close_btn?.addEventListener("click", () => {
    window.api.sendMessage('close')
  })

  mini_btn?.addEventListener("click", () => {
    window.api.sendMessage('window-mini')
  })

  document.getElementById("repair")?.addEventListener("click", async () => {
    window.api.repair()
  })

}

async function loopUpdated():Promise<void> {
  const play_btn = document.getElementById("play")
  const progress_main_per_elem = document.getElementById("progress_main_per")
  const download_progress_elem = document.getElementById("download_progress")
  const progress_text_left = document.getElementById("progress_text_left")

  while (play_btn) {
    if ((await window.api.mainVars()).IsUpdated) {
      play_btn?.classList.remove("play_btn_disabled")
      play_btn?.classList.add("play_btn")
      if(progress_main_per_elem)
        progress_main_per_elem.style.clipPath = `inset(0 0 0 0)`
      if (download_progress_elem)
        download_progress_elem.innerText = `Up-to-date`;
      if (progress_text_left)  
        progress_text_left.innerText = `Downloaded`;

      updateVersion()
      window.api.sendMessage('window-focus')
      break ;
    }
    await wait(1000)
  }
}

export function updateVersion() {
  const version_div = document.getElementById("version")
  if(!version_div)  return
  
  window.api.version().then((vv) => {
    version_div.innerHTML = "Launcher: v"+PackageJSON.version
    if(vv)
      version_div.innerHTML = "Game: " + vv + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + version_div.innerHTML
  })
}

export function disablePlayBtn() {
  const play_btn = document.getElementById("play")
  play_btn?.classList.remove("play_btn")
  play_btn?.classList.add("play_btn_disabled")
}
export function enablePlayBtn() {
  const play_btn = document.getElementById("play")
  play_btn?.classList.remove("play_btn_disabled")
  play_btn?.classList.add("play_btn")
}