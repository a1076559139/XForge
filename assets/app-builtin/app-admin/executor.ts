/* eslint-disable */
import { Component } from 'cc';
import { app } from '../../app/app';
import { DEV,EDITOR } from 'cc/env';

import EventManager from '../../../extensions/app/assets/manager/event/EventManager'
import LoaderManager from '../../../extensions/app/assets/manager/loader/LoaderManager'
import SoundManager from '../../../extensions/app/assets/manager/sound/SoundManager'
import TimerManager from '../../../extensions/app/assets/manager/timer/TimerManager'
import UIManager from '../../../extensions/app/assets/manager/ui/UIManager'
/**界面名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举) @deprecated 请使用UIManager.ViewName*/
export const ViewName = UIManager.ViewName
/**子界面名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举) @deprecated 请使用UIManager.MiniViewName*/
export const MiniViewName = UIManager.MiniViewName
/**音乐名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举) @deprecated 请使用SoundManager.MusicName*/
export const MusicName = SoundManager.MusicName
/**音效名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举) @deprecated 请使用SoundManager.EffectName*/
export const EffectName = SoundManager.EffectName

export type IViewName = "never"
export type IViewNames = IViewName[]
export type IMiniViewName = "never"
export type IMiniViewNames = IMiniViewName[]
export type IMusicName = "never"
export type IMusicNames = IMusicName[]
export type IEffectName = "never"
export type IEffectNames = IEffectName[]

if(!EDITOR||DEV) Object.assign(app.Controller, {})
if(!EDITOR||DEV) Object.assign(app.controller, {})
if(!EDITOR||DEV) Object.assign(app.data, {})
if(!EDITOR||DEV) Object.assign(app.config, {})
if(!EDITOR||DEV) Object.assign(app.store, {})

export type IReadOnly<T> = { readonly [P in keyof T]: T[P] extends Function ? T[P] : (T[P] extends Object ? IReadOnly<T[P]> : T[P]); };
export type IApp = {
    Controller: {},
    controller: {},
    Manager: {Event:Omit<typeof EventManager,keyof Component>,Loader:Omit<typeof LoaderManager,keyof Component>,Sound:Omit<typeof SoundManager,keyof Component>,Timer:Omit<typeof TimerManager,keyof Component>,UI:Omit<typeof UIManager,keyof Component>},
    manager: {event:Omit<EventManager,keyof Component>,loader:Omit<LoaderManager,keyof Component>,sound:Omit<SoundManager<IEffectName,IMusicName>,keyof Component>,timer:Omit<TimerManager,keyof Component>,ui:Omit<UIManager<IViewName,IMiniViewName>,keyof Component>},
    data: {},
    config: {}
    store: {}
}
