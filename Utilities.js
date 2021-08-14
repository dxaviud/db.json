import path from "path";

export class Converter {
    #rootPath;

    constructor(rootPath) {
        this.#rootPath = rootPath;
    }

    pathOf(identifier) {
        const split = identifier.split(".");
        split[split.length - 1] += ".json";
        const resultPath = path.join(this.#rootPath, ...split);
        return resultPath;
    }

    dirOf(identifier) {
        const split = identifier.split(".");
        split.pop();
        return path.join(this.#rootPath, ...split);
    }
}
