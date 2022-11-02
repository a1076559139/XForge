import { readFileSync } from 'fs';
import { join } from 'path';

const Assets = join(__dirname, '../../res/panel');

import App from './components/app-create';

/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    template: readFileSync(join(Assets, 'index.html'), 'utf-8'),
    style: readFileSync(join(Assets, 'styles/index.css'), 'utf-8'),
    $: {
        app: '#app'
    },
    listeners: {
        show() { console.log('show'); },
        hide() { console.log('hide'); },
    },
    methods: {},
    ready() {
        if (!this.$.app) return;

        const com = new App();
        com.$mount(this.$.app);
    },
    beforeClose() { },
    close() { },
});
