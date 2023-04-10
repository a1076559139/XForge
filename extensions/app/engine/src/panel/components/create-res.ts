import Vue from 'vue/dist/vue';
import { createFolderByUrl, getMeta, getReadme, getTemplate, stringCase } from '../../utils';

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

            if (/^[a-z][a-z0-9-]*[a-z0-9]+$/.test(name) === false) {
                this.display = '[错误] 名字不合法\n匹配规则: /^[a-z][a-z0-9-]*[a-z0-9]+$/\n1、不能以数字开头\n2、不能有大写字母\n3、分隔符只能使用-\n4、不能以分隔符开头或结尾';
                return;
            }

            this.display = '创建中';
            this.showLoading = true;

            if (!await createFolderByUrl(folderPath, {
                readme: getReadme(folderName),
                meta: folderName === 'resources' ? getMeta('resources') : undefined,
                subFolders: [
                    {
                        folder: name,
                        meta: this.typeSelectIndex === 0 ? getMeta('resources') : undefined
                    }
                ]
            })) {
                this.showLoading = false;
                this.display = '[错误] 创建失败';
                return;
            }

            this.showLoading = false;
            this.display = `[成功] 创建成功\n${folderPath}`;
        }
    },
});