'use strict';

interface Asset {
    displayName: string;
    file: string;
    imported: boolean;
    importer: string;
    invalid: boolean;
    isDirectory: boolean;
    library: {
        [extname: string]: string;
    };
    name: string;
    url: string;
    uuid: string;
    visible: boolean;
    subAssets: {
        [id: string]: Asset;
    };
}

interface Meta {
    files: string[];
    imported: boolean;
    importer: string;
    subMetas: {
        [id: string]: Meta;
    };
    userData: {
        [key: string]: any;
    };
    uuid: string;
    ver: string;
}

type Selector<$> = { $: Record<keyof $, HTMLElement> } & { dispatch(str: string): void, assetList: Asset[], metaList: Meta[] };

export const $ = {
    'display': '#display',
};

export const template = `
<ui-section header="文件夹说明" expand>
    <ui-label id="display"></ui-label>
</ui-section>
`;

type PanelThis = Selector<typeof $>;

export function update(this: PanelThis, assetList: Asset[], metaList: Meta[]) {
    this.assetList = assetList;
    this.metaList = metaList;

    if (assetList.length !== 1) return this.$.display.innerText = '';

    const dirName = assetList[0].name;

    if (dirName == 'app') {
        this.$.display.innerText = 'app核心文件夹';
    } else if (dirName == 'app-appinit') {
        this.$.display.innerText = '框架初始化文件夹';
    } else if (dirName == 'app-bundle') {
        this.$.display.innerText = '框架内置的Bundle';
    } else if (dirName == 'app-view') {
        this.$.display.innerText = '框架内置的Bundle, 用于存储UI资源';
    } else if (dirName == 'app-sound') {
        this.$.display.innerText = '框架内置的Bundle, 用于存储Sound资源';
    } else {
        this.$.display.innerText = '';
    }
};

export function ready(this: PanelThis) {
    // TODO something
};

export function close(his: PanelThis,) {
    // TODO something
};