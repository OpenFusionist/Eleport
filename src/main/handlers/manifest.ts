import fs from 'fs';
import path from 'path';
import crypto from 'crypto';


interface FileData {
    name: string;
    path: string;
    size: number;
    md5: string;
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
                    name: dirent.name,
                    path: relativePath,
                    size: stats.size,
                    md5: md5,
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


        const manifest = fileList;

  
        const manifestPath = path.join(folderPath, 'manifest.json');
        await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 4));

        console.log('Manifest gen');
    } catch (err) {
        console.error('Error generating manifest:', err);
    }
};

