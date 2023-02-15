"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const vue_1 = __importDefault(require("vue/dist/vue"));
const utils_1 = require("../../utils");
/**
 * 根据语言获取脚本内容
 */
function getScript(type, name) {
    if (type === 'data' || type === 'config') {
        const BaseModel = '../../../extensions/app/assets/base/BaseModel';
        const className = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        return 'import { IModel } from \'' + BaseModel + '\';\r\n' +
            'export default class ' + className + ' implements IModel<' + className + '> {\r\n' +
            '}';
    }
    else {
        return '// 存放直接导出的interface、type或enum等\r\n\r\n' +
            '// export type IString = string;\r\n' +
            '// export enum Type { None };';
    }
}
exports.default = vue_1.default.extend({
    template: utils_1.getTemplate('create-model'),
    data() {
        return {
            inputName: '',
            display: '',
            typeSelects: ['data', 'config', 'export'],
            typeSelectIndex: 0,
            showLoading: false
        };
    },
    methods: {
        onChangeTypeSelect(index) {
            this.typeSelectIndex = Number(index);
        },
        async onClickCreate() {
            const type = this.typeSelects[this.typeSelectIndex];
            const name = this.inputName;
            if (/^[a-zA-Z0-9_]+$/.test(name) === false) {
                this.display = '[错误] 名字不合法, 请修改\n匹配规则: /^[a-zA-Z0-9_]+$/';
                return;
            }
            this.display = '创建中';
            this.showLoading = true;
            const rootPath = 'db://assets/app-builtin/app-model';
            const modelName = `${type}.${name}`;
            const scriptUrl = `${rootPath}/${modelName}.ts`;
            if (fs_1.existsSync(utils_1.convertPathToDir(scriptUrl))) {
                this.showLoading = false;
                this.display = `[错误] 文件已存在, 请删除\n${scriptUrl}`;
                return;
            }
            // 目录如果不存在则创建
            if (!await utils_1.createFolderByPath(rootPath, { meta: utils_1.getMeta('app-model'), readme: utils_1.getReadme('app-model') })) {
                this.showLoading = false;
                this.display = `[错误] 创建目录失败\n${rootPath}`;
                return;
            }
            const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, getScript(type, name)).catch(_ => null);
            if (!createScriptResult) {
                this.showLoading = false;
                this.display = `[错误] 创建脚本失败\n${scriptUrl}`;
                return;
            }
            this.showLoading = false;
            this.display = `[成功] 创建成功\n${rootPath}`;
        }
    },
});
