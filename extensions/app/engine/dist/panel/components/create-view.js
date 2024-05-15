"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const vue_1 = __importDefault(require("../../../../vue"));
const utils_1 = require("../../utils");
/**
 * 获取脚本内容
 */
function getComScript(name = 'NewClass') {
    const isPage = name.toLocaleLowerCase().startsWith('page');
    const isPaper = name.toLocaleLowerCase().startsWith('paper');
    const basePath = isPaper ? '../../../../../../../extensions/app/assets/base/BaseView' : '../../../../../../extensions/app/assets/base/BaseView';
    return 'import { _decorator, Node } from \'cc\';\r\n' +
        'import BaseView from \'' + basePath + '\';\r\n' +
        `${isPage ? 'import { IMiniViewNames } from \'../../../../../app-builtin/app-admin/executor\';\r\n' : ''}` +
        'const { ccclass, property } = _decorator;\r\n' +
        '@ccclass(\'' + name + '\')\r\n' +
        'export class ' + name + ' extends BaseView {\r\n' +
        `    ${isPage ? '// 子界面列表，数组顺序为子界面排列顺序\r\n' : '\r\n'}` +
        `    ${isPage ? 'protected miniViews: IMiniViewNames = [];\r\n' : '\r\n'}` +
        '    // 初始化的相关逻辑写在这\r\n' +
        '    onLoad() {}\r\n\r\n' +
        '    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)\r\n' +
        `    ${isPage ? 'onShow(params: any) { this.showMiniViews({ views: this.miniViews }); }\r\n\r\n' : 'onShow(params: any) {}\r\n\r\n'}` +
        '    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)\r\n' +
        '    onHide(result: undefined) {\r\n' +
        '        // app.manager.ui.show<' + name + '>({name: \'' + name + '\', onHide:(result) => { 接收到return的数据，并且有类型提示 }})\r\n' +
        '        return result;\r\n' +
        '    }\r\n' +
        '}';
}
function getNaMetaUserData(name = 'new-class') {
    return Object.assign(Object.assign({}, utils_1.getResMeta('view-native')), { 'bundleName': `${name}` });
}
function getResMetaUserData(name = 'new-class') {
    return Object.assign(Object.assign({}, utils_1.getResMeta('view-resources')), { 'bundleName': `${name}-res` });
}
/**
 * UI类型(小写)
 */
const TypeSelects = ['page', 'paper', 'pop', 'top'];
/**
 * 大驼峰UI名(带page前缀) => 串式UI目录名(不带page前缀)
 */
