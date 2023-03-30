import { join } from 'path';
module.paths.push(join(Editor.App.path, 'node_modules'));

export function load() { }

export function unload() { }

// 在其他扩展脚本中，我们可以使用如下代码调用 rotateCamera 函数
// const options: ExecuteSceneScriptMethodOptions = {
//     name: scene.ts 所在的扩展包名, 如: App,
//     method: scene.ts 中定义的方法, 如: rotateCamera,
//     args: 参数，可选, 只传递json
// };
// const result = await Editor.Message.request('scene', 'execute-scene-script', options);
export const methods = {
    async createPrefab(name: string, file: string, is3D: boolean) {
        const { Node, js, Layers } = require('cc');

        const node = new Node(name);
        node.layer = is3D ? Layers.Enum.UI_3D : Layers.Enum.UI_2D;

        while (true) {
            const result = js.getClassByName(name);
            if (result) break;

            await new Promise((next) => {
                setTimeout(next, 100);
            });
        }

        const com = node.addComponent(name);
        com.resetInEditor && com.resetInEditor();

        // @ts-ignore
        const info = cce.Prefab.generatePrefabDataFromNode(node);
        node.destroy();

        return Editor.Message.request('asset-db', 'create-asset', file, info);
    },
};