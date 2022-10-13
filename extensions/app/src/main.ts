
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */

// [
//     "fd3a2e1e-5219-4687-a324-dead4f98dbad",
//     {
//         "name": "Node-002.prefab",
//         "displayName": "",
//         "source": "db://assets/asset-native/Node-002.prefab",
//         "path": "db://assets/asset-native/Node-002",
//         "url": "db://assets/asset-native/Node-002.prefab",
//         "file": "/Users/didi/Documents/CocosCreator/Creator3D/assets/asset-native/Node-002.prefab",
//         "uuid": "fd3a2e1e-5219-4687-a324-dead4f98dbad",
//         "importer": "prefab",
//         "imported": true,
//         "invalid": false,
//         "type": "cc.Prefab",
//         "isDirectory": false,
//         "library": {
//             ".json": "/Users/didi/Documents/CocosCreator/Creator3D/library/fd/fd3a2e1e-5219-4687-a324-dead4f98dbad.json"
//         },
//         "subAssets": {},
//         "visible": true,
//         "readonly": false
//     },
//     {
//         "ver": "1.1.40",
//         "importer": "prefab",
//         "imported": true,
//         "uuid": "fd3a2e1e-5219-4687-a324-dead4f98dbad",
//         "files": [
//             ".json"
//         ],
//         "subMetas": {},
//         "userData": {
//             "syncNodeName": "Node-002"
//         }
//     }
// ]

export const methods: { [key: string]: (...any: any) => any } = {
    ['open-panel']() {
        Editor.Panel.open(`app.open-panel`);
    },
    ['asset-db:asset-add'](uuid, info) {

    },
    ['asset-db:asset-change'](uuid, info) {

    },
    ['asset-db:asset-delete'](uuid, info) {

    }
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() { }

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() { }
