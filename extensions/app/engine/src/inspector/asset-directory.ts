'use strict';

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

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
    'code': '#code',
    'section': '#section',
};

export const template = `
<ui-section id="section" header="文件夹说明" expand>
    <ui-code id="code"></ui-code>
</ui-section>
`;

type PanelThis = Selector<typeof $>;

export function update(this: PanelThis, assetList: Asset[], metaList: Meta[]) {
    this.assetList = assetList;
    this.metaList = metaList;

    if (assetList.length === 0) {
        this.$.code.innerHTML = '';
    } else {
        this.$.code.innerHTML = assetList
            .filter((asset) => {
                const mdFile = join(asset.file, `.${asset.name}.md`);
                return existsSync(mdFile);
            })
            .map((asset) => {
                const mdFile = join(asset.file, `.${asset.name}.md`);
                const mdStr = readFileSync(mdFile, 'utf-8');
                return assetList.length > 1 ? `${asset.url}:\n ${mdStr}` : mdStr;
            })
            .join('\n') || '';
    }

    if (this.$.code.innerHTML === '') {
        this.$.section.hidden = true;
    } else {
        this.$.section.hidden = false;
    }
}

export function ready(this: PanelThis) {
    // TODO something
}

export function close(this: PanelThis,) {
    // TODO something
}