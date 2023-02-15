import { readFileSync } from 'fs';
import { join } from 'path';
import Vue from 'vue/dist/vue';

import ControlComponent from './create-control';
import ManagerComponent from './create-manager';
import ModelComponent from './create-model';
import ResComponent from './create-res';
import SoundComponent from './create-sound';
import ViewComponent from './create-view';

const Assets = join(__dirname, '../../../res/panel');
const Menus = ['ViewComponent', 'ManagerComponent', 'ModelComponent', 'ControlComponent', 'SoundComponent', 'ResComponent'];

export default Vue.extend({
    components: { ViewComponent, ManagerComponent, ModelComponent, ControlComponent, SoundComponent, ResComponent },
    template: readFileSync(join(Assets, 'components/app.html'), 'utf-8'),
    data() {
        return {
            menus: ['View', 'Manager', 'Model', 'Control', 'Sound', '资源目录'],
            content: 'ViewComponent'
        };
    },
    methods: {
        onClick(index: number) {
            this.content = Menus[index];
        }
    },
});