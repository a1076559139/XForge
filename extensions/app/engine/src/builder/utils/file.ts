import fs from 'fs';
import path from 'path';
import md5 from './md5';

const includeExts = ['.html', '.css', '.js', '.json'];
const regExp = new RegExp('(?<=(\'|"|url\\(|URL\\())(?!//)[a-zA-Z0-9_\./-]+\\.(js|css|json|png|apng|jpg|jpeg|gif|svg)(?=(\'|"|\\)))', 'g');

/**
 * 获取文件夹内的文件
 */
function getFiles(dir: string): string[] {
    const result: string[] = [];

    // 判断文件是否存在
    if (!fs.existsSync(dir)) return result;

    // 如果不是文件夹则返回
    if (!fs.statSync(dir).isDirectory()) return result;

    // 遍历文件夹
    fs.readdirSync(dir).forEach(item => {
        const item_path = path.join(dir, item);
        const isDir = fs.statSync(item_path).isDirectory();
        if (!isDir) result.push(item_path);
    });

    return result;
}

/**
 * 以某个文件为起点，对其引用的文件树进行md5
 * @param  filepath 文件路径
 * @param  exclude 排除的文件路径(不带md5,不支持相对路径),排除的文件不会遍历子文件树,默认其本身会进行md5
 */
export function adaptFileMD5(filepath: string, exclude: { path: string | RegExp, md5?: boolean }[] = []) {
    // 参数不合法
    if (!filepath) return false;

    // 修正文件路径
    filepath = fs.existsSync(filepath) ? filepath : queryFile(filepath);
    if (!filepath) return false;

    // 排除的文件
    const fileExt = path.extname(filepath);
    const filepathNoMD5 = getFilePathRemoveMD5(filepath);
    const excludeItem = exclude.find(item => {
        if (item.path instanceof RegExp) return item.path.test(filepath);
        else return item.path === filepathNoMD5;
    });
    const isExcluded = !!excludeItem || includeExts.indexOf(fileExt) === -1;

    // 文件扩展名
    if (!isExcluded) {
        // 文件目录
        const fileDir = path.dirname(filepath);
        // 文件内容
        let fileText = fs.readFileSync(filepath, 'utf-8');
        // 文件内所有引用的相对路径(排重)
        const subRelativePaths = Array.from(new Set(fileText.match(regExp)));

        for (let index = 0; index < subRelativePaths.length; index++) {
            // 子文件相对路径(读取到的)
            const subRelativePath = subRelativePaths[index];
            // 子文件路径(读取到的)
            const subFilePath = path.join(fileDir, subRelativePath);

            // 如果当前引用的文件的路径带有md5戳，并且文件存在，则跳过
            if (isFileNameHasMD5(subFilePath) && fs.existsSync(subFilePath)) continue;

            {
                // 实际的子文件路径(不确定有没有md5)
                const subFilePathReal = queryFile(subFilePath);
                // 实际的子文件不存在
                if (!subFilePathReal) {
                    // console.warn('[跳过] [文件不存在]', filepath, subRelativePath);
                    continue;
                }

                // 如果引用的文件路径不带md5，但是实际文件有md5，则
                if (!isFileNameHasMD5(subFilePath) && isFileNameHasMD5(subFilePathReal)) {

                    // 原始的子文件名
                    const subFileBasename = path.basename(subRelativePath);
                    // 实际的子文件名(带md5)
                    const subFileBasenameReal = path.basename(subFilePathReal);
                    // 替换
                    fileText = fileText.replace(new RegExp(subRelativePath, 'g'), subRelativePath.replace(subFileBasename, subFileBasenameReal));
                    continue;
                }
            }

            {
                // 对它进行md5处理
                const result = adaptFileMD5(subFilePath, exclude);
                // 文件不存在
                if (!result) {
                    // console.warn('[跳过] [文件不存在]', filepath, subRelativePath);
                    continue;
                }

                // 实际的子文件路径(已经带上md5了)
                const subFilepathReal = queryFile(subFilePath);
                // 原始的子文件名
                const subFileBasename = path.basename(subRelativePath);
                // 实际的子文件名(带md5)
                const subFileBasenameReal = path.basename(subFilepathReal);

                // 替换
                fileText = fileText.replace(new RegExp(subRelativePath, 'g'), subRelativePath.replace(subFileBasename, subFileBasenameReal));
            }
        }

        // 重新写入文件内容
        fs.writeFileSync(filepath, fileText, 'utf-8');
    }

    // 将文件md5重命名
    if (fileExt !== '.html' && excludeItem?.md5 !== false) {
        renameFileByMD5(filepath);
    }
    return true;
}

