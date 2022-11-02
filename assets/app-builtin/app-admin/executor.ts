/* eslint-disable */
import { Component } from 'cc';
import { DEV,EDITOR } from 'cc/env';

import {GameManager} from '../app-manager/game/GameManager'
import EventManager from '../../../extensions/app/assets/manager/event/EventManager'
import SoundManager from '../../../extensions/app/assets/manager/sound/SoundManager'
import TimerManager from '../../../extensions/app/assets/manager/timer/TimerManager'
import UIManager from '../../../extensions/app/assets/manager/ui/UIManager'
export enum viewNamesEnum { 'PageGame'}
export const miniViewNames = {"PaperGameIndex":"PaperGame"}
export enum musicNamesEnum { 'music/bgm'}
export enum effecNamesEnum { 'effect/btn'}
export type IViewName = keyof typeof viewNamesEnum
export type IViewNames = IViewName[]
export type IMiniViewName = keyof typeof miniViewNames
export type IMiniViewNames = IMiniViewName[]
export type IMusicName = keyof typeof musicNamesEnum
export type IMusicNames = IMusicName[]
export type IEffecName = keyof typeof effecNamesEnum
export type IEffecNames = IEffecName[]
export const Manager: {Game:Omit<typeof GameManager,keyof Component>,Event:Omit<typeof EventManager,keyof Component>,Sound:Omit<typeof SoundManager,keyof Component>,Timer:Omit<typeof TimerManager,keyof Component>,UI:Omit<typeof UIManager,keyof Component>} = {} as any
export const manager: {game:Omit<GameManager,keyof Component>,event:Omit<EventManager,keyof Component>,sound:Omit<SoundManager<IEffecName,IMusicName>,keyof Component>,timer:Omit<TimerManager,keyof Component>,ui:Omit<UIManager<IViewName,IMiniViewName>,keyof Component>} = {} as any

let data: {} = {} as any
if(!EDITOR||DEV) data = {}
export {data}

let config: {} = {} as any
if(!EDITOR||DEV) config = {}
export {config}