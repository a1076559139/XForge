import { existsSync, readFileSync } from "fs-extra";
import { join } from "path";


export function getTemplate(name: string) {
    const Assets = join(__dirname, '../../res/panel');
    return readFileSync(join(Assets, `components/${name}.html`), 'utf-8')
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
export function convertDBToPath(path: string) {
    if (path.startsWith('db://assets')) {
        path = Editor.Utils.Path.join(Editor.Project.path, path.slice(5));
    } else if (path.startsWith('db://app')) {
        path = Editor.Utils.Path.join(Editor.Project.path, 'extensions/app/assets', path.slice(8));
    }
    return path;
}

/**
 * 根据路径创建目录
 */
export async function createDBDir(path: string, subPaths?: string[]) {
    let pathHead = 'db://assets';

    if (!path && !path.startsWith(pathHead)) {
        return false;
    }

    // 修剪path
    if (path.endsWith('/')) {
        path = path.slice(pathHead.length + 1, -1).trim();
    } else {
        path = path.slice(pathHead.length + 1).trim();
    }

    // 每一层的路径
    const pathArr = path.split('/');

    // 创建主目录
    for (let index = 0; index < pathArr.length; index++) {
        pathHead += '/' + pathArr[index];

        if (!existsSync(convertDBToPath(pathHead))) {
            const result = Editor.Message.request('asset-db', 'create-asset', pathHead, null).catch(_ => null);
            if (!result) return false;
        }
    }

    // 创建子目录
    if (subPaths) {
        for (let index = 0; index < subPaths.length; index++) {
            const path = `${pathHead}/${subPaths[index]}`;
            if (!existsSync(convertDBToPath(path))) {
                const result = Editor.Message.request('asset-db', 'create-asset', path, null).catch(_ => null);
                if (!result) return false;
            }
        }
    }

    return true;
}