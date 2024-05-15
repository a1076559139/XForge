"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const vue_1 = __importDefault(require("../../../../vue"));
const create_controller_1 = __importDefault(require("./create-controller"));
const create_manager_1 = __importDefault(require("./create-manager"));
const create_model_1 = __importDefault(require("./create-model"));
const create_res_1 = __importDefault(require("./create-res"));
const create_sound_1 = __importDefault(require("./create-sound"));
const create_view_1 = __importDefault(require("./create-view"));
const Assets = path_1.join(__dirname, '../../../res/panel');
const Menus = ['ViewComponent', 'ManagerComponent', 'ControllerComponent', 'ModelComponent', 'SoundComponent', 'ResComponent'];
exports.default = vue_1.default.extend({
    components: { ViewComponent: create_view_1.default, ManagerComponent: create_manager_1.default, ControllerComponent: create_controller_1.default, ModelComponent: create_model_1.default, SoundComponent: create_sound_1.default, ResComponent: create_res_1.default },
    template: fs_1.readFileSync(path_1.join(Assets, 'components/app.html'), 'utf-8'),
    data() {
        return {
            menus: ['View', 'Manager', 'Controller', 'Model', 'Sound', '资源目录'],
            content: 'ViewComponent'
        };
    },
    methods: {
        onClick(index) {
            this.content = Menus[index];
        }
    },
});
