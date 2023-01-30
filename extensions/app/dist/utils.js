"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayFileExists = exports.createFolderByPath = exports.convertPathToDir = exports.stringCase = exports.getTemplate = exports.getMeta = exports.getReadme = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
function getReadme(name) {
    const Assets = path_1.join(__dirname, '../res/readme');
    return fs_1.readFileSync(path_1.join(Assets, `.${name}.md`), 'utf-8');
}
exports.getReadme = getReadme;
function getMeta(name) {
    const Assets = path_1.join(__dirname, '../res/meta');
    const str = fs_1.readFileSync(path_1.join(Assets, `${name}.meta`), 'utf-8');
    return str ? JSON.parse(str) : null;
}
exports.getMeta = getMeta;
function getTemplate(name) {
    const Assets = path_1.join(__dirname, '../res/panel');
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
 * 根据db下的路径创建目录(不是文件)
 * 如果已存在不会重复创建
 */
async function createFolderByPath(path, opts) {
    let pathHead = 'db://assets';
    if (!path && !path.startsWith(pathHead)) {
        return false;
    }
    // 修剪path
    const pathTail = path.endsWith('/') ? path.slice(pathHead.length + 1, -1).trim() : path.slice(pathHead.length + 1).trim();
    // 每一层的路径
    const pathArr = pathTail.split('/');
    // 创建主目录
    for (let index = 0; index < pathArr.length; index++) {
        pathHead += '/' + pathArr[index];
        if (!fs_1.existsSync(convertPathToDir(pathHead))) {
            const result = await Editor.Message.request('asset-db', 'create-asset', pathHead, null).catch(_ => null);
            if (!result)
                return false;
        }
    }
    // 主目录meta
    if (opts === null || opts === void 0 ? void 0 : opts.meta) {
        await delayFileExists(`${convertPathToDir(path)}.meta`);
        const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', path).catch(_ => null);
        if (!queryMeta)
            return false;
        queryMeta.userData = opts.meta.userData;
        const result = await Editor.Message.request('asset-db', 'save-asset-meta', path, JSON.stringify(queryMeta)).catch(_ => null);
        if (!result)
            return false;
    }
    // 主目录readme
    if (opts === null || opts === void 0 ? void 0 : opts.readme) {
        fs_1.writeFileSync(path_1.join(convertPathToDir(path), `.${path_1.basename(path)}.md`), opts.readme);
    }
    // 创建子目录
    if (opts === null || opts === void 0 ? void 0 : opts.subPaths) {
        for (let index = 0; index < opts.subPaths.length; index++) {
            const subPath = `${pathHead}/${opts.subPaths[index]}`;
            if (!fs_1.existsSync(convertPathToDir(subPath))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', subPath, null).catch(_ => null);
                if (!result)
                    return false;
            }
        }
    }
    if (opts === null || opts === void 0 ? void 0 : opts.subFolders) {
        for (let index = 0; index < opts.subFolders.length; index++) {
            const subOpts = opts.subFolders[index];
            const subPath = `${pathHead}/${subOpts.folder}`;
            // 判断是否存在
            if (!fs_1.existsSync(convertPathToDir(subPath))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', subPath, null).catch(_ => null);
                if (!result)
                    return false;
            }
            // meta
            if (subOpts.meta) {
                await delayFileExists(`${convertPathToDir(subPath)}.meta`);
                const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', subPath).catch(_ => null);
                if (!queryMeta)
                    return false;
                queryMeta.userData = subOpts.meta.userData;
                const result = await Editor.Message.request('asset-db', 'save-asset-meta', subPath, JSON.stringify(queryMeta)).catch(_ => null);
                if (!result)
                    return false;
            }
            // readme
            if (subOpts.readme) {
                fs_1.writeFileSync(path_1.join(convertPathToDir(subPath), `.${path_1.basename(subPath)}.md`), subOpts.readme);
            }
        }
    }
    return true;
}
exports.createFolderByPath = createFolderByPath;
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
