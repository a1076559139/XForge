"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDBDir = exports.convertDBToPath = exports.stringCase = exports.getTemplate = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
function getTemplate(name) {
    const Assets = (0, path_1.join)(__dirname, '../../res/panel');
    return (0, fs_extra_1.readFileSync)((0, path_1.join)(Assets, `components/${name}.html`), 'utf-8');
}
exports.getTemplate = getTemplate;
/**
 * 首字母大写或小写(默认大写)
 * @returns
 */
function stringCase(str, lower = false) {
    str = str.replace(/-/g, '_');
    const arr = str.split('_');
    return arr.map(function (str, index) {
        if (index === 0 && lower) {
            return str.charAt(0).toLowerCase() + str.slice(1);
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    }).join('');
}
exports.stringCase = stringCase;
/**
 * db下的路径转换为真实路径
 */
function convertDBToPath(path) {
    if (path.startsWith('db://assets')) {
        path = Editor.Utils.Path.join(Editor.Project.path, path.slice(5));
    }
    else if (path.startsWith('db://app')) {
        path = Editor.Utils.Path.join(Editor.Project.path, 'extensions/app/assets', path.slice(8));
    }
    return path;
}
exports.convertDBToPath = convertDBToPath;
/**
 * 根据路径创建目录
 */
async function createDBDir(path, subPaths) {
    let pathHead = 'db://assets';
    if (!path && !path.startsWith(pathHead)) {
        return false;
    }
    // 修剪path
    if (path.endsWith('/')) {
        path = path.slice(pathHead.length + 1, -1).trim();
    }
    else {
        path = path.slice(pathHead.length + 1).trim();
    }
    // 每一层的路径
    const pathArr = path.split('/');
    // 创建主目录
    for (let index = 0; index < pathArr.length; index++) {
        pathHead += '/' + pathArr[index];
        if (!(0, fs_extra_1.existsSync)(convertDBToPath(pathHead))) {
            const result = Editor.Message.request('asset-db', 'create-asset', pathHead, null).catch(_ => null);
            if (!result)
                return false;
        }
    }
    // 创建子目录
    if (subPaths) {
        for (let index = 0; index < subPaths.length; index++) {
            const path = `${pathHead}/${subPaths[index]}`;
            if (!(0, fs_extra_1.existsSync)(convertDBToPath(path))) {
                const result = Editor.Message.request('asset-db', 'create-asset', path, null).catch(_ => null);
                if (!result)
                    return false;
            }
        }
    }
    return true;
}
exports.createDBDir = createDBDir;
