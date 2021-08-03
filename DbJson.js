import process from "process";
import path from "path";
import FileSystemManager from "./FileSystemManager.js";
import assert from "assert";

export default class DbJson {
    #objectCache;
    #toDelete;
    #fsmanager;

    constructor(dataDir) {
        console.log("Hello from @dxaviud/dbjson");
        this.#objectCache = new Map();
        this.#toDelete = new Set();
        dataDir = path.join(process.cwd(), dataDir);
        this.#fsmanager = new FileSystemManager(dataDir);
        console.log("Data is stored under " + dataDir);
    }

    async has(identifier) {
        console.log("Checking if db has " + identifier);
        if (this.#objectCache.has(identifier)) {
            console.log(identifier + " found in cache");
            return true;
        }
        // console.log(identifier + " not found in cache, checking file system");
        if (await this.#fsmanager.has(identifier)) {
            console.log(identifier + " found in file system");
            return true;
        }
        console.log("Could not find " + identifier);
        return false;
    }

    async get(identifier) {
        console.log("Getting " + identifier);
        if (this.#objectCache.has(identifier)) {
            console.log(identifier + " retrieved from cache");
            return this.#objectCache.get(identifier);
        }
        // console.log(identifier + " not found in cache, checking file system");
        const result = await this.#fsmanager.read(identifier);
        if (result) {
            console.log(identifier + " retrieved from file system");
            this.set(identifier, result);
        } else {
            console.log("Could not find " + identifier);
        }
        return result;
    }

    set(identifier, object) {
        this.#objectCache.set(identifier, object);
        console.log("Added " + identifier + " to cache");
        if (this.#toDelete.has(identifier)) {
            this.#toDelete.delete(identifier);
            console.log(
                "Unregistered " +
                    identifier +
                    " for deletion from db upon persist call since it was reset in the cache"
            );
        }
    }

    async delete(identifier) {
        const deleted = this.#objectCache.delete(identifier);
        if (deleted) {
            console.log("Deleted " + identifier + " from cache");
        }
        const exists = await this.#fsmanager.has(identifier);
        if (exists) {
            this.#toDelete.add(identifier);
            console.log(
                "Registered " +
                    identifier +
                    " for deletion from db upon persist call"
            );
        } else {
            console.log(identifier + " does not exist in the database");
        }
        return exists;
    }

    async persist(identifier) {
        assert(
            !(
                this.#objectCache.has(identifier) &&
                this.#toDelete.has(identifier)
            )
        );
        if (this.#objectCache.has(identifier)) {
            await this.#fsmanager.write(
                identifier,
                this.#objectCache.get(identifier)
            );
            console.log("Persisted " + identifier);
            return;
        } else if (this.#toDelete.has(identifier)) {
            await this.#fsmanager.remove(identifier);
            console.log("Persisted " + identifier);
            return;
        }
        throw `${identifier} does not exist in the cache; You must call 'set(${identifier}, <object>)' or 'get(${identifier}) before trying to persist ${identifier}`;
    }

    async persistAll() {
        for (const identifier of this.#toDelete) {
            assert(
                !(
                    this.#objectCache.has(identifier) &&
                    this.#toDelete.has(identifier)
                )
            );
        }
        console.log("Persisting all changes to the file system");
        for (const [identifier, object] of this.#objectCache) {
            await this.#fsmanager.write(identifier, object);
            console.log("Persisted " + identifier);
        }
        for (const identifier of this.#toDelete) {
            await this.#fsmanager.remove(identifier);
            console.log("Persisted " + identifier);
        }
    }
}
