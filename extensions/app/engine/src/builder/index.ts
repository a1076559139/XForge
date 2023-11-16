import { BuildPlugin } from "../../@types/packages/builder/@types";

export const configs: BuildPlugin.Configs = {
    '*': {
        hooks: './hooks',
    }
};