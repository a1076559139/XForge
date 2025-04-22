/* eslint-disable */
import { Component,director,Director } from 'cc';
import { app } from '../../app/app';
import { EDITOR,EDITOR_NOT_IN_PREVIEW } from 'cc/env';

export type IReadOnly<T> = { readonly [P in keyof T]: T[P] extends Function ? T[P] : (T[P] extends Object ? IReadOnly<T[P]> : T[P]); };

export type IViewName = "never"
export type IViewNames = IViewName[]
export type IMiniViewName = "never"
export type IMiniViewNames = IMiniViewName[]
export type IMusicName = "never"
export type IMusicNames = IMusicName[]
export type IEffectName = "never"
export type IEffectNames = IEffectName[]

import EventManager from '../../../extensions/app/assets/manager/event/EventManager'
import LoaderManager from '../../../extensions/app/assets/manager/loader/LoaderManager'
import SoundManager from '../../../extensions/app/assets/manager/sound/SoundManager'
import TimerManager from '../../../extensions/app/assets/manager/timer/TimerManager'
import UIManager from '../../../extensions/app/assets/manager/ui/UIManager'
export type IApp = {
    Controller: {},
    controller: {},
    Manager: {Event:Omit<typeof EventManager,keyof Component>,Loader:Omit<typeof LoaderManager,keyof Component>,Sound:Omit<typeof SoundManager,keyof Component>,Timer:Omit<typeof TimerManager,keyof Component>,UI:Omit<typeof UIManager,keyof Component>},
    manager: {event:Omit<EventManager,keyof Component>,loader:Omit<LoaderManager,keyof Component>,sound:Omit<SoundManager<IEffectName,IMusicName>,keyof Component>,timer:Omit<TimerManager,keyof Component>,ui:Omit<UIManager<IViewName,IMiniViewName>,keyof Component>},
    data: {},
    config: {}
    store: {}
}

function init(){
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.config, {})
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.data, {})
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.store, {})

if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.Controller, {})
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.controller, {})
}
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) director.on(Director.EVENT_RESET,init)
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) init()
