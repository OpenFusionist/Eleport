// src/gameUpdater.ts
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { GetGameDownloadDir, wait } from './../utils';
import { TIMEOUT_MS, UPDATE_SERVER_URL } from './../configs';
import { mainWindow } from '../.';
import { IUpdateResult } from '../../preload/index.d';
import { globalVars } from './../vars';
import * as Sentry from "@sentry/electron/main";
// interface RemoteFile {
//     path: string;
//     checksum: string;
//     size: number;
// }

export interface Fileinfo {
    Md5: string
    Size: number
    Path?: string
}

interface Manifest {
    Total: number
    Files: {[key: string]: Fileinfo}
}

export let CacheLocalManifestFiles: {[key: string]: Fileinfo} = {}

export function getLOCAL_MANIFEST_FILE(): string {
    return path.join(GetGameDownloadDir(), 'manifest.json');
}

function readLocalManifest(): Manifest { 
    const emptyManifest: Manifest = { Total: 0, Files: {} }
    const LOCAL_MANIFEST_FILE = getLOCAL_MANIFEST_FILE()
    
    if (fs.existsSync(LOCAL_MANIFEST_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(LOCAL_MANIFEST_FILE, 'utf8')) as Manifest;
        } catch (e) {
            Sentry.captureException(e);
            console.error('read manifest error:', e);
            return emptyManifest
        }
    }
    return emptyManifest
}


