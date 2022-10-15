'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.update = exports.template = exports.$ = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
exports.$ = {
    'display': '#display',
};
exports.template = `
<ui-section header="文件夹说明" expand>
    <ui-label id="display"></ui-label>
</ui-section>
`;
function update(assetList, metaList) {
    this.assetList = assetList;
    this.metaList = metaList;
    if (assetList.length === 0)
        return this.$.display.innerText = '';
    this.$.display.innerText = assetList
        .filter((asset) => {
        const mdFile = (0, path_1.join)(asset.file, `.${asset.name}.md`);
        return (0, fs_1.existsSync)(mdFile);
    })
        .map((asset) => {
        const mdFile = (0, path_1.join)(asset.file, `.${asset.name}.md`);
        const mdStr = (0, fs_1.readFileSync)(mdFile, 'utf-8');
        return assetList.length > 1 ? `${asset.url}:\n ${mdStr}` : mdStr;
    })
        .join('\n');
}
exports.update = update;
;
function ready() {
    // TODO something
}
exports.ready = ready;
;
function close(his) {
    // TODO something
}
exports.close = close;
;
