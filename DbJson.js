import process from "process";
import path from "path";
import FileSystemManager from "./FileSystemManager.js";
import assert from "assert";
import { IdentifierConverter } from "./Utilities.js";

export default class DbJson {
    #objectCache;
    #toDelete;
    #fsmanager;
    #converter;
    #pathMap;

    constructor(dataDir) {
        console.log("Hello from @dxaviud/dbjson");
        dataDir = path.join(process.cwd(), dataDir);
        this.#objectCache = new Map();
        this.#toDelete = new Set();
        this.#fsmanager = new FileSystemManager(dataDir);
        this.#converter = new IdentifierConverter(dataDir);
        this.#initializePathMap(path.join(dataDir, "__path_mappings__.json"));
        console.log("Data is stored under " + dataDir);
    }

    async has(identifier) {
        console.log("Checking if db has " + identifier);
        if (this.#objectCache.has(identifier)) {
            console.log(identifier + " found in cache");
            return true;
        }
        // console.log(identifier + " not found in cache, checking file system");
        const path = this.#converter.pathOf(identifier);
        if (await this.#fsmanager.hasFile(path)) {
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
        const path = this.#converter.pathOf(identifier);
        const result = await this.#fsmanager.readFile(path);
        if (result) {
            console.log(identifier + " retrieved from file system");
            this.set(identifier, result);
        } else {
            console.log("Could not find " + identifier);
        }
        return result;
    }

    async set(identifier, object) {
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
        return true;
    }

    async delete(identifier) {
        const deleted = this.#objectCache.delete(identifier);
        if (deleted) {
            console.log("Deleted " + identifier + " from cache");
        }
        const path = this.#converter.pathOf(identifier);
        const exists = await this.#fsmanager.hasFile(path);
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
        const path = this.#converter.pathOf(identifier);
        if (this.#objectCache.has(identifier)) {
            await this.#fsmanager.writeFile(
                path,
                this.#objectCache.get(identifier)
            );
            console.log("Persisted " + identifier);
            return true;
        } else if (this.#toDelete.has(identifier)) {
            await this.#fsmanager.removeFile(path);
            console.log("Persisted " + identifier);
            return true;
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
        try {
            for (const [identifier, object] of this.#objectCache) {
                const path = this.#converter.pathOf(identifier);
                await this.#fsmanager.writeFile(path, object);
                console.log("Persisted " + identifier);
            }
            for (const identifier of this.#toDelete) {
                const path = this.#converter.pathOf(identifier);
                await this.#fsmanager.removeFile(path);
                console.log("Persisted " + identifier);
            }
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    #initializePathMap(pathToPathMappings) {
        // https://stackoverflow.com/questions/37437805/convert-map-to-json-object-in-javascript
        if (this.#fsmanager.hasFileSync(pathToPathMappings)) {
            this.#pathMap = new Map(
                Object.entries(this.#fsmanager.readFileSync(pathToPathMappings))
            );
        } else {
            this.#fsmanager.writeFileSync(pathToPathMappings, {});
            this.#pathMap = new Map();
        }
    }
}
