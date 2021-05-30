var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var { cocos } = require('../../config');

/**
 * 执行cmd指令
 * @param {string} cmd 
 * @returns {Promise}
 */
var execCmd = async function (cmd) {
    return new Promise(function (right, error) {
        exec(cmd, function (error, stdout, stderr) {
            right([error, stdout, stderr]);
        });
    })
}

/**
 * 创建目录
 * @param {string} dir 
 */
var CreateDirectory = function (dir) {
    if (fs.existsSync(dir) == false) {
        fs.mkdirSync(dir);
    }
}

/**
 * 删除目录及包含的文件
 * @param {string} dir 
 */
var DeleteDirectory = function (dir) {
    if (fs.existsSync(dir) == true) {
        var files = fs.readdirSync(dir);
        files.forEach(function (item) {
            var item_path = path.join(dir, item);
            if (fs.statSync(item_path).isDirectory()) {
                DeleteDirectory(item_path);
            }
            else {
                fs.unlinkSync(item_path);
            }
        });
        fs.rmdirSync(dir);
    }
}

/**
 * 拷贝源目录下的文件到目标目录下
 * @param {string} src  源
 * @param {string} dest 目标
 */
var CopyDirectory = function (src, dest) {
    if (fs.existsSync(src) == false) {
        return false;
    }

    if (fs.existsSync(dest) == false) {
        fs.mkdirSync(dest);
    }

    // 拷贝新的内容进去
    var dirs = fs.readdirSync(src);
    dirs.forEach(function (item) {
        var item_path = path.join(src, item);
        var temp = fs.statSync(item_path);
        if (temp.isFile()) { // 是文件
            fs.copyFileSync(item_path, path.join(dest, item));
        } else if (temp.isDirectory()) { // 是目录
            CopyDirectory(item_path, path.join(dest, item));
        }
    });
}

var ROOT_PATH = process.cwd();

module.exports = platform => async function cocosBuild() {
    if (fs.existsSync(cocos.path) == false) {
        throw new Error(`cocosCreator路径错误: ${cocos.path}`);
    }

    var configPath = cocos.buildCfg;
    if (fs.existsSync(configPath) == false) {
        throw new Error(`构建配置不存在: ${configPath}`);
    }

    var buildcmd = `${cocos.path} --project ./ --build "configPath=${path.join(ROOT_PATH, configPath)}"`;

    console.log('构建配置：' + configPath);
    console.log('构建指令：' + buildcmd);
    console.log('-------->任务开始<--------');

    CreateDirectory('./build-templates');
    CreateDirectory('./build');

    console.log('         删除构建');
    DeleteDirectory(`./build/${platform}`);
    DeleteDirectory('./build/wechatgame');
    console.log('         删除完成');

    console.log('         更新模板');
    DeleteDirectory('./build-templates/wechatgame');
    CopyDirectory(`./cmd/build/build-templates/${platform}`, './build-templates/wechatgame');
    console.log('         更新完成');

    console.log('         开始构建');
    let [error, stdout, stderr] = await execCmd(buildcmd);
    if (error || stderr) {
        console.log(error);
        // throw new Error('构建失败:' + error);
    }
    CopyDirectory('./build/wechatgame', `./build/${platform}`);
    console.log('         构建完成');

    console.log('         开始拷贝');
    CopyDirectory(`./cmd/build/build-copys/${platform}`, `./build/${platform}`);
    console.log('         拷贝完成');

    console.log('-------->任务完成<--------');
}