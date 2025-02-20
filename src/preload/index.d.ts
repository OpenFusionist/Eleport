import {} from '@electron-toolkit/preload'

export interface TApi {
  sendMessage: (channel: string, data?: unknown) => void
  receiveMessage: <T>(channel:string, callback: (...args: T[]) => void) => void
  repair: () => Promise<void>
  checkUpdate: () => Promise<IUpdateResult>
}

declare global {
  interface Window {
    // electron: ElectronAPI
    api: TApi
  }
}


export interface IUpdateResult {
  error: string;
}


export interface IGameUpdateProgressCallback {
  percent: number
  completed: number
  total: number
  type: string
  totalSize: string
}
