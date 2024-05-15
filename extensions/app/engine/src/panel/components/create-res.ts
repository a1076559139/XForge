import Vue from '../../../../vue';
import { createFolderByUrl, getResMeta, getResPanel, getResReadme, stringCase } from '../../utils';

const typeNames: ('res-bundle' | 'res-native' | 'resources')[] = ['res-native', 'res-bundle', 'resources'];
export default Vue.extend({
    template: getResPanel('create-res'),
    data() {
        return {
            inputName: '',
            display: '',

            typeSelects: ['公共静态目录', '公共动态目录', 'resources'],
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

            if (/^[a-z][a-z0-9-]*[a-z0-9]+$/.test(this.inputName) === false) {
                this.display = '[错误] 名字不合法\n1、不能以数字开头\n2、不能有大写字母\n3、分隔符只能使用-\n4、不能以分隔符开头或结尾';
                return;
            }
            if (name === 'resources') {
                this.display = '[错误] 名字不合法\n1、不能使用resources作为名字';
                return;
            }

            // 创建前确认
            const createResponse = await Editor.Dialog.info('请确认', { detail: name, buttons: ['创建', '取消'], default: 0, cancel: 1 });
            if (createResponse.response == 1) {
                return;
            }

            this.display = '创建中';
            this.showLoading = true;

            if (!await createFolderByUrl(folderPath, {
                readme: getResReadme(folderName),
                meta: folderName === 'resources' ? getResMeta('resources') : undefined,
                subFolders: [
                    {
                        folder: name,
                        meta: folderName === 'res-bundle' ? getResMeta('custom-bundle') : undefined
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