const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;

/**
 * 执行cmd指令
 * @param {string} cmd 
 * @param {string[]} args 
 * @param {SpawnOptionsWithoutStdio} options 
 * @returns 
 */
async function spawnCmd(cmd, args, options) {
    return new Promise(function (resolve, reject) {
        var result = spawn(cmd, args, options);
        result.on('close', function (code) {
            resolve(code);
        });
        result.stdout.on('data', function (data) {
            console.log('[log]: ' + data);
        });
        result.stderr.on('error', function (data) {
            console.log('[err]: ' + data);
        });
    });
}

/**
 * 获得文件夹所有文件路径
 * @param {string} dir 
 * @returns {Array<string>}
 */
function getFiles(dir) {
    const result = [];
    if (fs.existsSync(dir) !== true) return result;

    const files = fs.readdirSync(dir);
    files.forEach(function (item) {
        var item_path = path.join(dir, item);
        if (fs.statSync(item_path).isDirectory()) return;
        result.push(item_path);
    });

    return result;
}

/**
 * 遍历文件
 * @param {string} dir 
 * @param {( item_path: string, isDirectory: boolean ) => void} callback 
 * @returns 
 */
function eachFiles(dir, callback) {
    if (fs.existsSync(dir) !== true) return;

    const files = fs.readdirSync(dir);
    files.forEach(function (item) {
        const item_path = path.join(dir, item);
        callback(item_path, fs.statSync(item_path).isDirectory());
    });
}

/**
 * 删除文件夹
 * @param {string} dir 
 * @returns 
 */
function deleteDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach((file) => {
        const fileDir = path.join(dir, file);
        if (fs.statSync(fileDir).isDirectory()) {
            deleteDirectory(fileDir); //递归删除文件夹
        } else {
            fs.unlinkSync(fileDir); //删除文件
        }
    });

    fs.rmdirSync(dir);
}

/**
 * 拷贝源目录下的文件到目标目录下(过滤掉所有.git文件或目录)
 * @param {string} src  源
 * @param {string} dest 目标
 */
function copyDirectory(src, dest) {
    if (fs.existsSync(src) == false) {
        return false;
    }

    if (fs.existsSync(dest) == false) {
        fs.mkdirSync(dest);
    }

    // 拷贝新的内容进去
    let dirs = fs.readdirSync(src);
    dirs.forEach(function (item) {
        if (item === '.git') return;
        if (item === '.package-lock.json') return;
        let item_path = path.join(src, item);
        let temp = fs.statSync(item_path);
        if (temp.isFile() || temp.isSymbolicLink()) { // 是文件
            fs.copyFileSync(item_path, path.join(dest, item));
        } else if (temp.isDirectory()) { // 是目录
            copyDirectory(item_path, path.join(dest, item));
        }
    });
}

const assetsDir = path.join(__dirname, 'assets');
const packageDir = path.join(__dirname, 'package');
const modulesDir = path.join(packageDir, 'node_modules');

async function main() {
    // 存储meta信息
    const metaMap = {};
    eachFiles(assetsDir, (item_path, isDirectory) => {
        if (isDirectory) {
            if (!path.basename(item_path).startsWith('@')) return;
            getFiles(item_path).forEach((item_path2) => {
                if (!item_path2.endsWith('.meta')) return;
                metaMap[item_path2] = fs.readFileSync(item_path2, 'utf-8');
            });
        } else if (item_path.endsWith('.meta')) {
            metaMap[item_path] = fs.readFileSync(item_path, 'utf-8');
        }
    });

    // npm指令
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    if (process.argv[2] === 'update') {
        const cmd = ['--registry=https://registry.npmjs.org', 'update', '--prefix', packageDir];
        const code = await spawnCmd(npm, cmd);
        if (code !== 0) console.error(`[失败]: ${code}`);
    } else if (process.argv[2] === 'add') {
        const cmd = ['--registry=https://registry.npmjs.org', 'install', '--prefix', packageDir];
        if (process.argv[3]) cmd.push(process.argv[3]);
        const code = await spawnCmd(npm, cmd);
        if (code !== 0) {
            console.error(`[失败]: ${code}`);
        } else {
            // 直接更新executor.ts
            const executorPath = path.join(__dirname, '../../assets/app-builtin/app-admin/executor.ts');
            if (fs.existsSync(executorPath)) {
                const str = fs.readFileSync(executorPath, 'utf-8');
                if (str.search(new RegExp(`import\\s+['"]db://pkg/${process.argv[3]}['"]`)) === -1) {
                    fs.writeFileSync(executorPath, str + `\nimport 'db://pkg/${process.argv[3]}'`, 'utf-8');
                }
            }
        }
    } else if (process.argv[2] === 'remove') {
        const cmd = ['--registry=https://registry.npmjs.org', 'uninstall', '--prefix', packageDir];
        if (!process.argv[3]) return console.error('[失败]: 输入要卸载的名字');
        cmd.push(process.argv[3]);
        const code = await spawnCmd(npm, cmd);
        if (code !== 0) {
            console.error(`[失败]: ${code}`);
        } else {
            if (fs.existsSync(path.join(modulesDir, process.argv[3].trim()))) {
                // 如果文件夹未删除成功 则 强制删除
                deleteDirectory(path.join(modulesDir, process.argv[3].trim()));
            }
            // 直接更新executor.ts避免返回编辑器报错
            const executorPath = path.join(__dirname, '../../assets/app-builtin/app-admin/executor.ts');
            if (fs.existsSync(executorPath)) {
                const str = fs.readFileSync(executorPath, 'utf-8');
                fs.writeFileSync(executorPath, str.replace(new RegExp(`import\\s+['"]db://pkg/${process.argv[3]}['"]`), ''), 'utf-8');
            }
        }
    } else {
        return console.error('[未知指令]');
    }

    deleteDirectory(assetsDir);
    copyDirectory(modulesDir, assetsDir);

    // 还原meta，或删除无用meta
    for (const metaPath in metaMap) {
        if (!fs.existsSync(metaPath.slice(0, -5))) {
            if (!fs.existsSync(metaPath)) continue;
            fs.unlinkSync(metaPath);
        } else {
            fs.writeFileSync(metaPath, metaMap[metaPath], 'utf-8');
        }
    }

    console.log('⚠️: 如果编辑器报错，请点击资源管理器右上角的刷新按钮');
    console.log('⚠️: 如果运行时代码没更新，请点击编辑器菜单「开发者->缓存->清除代码缓存」');
}
main();