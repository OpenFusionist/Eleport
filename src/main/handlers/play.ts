
import { exec } from 'child_process';
import { GetGameDownloadDir } from './../utils';
import path from 'path';
import { mainWindow } from '..';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function play() {

  const exePath = path.join(GetGameDownloadDir(), 'fusionist.exe'); //GetGameDownloadDir() + "fusionist.exe"// path.join(__dirname, 'your-executable.exe'); 

  exec(`"${exePath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    mainWindow?.minimize();
  });
}
