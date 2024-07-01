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
async function executeCmd(cmd, args/**,options */) {
    return new Promise(function (resolve, reject) {
        let result = spawn(cmd, args, { shell: true });
        result.on('close', function (code) {
            resolve(code);
        });
        result.stdout.on('data', function (data) {
            console.log(data.toString());
        });
        result.stderr.on('error', function (data) {
            reject(data.toString());
        });
    });
}

/**
 * 同步文件夹内容
 * @param {*} source 源
 * @param {*} destination 目标
 */
function syncFolders(source, destination) {
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination);
    }
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

const exportDirName = 'pkg-export';
const exportDir = path.join(__dirname, '../../assets', exportDirName);

async function main() {
    // npm指令
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const cmd = process.argv[2].trim();

    if (cmd === 'update') {
        const cmd = ['--registry=https://registry.npmmirror.com', 'update', '--prefix', packageDir];
        const code = await executeCmd(npm, cmd);
        if (code !== 0)
            throw new Error(`错误码: ${code}`);
        else
            console.log('✅: 已更新安装包');
    } else if (cmd === 'add') {
        const pkgName = process.argv[3].trim();
        if (!pkgName)
            throw new Error('输入要安装的包名字');
        const args = ['--registry=https://registry.npmmirror.com', 'install', '--prefix', packageDir, pkgName];
        const code = await executeCmd(npm, args);
        if (code !== 0) {
            throw new Error(`错误码: ${code}`);
        } else {
            // 如果不存在文件夹则创建
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir);
            }
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir);
            }
            fs.writeFileSync(path.join(exportDir, '.' + exportDirName + '.md'), '用于辅助触发扩展包的自动import', 'utf-8');
            if (!fs.existsSync(path.join(exportDir, pkgName + '.ts'))) {
                if (pkgName.indexOf('/') !== -1) {
                    const dir = path.join(exportDir, pkgName.split('/')[0]);
                    if (!fs.existsSync(dir))
                        fs.mkdirSync(dir);
                }
                fs.writeFileSync(path.join(exportDir, pkgName + '.ts'), `export * from 'db://pkg/${pkgName}'`, 'utf-8');
            }
            console.log(`✅: 已成功安装包 ${pkgName}`);
        }
    } else if (cmd === 'remove') {
        const pkgName = process.argv[3].trim();
        if (!pkgName)
            throw new Error('输入要卸载的包名字');
        const pkgDir = path.join(modulesDir, pkgName);
        const args = ['--registry=https://registry.npmmirror.com', 'uninstall', '--prefix', packageDir, pkgName];
        const code = await executeCmd(npm, args);
        if (code !== 0) {
            throw new Error(`错误码: ${code}`);
        } else {
            // 如果文件夹未删除成功 则 强制删除
            if (fs.existsSync(pkgDir)) {
                deleteDirectory(pkgDir);
            }
            if (fs.existsSync(path.join(exportDir, pkgName + '.ts'))) {
                fs.unlinkSync(path.join(exportDir, pkgName + '.ts'));
            }
            if (fs.existsSync(path.join(exportDir, pkgName + '.ts.meta'))) {
                fs.unlinkSync(path.join(exportDir, pkgName + '.ts.meta'));
            }
            console.log(`✅: 已卸载安装包 ${pkgName}`);
        }
    } else {
        throw new Error('请输入正确的指令');
    }

    // 同步文件
    syncFolders(modulesDir, assetsDir);

    console.log('⚠️: 如果编辑器报错，请点击资源管理器右上角的刷新按钮');
    console.log('⚠️: 如果运行时代码没更新，请点击编辑器菜单「开发者->缓存->清除代码缓存」');
}
main();