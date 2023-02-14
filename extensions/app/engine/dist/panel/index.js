"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const Assets = path_1.join(__dirname, '../../res/panel');
const app_create_1 = __importDefault(require("./components/app-create"));
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    template: fs_1.readFileSync(path_1.join(Assets, 'index.html'), 'utf-8'),
    style: fs_1.readFileSync(path_1.join(Assets, 'styles/index.css'), 'utf-8'),
    $: {
        app: '#app'
    },
    listeners: {
        show() { console.log('show'); },
        hide() { console.log('hide'); },
    },
    methods: {},
    ready() {
        if (!this.$.app)
            return;
        const com = new app_create_1.default();
        com.$mount(this.$.app);
    },
    beforeClose() { },
    close() { },
});
