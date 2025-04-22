
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

// path.join不能正确处理'db://'结构，会把'//'变成'/'

import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { AssetInfo } from '../@types/packages/asset-db/@types/public';
import { convertUrlToPath, createFolderByUrl, getResMeta, getResReadme, stringCase, stringCaseNegate } from './utils';
const electron = require('electron');

const adminFolderName = 'app-admin';
const controllerFolderName = 'app-controller';
const managerFolderName = 'app-manager';
const modelFolderName = 'app-model';
const soundFolderName = 'app-sound';
const viewFolderName = 'app-view';
const builtinFolderName = 'app-builtin';
const bundleFolderName = 'app-bundle';

const pkgFolderUrl = 'db://pkg/';
const pkgFolderPath = convertUrlToPath(pkgFolderUrl);

const builtinFolderUrl = 'db://assets/' + builtinFolderName;
const builtinFolderPath = convertUrlToPath(builtinFolderUrl);

const bundleFolderUrl = 'db://assets/' + bundleFolderName;
const bundleFolderPath = convertUrlToPath(bundleFolderUrl);

const adminFolderUrl = builtinFolderUrl + '/' + adminFolderName;
const adminFolderPath = builtinFolderPath + '/' + adminFolderName;

const controllerFolderUrl = builtinFolderUrl + '/' + controllerFolderName;
const controllerFolderPath = builtinFolderPath + '/' + controllerFolderName;

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

