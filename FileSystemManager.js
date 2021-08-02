import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

export default class FileSystemManager {
    constructor(rootPath, dataDir) {
        this.rootPath = rootPath; // the absolute path to the project's root directory
        this.dataDir = dataDir; // the name of the directory that stores db data
        const dataDirFullPath = path.join(rootPath, dataDir);
        fsSync.mkdir(dataDirFullPath, { recursive: false }, (err) => {
            if (err) {
                console.log(dataDirFullPath + " directory already exists");
            } else {
                console.log("Created directory " + dataDirFullPath);
            }
        });
        console.log(
            "initialized file system manager with root path " +
                rootPath +
                " and data directory " +
                dataDir
        );
    }

    identifierToPath(identifier) {
        const split = identifier.split(".");
        split[split.length - 1] += ".json";
        const resultPath = path.join(this.rootPath, this.dataDir, ...split);
        console.log(
            "Converted identifier " + identifier + " to path " + resultPath
        );
        return resultPath;
    }

    async has(identifier) {
        const filePath = this.identifierToPath(identifier);
        return await this.hasPath(filePath);
    }

    async hasPath(filePath) {
        try {
            await fs.open(filePath);
            console.log(filePath + " exists");
            return true;
        } catch {
            console.log(filePath + " does not exist");
            return false;
        }
    }

    async write(identifier, object) {
        const filePath = this.identifierToPath(identifier);
        await fs.writeFile(filePath, JSON.stringify(object));
        console.log("Wrote " + identifier + " to " + filePath);
    }

    async read(identifier) {
        const filePath = this.identifierToPath(identifier);
        console.log("Reading from " + filePath);
        if (this.hasPath(filePath)) {
            const jsonString = await fs.readFile(filePath, "utf8");
            console.log("Returning parsed JSON");
            return JSON.parse(jsonString);
        }
        console.log(filePath + " does not exist, returning null");
        return null;
    }
}