/**
 * 替换某个文件里引用的的文件名
 * @param {string} filepath 被替换的文件路径
 * @param {string} adaptDir adaptFile所在的文件夹
 * @param {string} adaptFile 文件名.后缀，不能包含其他东西
 */
export function adaptFilename(filepath: string, adaptDir: string, adaptFile: string) {
    if (!fs.existsSync(filepath)) return false;

    const adaptName = adaptFile.split('.')[0];
    const adaptExtname = path.extname(adaptFile) || '';

    let text = fs.readFileSync(filepath, 'utf-8');

    const filePaths = getFiles(adaptDir);
    for (let index = 0; index < filePaths.length; index++) {
        const filePath = filePaths[index];
        const basename = path.basename(filePath);
        const name = basename.split('.')[0];
        const extname = path.extname(basename) || '';

        if (basename !== adaptFile && name === adaptName && extname === adaptExtname) {
            const regExp = new RegExp(`(?<=('|"|\/))${name}[\.a-zA-Z0-9]*\\${extname}(?=('|"))`, 'g');
            text = text.replace(regExp, basename);
            break;
        }
    }

    fs.writeFileSync(filepath, text, 'utf-8');
    return true;
}

/**
 * 判断一个文件是否有md5戳
 * @param {string} filename 
 */
export function isFileNameHasMD5(filename: string) {
    filename = path.basename(filename);
    return filename !== getFileNameRemoveMD5(filename);
}

/**
 * md5重命名文件名字
 * @param {string} filePath 
 * @returns 
 */
export function renameFileByMD5(filePath: string) {
    const basename = getFileNameRemoveMD5(filePath);
    const extname = path.extname(basename);
    if (!extname) return filePath;
    const filename = basename.slice(0, -extname.length);
    if (!filename) return filePath;
    const dirname = path.dirname(filePath);

    const txt = fs.readFileSync(filePath, 'utf-8');
    const renamePath = path.join(dirname, `${filename}.${md5(txt)}${extname}`);
    fs.renameSync(filePath, renamePath);
    return renamePath;
}

/**
 * 获取相同名字相同后缀, 但md5戳不一样的文件数组
 * @param {string} dir 
 */
export function getFilesBySameNameDiffMD5(dir: string): { name: string; ext: string; files: string[]; }[] {
    // [ [ {name:'index',ext:'.js',files:['/test/index.js','/test/index.c67d.js']} ]
    const result = [];
    const files = getFiles(dir);
    files.forEach(filepath => {
        const basename = getFileNameRemoveMD5(filepath);
        if (!basename) return;
        const extname = path.extname(basename);
        if (!extname) return;
        const filename = basename.slice(0, -extname.length);
        if (!filename) return;

        const res = result.find(data => data.name === filename && data.ext === extname);
        if (res) return res.files.push(filepath);

        result.push({
            name: filename,
            ext: extname,
            files: [filepath]
        });
    });
    return result.filter((data) => data.files.length >= 2);
}

/**
 * 将文件名中的md5字段去除
 * @param {string} filename 
 * @returns 
 */
export function getFileNameRemoveMD5(filename: string) {
    const basename = path.basename(filename)
        // a-jqw89a.js => a.js
        // a-jqw89a.min.js => a.min.js
        .replace(/-[a-z0-9]+\./, '.');

    return basename.split('.').filter((str, index, array) => {
        if (index === 0 || index === array.length - 1) return true;
        return index == 1 && str === 'min';
    }).join('.');
}

/**
 * 删除文件路径中的md5字段
 * @param {string} filepath 
 * @returns 
 */
export function getFilePathRemoveMD5(filepath: string) {
    const dirname = path.dirname(filepath);
    return path.join(dirname, getFileNameRemoveMD5(filepath));
}

/**
 * 输入文件路径，可以索引到对应的带有md5的文件路径
 * @param {string} filepath 文件路径(带后缀)
 * @returns 
 */
export function queryFile(filepath: string) {
    // 将文件名中的md5字段去除
    const filename = getFileNameRemoveMD5(filepath);
    const fileDir = path.dirname(filepath);

    const filesList = getFiles(fileDir);
    return filesList.find(filepath => {
        return path.basename(filepath) === filename;
    }) || filesList.find(filepath => {
        return getFileNameRemoveMD5(filepath) === filename;
    });
}