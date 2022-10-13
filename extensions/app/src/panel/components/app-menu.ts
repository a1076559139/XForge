import { readFileSync } from 'fs-extra';
import { join } from 'path';
import Vue from 'vue/dist/vue';

const Assets = join(__dirname, '../../../res/panel');

export default Vue.extend({
    template: readFileSync(join(Assets, 'components/app-menu.html'), 'utf-8'),
    data(): { app: any, index: number } {
        return {
            app: null,
            index: 0,
        };
    },
    methods: {
        init(app: any) {
            this.app = app;
        },
        onClick(index: number) {
            this.index = index;
            this.app.onClickMenu(index);
        }
    },
});