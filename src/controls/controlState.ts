// we could do this with a bitmask but this seems more readable
import {SceneEnum} from "../model/game";

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
    jump: boolean
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
        cursorDown: false
    }
}