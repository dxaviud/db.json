import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

export default class FileSystemManager {
    #rootPath;

    constructor(rootPath) {
        this.#rootPath = rootPath;
        try {
            fsSync.mkdirSync(rootPath, { recursive: false });
            // console.log("Created directory " + rootPath);
        } catch {
            // console.log("Directory " + rootPath + " already exists");
        }
        // console.log(
        //     "Initialized file system manager with root path " + rootPath
        // );
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

    async read(filePath) {
        console.log("Attempting to read " + filePath);
        if (await this.hasFile(filePath)) {
            const jsonString = await fs.readFile(filePath, "utf8");
            console.log("Returning parsed JSON from " + filePath);
            return JSON.parse(jsonString);
        }
        console.log(filePath + " does not exist");
        return null;
    }

    async write(filePath, object) {
        const dirPath = path.dirname(filePath);
        await this.#ensureDir(dirPath);
        await fs.writeFile(filePath, JSON.stringify(object));
        console.log("Wrote to " + filePath);
    }

    async remove(filePath) {
        await fs.rm(filePath);
        console.log("Removed " + filePath);
        let dirPath = path.dirname(filePath);
        while (dirPath !== this.#rootPath && this.#dirEmpty(dirPath)) {
            await fs.rmdir(dirPath);
            console.log("Removed empty directory " + dirPath);
            dirPath = path.dirname(dirPath);
        }
    }

    async #ensureDir(dirPath) {
        try {
            const handle = await fs.opendir(dirPath);
            await handle.close();
            return;
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    async #dirEmpty(dirPath) {
        const files = await fs.readdir(dirPath);
        return files.length === 0;
    }
}
