import { readFileSync } from 'fs';
import { join } from 'path';
import Vue from '../../../../vue';

import ControllerComponent from './create-controller';
import ManagerComponent from './create-manager';
import ModelComponent from './create-model';
import ResComponent from './create-res';
import SoundComponent from './create-sound';
import ViewComponent from './create-view';

const Assets = join(__dirname, '../../../res/panel');
const Menus = ['ViewComponent', 'ManagerComponent', 'ControllerComponent', 'ModelComponent', 'SoundComponent', 'ResComponent'];

export default Vue.extend({
    components: { ViewComponent, ManagerComponent, ControllerComponent, ModelComponent, SoundComponent, ResComponent },
    template: readFileSync(join(Assets, 'components/app.html'), 'utf-8'),
    data() {
        return {
            menus: ['View', 'Manager', 'Controller', 'Model', 'Sound', '资源目录'],
            content: 'ViewComponent'
        };
    },
    methods: {
        onClick(index: number) {
            this.content = Menus[index];
        }
    },
});