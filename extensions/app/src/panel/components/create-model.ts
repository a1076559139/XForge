import Vue from 'vue/dist/vue';
import { getTemplate } from '../utils';

/**
 * 根据语言获取脚本内容
 */
function getScript(type: string, name: string) {
    if (type === 'data' || type === 'config') {
        return "export default class " + name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() + " {\r\n" +
            "}";
    } else {
        return '// 存放接口';
    }
}

export default Vue.extend({
    template: getTemplate('create-model'),
    data() {
        return {
            inputName: '',
            display: '',

            typeSelects: ['data', 'config', 'interface'],
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
                this.display = `[错误] 名字不合法, 请删除\n/^[a-zA-Z0-9_]+$/.test(${name})`;
                return;
            }

            this.showLoading = true;

            const file = `db://assets/app-builtin/app-model/${type}.${name}.ts`;
            const result = await Editor.Message.request('asset-db', 'create-asset', file, getScript(type, name)).catch(_ => null);
            if (!result) this.display = `[错误] 创建失败`;

            this.showLoading = false;
        }
    },
});