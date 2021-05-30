const gulp = require("gulp");
const cocos = require("./tasks/cocos");
const compress = require("./tasks/compress");

exports.wx = gulp.series(cocos('wx'), compress('wx'));
exports.tt = gulp.series(cocos('tt'), compress('tt'));
exports.qq = gulp.series(cocos('qq'), compress('qq'));