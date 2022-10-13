import { readFileSync } from 'fs-extra';
import { join } from 'path';
import Vue from 'vue/dist/vue';

const Assets = join(__dirname, '../../../res/panel');

export default Vue.extend({
    template: readFileSync(join(Assets, 'components/create-view.html'), 'utf-8'),
    data() {
        return {
            counter: 0,
        };
    },
    methods: {
        addition() {
            this.counter += 1;
        },
        subtraction() {
            this.counter -= 1;
        },
    },
});