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

const exportDirName = 'pkg-export';
const exportDir = path.join(__dirname, '../../assets', exportDirName);

async function main() {
    // 移除旧目录
    if (fs.existsSync(packageDir)) {
        if (fs.existsSync(path.join(packageDir, 'package.json'))) {
            const _json = fs.readFileSync(path.join(packageDir, 'package.json'), 'utf-8');
            const _data = JSON.parse(_json);

            const json = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8');
            const data = JSON.parse(json);
            data.dependencies = _data.dependencies;
            fs.writeFileSync(path.join(__dirname, 'package.json'), JSON.stringify(data, null, '\t'), 'utf-8');
        }
        deleteDirectory(packageDir);
        console.log('\n> 移除旧目录: extensions/pkg/package');
    }

    // npm指令
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    const cmdIndex = process.argv.findIndex(item => item === 'update' || item === 'add' || item === 'remove');
    const cmd = process.argv[cmdIndex];

    const prefix = '--prefix=' + __dirname;
    const registry = process.argv.find(item => item.indexOf('--registry=') !== -1) || '--registry=https://registry.npmmirror.com';

    if (cmd === 'update') {
        const args = [prefix, registry, 'update'];
        const code = await executeCmd(npm, args);
        if (code !== 0)
            throw new Error(`错误码: ${code}`);
        else
            console.log('\n✅: 已更新安装包');
    } else if (cmd === 'add') {
        const pkgName = process.argv[cmdIndex + 1];
        if (!pkgName)
            throw new Error('输入要安装的包名字');
        const args = [prefix, registry, 'install', pkgName];
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
            // 更新提示描述
            fs.writeFileSync(path.join(exportDir, '.' + exportDirName + '.md'), '用于辅助触发扩展包的自动import', 'utf-8');
            // 创建提示文件
            if (!fs.existsSync(path.join(exportDir, pkgName + '.ts'))) {
                if (pkgName.indexOf('/') !== -1) {
                    const dir = path.join(exportDir, pkgName.split('/')[0]);
                    if (!fs.existsSync(dir))
                        fs.mkdirSync(dir);
                }
                fs.writeFileSync(path.join(exportDir, pkgName + '.ts'), `export * from 'db://pkg/${pkgName}';`, 'utf-8');
            }
            console.log(`\n✅: 已成功安装包 ${pkgName}`);
        }
    } else if (cmd === 'remove') {
        const pkgName = process.argv[cmdIndex + 1];
        if (!pkgName)
            throw new Error('输入要卸载的包名字');
        const args = [prefix, registry, 'uninstall', pkgName];
        const code = await executeCmd(npm, args);
        if (code !== 0) {
            throw new Error(`错误码: ${code}`);
        } else {
            // 如果未删除成功 则 强制删除
            if (fs.existsSync(path.join(assetsDir, pkgName))) {
                deleteDirectory(path.join(assetsDir, pkgName));
            }
            if (fs.existsSync(path.join(assetsDir, pkgName + '.meta'))) {
                fs.unlinkSync(path.join(assetsDir, pkgName + '.meta'));
            }
            if (fs.existsSync(path.join(exportDir, pkgName + '.ts'))) {
                fs.unlinkSync(path.join(exportDir, pkgName + '.ts'));
            }
            if (fs.existsSync(path.join(exportDir, pkgName + '.ts.meta'))) {
                fs.unlinkSync(path.join(exportDir, pkgName + '.ts.meta'));
            }
            console.log(`\n✅: 已卸载安装包 ${pkgName}`);
        }
    } else {
        throw new Error('请输入正确的指令');
    }

    console.log('\n🔥: 如果编辑器报错，请点击资源管理器右上角的刷新按钮\n🔥: 如果运行时代码没更新，请点击编辑器菜单「开发者->缓存->清除代码缓存」');
}
main();