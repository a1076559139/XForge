"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = __importDefault(require("vue/dist/vue"));
const Assets = (0, path_1.join)(__dirname, '../../../res/panel');
exports.default = vue_1.default.extend({
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
