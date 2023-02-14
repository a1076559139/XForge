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
};

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
 * 
 * @param {string} dir 
 * @param {( item_path: string, isDirectory: boolean ) => void} callback 
 * @returns 
 */
function eachDirectory(dir, callback) {
    if (fs.existsSync(dir) !== true) return;

    const files = fs.readdirSync(dir);
    files.forEach(function (item) {
        const item_path = path.join(dir, item);
        callback(item_path, fs.statSync(item_path).isDirectory())
    });
}

const packageDir = path.join(__dirname, 'package');
const moduleDir = path.join(packageDir, 'node_modules');

async function main() {
    // 存储meta信息
    const metaMap = {};
    eachDirectory(moduleDir, (item_path, isDirectory) => {
        if (isDirectory) {
            if (!path.basename(item_path).startsWith('@')) return;
            getFiles(item_path).forEach((item_path2) => {
                if (!item_path2.endsWith('.meta')) return;
                metaMap[item_path2] = fs.readFileSync(item_path2, 'utf-8')
            })
        } else if (item_path.endsWith('.meta')) {
            metaMap[item_path] = fs.readFileSync(item_path, 'utf-8');
        }
    })

    // npm指令
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    if (process.argv[2] === 'add') {
        const cmd = ['install', '--prefix', packageDir];
        if (process.argv[3]) cmd.push(process.argv[3]);
        const code = await spawnCmd(npm, cmd);
        if (code !== 0) console.error(`[失败]: ${code}`);
    } else if (process.argv[2] === 'remove') {
        const cmd = ['uninstall', '--prefix', packageDir];
        if (!process.argv[3]) return console.error(`[失败]: 输入要卸载的名字`);
        cmd.push(process.argv[3]);
        const code = await spawnCmd(npm, cmd);
        if (code !== 0) {
            console.error(`[失败]: ${code}`);
        } else if (fs.existsSync(path.join(moduleDir, process.argv[3].trim()))) {
            // 如果文件夹未删除成功 则 强制删除
            await spawnCmd(`rm -rf ${path.join(moduleDir, process.argv[3].trim())}`);
        }
    } else {
        return console.error(`[未知指令]`);
    }

    // 还原meta，或删除无用meta
    for (const metapath in metaMap) {
        if (!fs.existsSync(metapath.slice(0, -5))) {
            if (!fs.existsSync(metapath)) continue;
            fs.unlinkSync(metapath);
        } else {
            fs.writeFileSync(metapath, metaMap[metapath], 'utf-8');
        }
    }
}
main();