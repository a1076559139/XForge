"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAfterBuild = void 0;
const path_1 = __importDefault(require("path"));
const file_1 = require("./utils/file");
const onAfterBuild = async function (options, result) {
    if (options.platform !== 'web-mobile' && options.platform !== 'web-desktop') {
        return;
    }
    if (!options.md5Cache) {
        return;
    }
    file_1.adaptFileMD5(path_1.default.join(result.dest, 'index.html'));
};
exports.onAfterBuild = onAfterBuild;
