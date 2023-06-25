import { existsSync } from 'fs';
import Vue from 'vue/dist/vue';
import { convertUrlToPath, createFolderByUrl, getResMeta, getResPanel, getResReadme, stringCase } from '../../utils';

/**
 * 根据语言获取脚本内容
 */
function getScript(type: string, className: string) {
    if (type === 'data' || type === 'config') {
        const BaseModel = '../../../extensions/app/assets/base/BaseModel';
        return 'import { IModel } from \'' + BaseModel + '\';\r\n' +
            'export default class ' + className + ' implements IModel<' + className + '> {\r\n' +
            '}';
    } else {
        return '// 存放直接导出的interface、type或enum等\r\n\r\n' +
            '// export type IString = string;\r\n' +
            '// export enum Type { None };';
    }
}

export default Vue.extend({
    template: getResPanel('create-model'),
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

            if (/^[a-z][a-z0-9-]*[a-z0-9]+$/.test(name) === false) {
                this.display = '[错误] 名字不合法\n匹配规则: /^[a-z][a-z0-9-]*[a-z0-9]+$/\n1、不能以数字开头\n2、不能有大写字母\n3、分隔符只能使用-\n4、不能以分隔符开头或结尾';
                return;
            }

            const rootPath = 'db://assets/app-builtin/app-model';
            const modelName = `${type}.${name}`;
            const scriptUrl = `${rootPath}/${modelName}.ts`;

            // 创建前确认
            const createResponse = await Editor.Dialog.info('请确认', { detail: modelName, buttons: ['创建并打开', '仅创建', '取消'], default: 0, cancel: 2 });
            if (createResponse.response == 2) {
                return;
            }

            this.display = '创建中';
            this.showLoading = true;

            // 目录如果不存在则创建
            if (!await createFolderByUrl(rootPath, { meta: getResMeta('app-model'), readme: getResReadme('app-model') })) {
                this.showLoading = false;
                this.display = `[错误] 创建目录失败\n${rootPath}`;
                return;
            }

            if (existsSync(convertUrlToPath(scriptUrl))) {
                this.showLoading = false;
                this.display = `[错误] 文件已存在, 请删除\n${scriptUrl}`;
                return;
            }

            const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptUrl, getScript(type, stringCase(name))).catch(_ => null);
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