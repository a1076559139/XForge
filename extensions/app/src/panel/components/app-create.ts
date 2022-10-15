import { readFileSync } from 'fs-extra';
import { join } from 'path';
import Vue from 'vue/dist/vue';

import ViewComponent from './create-view';
import ManagerComponent from './create-manager';
import ModelComponent from './create-model';
import ControlComponent from './create-control';

const Assets = join(__dirname, '../../../res/panel');
const Menus = ['ViewComponent', 'ManagerComponent', 'ModelComponent', 'ControlComponent'];

export default Vue.extend({
    components: { ViewComponent, ManagerComponent, ModelComponent, ControlComponent },
    template: readFileSync(join(Assets, 'components/app.html'), 'utf-8'),
    data() {
        return {
            menus: ['View', 'Manager', 'Model', 'Control'],
            content: 'ViewComponent'
        }
    },
    methods: {
        onClick(index: number) {
            this.content = Menus[index];
        }
    },
});