module.exports = {
    cocos: {
        // CocosCreator路径
        path: '/Applications/CocosCreator/Creator/3.0.0/CocosCreator.app/Contents/MacOS/CocosCreator',
        buildCfg: './cmd/build/buildConfigs/buildConfig_wechatgame.json'
    },

    compress: {
        // 质量：min和max是介于0（最差）到1（完美）之间的数字
        quality: [0.2, 0.9],
        // 速度：取值范围从1（强力）到10（最快）。默认值为3。Speed 10的质量降低了5％，但比默认值快8倍。
        speed: 3,
        // 排除：指定哪些文件、文件夹下不进行压缩处理(需符合node-glob语法)
        // exclude: [],
        // 过滤
        // filter: function (file) {
        //     console.log(file.path, file.stat.size);
        //     return true;
        // }
    }
};