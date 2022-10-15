import { existsSync } from 'fs-extra';
import Vue from 'vue/dist/vue';
import { convertDBToPath, createDBDir, getTemplate, stringCase } from '../utils';

/**
 * 根据语言获取脚本内容
 */
function getScript(name: string) {
    const basePath = '../../../../extensions/app/assets/base/BaseManager';
    return "import { _decorator } from 'cc';\r\n" +
        "import BaseManager from '" + basePath + "';\r\n" +
        "const { ccclass, property } = _decorator;\r\n" +
        "@ccclass('" + name + "')\r\n" +
        "export class " + name + " extends BaseManager {\r\n" +
        "    // [无序] 加载完成时触发\r\n" +
        "    protected onLoad() { }\r\n\r\n" +
        "    // [无序] 自身初始化完成, init执行完毕后被调用\r\n" +
        "    protected onInited() { }\r\n\r\n" +
        "    // [无序] 所有manager初始化完成\r\n" +
        "    protected onFinished() { }\r\n\r\n" +
        "    // [无序] 初始化manager，在初始化完成后，调用finish方法\r\n" +
        "    protected init(finish: Function) {\r\n" +
        "        super.init(finish);\r\n" +
        "    }\r\n" +
        "}";
}

export default Vue.extend({
    template: getTemplate('create-manager'),
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

            const managerName = `${stringCase(name)}Manager`;
            const managerPath = `db://assets/app-builtin/app-manager/${stringCase(name, true)}`;
            const scriptFile = `${managerPath}/${managerName}.ts`;
            const prefabFile = `${managerPath}/${managerName}.prefab`;

            this.display = '创建中';
            this.showLoading = true;

            if (existsSync(convertDBToPath(managerPath))) {
                this.showLoading = false;
                this.display = `[错误] 目录已存在, 请删除\n${managerPath}`;
                return;
            }

            if (!await createDBDir(managerPath)) {
                this.showLoading = false;
                this.display = `[错误] 创建目录失败\n${managerPath}`;
                return;
            }

            // 创建script
            const createScriptResult = await Editor.Message.request('asset-db', 'create-asset', scriptFile, getScript(managerName)).catch(_ => null);
            if (!createScriptResult) {
                this.showLoading = false;
                this.display = `[错误] 创建脚本失败\n${scriptFile}`;
                return;
            }

            // 创建prefab
            const createPrefabResult = await Editor.Message.request('scene', 'execute-scene-script', {
                name: 'app',
                method: 'createPrefab',
                args: [managerName, prefabFile]
            });
            if (!createPrefabResult) {
                this.showLoading = false;
                this.display = `[错误] 创建预制体失败\n${prefabFile}`;
                return;
            }

            this.showLoading = false;
            this.display = `[成功] 创建成功`;
        }
    },
});