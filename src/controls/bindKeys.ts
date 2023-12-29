import {Player} from "../model/player";
import {ControlState} from "./controlState";

export function bindKeys(controlState: ControlState) {
    const setControl = (e:KeyboardEvent, newState:boolean) => {
        if (e.key >= "0" && e.key <= "9" && newState) {
            controlState.sceneSelection = parseInt(e.key)
            return
        }

        switch (e.key) {
            case ",": controlState.rollLeft = newState; break;
            case ".": controlState.rollRight = newState; break;
            case "s": controlState.pitchDown = newState; break;
            case "x": controlState.pitchUp = newState; break;
            case " ": controlState.accelerate = newState; break;
            case "/": controlState.decelerate = newState; break;
            case "j": controlState.jump = newState; break;
            case "ArrowLeft": controlState.cursorLeft = newState; break;
            case "ArrowRight": controlState.cursorRight = newState; break;
            case "ArrowUp": controlState.cursorUp = newState; break;
            case "ArrowDown": controlState.cursorDown = newState; break;
            case "h": controlState.hyperspace = newState; break;
        }
    }

    const keyDown = (e:KeyboardEvent) => setControl(e,true)
    const keyUp = (e:KeyboardEvent) => setControl(e, false)

    window.addEventListener("keydown", keyDown)
    window.addEventListener("keyup", keyUp)

    return () => {
        window.removeEventListener("keydown", keyDown)
        window.removeEventListener("keyup", keyUp)
    }
}