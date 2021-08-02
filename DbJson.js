import process from "process";
import path from "path";
import FileSystemManager from "./FileSystemManager.js";

export default class DbJson {
    constructor(dataDir) {
        const cwd = process.cwd();
        this.objectCache = new Map();
        this.fsmanager = new FileSystemManager(cwd, dataDir);
        console.log(
            "Hello from @dxaviud/dbjson, your database has been initialized"
        );
        console.log("Data is stored under " + path.join(cwd, dataDir));
    }

    async has(identifier) {
        console.log("Checking if db has " + identifier);
        if (this.objectCache.has(identifier)) {
            console.log(identifier + " found in cache");
            return true;
        }
        if (await this.fsmanager.has(identifier)) {
            console.log(identifier + " found under " + this.dataDir);
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
        if (await this.fsmanager.has(identifier)) {
            console.log(identifier + " retrieved from under " + this.dataDir);
            return this.fsmanager.read(identifier);
        }
        console.log("Could not find " + identifier + ", returning null");
        return null;
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
