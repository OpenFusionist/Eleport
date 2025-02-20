// src/gameUpdater.ts
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { bytesToGB, GetGameDownloadDir } from './../utils';
import { UPDATE_SERVER_URL } from './../configs';
import { mainWindow } from '../.';
import { IUpdateResult } from '../../preload/index.d';

// interface RemoteFile {
//     path: string;
//     checksum: string;
//     size: number;
// }

interface Fileinfo {
    Md5: string
    Size: number
}

interface Manifest {
    Total: number
    Files: {[key: string]: Fileinfo}
}

function getLOCAL_MANIFEST_FILE(): string {
    return path.join(GetGameDownloadDir(), 'manifest.json');
}

function readLocalManifest(): Manifest | null { 
    const LOCAL_MANIFEST_FILE = getLOCAL_MANIFEST_FILE()
    
    if (fs.existsSync(LOCAL_MANIFEST_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(LOCAL_MANIFEST_FILE, 'utf8')) as Manifest;
        } catch (e) {
            console.error('read manifest error:', e);
            return null
        }
    }
    return null
}


function writeLocalManifest(manifest: Manifest): void {
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
    console.log("remoteFile.path",remoteFile,  remoteFile)
    const localPath = path.join(GAME_DIR, remoteFile);
    ensureDirExist(localPath);

    const writer = fs.createWriteStream(localPath);
    const response = await axios.get(fileUrl, { responseType: 'stream' });

    try{
        console.log(remoteFile)
        await new Promise<void>((resolve, reject) => {
            response.data.pipe(writer);
            let error: Error | null = null;
            writer.on('error', (err: Error) => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    resolve();
                }
            });
        });
    }catch(e:unknown){
        if(e instanceof Error){
            alert("err:"+e.message)
        }
        downloadFile(remoteFile)
    }

   
    return localPath;
}

async function downloadFilesConcurrently(
    files: string[],
    concurrency: number,
    progressCallback: (completed: number, total: number) => void
): Promise<void> {
    let completed = 0;
    const total = files.length;

    async function worker(fileList: string[]): Promise<void> {
        for (const file of fileList) {
            await downloadFile(file);
            completed++;
            if (progressCallback) {
                progressCallback(completed, total);
            }
        }
    }

    const chunkSize = Math.ceil(total / concurrency);
    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) {
        const chunk = files.slice(i * chunkSize, (i + 1) * chunkSize);
        if (chunk.length > 0) {
            workers.push(worker(chunk));
        }
    }
    
    await Promise.all(workers);
}

function compareManifests(localManifest: Manifest | null, remoteManifest: Manifest): {
    filesToDownload: string[];
    filesToDelete: string[];
} {
    const filesToDownload: string[] = [];
    const filesToDelete: string[] = [];

    for (const filePath in remoteManifest.Files) {
        if(localManifest == null ){
            filesToDownload.push(filePath);
            continue
        }
        
        const remoteMd5 = remoteManifest.Files[filePath].Md5
        const localMd5 = localManifest.Files[filePath].Md5
        if (!localMd5 || localMd5 !== remoteMd5) {
            filesToDownload.push(filePath);
        }
    }

    for (const filePath in localManifest?.Files) {
        if (!remoteManifest.Files[filePath]) {
            filesToDelete.push(filePath);
        }
    }

    return { filesToDownload, filesToDelete };
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
        const totlaSize = remoteManifest.Total
        const localManifest = readLocalManifest();

        const { filesToDownload, filesToDelete } = compareManifests(localManifest, remoteManifest);

        for (const filePath of filesToDelete) {
            deleteFile(filePath);
            mainWindow?.webContents.send('game-update-progress', { type: 'delete', file: filePath });
        }

        if (filesToDownload.length === 0) {
            return { error: "" };
        }

        await downloadFilesConcurrently(filesToDownload, 10, (completed, total) => {
            const percent = Math.round((completed / total) * 100);
            mainWindow?.webContents.send('game-update-progress', { type: 'download', completed, total, percent, totalSize: bytesToGB(totlaSize) });
        });

        writeLocalManifest(remoteManifest);

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
