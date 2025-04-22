import { readFileSync } from 'fs';
import { join } from 'path';

const Assets = join(__dirname, '../../res/panel');

import App from './components/app';

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
