
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

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { AssetInfo } from '../@types/packages/asset-db/@types/public';
import { convertUrlToPath, createFolderByUrl, getProjectPath, getResJson, getResMeta, getResReadme, stringCase, stringCaseNegate } from './utils';

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
const builtinFolderPath = convertUrlToPath(builtinFolderUrl);

const bundleFolderUrl = 'db://assets/' + bundleFolderName;
const bundleFolderPath = convertUrlToPath(bundleFolderUrl);

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

// 非法的文件夹
function isIllegalFolder(info: AssetInfo) {
    if (!info.path) return false;
    if (!info.isDirectory) return false;
    if (!info.path.startsWith('db://assets')) return false;

    const cleanPath = info.path.slice('db://'.length);
    if (path.dirname(cleanPath) !== 'assets') return false;

    const basename = path.basename(cleanPath);
    if (basename === 'app') return false;
    if (basename === 'app-appinit') return false;
    if (basename === 'app-builtin') return false;
    if (basename === 'app-bundle') return false;
    if (basename === 'app-scene') return false;
    if (basename === 'res-bundle') return false;
    if (basename === 'res-native') return false;
    if (basename === 'resources') return false;

    return true;
}

async function moveIllegalFolders(infos: AssetInfo[] = null) {
    if (!infos) {
        infos = await Editor.Message.request('asset-db', 'query-assets', { pattern: 'db://assets/*' })
            .catch(() => []);
    }

    // 非法文件夹
    const illegalPaths = infos.filter(info => isIllegalFolder(info)).map(info => info.path);
    if (illegalPaths.length === 0) return;

    // 创建文件夹
    const folderName = 'res-native';
    const folderPath = `db://assets/${folderName}`;
    if (!await createFolderByUrl(folderPath, { readme: getResReadme(folderName) })) {
        Editor.Dialog.error(`${illegalPaths.join('\r\n')}\r\n只允许使用插件App创建的文件夹`, { title: '非法文件夹', buttons: ['确认'] });
        return;
    }

    illegalPaths.forEach(async illegalPath => {
        const basename = path.basename(illegalPath);
        console.log('移动:', illegalPath, '->', folderPath + '/' + basename);
        await Editor.Message.request('asset-db', 'move-asset', illegalPath, folderPath + '/' + basename);
    });
}

