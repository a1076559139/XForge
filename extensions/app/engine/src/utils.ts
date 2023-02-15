import { existsSync, readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';

export function getReadme(name: 'app' | 'app-appinit' | 'app-scene' | 'app-builtin' | 'app-bundle' | 'app-view' | 'app-admin' | 'app-control' | 'app-manager' | 'app-model' | 'app-sound' | 'effect' | 'music' | 'expansion' | 'native' | 'res-bundle' | 'res-native' | 'resources') {
    const Assets = join(__dirname, '../res/readme');
    return readFileSync(join(Assets, `.${name}.md`), 'utf-8');
}

export function getMeta(name: 'app-admin' | 'app-control' | 'app-manager' | 'app-model' | 'app-sound'): { userData: object } {
    const Assets = join(__dirname, '../res/meta');
    const str = readFileSync(join(Assets, `${name}.meta`), 'utf-8');
    return str ? JSON.parse(str) : null;
}

export function getTemplate(name: string) {
    const Assets = join(__dirname, '../res/panel');
    return readFileSync(join(Assets, `components/${name}.html`), 'utf-8');
}

/**
 * 首字母大写或小写(默认大写)
 * @returns 
 */
export function stringCase(str: string, lower = false) {
    str = str.replace(/-/g, '_');
    const arr = str.split('_');

    return arr.map(function (str, index) {
        if (index === 0 && lower) {
            return str.charAt(0).toLowerCase() + str.slice(1);
        }
        return str.charAt(0).toUpperCase() + str.slice(1);
    }).join('');
}

/**
 * db下的路径转换为真实路径
 */
export function convertPathToDir(path: string) {
    if (path.startsWith('db://assets')) {
        path = Editor.Utils.Path.join(Editor.Project.path, path.slice(5));
    } else if (path.startsWith('db://app')) {
        path = Editor.Utils.Path.join(Editor.Project.path, 'extensions/app/assets', path.slice(8));
    }
    return path;
}

/**
 * 根据db下的路径创建目录(不是文件)
 * 如果已存在不会重复创建
 */
export async function createFolderByPath(path: string, opts?: { subPaths?: string[], meta?: { userData: object }, readme?: string, subFolders?: { folder: string, meta?: { userData: object }, readme?: string }[] }) {
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

        if (!existsSync(convertPathToDir(pathHead))) {
            const result = await Editor.Message.request('asset-db', 'create-asset', pathHead, null).catch(_ => null);
            if (!result) return false;
        }
    }

    // 主目录meta
    if (opts?.meta) {
        await delayFileExists(`${convertPathToDir(path)}.meta`);
        const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', path).catch(_ => null);
        if (!queryMeta) return false;
        Object.assign(queryMeta.userData, opts.meta.userData);

        const result = await Editor.Message.request('asset-db', 'save-asset-meta', path, JSON.stringify(queryMeta)).catch(_ => null);
        if (!result) return false;
    }

    // 主目录readme
    if (opts?.readme) {
        writeFileSync(join(convertPathToDir(path), `.${basename(path)}.md`), opts.readme);
    }

    // 创建子目录
    if (opts?.subPaths) {
        for (let index = 0; index < opts.subPaths.length; index++) {
            const subPath = `${pathHead}/${opts.subPaths[index]}`;
            if (!existsSync(convertPathToDir(subPath))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', subPath, null).catch(_ => null);
                if (!result) return false;
            }
        }
    }

    if (opts?.subFolders) {
        for (let index = 0; index < opts.subFolders.length; index++) {
            const subOpts = opts.subFolders[index];
            const subPath = `${pathHead}/${subOpts.folder}`;

            // 判断是否存在
            if (!existsSync(convertPathToDir(subPath))) {
                const result = await Editor.Message.request('asset-db', 'create-asset', subPath, null).catch(_ => null);
                if (!result) return false;
            }

            // meta
            if (subOpts.meta) {
                await delayFileExists(`${convertPathToDir(subPath)}.meta`);
                const queryMeta = await Editor.Message.request('asset-db', 'query-asset-meta', subPath).catch(_ => null);
                if (!queryMeta) return false;
                Object.assign(queryMeta.userData, subOpts.meta.userData);

                const result = await Editor.Message.request('asset-db', 'save-asset-meta', subPath, JSON.stringify(queryMeta)).catch(_ => null);
                if (!result) return false;
            }

            // readme
            if (subOpts.readme) {
                writeFileSync(join(convertPathToDir(subPath), `.${basename(subPath)}.md`), subOpts.readme);
            }
        }
    }

    return true;
}

/**
 * 等待文件存在
 * @param file 真实路径，不是基于db下的
 */
export function delayFileExists(file: string) {
    let timer: NodeJS.Timer | null = null;
    return new Promise((next) => {
        timer = setInterval(() => {
            if (existsSync(file)) {
                if (timer) clearInterval(timer);
                timer = null;
                next(null);
            }
        }, 100);
    });
}