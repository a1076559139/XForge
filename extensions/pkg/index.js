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
 * 同步文件夹内容
 * @param {*} source 源
 * @param {*} destination 目标
 */
function syncFolders(source, destination) {
    // 删除在源中不存在的内容
    function remove(source, destination) {
        const files = fs.readdirSync(destination);
        // 遍历目标文件夹中的每个文件或文件夹
        files.forEach((file) => {
            if (path.extname(file) === '.meta') {
                const destinationPath = path.join(destination, file.slice(0, -5));
                const destinationMetaPath = path.join(destination, file);
                if (!fs.existsSync(destinationPath)) {
                    fs.unlinkSync(destinationMetaPath);
                }
                return;
            }
            const sourcePath = path.join(source, file);
            const destinationPath = path.join(destination, file);
            const destinationMetaPath = destinationPath + '.meta';

            const stats = fs.statSync(destinationPath);

            // 检查目标文件夹中的项在源文件夹中是否存在
            if (!fs.existsSync(sourcePath) || stats.isDirectory() !== fs.statSync(sourcePath).isDirectory()) {
                // 如果目标文件夹中的项在源文件夹中不存在，则删除(并删除对应的.meta)
                if (fs.existsSync(destinationMetaPath)) {
                    fs.unlinkSync(destinationMetaPath);
                }

                if (stats.isDirectory()) {
                    deleteDirectory(destinationPath);
                } else {
                    fs.unlinkSync(destinationPath);
                }
            } else if (stats.isDirectory()) {
                remove(sourcePath, destinationPath);
            }
        });
    }
    remove(source, destination);

    function add(source, destination) {
        // 获取源文件夹中的所有文件或文件夹
        const sourceFiles = fs.readdirSync(source);

        // 遍历源文件夹中的每个文件或文件夹
        sourceFiles.forEach((file) => {
            if (file === '.git') return;
            if (file === '.package-lock.json') return;

            const sourcePath = path.join(source, file);
            const destinationPath = path.join(destination, file);

            // 检查当前项是否是文件夹
            if (fs.statSync(sourcePath).isDirectory()) {
                // 如果是文件夹，则递归调用syncFolders
                if (!fs.existsSync(destinationPath)) {
                    fs.mkdirSync(destinationPath);
                }
                add(sourcePath, destinationPath);
            } else {
                // 如果是文件，则复制到目标文件夹
                fs.copyFileSync(sourcePath, destinationPath);
            }
        });
    }
    add(source, destination);
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

const assetsDir = path.join(__dirname, 'node_modules');
const packageDir = path.join(__dirname, 'package');
const modulesDir = path.join(packageDir, 'node_modules');
const executorPath = path.join(__dirname, '../../assets/app-builtin/app-admin/executor.ts');

async function main() {
    // npm指令
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const cmd = process.argv[2].trim();

    if (cmd === 'update') {
        const cmd = ['--registry=https://registry.npmjs.org', 'update', '--prefix', packageDir];
        const code = await spawnCmd(npm, cmd);
        if (code !== 0) console.error(`[失败]: ${code}`);
    } else if (cmd === 'add') {
        const pkgName = process.argv[3].trim();
        const args = ['--registry=https://registry.npmjs.org', 'install', '--prefix', packageDir];
        if (pkgName) args.push(pkgName);
        const code = await spawnCmd(npm, args);
        if (code !== 0) {
            console.error(`[失败]: ${code}`);
        } else {
            // 如果不存在文件夹则创建
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir);
            }
            // 直接更新executor.ts避免安装后直接在vscode中无法触发智能提示
            if (fs.existsSync(executorPath)) {
                const str = fs.readFileSync(executorPath, 'utf-8');
                const reg = new RegExp(`import\\s+['"]db://pkg/${pkgName}['"]`);
                if (str.search(reg) === -1) {
                    fs.writeFileSync(executorPath, str + `\nimport 'db://pkg/${pkgName}'`, 'utf-8');
                }
            }
        }
    } else if (cmd === 'remove') {
        const pkgName = process.argv[3].trim();
        const pkgDir = path.join(modulesDir, pkgName);
        const args = ['--registry=https://registry.npmjs.org', 'uninstall', '--prefix', packageDir];
        if (!pkgName) return console.error('[失败]: 输入要卸载的名字');
        args.push(pkgName);
        const code = await spawnCmd(npm, args);
        if (code !== 0) {
            console.error(`[失败]: ${code}`);
        } else {
            // 如果文件夹未删除成功 则 强制删除
            if (fs.existsSync(pkgDir)) {
                deleteDirectory(pkgDir);
            }
            // 直接更新executor.ts避免返回编辑器报错
            if (fs.existsSync(executorPath)) {
                const str = fs.readFileSync(executorPath, 'utf-8');
                const reg = new RegExp(`import\\s+['"]db://pkg/${pkgName}['"]`);
                fs.writeFileSync(executorPath, str.replace(reg, ''), 'utf-8');
            }
        }
    } else {
        return console.error('[未知指令]');
    }

    // 同步文件
    syncFolders(modulesDir, assetsDir);

    console.log('⚠️: 如果编辑器报错，请点击资源管理器右上角的刷新按钮');
    console.log('⚠️: 如果运行时代码没更新，请点击编辑器菜单「开发者->缓存->清除代码缓存」');
}
main();