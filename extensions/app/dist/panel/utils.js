"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayFileExists = exports.createPath = exports.convertPathToDir = exports.stringCase = exports.getTemplate = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
function getTemplate(name) {
    const Assets = path_1.join(__dirname, '../../res/panel');
    return fs_1.readFileSync(path_1.join(Assets, `components/${name}.html`), 'utf-8');
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
function convertPathToDir(path) {
    if (path.startsWith('db://assets')) {
        path = Editor.Utils.Path.join(Editor.Project.path, path.slice(5));
    }
    else if (path.startsWith('db://app')) {
        path = Editor.Utils.Path.join(Editor.Project.path, 'extensions/app/assets', path.slice(8));
    }
    return path;
}
exports.convertPathToDir = convertPathToDir;
/**
 * 根据db下的路径创建目录
 */
async function createPath(path, subPaths) {
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
        if (!fs_1.existsSync(convertPathToDir(pathHead))) {
            const result = await Editor.Message.request('asset-db', 'create-asset', pathHead, null).catch(_ => null);
            if (!result)
                return false;
        }
    }
    // 创建子目录
    if (subPaths) {
        for (let index = 0; index < subPaths.length; index++) {
            const path = `${pathHead}/${subPaths[index]}`;
            if (!fs_1.existsSync(convertPathToDir(path))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', path, null).catch(_ => null);
                if (!result)
                    return false;
            }
        }
    }
    return true;
}
exports.createPath = createPath;
/**
 * 等待文件存在
 * @param file 真实路径，不是基于db下的
 */
function delayFileExists(file) {
    let timer = null;
    return new Promise((next) => {
        timer = setInterval(() => {
            if (fs_1.existsSync(file)) {
                if (timer)
                    clearInterval(timer);
                timer = null;
                next(null);
            }
        }, 100);
    });
}
exports.delayFileExists = delayFileExists;
