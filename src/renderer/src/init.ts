import { IError } from "../../preload/index.d";
import { disablePlayBtn, enablePlayBtn } from "./home";

export function init():void {
  window.addEventListener('DOMContentLoaded', () => {
    window.api.receiveMessage('error', (error:IError) => {
      alert("error: "+ error.message + "["+error.code+"]")
    })
    window.api.receiveMessage('show-loading', () => {
      const loadingElement = document.getElementById("loading");
      if (loadingElement) {
        loadingElement.style.display = "flex";
      }
    });

    window.api.receiveMessage('hide-loading', () => {
      const loadingElement = document.getElementById("loading");
      if (loadingElement) {
        loadingElement.style.display = "none";
      }
    });

    window.api.receiveMessage('game-runing', (isRuning: boolean) => {
      if(isRuning){
        disablePlayBtn()
      }else{
        enablePlayBtn()
      }
    })
  });

}