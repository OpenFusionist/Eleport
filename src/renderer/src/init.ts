import { IError } from "../../preload/index.d";

export function init():void {
  window.api.receiveMessage('error', (error:IError) => {
    alert("error: "+ error.message + "["+error.code+"]")
  })
}