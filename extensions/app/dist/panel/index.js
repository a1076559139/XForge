"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = __importDefault(require("vue/dist/vue"));
const Assets = (0, path_1.join)(__dirname, '../../res/panel');
const MenuComponent = vue_1.default.extend({
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(Assets, 'components/app-menu.html'), 'utf-8'),
    data() {
        const data = {
            app: null,
            index: 0,
        };
        return data;
    },
    methods: {
        init(app) {
            this.app = app;
        },
        onClick(index) {
            this.index = index;
            this.app.onClickMenu(index);
        }
    },
});
const ViewComponent = vue_1.default.extend({
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(Assets, 'components/create-view.html'), 'utf-8'),
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
const weakMap = new WeakMap();
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
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(Assets, 'index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(Assets, 'styles/index.css'), 'utf-8'),
    $: {
        menu: '#menu',
        content: '#content',
    },
    methods: {
        onClickMenu(index) {
            if (!this.$.content)
                return;
            let com = weakMap.get(this);
            if (com)
                com.$destroy();
            com = new ViewComponent();
            weakMap.set(this, com);
            com.$mount(this.$.content);
        }
    },
    ready() {
        if (!this.$.menu)
            return;
        const com = new MenuComponent();
        weakMap.set(MenuComponent, com);
        com.$mount(this.$.menu);
        com.init(this);
        this.onClickMenu(0);
    },
    beforeClose() { },
    close() {
        const com = weakMap.get(MenuComponent);
        if (com)
            com.$destroy();
    },
});
