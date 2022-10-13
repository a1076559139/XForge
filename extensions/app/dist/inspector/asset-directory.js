'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.update = exports.template = exports.$ = void 0;
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
    if (assetList.length !== 1)
        return this.$.display.innerText = '';
    const dirName = assetList[0].name;
    if (dirName == 'app-bundle') {
        this.$.display.innerText = '框架内置的Bundle';
    }
    else if (dirName == 'app-view') {
        this.$.display.innerText = '框架内置的Bundle, 用于存储UI资源';
    }
    else if (dirName == 'app-sound') {
        this.$.display.innerText = '框架内置的Bundle, 用于存储Sound资源';
    }
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
