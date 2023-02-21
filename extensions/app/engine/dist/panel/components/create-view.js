"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const vue_1 = __importDefault(require("vue/dist/vue"));
const utils_1 = require("../../utils");
const PageBaseName = {};
/**
 * 获取脚本内容
 */
function getComScript(name = 'NewClass') {
    const isPage = name.toLocaleLowerCase().startsWith('page');
    const isPaper = name.toLocaleLowerCase().startsWith('paper');
    const basePath = isPaper ? '../../../../../../../extensions/app/assets/base/BaseView' : '../../../../../../extensions/app/assets/base/BaseView';
    return 'import { _decorator } from \'cc\';\r\n' +
        'import BaseView from \'' + basePath + '\';\r\n' +
        `${isPage ? 'import { IMiniViewNames } from \'../../../../../app-builtin/app-admin/executor\';\r\n' : ''}` +
        'const { ccclass, property } = _decorator;\r\n' +
        '@ccclass(\'' + name + '\')\r\n' +
        'export class ' + name + ' extends BaseView {\r\n' +
        '    // 子界面列表，数组顺序为子界面排列顺序\r\n' +
        `    ${isPage ? 'protected miniViews: IMiniViewNames = [];\r\n' : ''}` +
        '    // 初始化的相关逻辑写在这\r\n' +
        '    onLoad(){}\r\n\r\n' +
        '    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)\r\n' +
        `    ${isPage ? 'onShow(params: any){ this.showMiniViews({ views: this.miniViews }) }\r\n\r\n' : 'onShow(params: any){}\r\n\r\n'}` +
        '    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)\r\n' +
        '    onHide(result: undefined){\r\n' +
        '        // app.manager.ui.show<' + name + '>({name: \'' + name + '\', onHide:(result) => { 接收到return的数据，并且有类型提示 }})\r\n' +
        '        return result;\r\n' +
        '    }\r\n' +
        '}';
}
function getMetaUserData(name = 'NewClass') {
    return {
        'compressionType': {
            'web-desktop': 'merge_all_json',
            'web-mobile': 'merge_all_json',
            'android': 'merge_all_json',
            'ohos': 'merge_all_json',
            'huawei-agc': 'merge_all_json',
            'ios': 'merge_all_json',
            'windows': 'merge_all_json',
            'mac': 'merge_all_json',
            'bytedance-mini-game': 'subpackage',
            'oppo-mini-game': 'subpackage',
            'huawei-quick-game': 'subpackage',
            'cocos-play': 'zip',
            'vivo-mini-game': 'subpackage',
            'xiaomi-quick-game': 'subpackage',
            'baidu-mini-game': 'subpackage',
            'wechatgame': 'subpackage'
        },
        'isRemoteBundle': {
            'web-desktop': true,
            'web-mobile': true,
            'android': true,
            'ohos': true,
            'huawei-agc': true,
            'ios': true,
            'windows': true,
            'mac': true,
            'bytedance-mini-game': false,
            'oppo-mini-game': false,
            'huawei-quick-game': false,
            'cocos-play': true,
            'vivo-mini-game': false,
            'xiaomi-quick-game': false,
            'baidu-mini-game': false,
            'wechatgame': false
        },
        'isBundle': true,
        'bundleName': `app-view_${name}`
    };
}
function getResMetaUserData(name = 'NewClass') {
    return {
        'compressionType': {},
        'isRemoteBundle': {
            'web-desktop': true,
            'web-mobile': true,
            'android': true,
            'ohos': true,
            'huawei-agc': true,
            'ios': true,
            'windows': true,
            'mac': true,
            'bytedance-mini-game': true,
            'oppo-mini-game': true,
            'huawei-quick-game': true,
            'cocos-play': true,
            'vivo-mini-game': true,
            'xiaomi-quick-game': true,
            'baidu-mini-game': true,
            'wechatgame': true
        },
        'priority': 8,
        'isBundle': true,
        'bundleName': `app-view_${name}_Res`
    };
}
function getPages() {
    // page目录
    const pageDir = path_1.join(Editor.Project.path, 'assets/app-bundle/app-view/page');
    // 读取page目录下所有文件
    const files = fs_1.existsSync(pageDir) ? fs_1.readdirSync(pageDir) : [];
    // 筛选
    const PageSelects = [];
    files.forEach((name) => {
        const item_dir = path_1.join(pageDir, name);
        const isDirectory = fs_1.statSync(item_dir).isDirectory();
        if (isDirectory) {
            const page_name = `Page${utils_1.stringCase(name)}`;
            PageSelects.push(page_name);
            PageBaseName[page_name] = name;
        }
    });
    return PageSelects;
}
exports.default = vue_1.default.extend({
    template: utils_1.getTemplate('create-view'),
    data() {
        return {
            showLoading: false,
            showSelectPage: false,
            showSelectGroup: true,
            inputName: '',
            display: '',
            typeSelects: ['page', 'paper', 'pop', 'top'],
            typeSelectIndex: 0,
            groupSelects: ['2D', '3D'],
            groupSelectIndex: 0,
            pageSelects: [],
            pageSelectIndex: 0,
        };
    },
    methods: {
        onChangeGroupSelect(index) {
            this.groupSelectIndex = Number(index);
        },
        onChangeTypeSelect(index) {
            this.typeSelectIndex = Number(index);
            if (index == '0' || index == '1') {
                this.showSelectGroup = true;
            }
            else {
                this.showSelectGroup = false;
            }
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
            const isPage = this.typeSelectIndex == 0;
            const isPaper = this.typeSelectIndex == 1;
            const owner = this.pageSelects[this.pageSelectIndex];
            const type = utils_1.stringCase(this.typeSelects[this.typeSelectIndex], true);
            const name = utils_1.stringCase(this.inputName, true);
            if (/^[a-zA-Z0-9_]+$/.test(name) === false) {
                this.display = '[错误] 名字不合法, 请修改\n匹配规则: /^[a-zA-Z0-9_]+$/';
                return;
            }
            const bundlePath = 'db://assets/app-bundle';
            const viewPath = `${bundlePath}/app-view`;
            const is3D = (isPage || isPaper) && this.groupSelectIndex == 1;
            const uiName = isPaper ?
                `${utils_1.stringCase(type)}${utils_1.stringCase(PageBaseName[owner])}${utils_1.stringCase(name)}` :
                `${utils_1.stringCase(type)}${utils_1.stringCase(name)}`;
            const typePath = `${viewPath}/${type}`;
            const uiPath = isPaper ?
                `${typePath}/${PageBaseName[owner]}/${name}` :
                `${typePath}/${name}`;
            const nativePath = `${uiPath}/native`;
            const resourcesPath = `${uiPath}/resources`;
            const expansionPath = `${nativePath}/expansion`;
            const scriptUrl = `${nativePath}/${uiName}.ts`;
            const prefabUrl = `${nativePath}/${uiName}.prefab`;
            this.display = '创建中';
            this.showLoading = true;
            if (fs_1.existsSync(utils_1.convertPathToDir(uiPath))) {
                this.showLoading = false;
                this.display = `[错误] 目录已存在, 请删除\n${uiPath}`;
                return;
            }
            // 创建UI目录
            if (!await utils_1.createFolderByPath(uiPath, { subPaths: ['native', 'resources', 'native/expansion'] })) {
                this.showLoading = false;
                this.display = `[错误] 创建目录失败\n${uiPath}`;
                return;
            }
            // 创建script
            const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, getComScript(uiName)).catch(_ => null);
            if (!createScriptResult) {
                this.showLoading = false;
                this.display = `[错误] 创建脚本失败\n${scriptUrl}`;
                return;
            }
            // 创建prefab
            const createPrefabResult = await Editor.Message.request('scene', 'execute-scene-script', {
                name: 'app',
                method: 'createPrefab',
                args: [uiName, prefabUrl, is3D]
            }).catch(_ => null);
            if (!createPrefabResult) {
                this.showLoading = false;
                this.display = `[错误] 创建预制体失败\n${prefabUrl}`;
                return;
            }
            // 设置native分包
            await utils_1.delayFileExists(`${utils_1.convertPathToDir(nativePath)}.meta`);
            const queryNativeMeta = await Editor.Message.request('asset-db', 'query-asset-meta', nativePath).catch(_ => null);
            if (!queryNativeMeta) {
                this.showLoading = false;
                this.display = '[错误] 设置native分包配置失败';
                return;
            }
            queryNativeMeta.userData = getMetaUserData(uiName);
            await Editor.Message.request('asset-db', 'save-asset-meta', nativePath, JSON.stringify(queryNativeMeta)).catch(_ => null);
            // 设置resources分包
            await utils_1.delayFileExists(`${utils_1.convertPathToDir(resourcesPath)}.meta`);
            const queryResMeta = await Editor.Message.request('asset-db', 'query-asset-meta', resourcesPath).catch(_ => null);
            if (!queryResMeta) {
                this.showLoading = false;
                this.display = '[错误] 设置resources分包配置失败';
                return;
            }
            queryResMeta.userData = getResMetaUserData(uiName);
            await Editor.Message.request('asset-db', 'save-asset-meta', resourcesPath, JSON.stringify(queryResMeta)).catch(_ => null);
            fs_1.writeFileSync(path_1.join(utils_1.convertPathToDir(bundlePath), '.app-bundle.md'), utils_1.getReadme('app-bundle'));
            fs_1.writeFileSync(path_1.join(utils_1.convertPathToDir(viewPath), '.app-view.md'), utils_1.getReadme('app-view'));
            fs_1.writeFileSync(path_1.join(utils_1.convertPathToDir(typePath), `.${type}.md`), `所有${type}类型UI的根目录`);
            if (isPaper)
                fs_1.writeFileSync(path_1.join(utils_1.convertPathToDir(`${typePath}/${PageBaseName[owner]}`), `.${PageBaseName[owner]}.md`), `归属于Page${utils_1.stringCase(PageBaseName[owner])}`);
            fs_1.writeFileSync(path_1.join(utils_1.convertPathToDir(uiPath), `.${name}.md`), `${uiName}所在文件夹\n1、通过${isPaper ? `在${owner}中配置miniViews属性并调用showMiniViews方法` : `app.manager.ui.show({ name:'${uiName}' })`}的方式加载`);
            fs_1.writeFileSync(path_1.join(utils_1.convertPathToDir(nativePath), '.native.md'), utils_1.getReadme('native'));
            fs_1.writeFileSync(path_1.join(utils_1.convertPathToDir(resourcesPath), '.resources.md'), utils_1.getReadme('resources'));
            fs_1.writeFileSync(path_1.join(utils_1.convertPathToDir(expansionPath), '.expansion.md'), utils_1.getReadme('expansion'));
            this.showLoading = false;
            this.display = `[成功] 创建成功\n${uiPath}`;
        }
    }
});
