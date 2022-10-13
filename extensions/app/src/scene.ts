import { join } from 'path';
module.paths.push(join(Editor.App.path, 'node_modules'));

export function load() { };

export function unload() { };

// 在其他扩展脚本中，我们可以使用如下代码调用 rotateCamera 函数
// const options: ExecuteSceneScriptMethodOptions = {
//     name: scene.ts 所在的扩展包名, 如: App,
//     method: scene.ts 中定义的方法, 如: rotateCamera,
//     args: 参数，可选, 只传递json
// };
// const result = await Editor.Message.request('scene', 'execute-scene-script', options);
export const methods = {
    rotateCamera() {
        const { director } = require('cc');
        let mainCamera = director.getScene().getChildByName("Main Camera");
        if (mainCamera) {
            let euler = mainCamera.eulerAngles;
            euler.y += 10;
            mainCamera.setRotationFromEuler(euler);
            return true;
        }
        return false;
    },
};