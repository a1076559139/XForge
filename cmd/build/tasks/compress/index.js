var config = require('../../config');

const gulp = require("gulp");
const gulpIf = require("gulp-if");
const imagemin = require("gulp-imagemin");
const optipng = require("imagemin-optipng");
const pngquant = require("imagemin-pngquant");
const mozjpeg = require("imagemin-mozjpeg");
const jpegtran = require("imagemin-jpegtran");

const vinyl = require("vinyl");
/**
 * 过滤图片
 * @param {vinyl} file 
 * @returns 
 */
function compressCondition(file) {
    console.log(file.path);

    if (config.compress.filter) {
        return config.compress.filter(file) !== false;
    }

    return true;
}

/**
 * 压缩图片
 */
module.exports = platform => async function compress() {
    return new Promise(function (right, error) {
        
        const src = [`build/${platform}/**/*.{png,jpg,jpeg}`];

        if (config.compress.exclude && config.compress.exclude.length) {
            config.compress.exclude.forEach(function (str) {
                src.push(str[0] !== '!' ? str : ('!' + str));
            })
        }
        console.log(`匹配规则：${JSON.stringify(src)}`);

        console.log('-------->任务开始<--------');
        gulp.src(src)
            .pipe(gulpIf(compressCondition, imagemin([
                // mozjpeg({ quality: 75, progressive: true }),
                // optipng({optimizationLevel: 5})
                jpegtran(),
                pngquant({ quality: config.compress.quality, speed: config.compress.speed })
            ])))
            .pipe(gulp.dest(`build/${platform}`))
            .on('finish', function () {
                console.log('-------->任务完成<--------');
                right();
            });
    })
};