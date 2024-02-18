import { Game, SceneEnum } from "../model/game"
import { Size } from "../model/geometry"
import { flightLoop } from "./flightLoop"
import { RendererEffectFunc, Scene } from "../scenes/scene"
import { createLaunchingLoop } from "./launching"
import { applyControlState } from "./applyControlState"
import { Resources } from "../resources/resources"
import { createHyperspaceLoop } from "./hyperspace"
import { createDockingLoop } from "./docking"
import { createFramerateCounter } from "../utilities"
import { vec3 } from "gl-matrix"

function applySceneSelection(game: Game) {
  if (game.player.controlState.sceneSelection === null) {
    return
  }

  if (game.player.isDocked) {
    // scenes are slightly different when docked
    switch (game.player.controlState.sceneSelection!) {
      case 1:
        game.currentScene = SceneEnum.Launching
        break
      case 2:
        game.currentScene = SceneEnum.BuyMarketItems
        break
      case 3:
        game.currentScene = SceneEnum.BuyEquipment
        break
      case 5:
        game.currentScene = SceneEnum.LongRangeMap
        break
      case 6:
        game.currentScene = SceneEnum.LocalMap
        break
      case 7:
        game.currentScene = SceneEnum.SystemDetails
        break
      case 8:
        game.currentScene = SceneEnum.PriceList
        break
      case 9:
        game.currentScene = SceneEnum.PlayerDetails
        break
      case 0:
        game.currentScene = SceneEnum.Inventory
        break
    }
  } else {
    switch (game.player.controlState.sceneSelection!) {
      case 1:
        game.currentScene = SceneEnum.Front
        break
      case 5:
        game.currentScene = SceneEnum.LongRangeMap
        break
      case 6:
        game.currentScene = SceneEnum.LocalMap
        break
      case 7:
        game.currentScene = SceneEnum.SystemDetails
        break
      case 8:
        game.currentScene = SceneEnum.PriceList
        break
      case 9:
        game.currentScene = SceneEnum.PlayerDetails
        break
      case 0:
        game.currentScene = SceneEnum.Inventory
        break
    }
  }
  game.player.controlState.sceneSelection = null
}

function applyHyperspaceCountdown(game: Game, hyperspaceClock: number | null, deltaTime: number) {
  if (hyperspaceClock === null && game.hyperspace !== null) {
    hyperspaceClock = 0
  } else if (hyperspaceClock !== null) {
    if (hyperspaceClock > 0.1 && game.hyperspace !== null) {
      game.hyperspace.countdown--
      if (game.hyperspace.countdown === 0) {
        game.currentScene = SceneEnum.Hyperspace
      } else {
        hyperspaceClock = 0
      }
    } else {
      hyperspaceClock += deltaTime
    }
  }
  return hyperspaceClock
}

function shouldRunFlightLoop(game: Game) {
  return (
    !game.player.isDocked &&
    game.currentScene != SceneEnum.Hyperspace &&
    game.currentScene != SceneEnum.Launching &&
    game.currentScene != SceneEnum.PlayerExploding &&
    game.currentScene != SceneEnum.Docking
  )
}

function getLookAt(currentScene: SceneEnum) {
  switch (currentScene) {
    case SceneEnum.Rear:
      return [0, 0, -1]
    case SceneEnum.Left:
      return [-1, 0, 0]
    case SceneEnum.Right:
      return [1, 0, 0]
    case SceneEnum.Front:
    default:
      return [0, 0, 1]
  }
}

function createApplyCameraShake() {
  let time = 0
  const maxXDelta = 0.01
  const maxYDelta = 0.01
  const maxXRange = 0.1
  const maxYRange = 0.1
  const timeBetweenShake = 0.04
  return function applyCameraShake(game: Game, timeDelta: number) {
    if (game.player.isJumping) {
      time += timeDelta
      if (time > timeBetweenShake) {
        time = 0
        const xDelta = (Math.random() - 0.5) * maxXDelta
        const yDelta = (Math.random() - 0.5) * maxYDelta
        if (game.currentScene == SceneEnum.Front) {
          const c = game.player.lookAt
          c[0] += xDelta
          c[1] += yDelta
          if (c[0] > maxXRange) {
            c[0] = maxXRange
          } else if (c[0] < -maxYRange) {
            c[0] = -maxXRange
          }
          if (c[1] > maxYRange) {
            c[1] = maxYRange
          } else if (c[1] < -maxYRange) {
            c[1] = -maxYRange
          }
          game.player.lookAt = c
        }
      }
    } else {
      const lookAt = getLookAt(game.currentScene)
      game.player.lookAt = vec3.fromValues(lookAt[0], lookAt[1], lookAt[2])
    }
  }
}

export function createGameLoop(resources: Resources, game: Game, renderer: RendererEffectFunc) {
  let then = 0
  let deltaTime = 0
  let launchingLoop: ((deltaTime: number) => void) | null = null
  let dockingLoop: ((deltaTime: number) => void) | null = null
  let hyperspaceLoop: ((deltaTime: number) => void) | null = null
  let hyperspaceClock: number | null = null
  let frameRateCounter = createFramerateCounter()
  let applyCameraShake = createApplyCameraShake()

  const scene: Scene = {
    update: (now: number, _: Size) => {
      now *= 0.001 // convert to seconds
      deltaTime = now - then
      then = now
      game.diagnostics = []
      hyperspaceClock = applyHyperspaceCountdown(game, hyperspaceClock, deltaTime)
      applySceneSelection(game)
      applyControlState(game, resources, deltaTime)

      if (shouldRunFlightLoop(game)) {
        flightLoop(resources, game, deltaTime)
        applyCameraShake(game, deltaTime)
      }
      if (game.currentScene === SceneEnum.Launching) {
        if (launchingLoop === null) {
          launchingLoop = createLaunchingLoop(game, resources, () => (launchingLoop = null))
          resources.soundEffects.launch()
        }
        launchingLoop!(deltaTime)
      } else if (game.currentScene === SceneEnum.Hyperspace) {
        if (hyperspaceLoop === null) {
          hyperspaceLoop = createHyperspaceLoop(game, resources, () => (hyperspaceLoop = null))
          resources.soundEffects.hyperspace()
        }
        hyperspaceLoop!(deltaTime)
      } else if (game.currentScene === SceneEnum.Docking) {
        if (dockingLoop === null) {
          dockingLoop = createDockingLoop(game, resources, () => (dockingLoop = null))
          resources.soundEffects.docked()
        }
        dockingLoop!(deltaTime)
      }

      if (game.isFPSEnabled) {
        game.diagnostics.push(`FPS: ${frameRateCounter(deltaTime)}`)
      }

      renderer(game, deltaTime, game.renderEffect)
      game.player.previousControlState = { ...game.player.controlState }
      return null
    },
  }
  return scene
}
