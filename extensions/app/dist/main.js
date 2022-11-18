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
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const utils_1 = require("./panel/utils");
function isVaild(info, strict = true) {
    if (!strict) {
        if (info.path.endsWith('Control') && info.type === 'cc.Script')
            return true;
        if (info.path.endsWith('Manager') && (info.type === 'cc.Script' || info.type === 'cc.Prefab'))
            return true;
        if ((info.name.startsWith('data.') || info.name.startsWith('config.')) && info.type === 'cc.Script')
            return true;
        if ((info.name.startsWith('Page') || info.name.startsWith('Paper') || info.name.startsWith('Pop') || info.name.startsWith('Top'))
            && (info.type === 'cc.Script' || info.type === 'cc.Prefab'))
            return true;
        if (info.type === 'cc.AudioClip')
            return true;
        return false;
    }
    if (info.path.startsWith('db://assets/app-builtin/app-control')) {
        return info.path.endsWith('Control') && info.type === 'cc.Script';
    }
    if (info.path.startsWith('db://assets/app-builtin/app-manager')) {
        return info.path.endsWith('Manager') && (info.type === 'cc.Script' || info.type === 'cc.Prefab');
    }
    if (info.path.startsWith('db://assets/app-builtin/app-model')) {
        return (info.name.startsWith('data.') || info.name.startsWith('config.')) && info.type === 'cc.Script';
    }
    if (info.path.startsWith('db://assets/app-bundle/app-view')) {
        return (info.name.startsWith('Page') || info.name.startsWith('Paper') || info.name.startsWith('Pop') || info.name.startsWith('Top'))
            && (info.type === 'cc.Script' || info.type === 'cc.Prefab');
    }
    if (info.path.startsWith('db://assets/app-bundle/app-sound')) {
        return info.type === 'cc.AudioClip';
    }
}
const viewSelect = ['Page', 'Paper', 'Pop', 'Top'];
const viewRegExp = RegExp(`^(${viewSelect.join('|')})`);
function readFileSyncByURL(url) {
    const filepath = utils_1.convertPathToDir(url);
    return fs_1.existsSync(filepath) ? fs_1.readFileSync(filepath, 'utf8') : '';
}
function isTSDefault(value) {
    const extname = value[3];
    if (extname.endsWith('js')) {
        return false;
    }
    const filename = value[0];
    // const res = cc.require(filename);
    // const keys = Object.keys(res);
    // if (keys.length === 1 && keys[0] === 'default') {
    //     return true;
    // }
    // return false;
    // storage,db://assets/app/lib/storage,storage,ts
    const filepath = path_1.default.join(utils_1.convertPathToDir(value[1]), filename + '.ts');
    const js = fs_1.readFileSync(filepath, 'utf8');
    return js.search(/export\s+default/) >= 0;
}
const executorFile = 'executor.ts';
const executorPath = 'db://assets/app-builtin/app-admin';
const executorUrl = executorPath + '/' + executorFile;
const executorDir = utils_1.convertPathToDir(executorPath);
const keyWords = [
    'lib', 'manager', 'Manager', 'data', 'config',
    'IViewName', 'IViewNames', 'IMiniViewName', 'IMiniViewNames', 'IMusicName', 'IMusicNames', 'IEffecName', 'IEffecNames',
    'miniViewNames', 'viewNamesEnum', 'musicNamesEnum', 'effecNamesEnum'
];
async function updateExecutor(async = false) {
    // const results = await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://assets/{app-builtin,app-bundle}/**/*.!(png|jpg|json)' }).catch(_ => []);
    const result1 = async ? [] : await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://assets/app-builtin/{app-control,app-manager/*,app-model}/*.{ts,prefab}' }).catch(_ => []);
    const result2 = async ? [] : await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://assets/app-bundle/app-sound/{music,effect}/*.*' }).catch(_ => []);
    const result3 = async ? [] : await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://assets/app-bundle/app-view/{page,pop,top,paper/*}/*/native/*.{ts,prefab}' }).catch(_ => []);
    const result4 = async ? [] : await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://app/{lib,manager}/**/*.{ts,prefab}' }).catch(_ => []);
    const results = result1.slice().concat(result2).concat(result3).concat(result4);
    const libs = [];
    const mgrs = [];
    const datas = [];
    const confs = [];
    const viewKeys = {};
    const miniViewKeys = {};
    const musicKeys = {};
    const effecKeys = {};
    for (let index = 0; index < results.length; index++) {
        const result = results[index];
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
            const varname = filename.split('.').join('_');
            if (keyWords.indexOf(varname) >= 0) {
                console.log(`[跳过此文件] [${filename}] 原因: ${varname}与关键字中(${JSON.stringify(keyWords)})的一个重复`);
            }
            else if (dirname.includes('app-manager')) {
                // 用户manager
                if (filename.endsWith('Manager') && filename !== 'BaseManager') {
                    if (dirname.toLowerCase().includes(`app-manager/${filename.slice(0, -7).toLowerCase()}`)) {
                        mgrs.push([filename, dirname, varname, extname]);
                    }
                }
            }
            else if (dirname.includes('app/manager')) {
                // 系统manager
                if (filename.endsWith('Manager') && filename !== 'BaseManager') {
                    if (dirname.toLowerCase().includes(`app/manager/${filename.slice(0, -7).toLowerCase()}`)) {
                        mgrs.push([filename, dirname, varname, extname]);
                    }
                }
            }
            else if (dirname.endsWith(`app/lib/${filename}`)) {
                // lib
                libs.push([filename, dirname, varname, extname]);
            }
            else if (dirname.endsWith('model')) {
                // model
                if (filename.startsWith('data.')) {
                    datas.push([filename, dirname, varname, extname]);
                }
                else if (filename.startsWith('config.')) {
                    confs.push([filename, dirname, varname, extname]);
                }
            }
        }
        else if (extname === '.prefab') {
            if (dirname.indexOf('app-view/') >= 0 && viewRegExp.test(filename)) {
                const dirArray = dirname.split('/');
                const index = dirArray.indexOf('app-view');
                const viewDirArray = dirArray.slice(index + 1);
                // viewKeys
                if (['page', 'paper', 'pop', 'top'].indexOf(viewDirArray[0].toLowerCase()) >= 0) {
                    // 主界面
                    if (filename === `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}`) {
                        viewKeys[filename] = filename;
                    }
                    // 子界面
                    else if (filename === `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}${utils_1.stringCase(viewDirArray[2], false)}`) {
                        miniViewKeys[filename] = `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}`;
                    }
                }
                else {
                    if (filename === `${utils_1.stringCase(viewDirArray[1], false)}${utils_1.stringCase(viewDirArray[2], false)}`) {
                        viewKeys[filename] = filename;
                    }
                    // 子界面
                    else if (filename === `${utils_1.stringCase(viewDirArray[1], false)}${utils_1.stringCase(viewDirArray[2], false)}${utils_1.stringCase(viewDirArray[3], false)}`) {
                        miniViewKeys[filename] = `${utils_1.stringCase(viewDirArray[0], false)}${utils_1.stringCase(viewDirArray[1], false)}`;
                    }
                }
            }
        }
        else if (dirname.indexOf('app-sound/') >= 0) {
            const dir = path_1.default.join(dirname.split('app-sound/').pop(), filename);
            if (dir.startsWith('music')) {
                // musicKeys
                musicKeys[dir] = dir;
            }
            else {
                // effecKeys
                effecKeys[dir] = dir;
            }
        }
    }
    let result = `/* eslint-disable */\n` +
        `import { Component } from 'cc';\n` +
        `import { app } from '../../app/app';\n` +
        `import { DEV,EDITOR } from 'cc/env';\n\n`;
    const handle = function handle(arr, module) {
        arr.forEach(function (value, index, array) {
            // storage
            const filename = value[0];
            // db://assets/app/lib/storage
            const dirname = value[1];
            // storage
            const varname = value[2];
            if (isTSDefault(value)) {
                result += `import ${varname} from '${path_1.default.join(path_1.default.relative(executorDir, utils_1.convertPathToDir(dirname)), filename)}'\n`;
            }
            else if (module) {
                result += `import {${varname}} from '${path_1.default.join(path_1.default.relative(executorDir, utils_1.convertPathToDir(dirname)), filename)}'\n`;
            }
            else {
                result += `import * as ${varname} from '${path_1.default.join(path_1.default.relative(executorDir, utils_1.convertPathToDir(dirname)), filename)}'\n`;
            }
            array[index] = varname;
        });
    };
    // manager
    handle(mgrs, true);
    let MgrStr = '';
    let mgrStr = '';
    mgrs.forEach(function (varname, index, array) {
        MgrStr += `${varname.slice(0, -7)}:Omit<typeof ${varname},keyof Component>`;
        if (varname === 'UIManager') {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname}<IViewName,IMiniViewName>,keyof Component>`;
        }
        else if (varname === 'SoundManager') {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname}<IEffecName,IMusicName>,keyof Component>`;
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
        viewKeys['nerver'] = '';
    if (Object.keys(miniViewKeys).length === 0)
        miniViewKeys['nerver'] = '';
    if (Object.keys(musicKeys).length === 0)
        musicKeys['nerver'] = '';
    if (Object.keys(effecKeys).length === 0)
        effecKeys['nerver'] = '';
    result += 'enum viewNames { \'' + Object.keys(viewKeys).join('\',\'') + '\'}\n';
    result += 'const miniViewNames = ' + JSON.stringify(miniViewKeys) + '\n';
    result += 'enum musicNames { \'' + Object.keys(musicKeys).join('\',\'') + '\'}\n';
    result += 'enum effecNames { \'' + Object.keys(effecKeys).join('\',\'') + '\'}\n\n';
    result += 'export type IViewName = keyof typeof viewNames\n';
    result += 'export type IViewNames = IViewName[]\n';
    result += 'export type IMiniViewName = keyof typeof miniViewNames\n';
    result += 'export type IMiniViewNames = IMiniViewName[]\n';
    result += 'export type IMusicName = keyof typeof musicNames\n';
    result += 'export type IMusicNames = IMusicName[]\n';
    result += 'export type IEffecName = keyof typeof effecNames\n';
    result += 'export type IEffecNames = IEffecName[]\n\n';
    // data
    handle(datas, false);
    result += `if(!EDITOR||DEV) Object.assign(app.data, {${datas.map(varname => `${varname.slice(5)}:new ${varname}()`).join(',')}})\n`;
    // config
    handle(confs, false);
    result += `if(!EDITOR||DEV) Object.assign(app.config, {${confs.map(varname => `${varname.slice(7)}:new ${varname}()`).join(',')}})\n\n`;
    result += 'export type IApp = {\n';
    result += `    Manager: {${MgrStr}},\n`;
    result += `    manager: {${mgrStr}},\n`;
    result += `    data: {${datas.map(varname => `${varname.slice(5)}:${varname}`).join(',')}},\n`;
    result += `    config: {${confs.map(varname => `${varname.slice(7)}:${varname}`).join(',')}}\n`;
    result += '}\n';
    // save
    if (readFileSyncByURL(executorUrl) !== result) {
        // if(async)
        // writeFileSync(path.join(executorDir, executorFile), result, 'utf-8');
        await Editor.Message.request('asset-db', 'create-asset', executorUrl, result, {
            overwrite: true
        });
    }
}
let timer = null;
function callUpdateExecutor(sync = false) {
    if (timer)
        return;
    if (sync) {
        updateExecutor(true);
        callUpdateExecutor(false);
    }
    else {
        timer = setTimeout(() => {
            updateExecutor(false).finally(() => {
                timer = null;
            });
        }, 500);
    }
}
exports.methods = {
    ['open-panel']() {
        Editor.Panel.open(`app.open-panel`);
    },
    ['update-executor']() {
        callUpdateExecutor();
    },
    ['asset-db:ready']() {
        callUpdateExecutor();
    },
    ['asset-db:asset-add'](uuid, info) {
        if (!isVaild(info))
            return;
        callUpdateExecutor();
    },
    ['asset-db:asset-change'](uuid, info) {
        if (!isVaild(info, false))
            return;
        callUpdateExecutor();
    },
    ['asset-db:asset-delete'](uuid, info) {
        if (!isVaild(info))
            return;
        callUpdateExecutor(true);
    }
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() {
    Editor.Message.request('asset-db', 'query-ready')
        .then(ready => {
        if (ready)
            callUpdateExecutor();
    });
}
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() { }
exports.unload = unload;
