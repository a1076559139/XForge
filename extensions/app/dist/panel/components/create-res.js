"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vue_1 = __importDefault(require("vue/dist/vue"));
const utils_1 = require("../../utils");
const typeNames = ['res-bundle', 'res-native', 'resources'];
exports.default = vue_1.default.extend({
    template: utils_1.getTemplate('create-res'),
    data() {
        return {
            inputName: '',
            display: '',
            typeSelects: ['公共动态目录', '公共静态目录', 'resources'],
            typeSelectIndex: 0,
            showInput: true,
            showLoading: false
        };
    },
    methods: {
        onChangeTypeSelect(index) {
            this.typeSelectIndex = Number(index);
            this.showInput = (this.typeSelectIndex === 0);
        },
        async onClickCreate() {
            const folderName = typeNames[this.typeSelectIndex];
            const folderPath = `db://assets/${folderName}`;
            const name = utils_1.stringCase(this.inputName, true);
            if (/^[a-zA-Z0-9_]+$/.test(name) === false) {
                this.display = `[错误] 名字不合法, 请修改\n匹配规则: /^[a-zA-Z0-9_]+$/`;
                return;
            }
            this.display = `创建中`;
            this.showLoading = true;
            if (!await utils_1.createFolderByPath(folderPath, {
                readme: utils_1.getReadme(folderName),
                subFolders: this.typeSelectIndex === 0 ? [
                    {
                        folder: name,
                        meta: {
                            userData: {
                                isBundle: true
                            }
                        }
                    }
                ] : undefined
            })) {
                this.showLoading = false;
                this.display = `[错误] 创建失败`;
                return;
            }
            this.showLoading = false;
            this.display = `[成功] 创建成功\n${folderPath}`;
        }
    },
});
