'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.close = exports.ready = exports.update = exports.template = exports.$ = void 0;
exports.$ = {
    'display': '#display',
};
exports.template = `
<ui-label id="display"></ui-label>
`;
function update(assetList, metaList) {
    this.assetList = assetList;
    this.metaList = metaList;
    if (assetList.length !== 1)
        return this.$.display.innerText = '';
    this.$.display.innerText = JSON.stringify(assetList[0]);
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
