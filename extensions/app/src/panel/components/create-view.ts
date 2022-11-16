import { existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import Vue from 'vue/dist/vue';
import { convertPathToDir, createPath, delayFileExists, getTemplate, stringCase } from '../utils';

const PageBaseName: { [name: string]: string } = {};

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
    }
}

function getResMetaUserData(name = 'NewClass') {
    return {
        "compressionType": {},
        "isRemoteBundle": {
            "web-desktop": true,
            "web-mobile": true,
            "android": true,
            "ohos": true,
            "huawei-agc": true,
            "ios": true,
            "windows": true,
            "mac": true,
            "bytedance-mini-game": true,
            "oppo-mini-game": true,
            "huawei-quick-game": true,
            "cocos-play": true,
            "vivo-mini-game": true,
            "xiaomi-quick-game": true,
            "baidu-mini-game": true,
            "wechatgame": true
        },
        "priority": 8,
        "isBundle": true,
        "bundleName": `app-view_${name}_Res`
    }
}

function getPages() {
    // page目录
    const pageDir = join(Editor.Project.path, 'assets/app-bundle/app-view/page');

    // 读取page目录下所有文件
    const files = existsSync(pageDir) ? readdirSync(pageDir) : [];

    // 筛选
    const PageSelects: string[] = [];
    files.forEach((name) => {
        const item_dir = join(pageDir, name);
        const isDirectory = statSync(item_dir).isDirectory();
        if (isDirectory) {
            const page_name = `Page${stringCase(name)}`;
            PageSelects.push(page_name);
            PageBaseName[page_name] = name;
        }
    })

    return PageSelects;
}

export default Vue.extend({
    template: getTemplate('create-view'),
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

            pageSelects: [] as string[],
            pageSelectIndex: 0,
        };
    },
    methods: {
        onChangeGroupSelect(index: string) {
            this.groupSelectIndex = Number(index);
        },
        onChangeTypeSelect(index: string) {
            this.typeSelectIndex = Number(index);

            if (index == '0') {
                this.showSelectGroup = true;
            } else {
                this.showSelectGroup = false;
            }

            if (index == '1') {
                this.pageSelectIndex = 0;
                this.pageSelects = getPages();
                this.showSelectPage = true;
            } else {
                this.showSelectPage = false;
            }
        },
        onChangePageSelect(index: string) {
            this.pageSelectIndex = Number(index);
        },
        async onClickCreate() {
            const isPage = this.typeSelectIndex == 0;
            const isPaper = this.typeSelectIndex == 1;

            const owner = this.pageSelects[this.pageSelectIndex];
            const type = stringCase(this.typeSelects[this.typeSelectIndex], true);
            const name = stringCase(this.inputName, true);

            if (/^[a-zA-Z0-9_]+$/.test(name) === false) {
                this.display = `[错误] 名字不合法, 请修改\n匹配规则: /^[a-zA-Z0-9_]+$/`;
                return;
            }

            const is2D = isPage ? this.groupSelectIndex == 0 : true;
            const uiName = isPaper ?
                `${stringCase(type)}${stringCase(PageBaseName[owner])}${stringCase(name)}` :
                `${stringCase(type)}${stringCase(name)}`;
            const typePath = `db://assets/app-bundle/app-view/${type}`;
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

            if (existsSync(convertPathToDir(uiPath))) {
                this.showLoading = false;
                this.display = `[错误] 目录已存在, 请删除\n${uiPath}`;
                return;
            }

            if (!await createPath(uiPath, ['native', 'resources', 'native/expansion'])) {
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
                args: [uiName, prefabUrl, is2D]
            }).catch(_ => null);
            if (!createPrefabResult) {
                this.showLoading = false;
                this.display = `[错误] 创建预制体失败\n${prefabUrl}`;
                return;
            }

            // 设置native分包
            await delayFileExists(`${convertPathToDir(nativePath)}.meta`);
            const queryNativeMeta = await Editor.Message.request('asset-db', 'query-asset-meta', nativePath).catch(_ => null);
            if (!queryNativeMeta) {
                this.showLoading = false;
                this.display = `[错误] 设置native分包配置失败`;
                return;
            }
            queryNativeMeta.userData = getMetaUserData(uiName);
            await Editor.Message.request('asset-db', 'save-asset-meta', nativePath, JSON.stringify(queryNativeMeta)).catch(_ => null);

            // 设置resources分包
            await delayFileExists(`${convertPathToDir(resourcesPath)}.meta`);
            const queryResMeta = await Editor.Message.request('asset-db', 'query-asset-meta', resourcesPath).catch(_ => null);
            if (!queryResMeta) {
                this.showLoading = false;
                this.display = `[错误] 设置resources分包配置失败`;
                return;
            }
            queryResMeta.userData = getResMetaUserData(uiName);
            await Editor.Message.request('asset-db', 'save-asset-meta', resourcesPath, JSON.stringify(queryResMeta)).catch(_ => null);

            writeFileSync(join(convertPathToDir(uiPath), `.${name}.md`), `${uiName}所在文件夹, 通过${isPaper ? '在page中配置miniViews属性并调用showMiniViews方法' : 'app.manager.ui.show'}的方式加载`);
            writeFileSync(join(convertPathToDir(nativePath), '.native.md'), '存放脚本与预制体的文件夹, UI脚本与预制体一定在根目录下，其它脚本与预制体放到expansion目录下');
            writeFileSync(join(convertPathToDir(resourcesPath), '.resources.md'), 'UI资源目录，静态动态使用都可以，动态使用可在UI脚本内通过this.load加载(⚠️:脚本资源一定不要放在此文件夹内)');
            writeFileSync(join(convertPathToDir(expansionPath), '.expansion.md'), '只能存放脚本与预制体, 里面的资源只能以静态的方式引用(⚠️:动态使用的预制体请放到resources文件夹中, 但脚本一定在此文件夹中)');

            this.showLoading = false;
            this.display = `[成功] 创建成功`;
        }
    }
});