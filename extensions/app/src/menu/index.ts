import { AssetInfo } from "../../@types/packages/asset-db/@types/public";
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

export function onCreateMenu(assetInfo: AssetInfo) {
    return getMenu();
};

export function onDBMenu(assetInfo: AssetInfo) {
    return getMenu();
};

export function onPanelMenu(assetInfo: AssetInfo) {
    return getMenu();
};

export function onAssetMenu(assetInfo: AssetInfo) {
    return getMenu();
};