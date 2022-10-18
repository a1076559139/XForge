
import { _decorator } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { app } from '../../../../../app/app';


const { ccclass, property } = _decorator;

@ccclass('PageGame')
export class PageGame extends BaseView {
    onLoad() {
        app.manager.sound.playMusic({ name: 'music/bgm' });
    }
}