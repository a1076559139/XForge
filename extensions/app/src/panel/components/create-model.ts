import Vue from 'vue/dist/vue';
import { getTemplate } from '../utils';

/**
 * 根据语言获取脚本内容
 */
function getScript(type: string, name: string) {
    if (type === 'data' || type === 'config') {
        const BaseModel = '../../../extensions/app/assets/base/BaseModel';
        const className = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        return "import { IModel } from '" + BaseModel + "';\r\n" +
            "export default class " + className + " implements IModel<" + className + "> {\r\n" +
            "}";
    } else {
        return '// 存放直接导出的interface、type或enum等\r\n\r\n' +
            '// export type IString = string;\r\n' +
            '// export enum Type { None };';
    }
}

export default Vue.extend({
    template: getTemplate('create-model'),
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
        onChangeTypeSelect(index: string) {
            this.typeSelectIndex = Number(index);
        },
        async onClickCreate() {
            const type = this.typeSelects[this.typeSelectIndex];
            const name = this.inputName;

            if (/^[a-zA-Z0-9_]+$/.test(name) === false) {
                this.display = `[错误] 名字不合法, 请修改\n匹配规则: /^[a-zA-Z0-9_]+$/`;
                return;
            }

            this.showLoading = true;

            const fileUrl = `db://assets/app-builtin/app-model/${type}.${name}.ts`;
            const result = await Editor.Message.request('asset-db', 'create-asset', fileUrl, getScript(type, name)).catch(_ => null);
            if (!result) this.display = `[错误] 创建失败`;

            this.showLoading = false;
        }
    },
});