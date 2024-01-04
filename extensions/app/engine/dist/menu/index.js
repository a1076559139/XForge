"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAssetMenu = exports.onPanelMenu = exports.onDBMenu = exports.onCreateMenu = void 0;
const tinyPNG_1 = __importDefault(require("./tinyPNG"));
function getMenu(assetInfo) {
    return [
        {
            label: 'i18n:app.menuMain',
            submenu: [
                {
                    label: 'i18n:app.tiny',
                    click() {
                        tinyPNG_1.default(assetInfo.file);
                    },
                }
            ],
        },
    ];
}
function onCreateMenu(assetInfo) {
    // return getMenu();
}
exports.onCreateMenu = onCreateMenu;
function onDBMenu(assetInfo) {
    // return getMenu();
}
exports.onDBMenu = onDBMenu;
function onPanelMenu(assetInfo) {
    // return getMenu();
}
exports.onPanelMenu = onPanelMenu;
function onAssetMenu(assetInfo) {
    return getMenu(assetInfo);
}
exports.onAssetMenu = onAssetMenu;
