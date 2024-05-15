import Vue from '../../../../vue';
import { createFolderByUrl, getResMeta, getResPanel, getResReadme } from '../../utils';

export default Vue.extend({
    template: getResPanel('create-sound'),
    data() {
        return {
            display: '',

            typeSelects: ['音乐', '音效'],
            typeSelectIndex: 0,

            showLoading: false
        };
    },
    methods: {
        onChangeTypeSelect(index: string) {
            this.typeSelectIndex = Number(index);
        },
        async onClickCreate() {
            this.display = '创建中';
            this.showLoading = true;

            const rootPath = 'db://assets/app-bundle/app-sound';

            if (!await createFolderByUrl(rootPath, {
                meta: getResMeta('app-sound'),
                readme: getResReadme('app-sound'),
                subFolders: [
                    {
                        folder: this.typeSelectIndex === 0 ? 'music' : 'effect',
                        readme: getResReadme(this.typeSelectIndex === 0 ? 'sound-music' : 'sound-effect')
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