function isExecutor(info: AssetInfo, strict = true) {
    if (!strict) {
        if (info.path.endsWith('Controller') && info.type === 'cc.Script') return true;
        if (info.path.endsWith('Manager') && (info.type === 'cc.Script' || info.type === 'cc.Prefab')) return true;
        if ((info.name.startsWith('data.') || info.name.startsWith('config.') || info.name.startsWith('store.')) && info.type === 'cc.Script') return true;
        if ((info.name.startsWith('Page') || info.name.startsWith('Paper') || info.name.startsWith('Pop') || info.name.startsWith('Top'))
            && (info.type === 'cc.Script' || info.type === 'cc.Prefab' || info.type === 'cc.Scene' || info.type === 'cc.SceneAsset')) return true;
        if (info.type === 'cc.AudioClip') return true;

        return false;
    }

    if (info.path === builtinFolderUrl) return true;
    if (info.path === bundleFolderUrl) return true;
    if (info.path === managerFolderUrl) return true;
    if (info.path === controllerFolderUrl) return true;
    if (info.path === modelFolderUrl) return true;
    if (info.path === soundFolderUrl) return true;
    if (info.path === viewFolderUrl) return true;

    if (info.path.startsWith(controllerFolderUrl)) {
        return info.path.endsWith('Controller') && info.type === 'cc.Script';
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

function compareStr(str1: string, str2: string) {
    if (str1 === str2) {
        return 0;
    }
    const len = Math.max(str1.length, str2.length);
    for (let i = 0, code1 = 0, code2 = 0; i < len; i++) {
        if (str1.length <= i) {
            return -1;
        } else if (str2.length <= i) {
            return 1;
        } else {
            code1 = str1.charCodeAt(i);
            code2 = str2.charCodeAt(i);
            if (code1 > code2) {
                return 1;
            } else if (code1 < code2) {
                return -1;
            }
        }
    }
    return 0;
}

const viewSelect = ['Page', 'Paper', 'Pop', 'Top'];
const viewRegExp = RegExp(`^(${viewSelect.join('|')})`);

function readFileSyncByPath(url: string) {
    const filepath = convertUrlToPath(url);
    return existsSync(filepath) ? readFileSync(filepath, 'utf8') : '';
}

function isTSDefault(value: string[]) {
    // const varname = value[0];
    const filename = value[1];
    const dirname = value[2];
    const extname = value[3];

    if (extname.endsWith('js')) {
        return false;
    }

    const filepath = path.join(convertUrlToPath(dirname), filename + '.ts');
    const js = readFileSync(filepath, 'utf8');
    return js.search(/export\s+default/) >= 0;
}

const keyWords = [
    'lib', 'manager', 'Manager', 'controller', 'Controller', 'data', 'config', 'store',
    'IViewName', 'IViewNames', 'IMiniViewName', 'IMiniViewNames', 'IMusicName', 'IMusicNames', 'IEffectName', 'IEffectNames',
    'ViewName', 'MiniViewName', 'MusicName', 'EffectName'
];

async function clearExecutor() {
    if (!existsSync(executorFilePath)) return;

    let result = '/* eslint-disable */\n' +
        'import { Component } from \'cc\';\n' +
        'import { app } from \'../../app/app\';\n' +
        'import { EDITOR,EDITOR_NOT_IN_PREVIEW } from \'cc/env\';\n\n';

    result += 'export type IReadOnly<T> = { readonly [P in keyof T]: T[P] extends Function ? T[P] : (T[P] extends Object ? IReadOnly<T[P]> : T[P]); };\n\n';

    result += 'export type IViewName = "never"\n';
    result += 'export type IViewNames = IViewName[]\n';
    result += 'export type IMiniViewName = "never"\n';
    result += 'export type IMiniViewNames = IMiniViewName[]\n';
    result += 'export type IMusicName = "never"\n';
    result += 'export type IMusicNames = IMusicName[]\n';
    result += 'export type IEffectName = "never"\n';
    result += 'export type IEffectNames = IEffectName[]\n\n';

    result += 'export type IApp = {\n';
    result += '    Controller: {},\n';
    result += '    controller: {},\n';
    result += '    Manager: {},\n';
    result += '    manager: {},\n';
    result += '    data: {},\n';
    result += '    config: {}\n';
    result += '    store: {}\n';
    result += '}\n';

    // config
    result += 'if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.config, {})\n';
    // data
    result += 'if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.data, {})\n';
    // store
    result += 'if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.store, {})\n\n';
    // controller
    result += 'if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.Controller, {})\n';
    result += 'if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.controller, {})\n\n';

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
    if (!existsSync(builtinFolderPath)) await createFolderByUrl(builtinFolderUrl, { readme: getResReadme(builtinFolderName) });
    // app-admin文件夹不存在, 创建
    if (!existsSync(adminFolderPath)) await createFolderByUrl(adminFolderUrl, { meta: getResMeta(adminFolderName), readme: getResReadme(adminFolderName) });

    const mgrList: string[][] = [];
    const ctrList: string[][] = [];
    const dataList: string[][] = [];
    const confList: string[][] = [];
    const storeList: string[][] = [];

    const viewScene: { [name in string]: boolean } = {};
    const miniViewKeys: { [name in string]: string } = {};
    const musicKeys: { [name in string]: string } = {};
    const effectKeys: { [name in string]: string } = {};

    // app-controller app-manager app-model
    const result1: AssetInfo[] = await Editor.Message.request('asset-db', 'query-assets', { pattern: builtinFolderUrl + '/{app-controller,app-manager/*,app-model}/*.ts' })
        .then(res => {
            return res.sort((a, b) => compareStr(a.name, b.name));
        })
        .catch(() => []);
    // app-sound
    const result2: AssetInfo[] = await Editor.Message.request('asset-db', 'query-assets', { pattern: soundFolderUrl + '/{music,effect}/**/*.*' })
        .then(res => {
            return res.sort((a, b) => compareStr(a.name, b.name));
        })
        .catch(() => []);
    // app-view
    const result3: AssetInfo[] = await Editor.Message.request('asset-db', 'query-assets', { pattern: viewFolderUrl + '/{page,pop,top,paper/*}/*/native/*.{prefab,scene}' })
        .then(res => {
            return res.sort((a, b) => compareStr(a.name, b.name));
        })
        .catch(() => []);
    // manager
    const result4: AssetInfo[] = await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://app/manager/**/*.ts' })
        .then(res => {
            return res.sort((a, b) => compareStr(a.name, b.name));
        })
        .catch(() => []);
    // 集合
    const results: AssetInfo[] = result1.slice().concat(result2).concat(result3).concat(result4);

    for (let index = 0; index < results.length; index++) {
        const result = results[index];
        const fileUrl = result.url;
        // 文件名.扩展名
        const basename = path.basename(result.url || '') || '';
        // 扩展名
        const extname = path.extname(result.url || '') || '';
        // 文件名
        const filename = basename.slice(0, -extname.length);
        // 文件目录名
        const dirname = path.dirname(result.url || '') || '';

        if (!basename) continue;
        if (!extname) continue;
        if (!filename) continue;
        if (!dirname) continue;

        if (extname === '.ts') {
            // 变量名
            const varname = filename.replace(/[.-]/g, '_');

            if (keyWords.indexOf(varname) >= 0) {
                console.log(`[跳过此文件] [${filename}] 原因: ${varname}与关键字中(${JSON.stringify(keyWords)})的一个重复`);
            }
            else if (fileUrl.startsWith(controllerFolderUrl)) {
                // 用户controller
                if (filename.endsWith('Controller')) {
                    ctrList.push([varname, filename, dirname, extname]);
                }
            }
            else if (fileUrl.startsWith(managerFolderUrl)) {
                // 用户manager
                if (filename.endsWith('Manager') && dirname.endsWith(stringCaseNegate(filename.slice(0, -7)))) {
                    mgrList.push([varname, filename, dirname, extname]);
                }
            }
            else if (fileUrl.startsWith('db://app/manager/')) {
                // 系统manager(系统Mgr的文件夹命名为了美观没有那么规范，所以和用户Mgr的逻辑有区别)
                if (filename.endsWith('Manager') && dirname.endsWith(filename.slice(0, -7).toLocaleLowerCase())) {
                    mgrList.push([varname, filename, dirname, extname]);
                }
            }
            else if (fileUrl.startsWith(modelFolderUrl)) {
                // model
                if (filename.startsWith('data.')) {
                    dataList.push([varname, filename, dirname, extname]);
                } else if (filename.startsWith('config.')) {
                    confList.push([varname, filename, dirname, extname]);
                } else if (filename.startsWith('store.')) {
                    storeList.push([varname, filename, dirname, extname]);
                }
            }
        } else if (extname === '.prefab' || extname === '.scene') {
            if (fileUrl.startsWith(viewFolderUrl) && viewRegExp.test(filename)) {
                const dirArray = dirname.split('/');
                const index = dirArray.indexOf(viewFolderName);
                const viewDirArray = dirArray.slice(index + 1);

                if (['page', 'paper', 'pop', 'top'].indexOf(viewDirArray[0].toLocaleLowerCase()) >= 0) {
                    // 主界面
                    if (filename === `${stringCase(viewDirArray[0], false)}${stringCase(viewDirArray[1], false)}`) {
                        viewScene[filename] = extname === '.scene';
                    }
                    // 子界面
                    else if (filename === `${stringCase(viewDirArray[0], false)}${stringCase(viewDirArray[1], false)}${stringCase(viewDirArray[2], false)}`) {
                        miniViewKeys[filename] = `${stringCase(viewDirArray[0], false)}${stringCase(viewDirArray[1], false)}`;
                    }
                } else {
                    // 主界面
                    if (filename === `${stringCase(viewDirArray[1], false)}${stringCase(viewDirArray[2], false)}`) {
                        viewScene[filename] = extname === '.scene';
                    }
                    // 子界面
                    else if (filename === `${stringCase(viewDirArray[1], false)}${stringCase(viewDirArray[2], false)}${stringCase(viewDirArray[3], false)}`) {
                        miniViewKeys[filename] = `${stringCase(viewDirArray[0], false)}${stringCase(viewDirArray[1], false)}`;
                    }
                }
            }
        } else if (fileUrl.startsWith(soundFolderUrl)) {
            const dir = path.join(dirname.split(soundFolderName + '/').pop(), filename);
            if (dir.startsWith('music')) {
                // musicKeys
                musicKeys[dir] = dir;
            } else {
                // effectKeys
                effectKeys[dir] = dir;
            }
        }
    }

    // const pkgNames: string[] = [];
    // if (existsSync(pkgFolderPath)) {
    //     readdirSync(pkgFolderPath).forEach(function (item) {
    //         const item_path = path.join(pkgFolderPath, item);
    //         const item_stat = statSync(item_path);
    //         if (!item_stat.isDirectory()) return;
    //         const item_name = path.basename(item_path);
    //         if (item_name.startsWith('@')) {
    //             readdirSync(item_path).forEach(function (sub) {
    //                 const sub_path = path.join(item_path, sub);
    //                 const sub_stat = statSync(sub_path);
    //                 if (!sub_stat.isDirectory()) return;
    //                 const sub_name = path.basename(sub_path);
    //                 pkgNames.push(item_name + '/' + sub_name);
    //             });
    //         } else {
    //             pkgNames.push(item_name);
    //         }
    //     });
    // }

    let result = '/* eslint-disable */\n' +
        'import { Component,director,Director } from \'cc\';\n' +
        'import { app } from \'../../app/app\';\n' +
        'import { EDITOR,EDITOR_NOT_IN_PREVIEW } from \'cc/env\';\n\n';

    result += 'export type IReadOnly<T> = { readonly [P in keyof T]: T[P] extends Function ? T[P] : (T[P] extends Object ? IReadOnly<T[P]> : T[P]); };\n\n';

    result += `export type IViewName = ${Object.keys(viewScene).map(str => `"${str}"`).join('|') || '"never"'}\n`;
    result += 'export type IViewNames = IViewName[]\n';
    result += `export type IMiniViewName = ${Object.keys(miniViewKeys).map(str => `"${str}"`).join('|') || '"never"'}\n`;
    result += 'export type IMiniViewNames = IMiniViewName[]\n';
    result += `export type IMusicName = ${Object.keys(musicKeys).map(str => `"${str}"`).join('|') || '"never"'}\n`;
    result += 'export type IMusicNames = IMusicName[]\n';
    result += `export type IEffectName = ${Object.keys(effectKeys).map(str => `"${str}"`).join('|') || '"never"'}\n`;
    result += 'export type IEffectNames = IEffectName[]\n\n';

    // pkgNames.forEach(name => result += `import 'db://pkg/${name}'\n`);

    const writeImport = function writeImport(arr: string[][], module: boolean) {
        return arr.forEach(function (value) {
            const varname = value[0];
            const filename = value[1];
            const dirname = value[2];

            if (isTSDefault(value)) {
                result += `import ${varname} from '${path.join(path.relative(adminFolderPath, convertUrlToPath(dirname)), filename)}'\n`;
            } else if (module) {
                result += `import {${varname}} from '${path.join(path.relative(adminFolderPath, convertUrlToPath(dirname)), filename)}'\n`;
            } else {
                result += `import * as ${varname} from '${path.join(path.relative(adminFolderPath, convertUrlToPath(dirname)), filename)}'\n`;
            }
        });
    };

    writeImport(confList, false);
    writeImport(dataList, false);
    writeImport(storeList, false);
    writeImport(ctrList, true);
    writeImport(mgrList, true);

    // controller
    let ctrStr = '';
    let CtrStr = '';
    ctrList.forEach(function ([varname], index, array) {
        CtrStr += `${varname.slice(0, -10)}:typeof ${varname}`;
        ctrStr += `${varname.slice(0, -10).toLocaleLowerCase()}:IReadOnly<${varname}>`;
        if (index < array.length - 1) {
            CtrStr += ',';
            ctrStr += ',';
        }
    });

    // manager
    let mgrStr = '';
    let MgrStr = '';
    mgrList.forEach(function ([varname], index, array) {
        MgrStr += `${varname.slice(0, -7)}:Omit<typeof ${varname},keyof Component>`;
        if (varname === 'UIManager') {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname}<IViewName,IMiniViewName>,keyof Component>`;
        } else if (varname === 'SoundManager') {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname}<IEffectName,IMusicName>,keyof Component>`;
        } else {
            mgrStr += `${varname.slice(0, -7).toLocaleLowerCase()}:Omit<${varname},keyof Component>`;
        }
        if (index < array.length - 1) {
            MgrStr += ',';
            mgrStr += ',';
        }
    });

    result += 'export type IApp = {\n';
    result += `    Controller: {${CtrStr}},\n`;
    result += `    controller: {${ctrStr}},\n`;
    result += `    Manager: {${MgrStr}},\n`;
    result += `    manager: {${mgrStr}},\n`;
    result += `    data: {${dataList.map(([varname]) => `${varname.slice(5)}:${varname}`).join(',')}},\n`;
    result += `    config: {${confList.map(([varname]) => `${varname.slice(7)}:IReadOnly<${varname}>`).join(',')}}\n`;
    result += `    store: {${storeList.map(([varname]) => `${varname.slice(6)}:IReadOnly<${varname}>`).join(',')}}\n`;
    result += '}\n\n';

    result += 'function init(){\n';
    // config
    result += `if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.config, {${confList.map(([varname]) => `${varname.slice(7)}:new ${varname}()`).join(',')}})\n`;
    // data
    result += `if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.data, {${dataList.map(([varname]) => `${varname.slice(5)}:new ${varname}()`).join(',')}})\n`;
    // store
    result += `if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.store, {${storeList.map(([varname]) => `${varname.slice(6)}:new ${varname}()`).join(',')}})\n\n`;
    // controller
    result += `if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.Controller, {${ctrList.map(([varname]) => `${varname.slice(0, -10)}:${varname}`).join(',')}})\n`;
    result += `if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.controller, {${ctrList.map(([varname]) => `${varname.slice(0, -10).toLocaleLowerCase()}:new ${varname}()`).join(',')}})\n`;
    result += '}\n';
    result += 'if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) director.on(Director.EVENT_RESET,init)\n';
    result += 'if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) init()\n';

    // 修正windows系统中的\为/
    result = result.replace(/\\/g, '/');

    // save
    if (readFileSyncByPath(executorFileUrl) !== result) {
        await Editor.Message.request('asset-db', 'create-asset', executorFileUrl, result, {
            overwrite: true
        });
    }
}

let timer: NodeJS.Timeout | null = null;
function callUpdateExecutor(clear = false) {
    if (timer) return;
    if (clear) {
        clearExecutor();
        callUpdateExecutor(false);
    } else {
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
        const hackCode = readFileSync(path.join(__dirname, '../res/mark.js'), 'utf-8');
        webContents.executeJavaScript(hackCode);
    }
}

export const methods: { [key: string]: (...any: any) => any } = {
    ['open-panel']() {
        Editor.Panel.open('app.open-panel');
    },
    ['open-wiki']() {
        const url = 'https://gitee.com/cocos2d-zp/xforge/wikis/pages';
        Editor.Message.send('program', 'open-url', url);
    },
    ['open-issues']() {
        const url = 'https://gitee.com/cocos2d-zp/xforge/issues';
        Editor.Message.send('program', 'open-url', url);
    },
    ['open-github']() {
        const url = 'https://github.com/a1076559139/XForge';
        Editor.Message.send('program', 'open-url', url);
    },
    ['open-store']() {
        const url = 'https://store.cocos.com/app/search?name=xforge';
        Editor.Message.send('program', 'open-url', url);
    },
    ['refresh-executor']() {
        // 点击更新
        callUpdateExecutor();
        console.log('[executor.ts] 刷新成功');
    },
    ['scene:ready']() {
        // 
    },
    ['asset-db:ready']() {
        updateExecutor();
        updateMark();
    },
    ['asset-db:asset-add'](uuid: string, info: AssetInfo) {
        if (!isExecutor(info)) return;
        callUpdateExecutor();
    },
    ['asset-db:asset-change'](uuid: string, info: AssetInfo) {
        if (!isExecutor(info, false)) return;
        callUpdateExecutor();
    },
    ['asset-db:asset-delete'](uuid: string, info: AssetInfo) {
        if (!isExecutor(info)) return;
        callUpdateExecutor(true);
    }
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() {
    Editor.Message.request('asset-db', 'query-ready').then(ready => {
        if (!ready) return;
        updateExecutor();
    });
}

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() { }
