// we could do this with a bitmask but this seems more readable
import { SceneEnum } from "../model/game"
import { vec2 } from "gl-matrix"

export interface ControlState {
  rollLeft: boolean
  rollRight: boolean
  pitchUp: boolean
  pitchDown: boolean
  accelerate: boolean
  decelerate: boolean
  sceneSelection: number | null
  cursorLeft: boolean
  cursorRight: boolean
  cursorUp: boolean
  cursorDown: boolean
  dockingOn: boolean
  jump: boolean
  hyperspace: boolean
  mousePosition: vec2
  mouseDown: boolean
  shiftPressed: boolean
  nextEffectPressed: boolean
  previousEffectPressed: boolean
}

export function getEmptyControlState() {
  return {
    rollLeft: false,
    rollRight: false,
    pitchUp: false,
    pitchDown: false,
    accelerate: false,
    decelerate: false,
    sceneSelection: null,
    cursorLeft: false,
    cursorRight: false,
    cursorUp: false,
    cursorDown: false,
    dockingOn: false,
    jump: false,
    hyperspace: false,
    mousePosition: vec2.fromValues(-1, -1),
    mouseDown: false,
    shiftPressed: false,
    nextEffectPressed: false,
    previousEffectPressed: false,
  }
}
