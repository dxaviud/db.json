import process from "process";
import path from "path";
import FileSystemManager from "./FileSystemManager.js";

export default class DbJson {
    constructor(dataDir) {
        console.log("Hello from @dxaviud/dbjson");
        this.objectCache = new Map();
        dataDir = path.join(process.cwd(), dataDir);
        this.fsmanager = new FileSystemManager(dataDir);
        console.log("Data is stored under " + dataDir);
    }

    async has(identifier) {
        console.log("Checking if db has " + identifier);
        if (this.objectCache.has(identifier)) {
            console.log(identifier + " found in cache");
            return true;
        }
        console.log(identifier + " not found in cache, checking file system");
        if (await this.fsmanager.has(identifier)) {
            console.log(identifier + " found in file system");
            return true;
        }
        console.log("Could not find " + identifier);
        return false;
    }

    async get(identifier) {
        console.log("Getting " + identifier);
        if (this.objectCache.has(identifier)) {
            console.log(identifier + " retrieved from cache");
            return this.objectCache.get(identifier);
        }
        console.log(identifier + " not found in cache, checking file system");
        const result = await this.fsmanager.read(identifier);
        if (result) {
            console.log(identifier + " retrieved from file system");
        } else {
            console.log("Could not find " + identifier + ", returning null");
        }
        return result;
    }

    set(identifier, object) {
        console.log("Setting " + identifier + " in cache");
        this.objectCache.set(identifier, object);
    }

    async persist() {
        console.log("Persisting all objects in cache to the file system");
        for (const [identifier, object] of this.objectCache) {
            await this.fsmanager.write(identifier, object);
            console.log("Persisted " + identifier);
        }
    }
}
