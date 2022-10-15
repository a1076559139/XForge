"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = __importDefault(require("vue/dist/vue"));
const create_view_1 = __importDefault(require("./create-view"));
const create_manager_1 = __importDefault(require("./create-manager"));
const create_model_1 = __importDefault(require("./create-model"));
const create_control_1 = __importDefault(require("./create-control"));
const Assets = (0, path_1.join)(__dirname, '../../../res/panel');
const Menus = ['ViewComponent', 'ManagerComponent', 'ModelComponent', 'ControlComponent'];
exports.default = vue_1.default.extend({
    components: { ViewComponent: create_view_1.default, ManagerComponent: create_manager_1.default, ModelComponent: create_model_1.default, ControlComponent: create_control_1.default },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(Assets, 'components/app.html'), 'utf-8'),
    data() {
        return {
            menus: ['View', 'Manager', 'Model', 'Control'],
            content: 'ViewComponent'
        };
    },
    methods: {
        onClick(index) {
            this.content = Menus[index];
        }
    },
});