const PageNames = new Map();
function updatePages() {
    PageNames.clear();
    // page目录
    const pageRootPath = path_1.join(Editor.Project.path, 'assets/app-bundle/app-view/page');
    // 读取page目录下所有文件
    const folderNames = fs_1.existsSync(pageRootPath) ? fs_1.readdirSync(pageRootPath) : [];
    // 大驼峰命名的UI名
    folderNames.forEach((folderName) => {
        // folderName为串式命名法
        const pagePath = path_1.join(pageRootPath, folderName);
        const isDirectory = fs_1.statSync(pagePath).isDirectory();
        if (isDirectory) {
            PageNames.set(`Page${utils_1.stringCase(folderName)}`, folderName);
        }
    });
    PageNames.set('通用', 'all');
    return Array.from(PageNames.keys());
}
exports.default = vue_1.default.extend({
    template: utils_1.getResPanel('create-view'),
    data() {
        return {
            showLoading: false,
            showSelectPage: false,
            showSelectGroup: true,
            inputName: '',
            display: '',
            typeSelects: TypeSelects,
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
            if (index == '0') {
                this.showSelectGroup = true;
            }
            else {
                this.showSelectGroup = false;
            }
            if (index == '1') {
                this.pageSelectIndex = 0;
                this.pageSelects = updatePages();
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
            // ui归属(大驼峰)
            const owner = this.pageSelects[this.pageSelectIndex];
            // ui类型(小写)
            const type = this.typeSelects[this.typeSelectIndex];
            // ui名字(串式)
            const name = this.inputName;
            if (/^[a-z][a-z0-9-]*[a-z0-9]+$/.test(name) === false) {
                this.display = '[错误] 名字不合法\n1、不能以数字开头\n2、不能有大写字母\n3、分隔符只能使用-\n4、不能以分隔符开头或结尾';
                return;
            }
            if (name === 'all') {
                this.display = '[错误] 名字不合法\n1、不能使用all作为名字';
                return;
            }
            const is3D = isPage && this.groupSelectIndex == 1;
            const ownerName = PageNames.get(owner);
            const uiName = isPaper ?
                `${utils_1.stringCase(type)}${utils_1.stringCase(ownerName)}${utils_1.stringCase(name)}` :
                `${utils_1.stringCase(type)}${utils_1.stringCase(name)}`;
            const bundleName = isPaper ?
                `${type}-${ownerName}-${name}` :
                `${type}-${name}`;
            const bundleFolderUrl = 'db://assets/app-bundle';
            const viewFolderUrl = `${bundleFolderUrl}/app-view`;
            const typeFolderUrl = `${viewFolderUrl}/${type}`;
            const uiFolderUrl = isPaper ?
                `${typeFolderUrl}/${ownerName}/${name}` :
                `${typeFolderUrl}/${name}`;
            const nativeUrl = `${uiFolderUrl}/native`;
            const resourcesUrl = `${uiFolderUrl}/resources`;
            const expansionUrl = `${nativeUrl}/expansion`;
            const scriptUrl = `${nativeUrl}/${uiName}.ts`;
            const prefabUrl = `${nativeUrl}/${uiName}.prefab`;
            const sceneUrl = `${nativeUrl}/${uiName}.scene`;
            const singleColorUrl = `${resourcesUrl}/singleColor.png`;
            // 创建前确认
            const createResponse = await Editor.Dialog.info('请确认', { detail: uiName, buttons: ['创建并打开', '仅创建', '取消'], default: 0, cancel: 2 });
            if (createResponse.response == 2) {
                return;
            }
            this.display = '创建中';
            this.showLoading = true;
            // 创建目录
            if (!await utils_1.createFolderByUrl(uiFolderUrl, { subPaths: ['native', 'resources', 'native/expansion'] })) {
                this.showLoading = false;
                this.display = `[错误] 创建目录失败\n${uiFolderUrl}`;
                return;
            }
            // 设置native分包
            await utils_1.delayFileExistsByUrl(`${nativeUrl}.meta`);
            const queryNativeMeta = await Editor.Message.request('asset-db', 'query-asset-meta', nativeUrl).catch(_ => null);
            if (!queryNativeMeta) {
                this.showLoading = false;
                this.display = '[错误] 设置native分包配置失败';
                return;
            }
            queryNativeMeta.userData = getNaMetaUserData(bundleName);
            await Editor.Message.request('asset-db', 'save-asset-meta', nativeUrl, JSON.stringify(queryNativeMeta)).catch(_ => null);
            // 设置resources分包
            await utils_1.delayFileExistsByUrl(`${resourcesUrl}.meta`);
            const queryResMeta = await Editor.Message.request('asset-db', 'query-asset-meta', resourcesUrl).catch(_ => null);
            if (!queryResMeta) {
                this.showLoading = false;
                this.display = '[错误] 设置resources分包配置失败';
                return;
            }
            queryResMeta.userData = getResMetaUserData(bundleName);
            await Editor.Message.request('asset-db', 'save-asset-meta', resourcesUrl, JSON.stringify(queryResMeta)).catch(_ => null);
            fs_1.writeFileSync(path_1.join(utils_1.convertUrlToPath(bundleFolderUrl), '.app-bundle.md'), utils_1.getResReadme('app-bundle'));
            fs_1.writeFileSync(path_1.join(utils_1.convertUrlToPath(viewFolderUrl), '.app-view.md'), utils_1.getResReadme('app-view'));
            fs_1.writeFileSync(path_1.join(utils_1.convertUrlToPath(typeFolderUrl), `.${type}.md`), `1、所有${type}类型UI的根目录\n2、如不再需要，可以直接删除此文件夹`);
            fs_1.writeFileSync(path_1.join(utils_1.convertUrlToPath(nativeUrl), '.native.md'), utils_1.getResReadme('view-native'));
            fs_1.writeFileSync(path_1.join(utils_1.convertUrlToPath(resourcesUrl), '.resources.md'), utils_1.getResReadme('view-resources'));
            fs_1.writeFileSync(path_1.join(utils_1.convertUrlToPath(expansionUrl), '.expansion.md'), utils_1.getResReadme('view-expansion'));
            if (isPaper) {
                fs_1.writeFileSync(path_1.join(utils_1.convertUrlToPath(`${typeFolderUrl}/${ownerName}`), `.${ownerName}.md`), (ownerName === 'all' ? '1、归属于全体Page' : `1、归属于Page${utils_1.stringCase(ownerName)}`) + '\n2、如不再需要，可以直接删除此文件夹');
                fs_1.writeFileSync(path_1.join(utils_1.convertUrlToPath(uiFolderUrl), `.${name}.md`), `${uiName}所在文件夹\n1、通过${ownerName === 'all' ? '在任意Page中配置miniViews属性并调用showMiniViews方法' : `在${owner}中配置miniViews属性并调用showMiniViews方法`}的方式加载\n2、如不再需要，可以直接删除此文件夹`);
            }
            else {
                fs_1.writeFileSync(path_1.join(utils_1.convertUrlToPath(uiFolderUrl), `.${name}.md`), `${uiName}所在文件夹\n1、通过app.manager.ui.show({ name:'${uiName}' })的方式加载\n2、如不再需要，可以直接删除此文件夹`);
            }
            // 创建script
            if (!fs_1.existsSync(utils_1.convertUrlToPath(scriptUrl))) {
                const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, getComScript(uiName)).catch(_ => null);
                if (!createScriptResult) {
                    this.showLoading = false;
                    this.display = `[错误] 创建脚本失败\n${scriptUrl}`;
                    return;
                }
            }
            // 创建view
            if (!fs_1.existsSync(utils_1.convertUrlToPath(prefabUrl)) && !fs_1.existsSync(utils_1.convertUrlToPath(sceneUrl))) {
                if (is3D && isPage) {
                    const createSceneResult = await Editor.Message.request('scene', 'execute-scene-script', {
                        name: 'app',
                        method: 'createScene',
                        args: [uiName, sceneUrl]
                    }).catch(_ => null);
                    if (!createSceneResult) {
                        this.showLoading = false;
                        this.display = `[错误] 创建场景失败\n${sceneUrl}`;
                        return;
                    }
                }
                else {
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
                }
            }
            this.showLoading = false;
            this.display = `[成功] 创建成功\n${uiFolderUrl}`;
            // 是否打开
            if (createResponse.response == 0) {
                if (is3D) {
                    Editor.Message.request('asset-db', 'open-asset', sceneUrl);
                }
                else {
                    Editor.Message.request('asset-db', 'open-asset', prefabUrl);
                }
                Editor.Message.request('asset-db', 'open-asset', scriptUrl);
            }
            const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAA1BMVEX///+nxBvIAAAACklEQVQI12MAAgAABAABINItbwAAAABJRU5ErkJggg==';
            fs_1.writeFileSync(utils_1.convertUrlToPath(singleColorUrl), new Buffer(base64, 'base64'));
            Editor.Message.request('asset-db', 'refresh-asset', singleColorUrl).catch(_ => null);
        }
    }
});
