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
    async createPrefab(fileName: string, fileUrl: string, is3D = false) {
        const { Node, js, Layers } = require('cc');

        const node = new Node(fileName);
        node.layer = is3D ? Layers.Enum.UI_3D : Layers.Enum.UI_2D;

        while (true) {
            const result = js.getClassByName(fileName);
            if (result) break;

            await new Promise((next) => {
                setTimeout(next, 100);
            });
        }

        const com = node.addComponent(fileName);
        com.resetInEditor && com.resetInEditor();

        const info = cce.Prefab.generatePrefabDataFromNode(node) as any;
        node.destroy();

        return Editor.Message.request('asset-db', 'create-asset', fileUrl, info.prefabData || info);
    },
    async createScene(fileName: string, fileUrl: string) {
        const { SceneAsset, Scene, Node, js, Layers, Camera, DirectionalLight } = require('cc');

        while (true) {
            const result = js.getClassByName(fileName);
            if (result) break;

            await new Promise((next) => {
                setTimeout(next, 100);
            });
        }

        const scene = new Scene(fileName);

        // 根节点
        const node = new Node(fileName);
        node.layer = Layers.Enum.DEFAULT;
        node.parent = scene;

        // 相机
        const camera = new Node('Camera');
        camera.addComponent(Camera);
        camera.layer = Layers.Enum.DEFAULT;
        camera.parent = node;

        // 灯光
        const light = new Node('Light');
        light.addComponent(DirectionalLight);
        light.layer = Layers.Enum.DEFAULT;
        light.parent = node;

        const com = node.addComponent(fileName);
        com.resetInEditor && com.resetInEditor();

        const sceneAsset = new SceneAsset();
        sceneAsset.scene = scene;

        const info = EditorExtends.serialize(sceneAsset);
        camera.destroy();
        light.destroy();
        node.destroy();
        scene.destroy();
        sceneAsset.destroy();

        return Editor.Message.request('asset-db', 'create-asset', fileUrl, info);
    },
};