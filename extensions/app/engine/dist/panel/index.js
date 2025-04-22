"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const Assets = path_1.join(__dirname, '../../res/panel');
const app_1 = __importDefault(require("./components/app"));
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
        const com = new app_1.default();
        com.$mount(this.$.app);
    },
    beforeClose() { },
    close() { },
});
