// src/gameUpdater.ts
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { GetGameDownloadDir, wait } from './../utils';
import { UPDATE_SERVER_URL } from './../configs';
import { mainWindow } from '../.';
import { IUpdateResult } from '../../preload/index.d';
import { globalVars } from './../vars';

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

function getLOCAL_MANIFEST_FILE(): string {
    return path.join(GetGameDownloadDir(), 'manifest.json');
}

function readLocalManifest(): Manifest { 
    const emptyManifest: Manifest = { Total: 0, Files: {} }
    const LOCAL_MANIFEST_FILE = getLOCAL_MANIFEST_FILE()
    
    if (fs.existsSync(LOCAL_MANIFEST_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(LOCAL_MANIFEST_FILE, 'utf8')) as Manifest;
        } catch (e) {
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


async function downloadFile(remoteFile: string): Promise<string> {
    const GAME_DIR = GetGameDownloadDir()
    const fileUrl = `${UPDATE_SERVER_URL}/${remoteFile}`;
    const localPath = path.join(GAME_DIR, remoteFile);
    ensureDirExist(localPath);

    const writer = fs.createWriteStream(localPath);

    try{
        const response = await axios.get(fileUrl, { responseType: 'stream' });
        const isSuccess = await Promise.race([
            wait(30 * 1000),
            new Promise<number>((resolve, reject) => {
                response.data.pipe(writer);
                let error: Error | null = null;
                writer.on('error', (err: Error) => {
                    error = err;
                    writer.close();
                    reject(err);
                });
                writer.on('close', () => {
                    if (!error) {
                        resolve(1);
                    }
                });
            })
        ]);

        if(isSuccess !== 1){
            return await downloadFile(remoteFile)
        }
    }catch(e:unknown){
        if(e instanceof Error){
            mainWindow?.webContents.send("error", {
                code: 500,
                message: e.message
            })
        }
        await wait(1000)
        return await downloadFile(remoteFile)
    }
   
    return localPath;
}

async function downloadFilesConcurrently(
    files: Fileinfo[],
    concurrency: number,
    progressCallback: (completed: number, completedSize: number, total: number) => void
): Promise<void> {
    let completed = 0;
    let completedSize = 0;
    const total = files.length;
    const queue = [...files]; // 复制文件列表作为队列
    const workers: Promise<void>[] = [];
    
    async function worker(): Promise<void> {
        while (queue.length > 0) {
            const file = queue.shift(); // 从队列获取文件
            if (!file) break;
            
            await downloadFile(file.Path || "");
            
            CacheLocalManifestFiles[file.Path || ""] = {
                Md5: file.Md5,
                Size: file.Size
            };
            completed++;
            completedSize += file.Size;
            
            if (progressCallback) {
                progressCallback(completed, completedSize, total);
            }
        }
    }
    
    for (let i = 0; i < concurrency; i++) {
        workers.push(worker());
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
            mainWindow?.webContents.send('game-update-progress', { type: 'delete', file: filePath });
        }

        if (filesToDownload.length === 0) {
            globalVars.IsUpdated = true;
            return { error: "" };
        }

        await downloadFilesConcurrently(filesToDownload, 10, (completed, completedSize, total) => {
            const percent = Math.round((completed / total) * 100);
            mainWindow?.webContents.send('game-update-progress', { type: 'download', completed, completedSize, total, percent, totalSize: downloadSize});
        });

        writeLocalManifest(remoteManifest);

        globalVars.IsUpdated = true;
        return { error: "" };
    } catch (error: unknown) {
        console.error('update fail:', error);
        let err_msg = "500"
        if (error instanceof Error) {
            err_msg =  error.message
        }
        return { error: err_msg };
    }
}

export { checkForGameUpdate };
