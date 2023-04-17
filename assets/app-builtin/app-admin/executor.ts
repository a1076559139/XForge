/* eslint-disable */
import { Component } from 'cc';
import { app } from '../../app/app';
import { DEV,EDITOR } from 'cc/env';

import EventManager from '../../../extensions/app/assets/manager/event/EventManager'
import LoaderManager from '../../../extensions/app/assets/manager/loader/LoaderManager'
import SoundManager from '../../../extensions/app/assets/manager/sound/SoundManager'
import TimerManager from '../../../extensions/app/assets/manager/timer/TimerManager'
import UIManager from '../../../extensions/app/assets/manager/ui/UIManager'
enum viewNames { 'PageGame','PageHome','PopTip'}
const miniViewNames = {"PaperAllIndex":"PaperAll","PaperGameIndex":"PaperGame","PaperHomeIndex":"PaperHome"}
enum musicNames { 'never'}
enum effectNames { 'never'}

export type IViewName = keyof typeof viewNames
export type IViewNames = IViewName[]
export type IMiniViewName = keyof typeof miniViewNames
export type IMiniViewNames = IMiniViewName[]
export type IMusicName = keyof typeof musicNames
export type IMusicNames = IMusicName[]
export type IEffectName = keyof typeof effectNames
export type IEffectNames = IEffectName[]

if(!EDITOR||DEV) Object.assign(app.data, {})
if(!EDITOR||DEV) Object.assign(app.config, {})

export type IApp = {
    Manager: {Event:Omit<typeof EventManager,keyof Component>,Loader:Omit<typeof LoaderManager,keyof Component>,Sound:Omit<typeof SoundManager,keyof Component>,Timer:Omit<typeof TimerManager,keyof Component>,UI:Omit<typeof UIManager,keyof Component>},
    manager: {event:Omit<EventManager,keyof Component>,loader:Omit<LoaderManager,keyof Component>,sound:Omit<SoundManager<IEffectName,IMusicName>,keyof Component>,timer:Omit<TimerManager,keyof Component>,ui:Omit<UIManager<IViewName,IMiniViewName>,keyof Component>},
    data: {},
    config: {}
}
