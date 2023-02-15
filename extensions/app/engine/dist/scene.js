"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = exports.unload = exports.load = void 0;
const path_1 = require("path");
module.paths.push(path_1.join(Editor.App.path, 'node_modules'));
function load() { }
exports.load = load;
function unload() { }
exports.unload = unload;
// 在其他扩展脚本中，我们可以使用如下代码调用 rotateCamera 函数
// const options: ExecuteSceneScriptMethodOptions = {
//     name: scene.ts 所在的扩展包名, 如: App,
//     method: scene.ts 中定义的方法, 如: rotateCamera,
//     args: 参数，可选, 只传递json
// };
// const result = await Editor.Message.request('scene', 'execute-scene-script', options);
exports.methods = {
    async createPrefab(name, file, is3D) {
        const { Node, js, Layers } = require('cc');
        const node = new Node(name);
        node.layer = is3D ? Layers.Enum.UI_3D : Layers.Enum.UI_2D;
        while (true) {
            const result = js.getClassByName(name);
            if (result)
                break;
            await new Promise((next) => {
                setTimeout(next, 100);
            });
        }
        const com = node.addComponent(name);
        com.resetInEditor && com.resetInEditor();
        if (name.toLocaleLowerCase().startsWith('page')) {
            com.shade = false;
            com.blockInput = is3D ? false : true;
            com.captureFocus = is3D ? false : true;
        }
        else if (name.toLocaleLowerCase().startsWith('paper')) {
            com.shade = false;
            com.captureFocus = false;
            com.blockInput = false;
        }
        // @ts-ignore
        const info = cce.Prefab.generatePrefabDataFromNode(node);
        node.destroy();
        return Editor.Message.request('asset-db', 'create-asset', file, info);
    },
};
