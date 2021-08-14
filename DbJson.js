import process from "process";
import path from "path";
import FileSystemManager from "./FileSystemManager.js";
import assert from "assert";
import { Converter } from "./Utilities.js";

export default class DbJson {
    #objectCache;
    #toDelete;
    #fsmanager;
    #converter;
    #pathToPathMap;
    #pathMap;

    constructor(dataDir) {
        console.log("Hello from @dxaviud/dbjson");
        dataDir = path.join(process.cwd(), dataDir);
        this.#objectCache = new Map();
        this.#toDelete = new Set();
        this.#fsmanager = new FileSystemManager(dataDir);
        this.#converter = new Converter(dataDir);
        this.#pathToPathMap = path.join(dataDir, "__path_mappings__.json");
        this.#initializePathMap();
        console.log("Data is stored under " + dataDir);
    }

    async has(identifier) {
        console.log("Checking if db has " + identifier);
        if (this.#objectCache.has(identifier)) {
            console.log(identifier + " found in cache");
            return true;
        }
        // console.log(identifier + " not found in cache, checking file system");
        let path = this.#converter.pathOf(identifier);
        if (await this.#fsmanager.hasFile(path)) {
            console.log(identifier + " found in file system");
            return true;
        }
        if (this.#pathMap.has(identifier)) {
            path = this.#pathMap.get(identifier);
            if (await this.#fsmanager.hasFile(path)) {
                console.log(identifier + " found in file system");
                return true;
            }
            assert(false); // path map is wrong, mapped to non-existent path
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
        let path = this.#converter.pathOf(identifier);
        let result = await this.#fsmanager.readFile(path);
        if (result) {
            console.log(identifier + " retrieved from file system");
            this.set(identifier, result);
            this.#updateUnqualifiedIdentifierInCache(identifier, result);
        } else if (this.#pathMap.has(identifier)) {
            path = this.#pathMap.get(identifier);
            result = await this.#fsmanager.readFile(path);
            if (result) {
                console.log(identifier + " retrieved from file system");
                this.set(identifier, result);
            } else {
                console.log("Could not find " + identifier);
            }
        }
        return result;
    }

    async set(identifier, object) {
        this.#updateUnqualifiedIdentifierInCache(identifier, object);
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
        this.#updatePathMap(identifier);
        return true;
    }

    async delete(identifier) {
        let deleted = this.#objectCache.delete(identifier);
        if (deleted) {
            console.log("Deleted " + identifier + " from cache");
        }
        const unqualifiedIdentifier = this.#unqualifiedIdentifierOf(identifier);
        deleted = this.#objectCache.delete(unqualifiedIdentifier);
        if (deleted) {
            console.log("Deleted " + unqualifiedIdentifier + " from cache");
        }
        let path = this.#converter.pathOf(identifier);
        let exists = await this.#fsmanager.hasFile(path);
        if (exists) {
            this.#toDelete.add(identifier);
            console.log(
                "Registered " +
                    identifier +
                    " for deletion from db upon persist call"
            );
        } else {
            path = this.#pathMap.get(identifier);
            exists = await this.#fsmanager.hasFile(path);
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
        }
        this.#updatePathMap(identifier, { delete: true });
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
            this.#persistPathMap();
            return true;
        } else if (this.#toDelete.has(identifier)) {
            await this.#fsmanager.removeFile(path);
            console.log("Persisted " + identifier);
            this.#toDelete.delete(identifier);
            this.#persistPathMap();
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
            this.#persistPathMap();
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    #initializePathMap() {
        // https://stackoverflow.com/questions/37437805/convert-map-to-json-object-in-javascript
        if (this.#fsmanager.hasFileSync(this.#pathToPathMap)) {
            this.#pathMap = new Map(
                Object.entries(
                    this.#fsmanager.readFileSync(this.#pathToPathMap)
                )
            );
        } else {
            this.#pathMap = new Map();
        }
    }

    #persistPathMap() {
        this.#fsmanager.writeFileSync(
            this.#pathToPathMap,
            Object.fromEntries(this.#pathMap)
        );
    }

    #updatePathMap(identifier, options = { delete: false }) {
        const unqualifiedIdentifier = this.#unqualifiedIdentifierOf(identifier);
        if (options.delete) {
            this.#pathMap.delete(unqualifiedIdentifier);
        } else if (identifier !== unqualifiedIdentifier) {
            if (!this.#pathMap.has(unqualifiedIdentifier)) {
                this.#pathMap.set(
                    unqualifiedIdentifier,
                    this.#converter.pathOf(identifier)
                );
            } else {
                this.#pathMap.delete(unqualifiedIdentifier);
            }
        }
    }

    #unqualifiedIdentifierOf(qualifiedIdentifier) {
        return qualifiedIdentifier.split(".").pop();
    }

    #updateUnqualifiedIdentifierInCache(identifier, object) {
        const unqualifiedIdentifier = this.#unqualifiedIdentifierOf(identifier);
        if (!this.#objectCache.has(unqualifiedIdentifier)) {
            this.#objectCache.set(unqualifiedIdentifier, object);
            console.log(
                "Added " + unqualifiedIdentifier + " to cache (unqualified)"
            );
        } else if (!this.#objectCache.has(identifier)) {
            this.#objectCache.delete(unqualifiedIdentifier);
            console.log(
                "Removed " +
                    unqualifiedIdentifier +
                    " from cache since it will be ambiguous"
            );
        }
    }
}
