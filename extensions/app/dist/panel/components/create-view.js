"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
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
function getPages() {
    // page目录
    const pageDir = (0, path_1.join)(Editor.Project.path, 'assets/app-bundle/app-view/page');
    // 读取page目录下所有文件
    const files = (0, fs_extra_1.existsSync)(pageDir) ? (0, fs_extra_1.readdirSync)(pageDir) : [];
    // 筛选
    const PageSelects = [];
    files.forEach((name) => {
        const item_dir = (0, path_1.join)(pageDir, name);
        const isDirectory = (0, fs_extra_1.statSync)(item_dir).isDirectory();
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
            const type = this.typeSelects[this.typeSelectIndex];
            const name = this.inputName;
            if (/^[a-zA-Z0-9_]+$/.test(name) === false) {
                this.display = `[错误] 名字不合法, 请删除\n/^[a-zA-Z0-9_]+$/.test(${name})`;
                return;
            }
            const baseName = `${(0, utils_1.stringCase)(name)}`;
            const viewName = isPaper ?
                `${(0, utils_1.stringCase)(type)}${(0, utils_1.stringCase)(PageBaseName[owner])}${baseName}` :
                `${(0, utils_1.stringCase)(type)}${baseName}`;
            const viewPath = isPaper ?
                `db://assets/app-bundle/app-view/${(0, utils_1.stringCase)(type, true)}/${PageBaseName[owner]}/${(0, utils_1.stringCase)(name, true)}` :
                `db://assets/app-bundle/app-view/${(0, utils_1.stringCase)(type, true)}/${(0, utils_1.stringCase)(name, true)}`;
            const scriptFile = `${viewPath}/view/${viewName}.ts`;
            const prefabFile = `${viewPath}/view/${viewName}.prefab`;
            this.display = '创建中';
            this.showLoading = true;
            if ((0, fs_extra_1.existsSync)((0, utils_1.convertDBToPath)(viewPath))) {
                this.showLoading = false;
                this.display = `[错误] 目录已存在, 请删除\n${viewPath}`;
                return;
            }
            if (!await (0, utils_1.createDBDir)(viewPath, ['view', 'res'])) {
                this.showLoading = false;
                this.display = `[错误] 创建目录失败\n${viewPath}`;
                return;
            }
            // 创建script
            const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptFile, getComScript(viewName, isPaper)).catch(_ => null);
            if (!createScriptResult) {
                this.showLoading = false;
                this.display = `[错误] 创建脚本失败\n${scriptFile}`;
                return;
            }
            // 创建prefab
            const createPrefabResult = await Editor.Message.request('scene', 'execute-scene-script', {
                name: 'app',
                method: 'createPrefab',
                args: [viewName, prefabFile, isPaper]
            });
            if (!createPrefabResult) {
                this.showLoading = false;
                this.display = `[错误] 创建预制体失败\n${prefabFile}`;
                return;
            }
            this.showLoading = false;
            this.display = `[成功] 创建成功`;
        }
    }
});
