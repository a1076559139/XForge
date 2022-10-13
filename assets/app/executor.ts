/* eslint-disable */
import { EDITOR } from 'cc/env'
import http from '../../extensions/app/assets/lib/http/http'
import * as pipeline from '../../extensions/app/assets/lib/pipeline/pipeline'
import queue from '../../extensions/app/assets/lib/queue/queue'
import socket from '../../extensions/app/assets/lib/socket/socket'
import storage from '../../extensions/app/assets/lib/storage/storage'
import task from '../../extensions/app/assets/lib/task/task'
let lib: { http: typeof http, pipeline: typeof pipeline, queue: typeof queue, socket: typeof socket, storage: typeof storage, task: typeof task } = {} as any
if (!EDITOR) lib = { http, pipeline, queue, socket, storage, task }
export { lib }
export { data }
export { config }

import EventManager from '../../extensions/app/assets/manager/event/comp/EventManager'
import SoundManager from '../../extensions/app/assets/manager/sound/comp/SoundManager'
import TimerManager from '../../extensions/app/assets/manager/timer/comp/TimerManager'
import UIManager from '../../extensions/app/assets/manager/ui/comp/UIManager'
export const viewNameToBox = {}
export enum viewNamesEnum { 'PageGame' }
export const miniViewNames = { "Null": "Null" }
export enum musicNamesEnum { 'music/bgm' }
export enum effecNamesEnum { 'effect/btn' }
export type IViewName = keyof typeof viewNamesEnum
export type IViewNames = IViewName[]
export type IMiniViewName = keyof typeof miniViewNames
export type IMiniViewNames = IMiniViewName[]
export type IMusicName = keyof typeof musicNamesEnum
export type IMusicNames = IMusicName[]
export type IEffecName = keyof typeof effecNamesEnum
export type IEffecNames = IEffecName[]
export const Manager: { Event: typeof EventManager, Sound: typeof SoundManager, Timer: typeof TimerManager, UI: typeof UIManager } = {} as any
export const manager: { event: EventManager, sound: SoundManager<IEffecName, IMusicName>, timer: TimerManager, ui: UIManager<IViewName, IMiniViewName> } = {} as any

let data: {} = {} as any
if (!EDITOR) data = {}

let config: {} = {} as any
if (!EDITOR) config = {}