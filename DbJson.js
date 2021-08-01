import process from "process";
import path from "path";
import FileSystemManager from "./FileSystemManager.js";

export default class DbJson {
    constructor(dataDir) {
        const cwd = process.cwd();
        console.log(
            "Hello from @dxaviud/dbjson, your database has been initialized"
        );
        console.log("Data is stored under " + path.join(cwd, dataDir));
        this.objectCache = new Map();
        this.fsmanager = new FileSystemManager(cwd, dataDir + "/");
    }

    has(identifier) {
        if (this.objectCache.has(identifier)) {
            return true;
        }
        if (this.fsmanager.has(identifier)) {
            return true;
        }
        return false;
    }

    get(identifier) {
        if (this.objectCache.has(identifier)) {
            return this.objectCache.get(identifier);
        }
        if (this.fsmanager.has(identifier)) {
            return this.fsmanager.get(identifier);
        }
        return null;
    }

    set(identifier, object) {
        this.objectCache.set(identifier, object);
    }

    persist() {
        for (const [identifier, object] of this.objectCache) {
            this.fsmanager.write(identifier, object);
        }
    }
}
