class DbJson {
    constructor() {
        console.log("Hello from @dxaviud/dbjson");
        this.objectCache = new Map();
    }

    has(identifier) {
        if (this.objectCache.has(identifier)) {
            return true;
        }
        //todo check if the object is in the filesystem
        return false;
    }

    get(identifier) {
        if (this.objectCache.has(identifier)) {
            return this.objectCache.get(identifier);
        }
        //todo check if the object is in the filesystem
        return null;
    }

    set(identifier, object) {
        this.objectCache.set(identifier, object);
    }

    persist() {
        //todo persist the objects in the object cache to disk (filesystem)
        //split each identifier by '.' and put the corresponding object in the right directory
    }
}

export default new DbJson();
