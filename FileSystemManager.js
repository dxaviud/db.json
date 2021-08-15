import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

export default class FileSystemManager {
    #rootPath;

    constructor(rootPath) {
        this.#rootPath = rootPath;
        try {
            const handle = fsSync.opendirSync(rootPath);
            handle.closeSync();
        } catch {
            fsSync.mkdirSync(rootPath, { recursive: false });
        }
    }

    async hasFile(filePath) {
        try {
            const fileHandle = await fs.open(filePath);
            await fileHandle.close();
            return true;
        } catch {
            return false;
        }
    }

    hasFileSync(filePath) {
        try {
            const fd = fsSync.openSync(filePath);
            fsSync.closeSync(fd);
            return true;
        } catch {
            return false;
        }
    }

    async readFile(filePath) {
        if (await this.hasFile(filePath)) {
            const result = await fs.readFile(filePath, "utf8");
            return result;
        }
        return null;
    }

    readFileSync(filePath) {
        if (this.hasFileSync(filePath)) {
            return fsSync.readFileSync(filePath, "utf8");
        }
        return null;
    }

    async writeFile(filePath, content) {
        const dirPath = path.dirname(filePath);
        await this.#ensureDir(dirPath);
        await fs.writeFile(filePath, content);
    }

    writeFileSync(filePath, content) {
        const dirPath = path.dirname(filePath);
        this.#ensureDirSync(dirPath);
        fsSync.writeFileSync(filePath, content);
    }

    async removeFile(filePath) {
        await fs.rm(filePath);
        let dirPath = path.dirname(filePath);
        while (dirPath !== this.#rootPath && this.#dirEmpty(dirPath)) {
            await fs.rmdir(dirPath);
            dirPath = path.dirname(dirPath);
        }
    }

    async #ensureDir(dirPath) {
        try {
            const handle = await fs.opendir(dirPath);
            await handle.close();
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
        return true;
    }

    #ensureDirSync(dirPath) {
        try {
            const handle = fsSync.opendirSync(dirPath);
            handle.closeSync();
        } catch {
            fsSync.mkdirSync(dirPath, { recursive: true });
        }
        return true;
    }

    async #dirEmpty(dirPath) {
        const files = await fs.readdir(dirPath);
        return files.length === 0;
    }
}
