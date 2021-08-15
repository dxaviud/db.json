import process from "process";
import path from "path";
import FileSystemManager from "./FileSystemManager.js";
import { Converter } from "./Utilities.js";

export default class DbJson {
    #objectCache;
    #toDelete;
    #fsmanager;
    #converter;

    constructor(dataDir) {
        console.log("Hello from @dxaviud/dbjson");
        dataDir = path.join(process.cwd(), dataDir);
        this.#objectCache = new Map();
        this.#toDelete = new Set();
        this.#fsmanager = new FileSystemManager(dataDir);
        this.#converter = new Converter(dataDir);
        console.log("Data is stored under " + dataDir);
    }

    async has(identifier) {
        console.log("Checking if db has " + identifier);
        if (this.#objectCache.has(identifier)) {
            return true;
        }
        let path = this.#converter.pathOf(identifier);
        if (await this.#fsmanager.hasFile(path)) {
            return true;
        }
        return false;
    }

    async get(identifier) {
        if (this.#objectCache.has(identifier)) {
            return this.#objectCache.get(identifier);
        }
        const path = this.#converter.pathOf(identifier);
        const result = await this.#fsmanager.readFile(path);
        let object = null;
        if (result) {
            object = JSON.parse(result);
            this.set(identifier, object);
        }
        return object;
    }

    async set(identifier, object) {
        this.#objectCache.set(identifier, object);
        this.#toDelete.delete(identifier);
        return true;
    }

    async delete(identifier) {
        this.#objectCache.delete(identifier);
        const path = this.#converter.pathOf(identifier);
        const exists = await this.#fsmanager.hasFile(path);
        if (exists) {
            this.#toDelete.add(identifier);
        }
        return exists;
    }

    async persist(identifier) {
        const path = this.#converter.pathOf(identifier);
        if (this.#objectCache.has(identifier)) {
            await this.#fsmanager.writeFile(
                path,
                JSON.stringify(this.#objectCache.get(identifier))
            );
            return true;
        } else if (this.#toDelete.has(identifier)) {
            await this.#fsmanager.removeFile(path);
            this.#toDelete.delete(identifier);
            return true;
        }
        return false;
    }

    async persistAll() {
        try {
            for (const [identifier, object] of this.#objectCache) {
                const path = this.#converter.pathOf(identifier);
                await this.#fsmanager.writeFile(path, JSON.stringify(object));
            }
            for (const identifier of this.#toDelete) {
                const path = this.#converter.pathOf(identifier);
                await this.#fsmanager.removeFile(path);
            }
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }
}
