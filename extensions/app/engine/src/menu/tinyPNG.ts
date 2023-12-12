/** 
 * 
 * 参考： https://segmentfault.com/a/1190000015467084
 * 优化：通过 X-Forwarded-For 添加了动态随机伪IP，绕过 tinypng 的上传数量限制
 * 
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import { URL } from 'url';

const exts = ['.png', '.jpg', '.jpeg'];
const max = 5200000; // 5MB == 5242848.754299136

const options = {
    method: 'POST',
    hostname: 'tinypng.com',
    path: '/backend/opt/shrink',
    headers: {
        'rejectUnauthorized': 'false',
        'Postman-Token': Date.now(),
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
            'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
};

// 生成随机IP， 赋值给 X-Forwarded-For
function getRandomIP() {
    return Array.from(Array(4)).map(() => Math.floor(Math.random() * 255)).join('.');
}

// 遍历文件列表
function fileEach(folder: string, callback: (filePath: string) => any) {
    fs.readdir(folder, (err, files) => {
        if (err) console.error(err);
        files.forEach(file => {
            const filePath = path.join(folder, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return console.error(err);
                if (stats.isDirectory()) {
                    fileEach(filePath, callback);
                } else if (
                    // 必须是文件，小于5MB，后缀 jpg||png
                    stats.size <= max &&
                    stats.isFile() &&
                    exts.includes(path.extname(file))
                ) {
                    callback(filePath);
                }
            });
        });
    });
}

interface IResponse {
    input: {
        size: number;
        type: string;
    };
    output: {
        size: number;
        type: string;
        width: number;
        height: number;
        ratio: number;
        url: string;
    };
    error: string;
    message: string;
}
// 压缩图片
async function fileUpload(img_path: string): Promise<IResponse> {
    return new Promise((resolve, reject) => {
        // 通过 X-Forwarded-For 头部伪造客户端IP
        options.headers['X-Forwarded-For'] = getRandomIP();
        const req = https.request(options, function (res) {
            res.on('data', buf => {
                const data = JSON.parse(buf.toString()) as IResponse;
                if (data.error) {
                    reject(data.message);
                } else {
                    resolve(data);
                }
            });
        });

        req.write(fs.readFileSync(img_path), 'binary');
        req.on('error', err => {
            reject(err);
        });
        req.end();
    });
}

// 该方法被循环调用,请求图片数据
function fileUpdate(img_path: string, obj: IResponse): Promise<IResponse> {
    return new Promise((resolve, reject) => {
        const options = new URL(obj.output.url);
        const req = https.request(options, res => {
            let body = '';
            res.setEncoding('binary');
            res.on('data', function (data) {
                body += data;
            });

            res.on('end', function () {
                fs.writeFile(img_path, body, 'binary', err => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(obj);
                });
            });
        });
        req.on('error', err => {
            reject(err);
        });
        req.end();
    });
}

// 根据字节大小转成B、KB、MB
function toSize(b: number) {
    if (b < 1024) {
        return b + 'B';
    }
    else if (b < 1024 * 1024) {
        return (b / 1024).toFixed(2) + 'KB';
    }
    else {
        return (b / 1024 / 1024).toFixed(2) + 'MB';
    }
}

// 根据小数转成百分比字符串
function toPercent(num: number) {
    return (num * 100).toFixed(2) + '%';
}

async function fileTiny(filePath: string) {
    return fileUpload(filePath)
        .then(obj => fileUpdate(filePath, obj));
}

export default function (folder: string) {
    // 路径是否存在
    if (!fs.existsSync(folder)) {
        console.log(`路径不存在：${folder}`);
        return;
    }

    const basename = path.basename(folder);
    console.log(`[${basename}] 压缩中...`);

    // 是文件
    if (!fs.statSync(folder).isDirectory()) {
        if (!exts.includes(path.extname(folder))) {
            console.log(`[${basename}] 压缩失败！报错：只支持png、jpg与jpeg格式`);
            return;
        }
        fileTiny(folder)
            .then(obj => {
                console.log(
                    '[1/1]',
                    `[${basename}]`,
                    `压缩成功，原始: ${toSize(obj.input.size)}，压缩: ${toSize(obj.output.size)}，压缩比: ${toPercent(obj.output.ratio)}`
                );
            })
            .catch(err => {
                console.log(
                    '[1/1]',
                    `[${basename}]`,
                    `压缩失败！报错：${err}`
                );
            });
        return;
    }

    let total = 0;
    let finished = 0;
    // 是文件夹
    fileEach(folder, (filePath => {
        total++;
        const relativePath = path.relative(folder, filePath);
        fileTiny(filePath)
            .then(obj => {
                console.log(
                    `[${++finished}/${total}]`,
                    `[${relativePath}]`,
                    `压缩成功，原始: ${toSize(obj.input.size)}，压缩: ${toSize(obj.output.size)}，压缩比: ${toPercent(obj.output.ratio)}`
                );
            })
            .catch(err => {
                console.log(
                    `[${++finished}/${total}]`,
                    `[${relativePath}]`,
                    `压缩失败！报错：${err}`
                );
            });
    }));
}