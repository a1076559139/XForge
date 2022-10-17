/* eslint-disable */
import { Component } from 'cc';
import { DEV,EDITOR } from 'cc/env';
import http from '../../extensions/app/assets/lib/http/http'
import * as pipeline from '../../extensions/app/assets/lib/pipeline/pipeline'
import queue from '../../extensions/app/assets/lib/queue/queue'
import socket from '../../extensions/app/assets/lib/socket/socket'
import storage from '../../extensions/app/assets/lib/storage/storage'
import task from '../../extensions/app/assets/lib/task/task'
let lib: {http:typeof http,pipeline:typeof pipeline,queue:typeof queue,socket:typeof socket,storage:typeof storage,task:typeof task} = {} as any
if(!EDITOR||DEV) lib = {http,pipeline,queue,socket,storage,task}
export {lib}

import {GameManager} from '../app-builtin/app-manager/game/GameManager'
import SoundManager from '../../extensions/app/assets/manager/sound/SoundManager'
import EventManager from '../../extensions/app/assets/manager/event/EventManager'
import TimerManager from '../../extensions/app/assets/manager/timer/TimerManager'
import UIManager from '../../extensions/app/assets/manager/ui/UIManager'
export enum viewNamesEnum { 'PageGame'}
export const miniViewNames = {"nerver":""}
export enum musicNamesEnum { 'nerver'}
export enum effecNamesEnum { 'nerver'}
export type IViewName = keyof typeof viewNamesEnum
export type IViewNames = IViewName[]
export type IMiniViewName = keyof typeof miniViewNames
export type IMiniViewNames = IMiniViewName[]
export type IMusicName = keyof typeof musicNamesEnum
export type IMusicNames = IMusicName[]
export type IEffecName = keyof typeof effecNamesEnum
export type IEffecNames = IEffecName[]
export const Manager: {Game:Omit<typeof GameManager,keyof Component>,Sound:Omit<typeof SoundManager,keyof Component>,Event:Omit<typeof EventManager,keyof Component>,Timer:Omit<typeof TimerManager,keyof Component>,UI:Omit<typeof UIManager,keyof Component>} = {} as any
export const manager: {game:Omit<GameManager,keyof Component>,sound:Omit<SoundManager<IEffecName,IMusicName>,keyof Component>,event:Omit<EventManager,keyof Component>,timer:Omit<TimerManager,keyof Component>,ui:Omit<UIManager<IViewName,IMiniViewName>,keyof Component>} = {} as any

let data: {} = {} as any
if(!EDITOR||DEV) data = {}
export {data}

let config: {} = {} as any
if(!EDITOR||DEV) config = {}
export {config}