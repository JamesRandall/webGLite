import { ControlState } from "./controlState"

export function bindKeys(controlState: ControlState) {
  const setControl = (e: KeyboardEvent, newState: boolean) => {
    if (e.key >= "0" && e.key <= "9" && newState) {
      e.preventDefault()
      controlState.sceneSelection = parseInt(e.key)
      return
    }

    let handled = true
    switch (e.key) {
      case "i":
      case "I":
        controlState.instructions = newState
        break
      case "l":
      case "L":
        controlState.loading = newState
        break
      case "a":
      case "A":
        controlState.firing = newState
        break
      case ",":
        controlState.rollLeft = newState
        break
      case ".":
        controlState.rollRight = newState
        break
      case "s":
      case "S":
        controlState.pitchDown = newState
        controlState.saving = newState
        break
      case "t":
      case "T":
        controlState.armMissile = newState
        break
      case "m":
      case "M":
        controlState.fireMissile = newState
        break
      case "u":
      case "U":
        controlState.unarmMissile = newState
        break
      case "x":
      case "X":
        controlState.pitchUp = newState
        break
      case " ":
        controlState.accelerate = newState
        break
      case "/":
        controlState.decelerate = newState
        break
      case "e":
      case "E":
        controlState.ecm = newState
        break
      case "Tab":
        controlState.energyBomb = newState
        break
      case "j":
      case "J":
        controlState.jump = newState
        break
      case "ArrowLeft":
        controlState.cursorLeft = newState
        break
      case "ArrowRight":
        controlState.cursorRight = newState
        break
      case "ArrowUp":
        controlState.cursorUp = newState
        break
      case "ArrowDown":
        controlState.cursorDown = newState
        break
      case "h":
      case "H":
        controlState.hyperspace = newState
        break
      case "Shift":
        controlState.shiftPressed = newState
        break
      case "c":
      case "C":
        controlState.dockingOn = newState
        break
      case "[":
        controlState.previousEffectPressed = newState
        break
      case "]":
        controlState.nextEffectPressed = newState
        break
      default:
        handled = false
    }
    if (handled) {
      e.preventDefault()
    }
  }

  const keyDown = (e: KeyboardEvent) => setControl(e, true)
  const keyUp = (e: KeyboardEvent) => setControl(e, false)

  window.addEventListener("keydown", keyDown)
  window.addEventListener("keyup", keyUp)

  return () => {
    window.removeEventListener("keydown", keyDown)
    window.removeEventListener("keyup", keyUp)
  }
}
