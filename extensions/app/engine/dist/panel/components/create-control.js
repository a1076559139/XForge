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
        '    Refresh\r\n' +
        '}\r\n' +
        'export class ' + name + ' extends BaseControl<' + name + ', typeof Event, {\r\n' +
        '    // 定义了监听Refresh时函数的参数列表和返回值(类型检查可省略不写，但建议补全)\r\n' +
        '    Refresh: (a: number) => any\r\n' +
        '}>(Event) {\r\n' +
        '    // control中发射事件, view中监听事件:\r\n' +
        '    // 1、view中需要将 「extends BaseView」 改为=> 「extends BaseView.bindControl(' + name + ')」\r\n' +
        '    // 2、view中使用this.control.on监听事件\r\n' +
        '    refresh() {\r\n' +
        '        this.emit(Event.Refresh, 1000); //正确\r\n' +
        '        this.emit(Event.Refresh, true); //参数类型错误\r\n' +
        '    }\r\n' +
        '}';
}
exports.default = vue_1.default.extend({
    template: utils_1.getResPanel('create-control'),
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
            if (/^[a-z][a-z0-9-]*[a-z0-9]+$/.test(name) === false) {
                this.display = '[错误] 名字不合法\n1、不能以数字开头\n2、不能有大写字母\n3、分隔符只能使用-\n4、不能以分隔符开头或结尾';
                return;
            }
            const rootPath = 'db://assets/app-builtin/app-control';
            const controlName = `${utils_1.stringCase(name)}Control`;
            const scriptUrl = `${rootPath}/${controlName}.ts`;
            // 创建前确认
            const createResponse = await Editor.Dialog.info('请确认', { detail: controlName, buttons: ['创建并打开', '仅创建', '取消'], default: 0, cancel: 2 });
            if (createResponse.response == 2) {
                return;
            }
            this.display = '创建中';
            this.showLoading = true;
            if (fs_1.existsSync(utils_1.convertUrlToPath(scriptUrl))) {
                this.showLoading = false;
                this.display = `[错误] 文件已存在, 请删除\n${scriptUrl}`;
                return;
            }
            // 目录如果不存在则创建
            if (!await utils_1.createFolderByUrl(rootPath, { meta: utils_1.getResMeta('app-control'), readme: utils_1.getResReadme('app-control') })) {
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
            // 是否打开
            if (createResponse.response == 0) {
                Editor.Message.request('asset-db', 'open-asset', scriptUrl);
            }
        }
    },
});
