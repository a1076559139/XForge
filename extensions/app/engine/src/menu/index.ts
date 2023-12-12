import { AssetInfo } from '../../@types/packages/asset-db/@types/public';
import tinyPNG from './tinyPNG';

function getMenu(assetInfo: AssetInfo) {
    return [
        {
            label: 'i18n:app.menuMain',
            submenu: [
                {
                    label: 'i18n:app.tiny',
                    click() {
                        tinyPNG(assetInfo.file);
                    },
                }
            ],
        },
    ];
}

export function onCreateMenu(assetInfo: AssetInfo) {
    // return getMenu();
}

export function onDBMenu(assetInfo: AssetInfo) {
    // return getMenu();
}

export function onPanelMenu(assetInfo: AssetInfo) {
    // return getMenu();
}

export function onAssetMenu(assetInfo: AssetInfo) {
    return getMenu(assetInfo);
}