function isExecutor(info: AssetInfo, strict = true) {
    if (!strict) {
        if (info.path.endsWith('Control') && info.type === 'cc.Script') return true;
        if (info.path.endsWith('Manager') && (info.type === 'cc.Script' || info.type === 'cc.Prefab')) return true;
        if ((info.name.startsWith('data.') || info.name.startsWith('config.')) && info.type === 'cc.Script') return true;
        if ((info.name.startsWith('Page') || info.name.startsWith('Paper') || info.name.startsWith('Pop') || info.name.startsWith('Top'))
            && (info.type === 'cc.Script' || info.type === 'cc.Prefab' || info.type === 'cc.Scene' || info.type === 'cc.SceneAsset')) return true;
        if (info.type === 'cc.AudioClip') return true;

        return false;
    }

    if (info.path === builtinFolderUrl) return true;
    if (info.path === bundleFolderUrl) return true;
    if (info.path === managerFolderUrl) return true;
    if (info.path === controlFolderUrl) return true;
    if (info.path === modelFolderUrl) return true;
    if (info.path === soundFolderUrl) return true;
    if (info.path === viewFolderUrl) return true;

    if (info.path.startsWith(controlFolderUrl)) {
        return info.path.endsWith('Control') && info.type === 'cc.Script';
    }
    if (info.path.startsWith(managerFolderUrl)) {
        return info.path.endsWith('Manager') && (info.type === 'cc.Script' || info.type === 'cc.Prefab');
    }
    if (info.path.startsWith(modelFolderUrl)) {
        return (info.name.startsWith('data.') || info.name.startsWith('config.')) && info.type === 'cc.Script';
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

    const filepath = path.join(convertUrlToPath(value[1]), filename + '.ts');
    const js = readFileSync(filepath, 'utf8');
    return js.search(/export\s+default/) >= 0;
}

const keyWords = [
    'lib', 'manager', 'Manager', 'data', 'config',
    'IViewName', 'IViewNames', 'IMiniViewName', 'IMiniViewNames', 'IMusicName', 'IMusicNames', 'IEffectName', 'IEffectNames',
    'viewNames', 'miniViewNames', 'musicNames', 'effectNames'
];

async function clearExecutor() {
    if (!existsSync(executorFilePath)) return;

    const viewKeys = { never: '' };
    const miniViewKeys = { never: '' };
    const musicKeys = { never: '' };
    const effectKeys = { never: '' };

    let result = '/* eslint-disable */\n' +
        'import { Component } from \'cc\';\n' +
        'import { app } from \'../../app/app\';\n' +
        'import { DEV, EDITOR } from \'cc/env\';\n\n';

    result += 'enum viewNames { \'' + Object.keys(viewKeys).join('\',\'') + '\'}\n';
    result += 'const miniViewNames = ' + JSON.stringify(miniViewKeys) + '\n';
    result += 'enum musicNames { \'' + Object.keys(musicKeys).join('\',\'') + '\'}\n';
    result += 'enum effectNames { \'' + Object.keys(effectKeys).join('\',\'') + '\'}\n\n';

    result += 'export type IViewName = keyof typeof viewNames\n';
    result += 'export type IViewNames = IViewName[]\n';
    result += 'export type IMiniViewName = keyof typeof miniViewNames\n';
    result += 'export type IMiniViewNames = IMiniViewName[]\n';
    result += 'export type IMusicName = keyof typeof musicNames\n';
    result += 'export type IMusicNames = IMusicName[]\n';
    result += 'export type IEffectName = keyof typeof effectNames\n';
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
    result += '    scene: IViewName[]\n';
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
    if (!existsSync(builtinFolderPath)) await createFolderByUrl(builtinFolderUrl, { readme: getResReadme(builtinFolderName) });
    // app-admin文件夹不存在, 创建
    if (!existsSync(adminFolderPath)) await createFolderByUrl(adminFolderUrl, { meta: getResMeta(adminFolderName), readme: getResReadme(adminFolderName) });

    const mgrList: any[] = [];
    const dataList: any[] = [];
    const confList: any[] = [];

    const viewKeys: { [name in string]: boolean } = {};
    const miniViewKeys: { [name in string]: string } = {};
    const musicKeys: { [name in string]: string } = {};
    const effectKeys: { [name in string]: string } = {};

    // app-control app-manager app-model
    const result1: AssetInfo[] = await Editor.Message.request('asset-db', 'query-assets', { pattern: builtinFolderUrl + '/{app-control,app-manager/*,app-model}/*.ts' })
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
            else if (fileUrl.startsWith(managerFolderUrl)) {
                // 用户manager
                if (filename.endsWith('Manager') && dirname.endsWith(stringCaseNegate(filename.slice(0, -7)))) {
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
                } else if (filename.startsWith('config.')) {
                    confList.push([filename, dirname, varname, extname]);
                }
            }
        } else if (extname === '.prefab' || extname === '.scene') {
            if (fileUrl.startsWith(viewFolderUrl) && viewRegExp.test(filename)) {
                const dirArray = dirname.split('/');
                const index = dirArray.indexOf(viewFolderName);
                const viewDirArray = dirArray.slice(index + 1);

                // viewKeys
                if (['page', 'paper', 'pop', 'top'].indexOf(viewDirArray[0].toLowerCase()) >= 0) {
                    // 主界面
                    if (filename === `${stringCase(viewDirArray[0], false)}${stringCase(viewDirArray[1], false)}`) {
                        viewKeys[filename] = extname === '.scene';
                    }
                    // 子界面
                    else if (filename === `${stringCase(viewDirArray[0], false)}${stringCase(viewDirArray[1], false)}${stringCase(viewDirArray[2], false)}`) {
                        miniViewKeys[filename] = `${stringCase(viewDirArray[0], false)}${stringCase(viewDirArray[1], false)}`;
                    }
                } else {
                    // 主界面
                    if (filename === `${stringCase(viewDirArray[1], false)}${stringCase(viewDirArray[2], false)}`) {
                        viewKeys[filename] = extname === '.scene';
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

    const pkgs: string[] = [];
    const pkgAssetsPath = convertUrlToPath(pkgFolderUrl);
    if (existsSync(pkgAssetsPath)) {
        readdirSync(pkgAssetsPath).forEach(function (item) {
            const item_path = path.join(pkgAssetsPath, item);
            const item_stat = statSync(item_path);
            if (!item_stat.isDirectory()) return;
            const item_name = path.basename(item_path);
            if (item_name.startsWith('@')) {
                readdirSync(item_path).forEach(function (sub) {
                    const sub_path = path.join(item_path, sub);
                    const sub_stat = statSync(sub_path);
                    if (!sub_stat.isDirectory()) return;
                    const sub_name = path.basename(sub_path);
                    pkgs.push(item_name + '/' + sub_name);
                });
            } else {
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

    const handle = function handle(arr: any[], module: boolean) {
        arr.forEach(function (value, index, array) {
            // storage
            const filename = value[0];
            // db://assets/app/lib/storage
            const dirname = value[1];
            // storage
            const varname = value[2];
            if (isTSDefault(value)) {
                result += `import ${varname} from '${path.join(path.relative(adminFolderPath, convertUrlToPath(dirname)), filename)}'\n`;
            } else if (module) {
                result += `import {${varname}} from '${path.join(path.relative(adminFolderPath, convertUrlToPath(dirname)), filename)}'\n`;
            } else {
                result += `import * as ${varname} from '${path.join(path.relative(adminFolderPath, convertUrlToPath(dirname)), filename)}'\n`;
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
    if (Object.keys(viewKeys).length === 0) viewKeys['never'] = false;
    if (Object.keys(miniViewKeys).length === 0) miniViewKeys['never'] = '';
    if (Object.keys(musicKeys).length === 0) musicKeys['never'] = '';
    if (Object.keys(effectKeys).length === 0) effectKeys['never'] = '';

    result += 'enum viewNames { \'' + Object.keys(viewKeys).join('\',\'') + '\'}\n';
    result += 'const miniViewNames = ' + JSON.stringify(miniViewKeys) + '\n';
    result += 'export enum musicNames { \'' + Object.keys(musicKeys).join('\',\'') + '\'}\n';
    result += 'export enum effectNames { \'' + Object.keys(effectKeys).join('\',\'') + '\'}\n\n';

    result += 'export type IViewName = keyof typeof viewNames\n';
    result += 'export type IViewNames = IViewName[]\n';
    result += 'export type IMiniViewName = keyof typeof miniViewNames\n';
    result += 'export type IMiniViewNames = IMiniViewName[]\n';
    result += 'export type IMusicName = keyof typeof musicNames\n';
    result += 'export type IMusicNames = IMusicName[]\n';
    result += 'export type IEffectName = keyof typeof effectNames\n';
    result += 'export type IEffectNames = IEffectName[]\n\n';

    // scene
    result += `if(!EDITOR||DEV) Array.prototype.push.apply(app.scene, ${JSON.stringify(Object.keys(viewKeys).filter(key => viewKeys[key]))})\n`;

    // data
    handle(dataList, false);
    result += `if(!EDITOR||DEV) Object.assign(app.data, {${dataList.map(varname => `${varname.slice(5)}:new ${varname}()`).join(',')}})\n`;

    // config
    handle(confList, false);
    result += `if(!EDITOR||DEV) Object.assign(app.config, {${confList.map(varname => `${varname.slice(7)}:new ${varname}()`).join(',')}})\n\n`;

    result += 'export type IApp = {\n';
    result += `    Manager: {${MgrStr}},\n`;
    result += `    manager: {${mgrStr}},\n`;
    result += `    data: {${dataList.map(varname => `${varname.slice(5)}:${varname}`).join(',')}},\n`;
    result += `    config: {${confList.map(varname => `${varname.slice(7)}:${varname}`).join(',')}}\n`;
    result += '    scene: IViewName[]\n';
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

function updateBuilder() {
    const builder = getResJson('builder');

    const sourcePath = path.join(getProjectPath(), 'settings/v2/packages/builder.json');
    const str = readFileSync(sourcePath, 'utf-8');
    const source = JSON.parse(str);

    const overwriteKeys = builder.bundleConfig['custom'] ? Object.keys(builder.bundleConfig['custom']) : [];

    const handle = (data: object, out: object) => {
        for (const key in data) {
            if (!Object.prototype.hasOwnProperty.call(data, key)) {
                continue;
            }
            if (!out[key]) {
                out[key] = data[key];
                continue;
            }
            if (overwriteKeys.indexOf(key) >= 0) {
                out[key] = data[key];
                continue;
            }
            if (data[key] && typeof data[key] === 'object' && out[key] && typeof out[key] === 'object') {
                handle(data[key], out[key]);
            }
        }
    };

    handle(builder, source);
    writeFileSync(sourcePath, JSON.stringify(source, null, '  '), { encoding: 'utf-8' });
}

export const methods: { [key: string]: (...any: any) => any } = {
    ['open-panel']() {
        Editor.Panel.open('app.open-panel');
    },
    ['update-executor']() {
        // 点击更新
        updateBuilder();
        callUpdateExecutor();
    },
    ['scene:ready']() {
        moveIllegalFolders();

    },
    ['asset-db:ready']() {
        updateExecutor();
    },
    ['asset-db:asset-add'](uuid: string, info: AssetInfo) {
        if (isIllegalFolder(info)) {
            moveIllegalFolders([info]);
            // Editor.Dialog.error(`${info.path}\r\n只允许使用插件App创建的文件夹`, { title: '非法文件夹', buttons: ['确认'] });
            // Editor.Message.request('asset-db', 'delete-asset', info.path);
            return;
        }
        if (!isExecutor(info)) return;
        callUpdateExecutor();
    },
    ['asset-db:asset-change'](uuid: string, info: AssetInfo) {
        if (isIllegalFolder(info)) {
            moveIllegalFolders([info]);
            // Editor.Dialog.error(`${info.path}\r\n只允许使用插件App创建的文件夹`, { title: '非法文件夹', buttons: ['确认'] });
            // Editor.Message.request('asset-db', 'delete-asset', info.path);
            return;
        }
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
    updateBuilder();
    Editor.Message.request('asset-db', 'query-ready')
        .then(ready => {
            if (!ready) return;
            updateExecutor();
        });
}

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() { }
