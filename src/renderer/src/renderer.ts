import { IGameUpdateProgressCallback } from "../../preload/index.d";

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div class="actions">
      <div class="action">
        <a id="ipcHandler" target="_blank" rel="noreferrer" style="display: none;">Play</a>
        <br/>
        <a id="repairHandler" target="_blank" rel="noreferrer">repai</a>
      </div>
    </div>

    <ul class="versions">
      <li class="electron-version"></li>
    </ul>
  </div>
`


function initListeners(): void {
  window.addEventListener('DOMContentLoaded', () => {
    doAThing()
  })

  window.api.receiveMessage('game-update-progress', (progressData: IGameUpdateProgressCallback) => {
    if (progressData.type === 'download') {
      replaceText('.electron-version', `
        ${progressData.percent}% | Download progress:${progressData.completed} / ${progressData.total} file | TotalSize: ${progressData.totalSize} bytes | CompletedSize: ${progressData.completedSize}
        `)
    } else if (progressData.type === 'delete') {
        // updateStatus.innerText = `${progressData.file}`;
    }
  });
}
initListeners()


async function doAThing(): Promise<void> {
  // const response = await window.electron.ipcRenderer.invoke('show-gamedir')
  replaceText('.electron-version', `check update`)

  const ipcHandlerBtn = document.getElementById('ipcHandler')
  ipcHandlerBtn?.addEventListener('click', () => {
    window.api.sendMessage('play')
  })
  const repairBtn = document.getElementById("repairHandler")
  repairBtn?.addEventListener('click', async () => {
    await window.api.repair()
    const { error } = await window.api.checkUpdate()
    if (error === ""){
      replaceText('.electron-version', `up-to-date`)
    }else{
      replaceText('.electron-version', `error: ${error}`)
    }
  })

  if(ipcHandlerBtn !== null) 
  {
    ipcHandlerBtn.style.display = "block"
  }



  const { error } = await window.api.checkUpdate()
  if (error === ""){
    replaceText('.electron-version', `up-to-date`)
  }else{
    replaceText('.electron-version', `error: ${error}`)
  }
}



function replaceText(selector: string, text: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) {
    element.innerText = text
  }
}
