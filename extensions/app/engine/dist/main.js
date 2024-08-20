"use strict";
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
/**
 * // 打开panel
 * Editor.Panel.open(`${插件名}.${panel名}`);
 * // 调用普通事件
 * Editor.Message.request(插件名, 消息名, ...args);
 * // 调用场景方法
 * Editor.Message.request('scene', 'execute-scene-script', {
 *      //插件名
 *      name: string,
 *      //方法名
 *      method: string,
 *      //参数列表
 *      args: any[]
 *  });
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
// path.join不能正确处理'db://'结构，会把'//'变成'/'
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const electron = require('electron');
const adminFolderName = 'app-admin';
const controlFolderName = 'app-control';
const managerFolderName = 'app-manager';
const modelFolderName = 'app-model';
const soundFolderName = 'app-sound';
const viewFolderName = 'app-view';
const builtinFolderName = 'app-builtin';
const bundleFolderName = 'app-bundle';
const pkgFolderUrl = 'db://pkg/';
const builtinFolderUrl = 'db://assets/' + builtinFolderName;
const builtinFolderPath = utils_1.convertUrlToPath(builtinFolderUrl);
const bundleFolderUrl = 'db://assets/' + bundleFolderName;
const bundleFolderPath = utils_1.convertUrlToPath(bundleFolderUrl);
const adminFolderUrl = builtinFolderUrl + '/' + adminFolderName;
const adminFolderPath = builtinFolderPath + '/' + adminFolderName;
const controlFolderUrl = builtinFolderUrl + '/' + controlFolderName;
const controlFolderPath = builtinFolderPath + '/' + controlFolderName;
const managerFolderUrl = builtinFolderUrl + '/' + managerFolderName;
const managerFolderPath = builtinFolderPath + '/' + managerFolderName;
const modelFolderUrl = builtinFolderUrl + '/' + modelFolderName;
const modelFolderPath = builtinFolderPath + '/' + modelFolderName;
const soundFolderUrl = bundleFolderUrl + '/' + soundFolderName;
const soundFolderPath = bundleFolderPath + '/' + soundFolderName;
const viewFolderUrl = bundleFolderUrl + '/' + viewFolderName;
const viewFolderPath = bundleFolderPath + '/' + viewFolderName;
const executorFileUrl = adminFolderUrl + '/executor.ts';
const executorFilePath = adminFolderPath + '/executor.ts';
function isExecutor(info, strict = true) {
    if (!strict) {
        if (info.path.endsWith('Control') && info.type === 'cc.Script')
            return true;
        if (info.path.endsWith('Manager') && (info.type === 'cc.Script' || info.type === 'cc.Prefab'))
            return true;
        if ((info.name.startsWith('data.') || info.name.startsWith('config.') || info.name.startsWith('store.')) && info.type === 'cc.Script')
            return true;
        if ((info.name.startsWith('Page') || info.name.startsWith('Paper') || info.name.startsWith('Pop') || info.name.startsWith('Top'))
            && (info.type === 'cc.Script' || info.type === 'cc.Prefab' || info.type === 'cc.Scene' || info.type === 'cc.SceneAsset'))
            return true;
        if (info.type === 'cc.AudioClip')
            return true;
        return false;
    }
    if (info.path === builtinFolderUrl)
        return true;
    if (info.path === bundleFolderUrl)
        return true;
    if (info.path === managerFolderUrl)
        return true;
    if (info.path === controlFolderUrl)
        return true;
    if (info.path === modelFolderUrl)
        return true;
    if (info.path === soundFolderUrl)
        return true;
    if (info.path === viewFolderUrl)
        return true;
    if (info.path.startsWith(controlFolderUrl)) {
        return info.path.endsWith('Control') && info.type === 'cc.Script';
    }
    if (info.path.startsWith(managerFolderUrl)) {
        return info.path.endsWith('Manager') && (info.type === 'cc.Script' || info.type === 'cc.Prefab');
    }
    if (info.path.startsWith(modelFolderUrl)) {
        return (info.name.startsWith('data.') || info.name.startsWith('config.') || info.name.startsWith('store.')) && info.type === 'cc.Script';
    }
    if (info.path.startsWith(viewFolderUrl)) {
        return (info.name.startsWith('Page') || info.name.startsWith('Paper') || info.name.startsWith('Pop') || info.name.startsWith('Top'))
            && (info.type === 'cc.Script' || info.type === 'cc.Prefab' || info.type === 'cc.Scene' || info.type === 'cc.SceneAsset');
    }
    if (info.path.startsWith(soundFolderUrl)) {
        return info.type === 'cc.AudioClip';
    }
}
function compareStr(str1, str2) {
    if (str1 === str2) {
        return 0;
    }
    const len = Math.max(str1.length, str2.length);
    for (let i = 0, code1 = 0, code2 = 0; i < len; i++) {
        if (str1.length <= i) {
            return -1;
        }
        else if (str2.length <= i) {
            return 1;
        }
        else {
            code1 = str1.charCodeAt(i);
            code2 = str2.charCodeAt(i);
            if (code1 > code2) {
                return 1;
            }
            else if (code1 < code2) {
                return -1;
            }
        }
    }
    return 0;
}
const viewSelect = ['Page', 'Paper', 'Pop', 'Top'];
const viewRegExp = RegExp(`^(${viewSelect.join('|')})`);
function readFileSyncByPath(url) {
    const filepath = utils_1.convertUrlToPath(url);
    return fs_1.existsSync(filepath) ? fs_1.readFileSync(filepath, 'utf8') : '';
}
function isTSDefault(value) {
    const extname = value[3];
    if (extname.endsWith('js')) {
        return false;
    }
    const filename = value[0];
    const filepath = path_1.default.join(utils_1.convertUrlToPath(value[1]), filename + '.ts');
    const js = fs_1.readFileSync(filepath, 'utf8');
    return js.search(/export\s+default/) >= 0;
}
const keyWords = [
    'lib', 'manager', 'Manager', 'data', 'config',
    'IViewName', 'IViewNames', 'IMiniViewName', 'IMiniViewNames', 'IMusicName', 'IMusicNames', 'IEffectName', 'IEffectNames',
    'ViewName', 'MiniViewName', 'MusicName', 'EffectName'
];
async function clearExecutor() {
    if (!fs_1.existsSync(executorFilePath))
        return;
    const viewKeys = { never: false };
    const miniViewKeys = { never: '' };
    const musicKeys = { never: '' };
    const effectKeys = { never: '' };
    let result = '/* eslint-disable */\n' +
        'import { Component } from \'cc\';\n' +
        'import { app } from \'../../app/app\';\n' +
        'import { DEV, EDITOR } from \'cc/env\';\n\n';
    result += '/**界面名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举)*/\n';
    result += 'export enum ViewName {' + Object.keys(viewKeys).map(v => `${v}="${v}"`).join(',') + '}\n';
    result += '/**子界面名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举)*/\n';
    result += 'export enum MiniViewName {' + Object.keys(miniViewKeys).map(v => `${v}="${v}"`).join(',') + '}\n';
    result += '/**音乐名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举)*/\n';
    result += 'export enum MusicName {' + Object.keys(musicKeys).map(v => `"${v}"="${v}"`).join(',') + '}\n';
    result += '/**音效名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举)*/\n';
    result += 'export enum EffectName {' + Object.keys(effectKeys).map(v => `"${v}"="${v}"`).join(',') + '}\n\n';
    result += 'export type IViewName = keyof typeof ViewName\n';
    result += 'export type IViewNames = IViewName[]\n';
    result += 'export type IMiniViewName = keyof typeof MiniViewName\n';
    result += 'export type IMiniViewNames = IMiniViewName[]\n';
    result += 'export type IMusicName = keyof typeof MusicName\n';
    result += 'export type IMusicNames = IMusicName[]\n';
    result += 'export type IEffectName = keyof typeof EffectName\n';
    result += 'export type IEffectNames = IEffectName[]\n\n';
    // data
    result += 'if(!EDITOR||DEV) Object.assign(app.data, {})\n';
    // config
    result += 'if(!EDITOR||DEV) Object.assign(app.config, {})\n\n';
    result += 'export type IApp = {\n';
    result += '    Manager: {},\n';
    result += '    manager: {},\n';
    result += '    data: {},\n';
    result += '    config: {}\n';
    result += '    store: {}\n';
    // result += '    scene: IViewName[]\n';
    result += '}\n';
    // 修正windows系统中的\为/
    result = result.replace(/\\/g, '/');
    // save
    if (readFileSyncByPath(executorFileUrl) !== result) {
        await Editor.Message.request('asset-db', 'create-asset', executorFileUrl, result, {
            overwrite: true
        });
    }
}
async function updateExecutor() {
    // app-builtin文件夹不存在, 创建
    if (!fs_1.existsSync(builtinFolderPath))
        await utils_1.createFolderByUrl(builtinFolderUrl, { readme: utils_1.getResReadme(builtinFolderName) });
    // app-admin文件夹不存在, 创建
    if (!fs_1.existsSync(adminFolderPath))
        await utils_1.createFolderByUrl(adminFolderUrl, { meta: utils_1.getResMeta(adminFolderName), readme: utils_1.getResReadme(adminFolderName) });
    const mgrList = [];
    const dataList = [];
    const confList = [];
    const storeList = [];
    const viewKeys = {};
    const miniViewKeys = {};
    const musicKeys = {};
    const effectKeys = {};
    // app-control app-manager app-model
    const result1 = await Editor.Message.request('asset-db', 'query-assets', { pattern: builtinFolderUrl + '/{app-control,app-manager/*,app-model}/*.ts' })
        .then(res => {
        return res.sort((a, b) => compareStr(a.name, b.name));
    })
        .catch(() => []);
    // app-sound
    const result2 = await Editor.Message.request('asset-db', 'query-assets', { pattern: soundFolderUrl + '/{music,effect}/**/*.*' })
        .then(res => {
        return res.sort((a, b) => compareStr(a.name, b.name));
    })
        .catch(() => []);
    // app-view
    const result3 = await Editor.Message.request('asset-db', 'query-assets', { pattern: viewFolderUrl + '/{page,pop,top,paper/*}/*/native/*.{prefab,scene}' })
        .then(res => {
        return res.sort((a, b) => compareStr(a.name, b.name));
    })
        .catch(() => []);
    // manager
    const result4 = await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://app/manager/**/*.ts' })
        .then(res => {
        return res.sort((a, b) => compareStr(a.name, b.name));
    })
        .catch(() => []);
    // 集合
    const results = result1.slice().concat(result2).concat(result3).concat(result4);
    for (let index = 0; index < results.length; index++) {
        const result = results[index];
        const fileUrl = result.url;
        // 文件名.扩展名
        const basename = path_1.default.basename(result.url || '') || '';
        // 扩展名
        const extname = path_1.default.extname(result.url || '') || '';
        // 文件名
        const filename = basename.slice(0, -extname.length);
        // 文件目录名
        const dirname = path_1.default.dirname(result.url || '') || '';
        if (!basename)
            continue;
        if (!extname)
            continue;
        if (!filename)
            continue;
        if (!dirname)
            continue;
        if (extname === '.ts') {
            // 变量名
            const varname = filename.replace(/[.-]/g, '_');
            if (keyWords.indexOf(varname) >= 0) {
                console.log(`[跳过此文件] [${filename}] 原因: ${varname}与关键字中(${JSON.stringify(keyWords)})的一个重复`);
            }
            else if (fileUrl.startsWith(managerFolderUrl)) {
                // 用户manager
                if (filename.endsWith('Manager') && dirname.endsWith(utils_1.stringCaseNegate(filename.slice(0, -7)))) {
                    mgrList.push([filename, dirname, varname, extname]);
                }
            }
            else if (fileUrl.startsWith('db://app/manager/')) {
                // 系统manager
                if (filename.endsWith('Manager') && dirname.endsWith(filename.slice(0, -7).toLocaleLowerCase())) {
                    mgrList.push([filename, dirname, varname, extname]);
                }
            }
            else if (fileUrl.startsWith(modelFolderUrl)) {
                // model
                if (filename.startsWith('data.')) {
                    dataList.push([filename, dirname, varname, extname]);
                }
                else if (filename.startsWith('config.')) {
                    confList.push([filename, dirname, varname, extname]);
                }
                else if (filename.startsWith('store.')) {
                    storeList.push([filename, dirname, varname, extname]);
                }
            }
        }
        else if (extname === '.prefab' || extname === '.scene') {
            if (fileUrl.startsWith(viewFolderUrl) && viewRegExp.test(filename)) {
                const dirArray = dirname.split('/');
                const index = dirArray.indexOf(viewFolderName);
                const viewDirArray = dirArray.slice(index + 1);
                // viewKeys
                if (['page', 'paper', 'pop', 'top'].indexOf(viewDirArray[0].toLowerCase()) >= 0) {
                    // 主界面
                    if (filename === `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}`) {
                        viewKeys[filename] = extname === '.scene';
                    }
                    // 子界面
                    else if (filename === `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}${utils_1.stringCase(viewDirArray[2], false)}`) {
                        miniViewKeys[filename] = `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}`;
                    }
                }
                else {
                    // 主界面
                    if (filename === `${utils_1.stringCase(viewDirArray[1], false)}${utils_1.stringCase(viewDirArray[2], false)}`) {
                        viewKeys[filename] = extname === '.scene';
                    }
                    // 子界面
                    else if (filename === `${utils_1.stringCase(viewDirArray[1], false)}${utils_1.stringCase(viewDirArray[2], false)}${utils_1.stringCase(viewDirArray[3], false)}`) {
                        miniViewKeys[filename] = `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}`;
                    }
                }
            }
        }
        else if (fileUrl.startsWith(soundFolderUrl)) {
            const dir = path_1.default.join(dirname.split(soundFolderName + '/').pop(), filename);
            if (dir.startsWith('music')) {
                // musicKeys
                musicKeys[dir] = dir;
            }
            else {
                // effectKeys
                effectKeys[dir] = dir;
            }
        }
    }
    const pkgs = [];
    const pkgAssetsPath = utils_1.convertUrlToPath(pkgFolderUrl);
    if (fs_1.existsSync(pkgAssetsPath)) {
        fs_1.readdirSync(pkgAssetsPath).forEach(function (item) {
            const item_path = path_1.default.join(pkgAssetsPath, item);
            const item_stat = fs_1.statSync(item_path);
            if (!item_stat.isDirectory())
                return;
            const item_name = path_1.default.basename(item_path);
            if (item_name.startsWith('@')) {
                fs_1.readdirSync(item_path).forEach(function (sub) {
                    const sub_path = path_1.default.join(item_path, sub);
                    const sub_stat = fs_1.statSync(sub_path);
                    if (!sub_stat.isDirectory())
                        return;
                    const sub_name = path_1.default.basename(sub_path);
                    pkgs.push(item_name + '/' + sub_name);
                });
            }
            else {
                pkgs.push(item_name);
            }
        });
    }
    let result = '/* eslint-disable */\n' +
        'import { Component } from \'cc\';\n' +
        'import { app } from \'../../app/app\';\n' +
        'import { DEV,EDITOR } from \'cc/env\';\n\n';
    pkgs.forEach(name => {
        result += `import 'db://pkg/${name}'\n`;
    });
    const handle = function handle(arr, module) {
        arr.forEach(function (value, index, array) {
            // storage
            const filename = value[0];
            // db://assets/app/lib/storage
            const dirname = value[1];
            // storage
            const varname = value[2];
            if (isTSDefault(value)) {
                result += `import ${varname} from '${path_1.default.join(path_1.default.relative(adminFolderPath, utils_1.convertUrlToPath(dirname)), filename)}'\n`;
            }
            else if (module) {
                result += `import {${varname}} from '${path_1.default.join(path_1.default.relative(adminFolderPath, utils_1.convertUrlToPath(dirname)), filename)}'\n`;
            }
            else {
                result += `import * as ${varname} from '${path_1.default.join(path_1.default.relative(adminFolderPath, utils_1.convertUrlToPath(dirname)), filename)}'\n`;
            }
            array[index] = varname;
        });
    };
    // manager
    handle(mgrList, true);
    let MgrStr = '';
    let mgrStr = '';
    mgrList.forEach(function (varname, index, array) {
        MgrStr += `${varname.slice(0, -7)}:Omit<typeof ${varname},keyof Component>`;
        if (varname === 'UIManager') {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname}<IViewName,IMiniViewName>,keyof Component>`;
        }
        else if (varname === 'SoundManager') {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname}<IEffectName,IMusicName>,keyof Component>`;
        }
        else {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname},keyof Component>`;
        }
        if (index < array.length - 1) {
            MgrStr += ',';
            mgrStr += ',';
        }
    });
    if (Object.keys(viewKeys).length === 0)
        viewKeys['never'] = false;
    if (Object.keys(miniViewKeys).length === 0)
        miniViewKeys['never'] = '';
    if (Object.keys(musicKeys).length === 0)
        musicKeys['never'] = '';
    if (Object.keys(effectKeys).length === 0)
        effectKeys['never'] = '';
    result += '/**界面名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举)*/\n';
    result += 'export enum ViewName {' + Object.keys(viewKeys).map(v => `${v}="${v}"`).join(',') + '}\n';
    result += '/**子界面名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举)*/\n';
    result += 'export enum MiniViewName {' + Object.keys(miniViewKeys).map(v => `${v}="${v}"`).join(',') + '}\n';
    result += '/**音乐名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举)*/\n';
    result += 'export enum MusicName {' + Object.keys(musicKeys).map(v => `"${v}"="${v}"`).join(',') + '}\n';
    result += '/**音效名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举)*/\n';
    result += 'export enum EffectName {' + Object.keys(effectKeys).map(v => `"${v}"="${v}"`).join(',') + '}\n\n';
    result += 'export type IViewName = keyof typeof ViewName\n';
    result += 'export type IViewNames = IViewName[]\n';
    result += 'export type IMiniViewName = keyof typeof MiniViewName\n';
    result += 'export type IMiniViewNames = IMiniViewName[]\n';
    result += 'export type IMusicName = keyof typeof MusicName\n';
    result += 'export type IMusicNames = IMusicName[]\n';
    result += 'export type IEffectName = keyof typeof EffectName\n';
    result += 'export type IEffectNames = IEffectName[]\n\n';
    // scene
    // result += `if(!EDITOR||DEV) Array.prototype.push.apply(app.scene, ${JSON.stringify(Object.keys(viewKeys).filter(key => viewKeys[key]))})\n`;
    // data
    handle(dataList, false);
    result += `if(!EDITOR||DEV) Object.assign(app.data, {${dataList.map(varname => `${varname.slice(5)}:new ${varname}()`).join(',')}})\n`;
    // config
    handle(confList, false);
    result += `if(!EDITOR||DEV) Object.assign(app.config, {${confList.map(varname => `${varname.slice(7)}:new ${varname}()`).join(',')}})\n`;
    // store
    handle(storeList, false);
    result += `if(!EDITOR||DEV) Object.assign(app.store, {${storeList.map(varname => `${varname.slice(6)}:new ${varname}()`).join(',')}})\n\n`;
    result += 'type IReadOnly<T> = { readonly [P in keyof T]: T[P] extends Function ? T[P] : (T[P] extends Object ? IReadOnly<T[P]> : T[P]); };\n';
    result += 'export type IApp = {\n';
    result += `    Manager: {${MgrStr}},\n`;
    result += `    manager: {${mgrStr}},\n`;
    result += `    data: {${dataList.map(varname => `${varname.slice(5)}:${varname}`).join(',')}},\n`;
    result += `    config: {${confList.map(varname => `${varname.slice(7)}:IReadOnly<${varname}>`).join(',')}}\n`;
    result += `    store: {${storeList.map(varname => `${varname.slice(6)}:IReadOnly<${varname}>`).join(',')}}\n`;
    // result += '    scene: IReadOnly<IViewName[]>\n';
    result += '}\n';
    // 修正windows系统中的\为/
    result = result.replace(/\\/g, '/');
    // save
    if (readFileSyncByPath(executorFileUrl) !== result) {
        await Editor.Message.request('asset-db', 'create-asset', executorFileUrl, result, {
            overwrite: true
        });
    }
}
let timer = null;
function callUpdateExecutor(clear = false) {
    if (timer)
        return;
    if (clear) {
        clearExecutor();
        callUpdateExecutor(false);
    }
    else {
        timer = setTimeout(() => {
            updateExecutor().finally(() => {
                timer = null;
            });
        }, 500);
    }
}
// 获得Creator主窗口
function getMainWebContents() {
    const windows = electron.BrowserWindow.getAllWindows();
    for (let i = 0; i < windows.length; i++) {
        const win = windows[i];
        if (win.webContents.getURL().includes('windows/main.html') || (win.title && win.title.includes('Cocos Creator'))) {
            return win.webContents;
        }
    }
    return;
}
function updateMark() {
    const webContents = getMainWebContents();
    if (webContents) {
        const hackCode = fs_1.readFileSync(path_1.default.join(__dirname, '../res/mark.js'), 'utf-8');
        webContents.executeJavaScript(hackCode);
    }
}
exports.methods = {
    ['open-panel']() {
        Editor.Panel.open('app.open-panel');
    },
    ['open-help']() {
        const url = 'https://gitee.com/cocos2d-zp/cococs-creator-frame-3d/wikis/pages?sort_id=9432723&doc_id=5075526';
        Editor.Message.send('program', 'open-url', url);
    },
    ['update-executor']() {
        // 点击更新
        callUpdateExecutor();
        console.log('[executor.ts] 更新成功');
    },
    ['scene:ready']() {
        // 
    },
    ['asset-db:ready']() {
        updateExecutor();
        updateMark();
    },
    ['asset-db:asset-add'](uuid, info) {
        if (!isExecutor(info))
            return;
        callUpdateExecutor();
    },
    ['asset-db:asset-change'](uuid, info) {
        if (!isExecutor(info, false))
            return;
        callUpdateExecutor();
    },
    ['asset-db:asset-delete'](uuid, info) {
        if (!isExecutor(info))
            return;
        callUpdateExecutor(true);
    }
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() {
    Editor.Message.request('asset-db', 'query-ready').then(ready => {
        if (!ready)
            return;
        updateExecutor();
    });
}
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() { }
exports.unload = unload;
