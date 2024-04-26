import { existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';

export function getResJson(name: 'builder'): { bundleConfig: object, textureCompressConfig: object } {
    const Assets = join(__dirname, '../res/json');
    const str = readFileSync(join(Assets, `${name}.json`), 'utf-8');
    return str ? JSON.parse(str) : null;
}

export function getResReadme(name: 'resources' | 'app' | 'app-appinit' | 'app-scene' | 'app-builtin' | 'app-bundle' | 'app-view' | 'app-admin' | 'app-controller' | 'app-manager' | 'app-model' | 'app-sound' | 'sound-effect' | 'sound-music' | 'view-expansion' | 'view-native' | 'res-bundle' | 'res-native' | 'view-resources') {
    const Assets = join(__dirname, '../res/readme');
    return readFileSync(join(Assets, `${name}.md`), 'utf-8');
}

export function getResMeta(name: 'resources' | 'custom-bundle' | 'app-admin' | 'app-controller' | 'app-manager' | 'app-model' | 'app-sound' | 'view-native' | 'view-resources'): { userData: object } {
    const Assets = join(__dirname, '../res/meta');
    const str = readFileSync(join(Assets, `${name}.meta`), 'utf-8');
    return str ? JSON.parse(str) : null;
}

export function getResPanel(name: string) {
    const Assets = join(__dirname, '../res/panel');
    return readFileSync(join(Assets, `components/${name}.html`), 'utf-8');
}

/**
 * 将串式命名转成驼峰命名
 * @param str 串式字符串
 * @param lower 首字母是否小写(默认大写)
 * @returns 
 */
export function stringCase(str: string, lower = false) {
    str = str.replace(/-/g, '_');
    const arr = str.split('_');

    return arr.map(function (str, index) {
        if (index === 0 && lower) {
            return str.charAt(0).toLocaleLowerCase() + str.slice(1);
        }
        return str.charAt(0).toLocaleUpperCase() + str.slice(1);
    }).join('');
}

/**
 * 将驼峰命名转成串式命名
 * @param str 驼峰字符串
 * @returns 
 */
export function stringCaseNegate(str: string) {
    return str.replace(/[A-Z]/g, (searchStr, startIndex) => {
        if (startIndex === 0) {
            return searchStr.toLocaleLowerCase();
        } else {
            return '-' + searchStr.toLocaleLowerCase();
        }
    });
}

/**
 * db下的路径转换为真实路径
 */
export function convertUrlToPath(url: string) {
    if (url.startsWith('db://assets')) {
        url = Editor.Utils.Path.join(Editor.Project.path, url.slice(5));
    } else if (url.startsWith('db://app')) {
        url = Editor.Utils.Path.join(Editor.Project.path, 'extensions/app/assets', url.slice(8));
    } else if (url.startsWith('db://pkg')) {
        url = Editor.Utils.Path.join(Editor.Project.path, 'extensions/pkg/node_modules', url.slice(8));
    }
    return url;
}

/**
 * 获取程序路径
 */
export function getProjectPath() {
    return Editor.Project.path;
}

/**
 * 根据db下的路径创建目录(不是文件)
 * 如果已存在不会重复创建
 */
export async function createFolderByUrl(url: string, opts?: { subPaths?: string[], meta?: { userData: object }, readme?: string, subFolders?: { folder: string, meta?: { userData: object }, readme?: string }[] }) {
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

        if (!existsSync(convertUrlToPath(pathHead))) {
            const result = await Editor.Message.request('asset-db', 'create-asset', pathHead, null).catch(_ => null);
            if (!result) return false;
        }
    }

    // 主目录meta
    if (opts?.meta) {
        await delayFileExistsByUrl(`${url}.meta`);
        await delay(100);
        const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', url).catch(_ => null);
        if (!queryMeta) return false;
        Object.assign(queryMeta.userData, opts.meta.userData);

        const result = await Editor.Message.request('asset-db', 'save-asset-meta', url, JSON.stringify(queryMeta)).catch(_ => null);
        if (!result) return false;
    }

    // 主目录readme
    if (opts?.readme) {
        writeFileSync(join(convertUrlToPath(url), `.${basename(url)}.md`), opts.readme);
    }

    // 创建子目录
    if (opts?.subPaths) {
        await delay(100);
        for (let index = 0; index < opts.subPaths.length; index++) {
            const subPath = `${pathHead}/${opts.subPaths[index]}`;
            if (!existsSync(convertUrlToPath(subPath))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', subPath, null).catch(_ => null);
                if (!result) return false;
            }
        }
    }

    if (opts?.subFolders) {
        await delay(100);
        for (let index = 0; index < opts.subFolders.length; index++) {
            const subOpts = opts.subFolders[index];
            const subUrl = `${pathHead}/${subOpts.folder}`;

            // 判断是否存在
            if (!existsSync(convertUrlToPath(subUrl))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', subUrl, null).catch(_ => null);
                if (!result) return false;
            }

            // meta
            if (subOpts.meta) {
                await delayFileExistsByUrl(`${subUrl}.meta`);
                const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', subUrl).catch(_ => null);
                if (!queryMeta) return false;
                Object.assign(queryMeta.userData, subOpts.meta.userData);

                const result = await Editor.Message.request('asset-db', 'save-asset-meta', subUrl, JSON.stringify(queryMeta)).catch(_ => null);
                if (!result) return false;
            }

            // readme
            if (subOpts.readme) {
                writeFileSync(join(convertUrlToPath(subUrl), `.${basename(subUrl)}.md`), subOpts.readme);
            }
        }
    }

    return true;
}

export function delay(time: number) {
    return new Promise((next) => {
        setTimeout(() => {
            next(null);
        }, time);
    });
}

/**
 * 等待文件存在
 */
export function delayFileExistsByUrl(url: string) {
    const path = convertUrlToPath(url);
    let timer: NodeJS.Timer | null = null;
    return new Promise((next) => {
        timer = setInterval(() => {
            if (existsSync(path)) {
                if (timer) clearInterval(timer);
                timer = null;
                next(null);
            }
        }, 100);
    });
}