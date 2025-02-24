import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GetGameDownloadDir } from '../utils';


interface FileData {
    Size: number;
    Md5: string;
}

interface Manifest {
    Total: number;
    Files: Record<string, FileData>;
}

const fileList: Record<string, FileData> = {};

const calculateMD5 = (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (chunk) => {
            hash.update(chunk);
        });

        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
};

const scanDirectory = async (dirPath: string, gamePath: string): Promise<void> => {
    try {
        const files = await fs.promises.readdir(dirPath, { withFileTypes: true });

        for (const dirent of files) {
            const fullPath = path.join(dirPath, dirent.name);

            if (dirent.isDirectory()) {
                await scanDirectory(fullPath, gamePath);
            } else if (dirent.isFile()) {
                const relativePath = fullPath.replace(gamePath+'\\', '').replace(/\\/g, '/');
                const md5 = await calculateMD5(fullPath);
                const stats = fs.statSync(fullPath);
                fileList[relativePath] = { 
                    Size: stats.size,
                    Md5: md5,
                };
            }
        }
    } catch (err) {
        console.error('Error reading directory:', err);
    }
};

export const generateManifest = async (folderPath: string): Promise<void> => {
    try {
        await scanDirectory(folderPath, folderPath);


        const manifest:Manifest = {
            Total: 0,
            Files: fileList,
        }

  
        const manifestPath = path.join(GetGameDownloadDir(), 'manifest.json');
        await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 4));

        console.log('Manifest gen');
    } catch (err) {
        console.error('Error generating manifest:', err);
    }
};

