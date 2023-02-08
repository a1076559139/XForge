import Vue from 'vue/dist/vue';
import { createFolderByPath, getReadme, getTemplate, stringCase } from '../../utils';

const typeNames: ('res-bundle' | 'res-native' | 'resources')[] = ['res-bundle', 'res-native', 'resources'];
export default Vue.extend({
    template: getTemplate('create-res'),
    data() {
        return {
            inputName: '',
            display: '',

            typeSelects: ['公共动态目录', '公共静态目录', 'resources'],
            typeSelectIndex: 0,

            showLoading: false
        };
    },
    methods: {
        onChangeTypeSelect(index: string) {
            this.typeSelectIndex = Number(index);
        },
        async onClickCreate() {
            const folderName = typeNames[this.typeSelectIndex];
            const folderPath = `db://assets/${folderName}`;
            const name = stringCase(this.inputName, true);

            if (/^[a-zA-Z0-9_]+$/.test(name) === false) {
                this.display = `[错误] 名字不合法, 请修改\n匹配规则: /^[a-zA-Z0-9_]+$/`;
                return;
            }

            this.display = `创建中`;
            this.showLoading = true;

            if (!await createFolderByPath(folderPath, {
                readme: getReadme(folderName),
                subFolders: [
                    {
                        folder: name,
                        meta: this.typeSelectIndex === 0 ? {
                            userData: {
                                isBundle: true
                            }
                        } : undefined
                    }
                ]
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