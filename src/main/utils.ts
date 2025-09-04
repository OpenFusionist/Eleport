import path from "path";
import { app } from "electron";
import { GAME_DOWNLOAD_DIR_NAME } from "./configs";
import { exec } from "child_process";
import fs from "fs";


export function GetResourceDir(): string {
  let resourcePath
  
  if (app.isPackaged) {
    if(isInstalledOnSystemDrive()){
      resourcePath = app.getPath('userData');
    }else{
      resourcePath = path.join(app.getAppPath(), "../");
    }
  } else {
    resourcePath = path.join(__dirname, '../../../');
  }

  return resourcePath
}

export function GetGameDownloadDir(): string {
  return path.join(GetResourceDir(), GAME_DOWNLOAD_DIR_NAME)
}

export function wait(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getProcessList():Promise<string> {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'tasklist' : 'ps aux';
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`exec error: ${error}`);
        return;
      }
      if (stderr) {
        reject(`stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

export function isInstalledOnSystemDrive() {
  const exePath = app.getPath('exe');
  const systemDrive = process.env.SystemDrive || "C:";
  
  return exePath.toLowerCase().startsWith(systemDrive.toLowerCase());
}

export interface DiskSpaceCheckResult {
  hasEnoughSpace: boolean;
  availableBytes: number;
  requiredBytes: number;
  errorMessage: string;
}

export async function checkDiskSpace(targetPath: string, requiredBytes: number): Promise<DiskSpaceCheckResult> {
  try {
    // Ensure target directory exists, create if it doesn't exist
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    // Get available disk space
    let availableBytes: number;
    
    if (process.platform === 'win32') {
      const drive = path.parse(targetPath).root;
      availableBytes = await getDiskFreeSpaceWindows(drive);
    } else {
      availableBytes = await getDiskFreeSpaceUnix(targetPath);
    }

    // Add 1GB safety buffer
    const SAFETY_BUFFER = 1024 * 1024 * 1024; // 1GB
    const totalRequiredBytes = requiredBytes + SAFETY_BUFFER;

    const hasEnoughSpace = availableBytes >= totalRequiredBytes;

    let errorMessage = "";
    if (!hasEnoughSpace) {
      const availableGB = (availableBytes / (1024 * 1024 * 1024)).toFixed(2);
      const requiredGB = (requiredBytes / (1024 * 1024 * 1024)).toFixed(2);
      const totalRequiredGB = (totalRequiredBytes / (1024 * 1024 * 1024)).toFixed(2);
      const needToFreeGB = Math.max(0, (totalRequiredBytes - availableBytes) / (1024 * 1024 * 1024)).toFixed(2);
      
      errorMessage = `Insufficient disk space!\n` +
                    `Current available space: ${availableGB} GB\n` +
                    `Game update requires: ${requiredGB} GB\n` +
                    `Recommended reserved space: ${totalRequiredGB} GB (including 1GB safety buffer)\n` +
                    `Please free at least ${needToFreeGB} GB of disk space and try again.`;
    }

    return {
      hasEnoughSpace,
      availableBytes,
      requiredBytes: totalRequiredBytes,
      errorMessage
    };
  } catch (error) {
    console.error('Error occurred while checking disk space:', error);
    return {
      hasEnoughSpace: false,
      availableBytes: 0,
      requiredBytes,
      errorMessage: `Unable to check disk space: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function getDiskFreeSpaceWindows(drive: string): Promise<number> {
  return new Promise((resolve) => {
    // Use PowerShell command, it returns standardized numeric output, language-independent
    const powershellCmd = `powershell -command "(Get-WmiObject -Class Win32_LogicalDisk -Filter \\"DeviceID='${drive.replace('\\', '')}'\\").FreeSpace"`;
    
    exec(powershellCmd, (error, stdout) => {
      if (error) {
        // PowerShell failed, fallback to fsutil with smarter parsing
        console.warn(`PowerShell failed to get disk space, trying fsutil: ${error.message}`);
        fallbackFsutil(drive, resolve);
        return;
      }
      
      try {
        const freeBytes = parseInt(stdout.trim(), 10);
        if (isNaN(freeBytes) || freeBytes < 0) {
          console.warn('PowerShell returned invalid data, using fsutil fallback');
          fallbackFsutil(drive, resolve);
          return;
        }
        
        console.log(`Detected available disk space: ${(freeBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
        resolve(freeBytes);
      } catch (parseError) {
        console.warn(`Failed to parse PowerShell output, using fsutil fallback: ${parseError}`);
        fallbackFsutil(drive, resolve);
      }
    });
  });
}

function fallbackFsutil(drive: string, resolve: (value: number) => void): void {
  exec(`fsutil volume diskfree "${drive}"`, (error, stdout) => {
    if (error) {
      console.warn(`fsutil also failed, using conservative estimate: ${error.message}`);
      resolve(Number.MAX_SAFE_INTEGER);
      return;
    }
    
    try {
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      // Parse fsutil output format:
      // English: Total # of free bytes        : 123456789
      let availableBytes = 0;
      
      // First try to parse English format
      for (const line of lines) {
        if (line.includes('free bytes') && line.includes(':')) {
          const match = line.match(/:[\s]*(\d+)/);
          if (match) {
            const bytes = parseInt(match[1], 10);
            if (line.includes('avail free') || availableBytes === 0) {
              availableBytes = bytes;
            }
          }
        }
      }
      
      // If no English format found, use fallback for non-English systems
      // Take the first number from the first line (usually available space)
      if (availableBytes === 0 && lines.length > 0) {
        const firstLine = lines[0];
        const match = firstLine.match(/:[\s]*([0-9,]+)/);
        if (match) {
          // Remove commas and parse the number
          const numberStr = match[1].replace(/,/g, '');
          availableBytes = parseInt(numberStr, 10);
        }
      }
      
      if (availableBytes > 0) {
        console.log(`Detected available disk space via fsutil: ${(availableBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
        resolve(availableBytes);
      } else {
        console.warn('Unable to parse disk space from fsutil output, using conservative estimate');
        resolve(Number.MAX_SAFE_INTEGER);
      }
    } catch (parseError) {
      console.warn(`Failed to parse fsutil output: ${parseError}`);
      resolve(Number.MAX_SAFE_INTEGER);
    }
  });
}

function getDiskFreeSpaceUnix(targetPath: string): Promise<number> {
  return new Promise((resolve) => {
    exec(`df -k "${targetPath}"`, (error, stdout) => {
      if (error) {
        console.warn(`Unable to get disk space information: ${error.message}`);
        resolve(Number.MAX_SAFE_INTEGER);
        return;
      }
      
      try {
        const lines = stdout.trim().split('\n');
        if (lines.length >= 2) {
          const stats = lines[1].split(/\s+/);
          if (stats.length >= 4) {
            const availableKB = parseInt(stats[3], 10);
            const availableBytes = availableKB * 1024;
            console.log(`Detected available disk space: ${(availableBytes / 1024 / 1024 / 1024).toFixed(2)} GB`);
            resolve(availableBytes);
            return;
          }
        }
        resolve(Number.MAX_SAFE_INTEGER);
      } catch (parseError) {
        console.warn(`Failed to parse disk space information: ${parseError}`);
        resolve(Number.MAX_SAFE_INTEGER);
      }
    });
  });
}