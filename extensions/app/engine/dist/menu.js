"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAssetMenu = exports.onPanelMenu = exports.onDBMenu = exports.onCreateMenu = void 0;
function getMenu() {
    return [
        {
            label: 'i18n:app.menuMain',
            submenu: [
                {
                    label: 'i18n:app.menuCreateView',
                    click() {
                        Editor.Panel.open('createView');
                    },
                },
                {
                    label: 'i18n:app.menuCreateManager',
                    click() {
                        Editor.Panel.open('createManager');
                    },
                },
                {
                    label: 'i18n:app.menuCreateControl',
                    click() {
                        Editor.Panel.open('createControl');
                    },
                },
                {
                    label: 'i18n:app.menuCreateModel',
                    click() {
                        Editor.Panel.open('createModel');
                    },
                },
            ],
        },
    ];
}
function onCreateMenu(assetInfo) {
    return getMenu();
}
exports.onCreateMenu = onCreateMenu;
;
function onDBMenu(assetInfo) {
    return getMenu();
}
exports.onDBMenu = onDBMenu;
;
function onPanelMenu(assetInfo) {
    return getMenu();
}
exports.onPanelMenu = onPanelMenu;
;
function onAssetMenu(assetInfo) {
    return getMenu();
}
exports.onAssetMenu = onAssetMenu;
;
