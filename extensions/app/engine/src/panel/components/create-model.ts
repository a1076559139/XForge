import { existsSync } from 'fs';
import Vue from '../../../../vue';
import { convertUrlToPath, createFolderByUrl, getResMeta, getResPanel, getResReadme, stringCase } from '../../utils';

/**
 * 根据语言获取脚本内容
 */
function getScript(type: string, className: string) {
    if (type === 'data') {
        const BaseModel = '../../../extensions/app/assets/base/BaseModel';
        return 'import { IModel } from \'' + BaseModel + '\';\r\n' +
            '// data中不能定义任何方法\r\n' +
            'export default class ' + className + ' implements IModel<' + className + '> {\r\n' +
            '}';
    } else if (type === 'config') {
        const BaseModel = '../../../extensions/app/assets/base/BaseModel';
        return 'import { IModel } from \'' + BaseModel + '\';\r\n' +
            '// config中不能定义任何方法, 任何变量在外部访问都是readonly\r\n' +
            'export default class ' + className + ' implements IModel<' + className + '> {\r\n' +
            '}';
    } else if (type === 'store') {
        const BaseModel = '../../../extensions/app/assets/base/BaseModel';
        return 'import { IStore } from \'' + BaseModel + '\';\r\n' +
            '// store中只允许在根路径下定义方法，任何变量在外部访问都是readonly\r\n' +
            '// store类型的引入是借鉴了Web前端框架中全局状态管理的思路，意图是让数据更安全，更可控。同时框架中还提供了数据绑定的扩展包，可以通过pkg的方式安装，实现「数据->视图」的单向绑定。\r\n' +
            'export default class ' + className + ' implements IStore<' + className + '> {\r\n' +
            '    count = 0;\r\n' +
            '    setCount(v: number) {\r\n' +
            '        this.count = v;\r\n' +
            '    }\r\n' +
            '}';
    } else {
        return '// 🔥切记: 当前文件处于分包中, 由于加载顺序的原因，不可以在「主包」中使用此文件内导出的变量\r\n' +
            '// 存放直接导出的interface、type或enum等\r\n\r\n' +
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

            typeSelects: ['store', 'data', 'config', 'export'],
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
                this.display = '[错误] 名字不合法\n1、不能以数字开头\n2、不能有大写字母\n3、分隔符只能使用-\n4、不能以分隔符开头或结尾';
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