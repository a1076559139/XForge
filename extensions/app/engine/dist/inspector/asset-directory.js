'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.update = exports.template = exports.$ = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
exports.$ = {
    'code': '#code',
    'section': '#section',
};
exports.template = `
<ui-section id="section" header="文件夹说明" expand>
    <ui-code id="code"></ui-code>
</ui-section>
`;
function update(assetList, metaList) {
    this.assetList = assetList;
    this.metaList = metaList;
    if (assetList.length === 0) {
        this.$.code.innerHTML = '';
    }
    else {
        this.$.code.innerHTML = assetList
            .filter((asset) => {
            const mdFile = path_1.join(asset.file, `.${asset.name}.md`);
            return fs_1.existsSync(mdFile);
        })
            .map((asset) => {
            const mdFile = path_1.join(asset.file, `.${asset.name}.md`);
            const mdStr = fs_1.readFileSync(mdFile, 'utf-8');
            return assetList.length > 1 ? `${asset.url}:\n ${mdStr}` : mdStr;
        })
            .join('\n') || '';
    }
    if (this.$.code.innerHTML === '') {
        this.$.section.hidden = true;
    }
    else {
        this.$.section.hidden = false;
    }
}
exports.update = update;
function ready() {
    // TODO something
}
exports.ready = ready;
function close() {
    // TODO something
}
exports.close = close;
