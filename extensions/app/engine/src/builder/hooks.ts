import path from 'path';
import { BuildHook } from '../../@types/packages/builder/@types';
import { adaptFileMD5 } from './utils/file';

export const onAfterBuild: BuildHook.onAfterBuild = async function (options, result) {
    if (options.platform !== 'web-mobile' && options.platform !== 'web-desktop') {
        return;
    }

    if (!options.md5Cache) {
        return;
    }

    adaptFileMD5(path.join(result.dest, 'index.html'));
};