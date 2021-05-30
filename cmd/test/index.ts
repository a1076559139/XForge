import * as gulp from "gulp"

export default gulp.series(async function test() {
    await console.log('test ok');
});