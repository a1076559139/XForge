"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const vue_1 = __importDefault(require("vue/dist/vue"));
const utils_1 = require("../utils");
const PageBaseName = {};
/**
 * 获取脚本内容
 */
function getComScript(name = 'NewClass', isPaper = false) {
    const basePath = isPaper ? '../../../../../../../extensions/app/assets/base/BaseView' : '../../../../../../extensions/app/assets/base/BaseView';
    return "import { _decorator } from 'cc';\r\n" +
        "import BaseView from '" + basePath + "';\r\n" +
        "const { ccclass, property } = _decorator;\r\n" +
        "@ccclass('" + name + "')\r\n" +
        "export class " + name + " extends BaseView {\r\n" +
        "    // 初始化的相关逻辑写在这\r\n" +
        "    onLoad(){}\r\n\r\n" +
        "    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)\r\n" +
        "    onShow(params: any){}\r\n\r\n" +
        "    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)\r\n" +
        "    onHide(result: undefined){\r\n" +
        "        // app.manager.ui.show<" + name + ">({name: '" + name + "', onHide:(result) => { 接收到return的数据，并且有类型提示 }})\r\n" +
        "        return result;\r\n" +
        "    }\r\n" +
        "}";
}
function getMetaUserData(name = 'NewClass') {
    return {
        "compressionType": {
            "web-desktop": "merge_all_json",
            "web-mobile": "merge_all_json",
            "android": "merge_all_json",
            "ohos": "merge_all_json",
            "huawei-agc": "merge_all_json",
            "ios": "merge_all_json",
            "windows": "merge_all_json",
            "mac": "merge_all_json",
            "bytedance-mini-game": "subpackage",
            "oppo-mini-game": "subpackage",
            "huawei-quick-game": "subpackage",
            "cocos-play": "zip",
            "vivo-mini-game": "subpackage",
            "xiaomi-quick-game": "subpackage",
            "baidu-mini-game": "subpackage",
            "wechatgame": "subpackage"
        },
        "isRemoteBundle": {
            "web-desktop": true,
            "web-mobile": true,
            "android": true,
            "ohos": true,
            "huawei-agc": true,
            "ios": true,
            "windows": true,
            "mac": true,
            "bytedance-mini-game": false,
            "oppo-mini-game": false,
            "huawei-quick-game": false,
            "cocos-play": true,
            "vivo-mini-game": false,
            "xiaomi-quick-game": false,
            "baidu-mini-game": false,
            "wechatgame": false
        },
        "isBundle": true,
        "bundleName": `app-view_${name}`
    };
}
function getPages() {
    // page目录
    const pageDir = (0, path_1.join)(Editor.Project.path, 'assets/app-bundle/app-view/page');
    // 读取page目录下所有文件
    const files = (0, fs_1.existsSync)(pageDir) ? (0, fs_1.readdirSync)(pageDir) : [];
    // 筛选
    const PageSelects = [];
    files.forEach((name) => {
        const item_dir = (0, path_1.join)(pageDir, name);
        const isDirectory = (0, fs_1.statSync)(item_dir).isDirectory();
        if (isDirectory) {
            const page_name = `Page${(0, utils_1.stringCase)(name)}`;
            PageSelects.push(page_name);
            PageBaseName[page_name] = name;
        }
    });
    return PageSelects;
}
exports.default = vue_1.default.extend({
    template: (0, utils_1.getTemplate)('create-view'),
    data() {
        return {
            showLoading: false,
            showSelectPage: false,
            inputName: '',
            display: '',
            typeSelects: ['page', 'paper', 'pop', 'top'],
            typeSelectIndex: 0,
            pageSelects: [],
            pageSelectIndex: 0,
        };
    },
    methods: {
        onChangeTypeSelect(index) {
            this.typeSelectIndex = Number(index);
            if (index == '1') {
                this.pageSelectIndex = 0;
                this.pageSelects = getPages();
                this.showSelectPage = true;
            }
            else {
                this.showSelectPage = false;
            }
        },
        onChangePageSelect(index) {
            this.pageSelectIndex = Number(index);
        },
        async onClickCreate() {
            const isPaper = this.typeSelectIndex == 1;
            const owner = this.pageSelects[this.pageSelectIndex];
            const type = (0, utils_1.stringCase)(this.typeSelects[this.typeSelectIndex], true);
            const name = (0, utils_1.stringCase)(this.inputName, true);
            if (/^[a-zA-Z0-9_]+$/.test(name) === false) {
                this.display = `[错误] 名字不合法, 请修改\n匹配规则: /^[a-zA-Z0-9_]+$/`;
                return;
            }
            const uiName = isPaper ?
                `${(0, utils_1.stringCase)(type)}${(0, utils_1.stringCase)(PageBaseName[owner])}${(0, utils_1.stringCase)(name)}` :
                `${(0, utils_1.stringCase)(type)}${(0, utils_1.stringCase)(name)}`;
            const typePath = `db://assets/app-bundle/app-view/${type}`;
            const uiPath = isPaper ?
                `${typePath}/${PageBaseName[owner]}/${name}` :
                `${typePath}/${name}`;
            const bundlePath = `${uiPath}/bundle`;
            const nativePath = `${uiPath}/native`;
            const bundleResPath = `${bundlePath}/resources`;
            const scriptUrl = `${uiPath}/bundle/${uiName}.ts`;
            const prefabUrl = `${uiPath}/bundle/${uiName}.prefab`;
            this.display = '创建中';
            this.showLoading = true;
            if ((0, fs_1.existsSync)((0, utils_1.convertPathToDir)(uiPath))) {
                this.showLoading = false;
                this.display = `[错误] 目录已存在, 请删除\n${uiPath}`;
                return;
            }
            if (!await (0, utils_1.createPath)(uiPath, ['bundle', 'native', 'bundle/resources'])) {
                this.showLoading = false;
                this.display = `[错误] 创建目录失败\n${uiPath}`;
                return;
            }
            // 创建script
            const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, getComScript(uiName, isPaper)).catch(_ => null);
            if (!createScriptResult) {
                this.showLoading = false;
                this.display = `[错误] 创建脚本失败\n${scriptUrl}`;
                return;
            }
            // 创建prefab
            const createPrefabResult = await Editor.Message.request('scene', 'execute-scene-script', {
                name: 'app',
                method: 'createPrefab',
                args: [uiName, prefabUrl, isPaper]
            }).catch(_ => null);
            if (!createPrefabResult) {
                this.showLoading = false;
                this.display = `[错误] 创建预制体失败\n${prefabUrl}`;
                return;
            }
            // 设置分包
            await (0, utils_1.delayFileExists)(`${(0, utils_1.convertPathToDir)(bundlePath)}.meta`);
            const queryViewMeta = await Editor.Message.request('asset-db', 'query-asset-meta', bundlePath).catch(_ => null);
            if (!queryViewMeta) {
                this.showLoading = false;
                this.display = `[错误] 创建分包配置失败`;
                return;
            }
            queryViewMeta.userData = getMetaUserData(uiName);
            await Editor.Message.request('asset-db', 'save-asset-meta', bundlePath, JSON.stringify(queryViewMeta)).catch(_ => null);
            (0, fs_1.writeFileSync)((0, path_1.join)((0, utils_1.convertPathToDir)(uiPath), `.${name}.md`), `${uiName}所在文件夹, 通过${isPaper ? '在page中配置miniViews属性并调用showMiniViews方法' : 'app.manager.ui.show'}的方式加载`);
            (0, fs_1.writeFileSync)((0, path_1.join)((0, utils_1.convertPathToDir)(bundlePath), '.bundle.md'), '存放脚本与预制体的文件夹, UI脚本与预制体一定在根目录下，其它脚本与预制体放到resources目录下');
            (0, fs_1.writeFileSync)((0, path_1.join)((0, utils_1.convertPathToDir)(nativePath), '.native.md'), '存放UI静态资源的文件夹(⚠️:脚本或动态预制体请放到bundle/resources目录下)');
            (0, fs_1.writeFileSync)((0, path_1.join)((0, utils_1.convertPathToDir)(bundleResPath), '.resources.md'), '只能存放脚本与预制体, 里面的资源可在UI脚本内通过this.load加载(⚠️:图片等其他资源一定不要放在此文件夹内)');
            this.showLoading = false;
            this.display = `[成功] 创建成功`;
        }
    }
});
