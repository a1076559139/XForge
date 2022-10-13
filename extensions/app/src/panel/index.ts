import { readFileSync } from 'fs-extra';
import { join } from 'path';

import MenuComponent from './components/app-menu';
import ViewComponent from './components/app-view';

const Assets = join(__dirname, '../../res/panel');

// export

interface IComponent {
    $mount(parent: HTMLElement): any
    $destroy: () => any
}

const weakMap = new WeakMap() as WeakMap<object, InstanceType<{ new(): IComponent }>>;
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {
        show() { console.log('show'); },
        hide() { console.log('hide'); },
    },
    template: readFileSync(join(Assets, 'index.html'), 'utf-8'),
    style: readFileSync(join(Assets, 'styles/index.css'), 'utf-8'),
    $: {
        menu: '#menu',
        content: '#content',
    },
    methods: {
        onClickMenu(index: number) {
            if (!this.$.content) return;

            let com = weakMap.get(this);
            if (com) com.$destroy();

            com = new ViewComponent();
            weakMap.set(this, com);
            com.$mount(this.$.content);
        }
    },
    ready() {
        if (!this.$.menu) return;

        const com = new MenuComponent();
        weakMap.set(MenuComponent, com);
        com.$mount(this.$.menu);
        com.init(this);

        this.onClickMenu(0);
    },
    beforeClose() { },
    close() {
        const com = weakMap.get(MenuComponent);
        if (com) com.$destroy();
    },
});
