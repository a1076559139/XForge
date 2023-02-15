"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAssetMenu = exports.onPanelMenu = exports.onDBMenu = exports.onCreateMenu = void 0;
// @ts-ignore
function getMenu() {
    return [
        {
            label: 'i18n:app.menuMain',
            submenu: [
                {
                    label: 'i18n:app.create',
                    click() {
                        // Editor.Panel.open(`${packageJSON.name}.open-panel`);
                        Editor.Message.send('app', 'open-panel');
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
    return getMenu();
}
exports.onAssetMenu = onAssetMenu;
