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
function getScript(name) {
    const basePath = '../../../extensions/app/assets/base/BaseControl';
    return 'import BaseControl from \'' + basePath + '\';\r\n' +
        '// 事件名(首字母大写),可以通过 ' + name + '.Event 调用\r\n' +
        'enum Event { \r\n' +
        '    // Refresh\r\n' +
        '}\r\n' +
        'export class ' + name + ' extends BaseControl<' + name + ', typeof Event>(Event) {\r\n' +
        '    // control中发射事件, view中监听事件:\r\n' +
        '    // 1、view中需要将 「class ' + name.slice(0, -7) + ' extends BaseView」 改为=> 「class ' + name.slice(0, -7) + ' extends BaseView.bindControl(' + name + ')」\r\n' +
        '    // 2、view中使用this.control.on监听事件\r\n' +
        '    // refresh() { this.emit(Event.Refresh) }\r\n' +
        '}';
}
exports.default = vue_1.default.extend({
    template: utils_1.getTemplate('create-control'),
    data() {
        return {
            inputName: '',
            display: '',
            showLoading: false
        };
    },
    methods: {
        async onClickCreate() {
            const name = this.inputName;
            if (/^[a-zA-Z0-9_]+$/.test(name) === false) {
                this.display = '[错误] 名字不合法, 请修改\n匹配规则: /^[a-zA-Z0-9_]+$/';
                return;
            }
            const rootPath = 'db://assets/app-builtin/app-control';
            const controlName = `${utils_1.stringCase(name)}Control`;
            const scriptUrl = `${rootPath}/${controlName}.ts`;
            this.display = '创建中';
            this.showLoading = true;
            if (fs_1.existsSync(utils_1.convertPathToDir(scriptUrl))) {
                this.showLoading = false;
                this.display = `[错误] 文件已存在, 请删除\n${scriptUrl}`;
                return;
            }
            // 目录如果不存在则创建
            if (!await utils_1.createFolderByPath(rootPath, { meta: utils_1.getMeta('app-control'), readme: utils_1.getReadme('app-control') })) {
                this.showLoading = false;
                this.display = `[错误] 创建目录失败\n${rootPath}`;
                return;
            }
            // 创建script
            const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, getScript(controlName)).catch(_ => null);
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
