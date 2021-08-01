class DbJson {
    constructor() {
        console.log("Hello from @dxaviud/dbjson");
        this.objectCache = new Map();
    }

    hasObject(identifier) {
        if (this.objectCache.has(identifier)) {
            return true;
        }
        //todo check if the object is in the filesystem
        return false;
    }

    getObject(identifier) {
        if (this.objectCache.has(identifier)) {
            return this.objectCache.get(identifier);
        }
        return null;
    }

    setObject(identifier, object) {
        this.objectCache.set(identifier, object);
    }

    persist() {
        //todo persist the objects in the object cache to disk (file system)
    }
}

export default new DbJson();
