import fs from "fs/promises";

export default class FileSystemManager {
    constructor(rootPath) {
        if (rootPath.charAt(rootPath.length - 1) !== "/") {
            rootPath += "/";
        }
        this.rootPath = rootPath; // the absolute path to the project's root directory
    }

    identifierToPath(identifier) {
        return (
            this.rootPath +
            "dbdata/" +
            identifier.split(".").join("/") +
            ".json"
        );
    }

    async has(identifier) {
        const path = this.identifierToPath(identifier);
        return await this.hasPath(path);
    }

    async hasPath(path) {
        try {
            await fs.open(path);
            return true;
        } catch {
            return false;
        }
    }

    async write(object, identifier) {}

    async read(identifier) {}
}
