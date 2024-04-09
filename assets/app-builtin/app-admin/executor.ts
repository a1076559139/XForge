/* eslint-disable */
import { Component } from 'cc';
import { app } from '../../app/app';
import { DEV,EDITOR } from 'cc/env';

import EventManager from '../../../extensions/app/assets/manager/event/EventManager'
import LoaderManager from '../../../extensions/app/assets/manager/loader/LoaderManager'
import SoundManager from '../../../extensions/app/assets/manager/sound/SoundManager'
import TimerManager from '../../../extensions/app/assets/manager/timer/TimerManager'
import UIManager from '../../../extensions/app/assets/manager/ui/UIManager'
/**界面名字枚举(在main、resources与app-model所在的Asset Bundle中无法使用此枚举)*/
export enum ViewName {never="never"}
/**子界面名字枚举(在main、resources与app-model所在的Asset Bundle中无法使用此枚举)*/
export enum MiniViewName {never="never"}
/**音乐名字枚举(在main、resources与app-model所在的Asset Bundle中无法使用此枚举)*/
export enum MusicName {"never"="never"}
/**音效名字枚举(在main、resources与app-model所在的Asset Bundle中无法使用此枚举)*/
export enum EffectName {"never"="never"}

export type IViewName = keyof typeof ViewName
export type IViewNames = IViewName[]
export type IMiniViewName = keyof typeof MiniViewName
export type IMiniViewNames = IMiniViewName[]
export type IMusicName = keyof typeof MusicName
export type IMusicNames = IMusicName[]
export type IEffectName = keyof typeof EffectName
export type IEffectNames = IEffectName[]

if(!EDITOR||DEV) Array.prototype.push.apply(app.scene, [])
if(!EDITOR||DEV) Object.assign(app.data, {})
if(!EDITOR||DEV) Object.assign(app.config, {})
if(!EDITOR||DEV) Object.assign(app.store, {})

type IReadOnly<T> = { readonly [P in keyof T]: T[P] extends Function ? T[P] : (T[P] extends Object ? IReadOnly<T[P]> : T[P]); };
export type IApp = {
    Manager: {Event:Omit<typeof EventManager,keyof Component>,Loader:Omit<typeof LoaderManager,keyof Component>,Sound:Omit<typeof SoundManager,keyof Component>,Timer:Omit<typeof TimerManager,keyof Component>,UI:Omit<typeof UIManager,keyof Component>},
    manager: {event:Omit<EventManager,keyof Component>,loader:Omit<LoaderManager,keyof Component>,sound:Omit<SoundManager<IEffectName,IMusicName>,keyof Component>,timer:Omit<TimerManager,keyof Component>,ui:Omit<UIManager<IViewName,IMiniViewName>,keyof Component>},
    data: {},
    config: {}
    store: {}
    scene: IViewName[]
}
