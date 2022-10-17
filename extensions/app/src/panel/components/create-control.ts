import Vue from 'vue/dist/vue';
import { createDBDir, getTemplate, stringCase } from '../utils';

/**
 * 根据语言获取脚本内容
 */
function getScript(name: string) {
    const basePath = '../../../extensions/app/assets/base/BaseControl';
    return "import BaseControl from '" + basePath + "';\r\n" +
        "// 事件名(首字母大写),可以通过 " + name + ".Event 调用\r\n" +
        "enum Event { \r\n" +
        "    // Refresh\r\n" +
        "}\r\n" +
        "export class " + name + " extends BaseControl<" + name + ", typeof Event>(Event) {\r\n" +
        "    // control中发射事件, view中监听事件:\r\n" +
        "    // 1、view中需要将 「class " + name.slice(0, -7) + " extends BaseView」 改为=> 「class " + name.slice(0, -7) + " extends BaseView.bindControl(" + name + ")」\r\n" +
        "    // 2、view中使用this.control.on监听事件\r\n" +
        "    // refresh() { this.emit(Event.Refresh) }\r\n" +
        "}";
}

export default Vue.extend({
    template: getTemplate('create-control'),
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
                this.display = `[错误] 名字不合法, 请删除\n/^[a-zA-Z0-9_]+$/.test(${name})`;
                return;
            }

            const controlName = `${stringCase(name)}Control`;
            const controlPath = `db://assets/app-builtin/app-control`;
            const scriptFile = `${controlPath}/${controlName}.ts`;

            this.display = '创建中';
            this.showLoading = true;

            if (!await createDBDir(controlPath)) {
                this.showLoading = false;
                this.display = `[错误] 创建目录失败\n${controlPath}`;
                return;
            }

            // 创建script
            const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptFile, getScript(controlName)).catch(_ => null);
            if (!createScriptResult) {
                this.showLoading = false;
                this.display = `[错误] 创建脚本失败\n${scriptFile}`;
                return;
            }

            this.showLoading = false;
            this.display = `[成功] 创建成功`;
        }
    },
});