export function writeLocalManifest(manifest: Manifest): void {
    const LOCAL_MANIFEST_FILE = getLOCAL_MANIFEST_FILE()
    
    fs.writeFileSync(LOCAL_MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}


function ensureDirExist(filePath: string): void {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

async function downloadFile(remoteFile: string, Filesize: number, onProgress: (fileSize: number) => void): Promise<string> {
    const GAME_DIR = GetGameDownloadDir()
    const fileUrl = `${UPDATE_SERVER_URL}/${remoteFile}`;
    const localPath = path.join(GAME_DIR, remoteFile);
    ensureDirExist(localPath);

    const writer = fs.createWriteStream(localPath);
    try{
        const response = await axios.get(fileUrl, { responseType: 'stream', timeout: TIMEOUT_MS });

        await new Promise((resolve, reject) => {
            let cacheTotalBytesWritten = -1;
            let totalBytesWritten = 0;

            const timer = setInterval(() => {
                if(cacheTotalBytesWritten === totalBytesWritten) {
                    clearInterval(timer)
                    reject("error")
                }
                cacheTotalBytesWritten = totalBytesWritten
            }, TIMEOUT_MS)

            response.data.on('data', (chunk) => {  
                totalBytesWritten += chunk.length;        
                if(onProgress) onProgress(totalBytesWritten);
                // console.log(`${remoteFile}: Writing chunk of ${chunk.length} bytes... Total written: ${totalBytesWritten} bytes`);
                writer.write(chunk);
            });
            
            response.data.on('end', () => {
                // console.log('File writing completed!');
                writer.end();
                clearInterval(timer)
                resolve(1);
            });
    
            writer.on('error', (err: Error) => {
                writer.end();
                clearInterval(timer)
                reject(err)
            });
        })

    } catch (e:unknown) {
        writer.end();
        if(onProgress) onProgress(0)
        Sentry.captureException(e);
        await wait(1000)
        return await downloadFile(remoteFile, Filesize, onProgress)
    }
   
    return localPath;
}

async function downloadFilesConcurrently(
    files: Fileinfo[],
    concurrency: number,
    progressCallback: (completed: number, completedSize: number) => void
): Promise<void> {
    let completed = 0;
    let completedSize = 0;
    let queue = [...files];

    queue.sort((a, b) => b.Size - a.Size);
    // if (queue.length > 800 * 10)
    //     queue = [...queue.slice(-800), ...queue.slice(0, -800)]

    const workers: Promise<void>[] = [];
    
    async function worker(isShift): Promise<void> {
        while (queue.length > 0) {
            let currentReceivedSize = 0;
            let lastReportedSize = 0;

            const file = isShift?queue.shift():queue.pop()
            if (!file) break;

            const onProgress = (fileSize: number) => {
                currentReceivedSize = fileSize;
                
                // Handle download failure reset (fileSize = 0)
                if (fileSize === 0 && lastReportedSize > 0) {
                    // Subtract the previously counted size when download fails
                    completedSize -= lastReportedSize;
                    lastReportedSize = 0;
                    currentReceivedSize = 0;
                    if (progressCallback) {
                        progressCallback(completed, completedSize);
                    }
                    return;
                }
                
                if(currentReceivedSize <= file.Size) {
                    // Only add the difference to avoid duplicate counting
                    const sizeDiff = currentReceivedSize - lastReportedSize;
                    completedSize += sizeDiff;
                    lastReportedSize = currentReceivedSize;
                    if (progressCallback) {
                        progressCallback(completed, completedSize);
                    }
                }
            };
            
            try {
                await downloadFile(file.Path || "", file.Size, onProgress);
                
                CacheLocalManifestFiles[file.Path || ""] = {
                    Md5: file.Md5,
                    Size: file.Size
                };
                completed++;
                
                if (progressCallback) {
                    progressCallback(completed, completedSize);
                }
            } catch (error) {
                // If download fails completely, ensure we don't count partial progress
                if (lastReportedSize > 0) {
                    completedSize -= lastReportedSize;
                }
                
                // Put the failed file back to the queue for retry
                queue.push(file);
                
                if (progressCallback) {
                    progressCallback(completed, completedSize);
                }
                Sentry.captureException(error);
                console.warn(`Download failed for ${file.Path}, added back to queue. Remaining: ${queue.length}`);
            }
        }
    }
    
    for (let i = 0; i < concurrency; i++) {
        let isShift = true;
        if (i <= 1) isShift = false

        workers.push(worker(isShift));
    }
    
    await Promise.all(workers);
}


function compareManifests(localManifest: Manifest | null, remoteManifest: Manifest): {
    filesToDownload: Fileinfo[];
    filesToDelete: string[];
    downloadSize: number;
} {
    const filesToDownload: Fileinfo[] = [];
    const filesToDelete: string[] = [];
    let downloadSize = 0;

    for (const filePath in remoteManifest.Files) {
        if(filePath.toLowerCase() === "manifest.json"){
            continue
        }
        const _fileinfo = remoteManifest.Files[filePath]
        _fileinfo.Path = filePath

        if(localManifest == null || !localManifest.Files[filePath]){
            filesToDownload.push(_fileinfo);
            downloadSize += _fileinfo.Size
            continue
        }
        
        const remoteMd5 = remoteManifest.Files[filePath].Md5
        const localMd5 = localManifest.Files[filePath].Md5
        if (!localMd5 || localMd5 !== remoteMd5) {
            filesToDownload.push(_fileinfo);
            downloadSize += _fileinfo.Size
        }
    }

    for (const filePath in localManifest?.Files) {
        if(filePath.toLowerCase() === "manifest.json"){
            continue
        }
        if (!remoteManifest.Files[filePath]) {
            filesToDelete.push(filePath);
        }
    }

    return { filesToDownload, filesToDelete, downloadSize };
}

function deleteFile(filePath: string): void {
    const localPath = path.join(GetGameDownloadDir(), filePath);
    if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
    }
}

async function checkForGameUpdate(): Promise<IUpdateResult> {
    try {
        const manifestUrl = `${UPDATE_SERVER_URL}/manifest.json`;
        const { data: remoteManifest } = await axios.get<Manifest>(manifestUrl);

        const localManifest = readLocalManifest();

        const { filesToDownload, filesToDelete, downloadSize } = compareManifests(localManifest, remoteManifest);
        CacheLocalManifestFiles = localManifest.Files
        for (const filePath of filesToDelete) {
            deleteFile(filePath);
            delete CacheLocalManifestFiles[filePath]
            if(mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('game-update-progress', { type: 'delete', file: filePath });
            }
        }

        if (filesToDownload.length === 0) {
            globalVars.IsUpdated = true;
            return { error: "" };
        }

        const total = filesToDownload.length;
        if(mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('game-update-progress', { type: 'download', completed:0, completedSize:0, total, percent:0, totalSize: downloadSize});
        }

        await downloadFilesConcurrently(filesToDownload, 10, (completed, completedSize) => {
            const percent = Math.round((completedSize / downloadSize) * 100);
            if(mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('game-update-progress', { type: 'download', completed, completedSize, total, percent, totalSize: downloadSize});
            }
        });

        writeLocalManifest(remoteManifest);

        globalVars.IsUpdated = true;
        return { error: "" };
    } catch (error: unknown) {
        Sentry.captureException(error);
        console.error('update fail:', error);
        let err_msg = "500"
        if (error instanceof Error) {
            err_msg =  error.message
        }
        return { error: err_msg };
    }
}

export { checkForGameUpdate };
