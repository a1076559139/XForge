"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delayFileExistsByUrl = exports.delay = exports.createFolderByUrl = exports.getProjectPath = exports.convertUrlToPath = exports.stringCaseNegate = exports.stringCase = exports.getResPanel = exports.getResMeta = exports.getResReadme = exports.getResJson = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
function getResJson(name) {
    const Assets = path_1.join(__dirname, '../res/json');
    const str = fs_1.readFileSync(path_1.join(Assets, `${name}.json`), 'utf-8');
    return str ? JSON.parse(str) : null;
}
exports.getResJson = getResJson;
function getResReadme(name) {
    const Assets = path_1.join(__dirname, '../res/readme');
    return fs_1.readFileSync(path_1.join(Assets, `${name}.md`), 'utf-8');
}
exports.getResReadme = getResReadme;
function getResMeta(name) {
    const Assets = path_1.join(__dirname, '../res/meta');
    const str = fs_1.readFileSync(path_1.join(Assets, `${name}.meta`), 'utf-8');
    return str ? JSON.parse(str) : null;
}
exports.getResMeta = getResMeta;
function getResPanel(name) {
    const Assets = path_1.join(__dirname, '../res/panel');
    return fs_1.readFileSync(path_1.join(Assets, `components/${name}.html`), 'utf-8');
}
exports.getResPanel = getResPanel;
/**
 * 将串式命名转成驼峰命名
 * @param str 串式字符串
 * @param lower 首字母是否小写(默认大写)
 * @returns
 */
function stringCase(str, lower = false) {
    str = str.replace(/-/g, '_');
    const arr = str.split('_');
    return arr.map(function (str, index) {
        if (index === 0 && lower) {
            return str.charAt(0).toLocaleLowerCase() + str.slice(1);
        }
        return str.charAt(0).toLocaleUpperCase() + str.slice(1);
    }).join('');
}
exports.stringCase = stringCase;
/**
 * 将驼峰命名转成串式命名
 * @param str 驼峰字符串
 * @returns
 */
function stringCaseNegate(str) {
    return str.replace(/[A-Z]/g, (searchStr, startIndex) => {
        if (startIndex === 0) {
            return searchStr.toLocaleLowerCase();
        }
        else {
            return '-' + searchStr.toLocaleLowerCase();
        }
    });
}
exports.stringCaseNegate = stringCaseNegate;
/**
 * db下的路径转换为真实路径
 */
function convertUrlToPath(url) {
    if (url.startsWith('db://assets')) {
        url = Editor.Utils.Path.join(Editor.Project.path, url.slice(5));
    }
    else if (url.startsWith('db://app')) {
        url = Editor.Utils.Path.join(Editor.Project.path, 'extensions/app/assets', url.slice(8));
    }
    else if (url.startsWith('db://pkg')) {
        url = Editor.Utils.Path.join(Editor.Project.path, 'extensions/pkg/node_modules', url.slice(8));
    }
    return url;
}
exports.convertUrlToPath = convertUrlToPath;
/**
 * 获取程序路径
 */
function getProjectPath() {
    return Editor.Project.path;
}
exports.getProjectPath = getProjectPath;
/**
 * 根据db下的路径创建目录(不是文件)
 * 如果已存在不会重复创建
 */
async function createFolderByUrl(url, opts) {
    let pathHead = 'db://assets';
    if (!url && !url.startsWith(pathHead)) {
        return false;
    }
    // 修剪path
    const pathTail = url.endsWith('/') ? url.slice(pathHead.length + 1, -1).trim() : url.slice(pathHead.length + 1).trim();
    // 每一层的路径
    const pathArr = pathTail.split('/');
    // 创建主目录
    for (let index = 0; index < pathArr.length; index++) {
        pathHead += '/' + pathArr[index];
        if (!fs_1.existsSync(convertUrlToPath(pathHead))) {
            const result = await Editor.Message.request('asset-db', 'create-asset', pathHead, null).catch(_ => null);
            if (!result)
                return false;
        }
    }
    // 主目录meta
    if (opts === null || opts === void 0 ? void 0 : opts.meta) {
        await delayFileExistsByUrl(`${url}.meta`);
        await delay(100);
        const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', url).catch(_ => null);
        if (!queryMeta)
            return false;
        Object.assign(queryMeta.userData, opts.meta.userData);
        const result = await Editor.Message.request('asset-db', 'save-asset-meta', url, JSON.stringify(queryMeta)).catch(_ => null);
        if (!result)
            return false;
    }
    // 主目录readme
    if (opts === null || opts === void 0 ? void 0 : opts.readme) {
        fs_1.writeFileSync(path_1.join(convertUrlToPath(url), `.${path_1.basename(url)}.md`), opts.readme);
    }
    // 创建子目录
    if (opts === null || opts === void 0 ? void 0 : opts.subPaths) {
        await delay(100);
        for (let index = 0; index < opts.subPaths.length; index++) {
            const subPath = `${pathHead}/${opts.subPaths[index]}`;
            if (!fs_1.existsSync(convertUrlToPath(subPath))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', subPath, null).catch(_ => null);
                if (!result)
                    return false;
            }
        }
    }
    if (opts === null || opts === void 0 ? void 0 : opts.subFolders) {
        await delay(100);
        for (let index = 0; index < opts.subFolders.length; index++) {
            const subOpts = opts.subFolders[index];
            const subUrl = `${pathHead}/${subOpts.folder}`;
            // 判断是否存在
            if (!fs_1.existsSync(convertUrlToPath(subUrl))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', subUrl, null).catch(_ => null);
                if (!result)
                    return false;
            }
            // meta
            if (subOpts.meta) {
                await delayFileExistsByUrl(`${subUrl}.meta`);
                const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', subUrl).catch(_ => null);
                if (!queryMeta)
                    return false;
                Object.assign(queryMeta.userData, subOpts.meta.userData);
                const result = await Editor.Message.request('asset-db', 'save-asset-meta', subUrl, JSON.stringify(queryMeta)).catch(_ => null);
                if (!result)
                    return false;
            }
            // readme
            if (subOpts.readme) {
                fs_1.writeFileSync(path_1.join(convertUrlToPath(subUrl), `.${path_1.basename(subUrl)}.md`), subOpts.readme);
            }
        }
    }
    return true;
}
exports.createFolderByUrl = createFolderByUrl;
function delay(time) {
    return new Promise((next) => {
        setTimeout(() => {
            next(null);
        }, time);
    });
}
exports.delay = delay;
/**
 * 等待文件存在
 */
function delayFileExistsByUrl(url) {
    const path = convertUrlToPath(url);
    let timer = null;
    return new Promise((next) => {
        timer = setInterval(() => {
            if (fs_1.existsSync(path)) {
                if (timer)
                    clearInterval(timer);
                timer = null;
                next(null);
            }
        }, 100);
    });
}
exports.delayFileExistsByUrl = delayFileExistsByUrl;
