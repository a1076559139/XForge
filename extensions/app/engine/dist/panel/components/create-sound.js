"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vue_1 = __importDefault(require("../../../../vue"));
const utils_1 = require("../../utils");
exports.default = vue_1.default.extend({
    template: utils_1.getResPanel('create-sound'),
    data() {
        return {
            display: '',
            typeSelects: ['音乐', '音效'],
            typeSelectIndex: 0,
            showLoading: false
        };
    },
    methods: {
        onChangeTypeSelect(index) {
            this.typeSelectIndex = Number(index);
        },
        async onClickCreate() {
            this.display = '创建中';
            this.showLoading = true;
            const rootPath = 'db://assets/app-bundle/app-sound';
            if (!await utils_1.createFolderByUrl(rootPath, {
                meta: utils_1.getResMeta('app-sound'),
                readme: utils_1.getResReadme('app-sound'),
                subFolders: [
                    {
                        folder: this.typeSelectIndex === 0 ? 'music' : 'effect',
                        readme: utils_1.getResReadme(this.typeSelectIndex === 0 ? 'sound-music' : 'sound-effect')
                    }
                ]
            })) {
                this.showLoading = false;
                this.display = '[错误] 创建失败';
                return;
            }
            this.showLoading = false;
            this.display = `[成功] 创建成功\n${rootPath}`;
        }
    },
});
