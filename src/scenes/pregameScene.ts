import { Resources } from "../resources/resources"
import { vec3 } from "gl-matrix"
import { dimensions, scannerRadialWorldRange } from "../constants"
import { LocalBubble } from "../model/localBubble"
import { createSquareModel, createSquareModelWithLoadedTexture } from "../resources/models"
import { createStardust } from "../gameloop/stardust"
import { createPregameSceneRenderer } from "../renderer/pregame/sceneRenderer"
import { createDashboardRenderer } from "../renderer/dashboard/dashboard"
import { generateGalaxy } from "../proceduralGeneration/starSystems"
import { Game, SceneEnum } from "../model/game"
import { getStartingPlayer } from "../model/player"
import { RendererEffectFunc } from "./scene"
import { Size } from "../model/geometry"
import { updateShipInstance } from "../gameloop/updateShipInstance"
import { createGameScene } from "./gameScene"
import { generateMarketItems } from "../proceduralGeneration/marketItems"
import { createRootRenderer, nextEffect, previousEffect, RenderEffect } from "../renderer/rootRenderer"
import { doesSaveExist, loadGame, newGame } from "../persistence"
import { bindMouse } from "../controls/bindMouse"

const startingZ = -scannerRadialWorldRange[2]
const targetZ = -scannerRadialWorldRange[2] / 24.0

export const createPregameScene = (resources: Resources, gl: WebGL2RenderingContext) => {
  const clipSpaceRadius = Math.abs(startingZ)
  const startingShip = 0

  // TODO: The ship models are currently pointing the wrong way round, wwe need to rotate them around Y 180 degrees
  // when we load them!
  const ships = [
    //resources.ships.getCobraMk3(vec3.fromValues(0, 0.0, -scannerRadialWorldRange[2] / 24.0), vec3.fromValues(0.0, 0.0, -1.0))
    resources.ships.getIndexedShip(startingShip, vec3.fromValues(0, 0.0, startingZ), vec3.fromValues(0.0, 0.0, -1.0)),
  ]
  ships[0].roll = ships[0].blueprint.maxRollSpeed
  ships[0].pitch = ships[0].blueprint.maxPitchSpeed * 2

  const localBubble: LocalBubble = {
    sun: {
      position: [0, 0, clipSpaceRadius - 1],
      noseOrientation: [0, 0, -1],
      initialOrientation: [0, 0, -1],
      roofOrientation: [0, 1, 0],
      rightOrientation: [1, 0, 0],
      color: [1.0, 0.0, 0.0],
      radius: 1300000,
      pitch: 0.0,
      roll: 0.0,
      surfaceTextureIndex: 0,
      model: createSquareModelWithLoadedTexture(gl, resources.textures.starmask),
      fixedDirectionOfMovement: null,
      boundingBox: [],
    },
    planet: {
      position: [0, 0, -clipSpaceRadius / 2],
      noseOrientation: [0, 0, 1],
      initialOrientation: [0, 0, 1],
      roofOrientation: [0, 1, 0],
      rightOrientation: [-1, 0, 0],
      color: [0.0, 0.0, 0.8],
      radius: 1,
      pitch: 0.0,
      roll: 0.0,
      surfaceTextureIndex: 0,
      model: createSquareModel(gl, [0.0, 0.0, 0.8, 1.0]),
      fixedDirectionOfMovement: null,
      boundingBox: [],
    },
    clipSpaceRadius: clipSpaceRadius,
    ships: ships,
    explosions: [],
    station: null,
    stardust: createStardust(),
    sunPlanetLightingDirection: [0, 0, 0],
  }
  const stars = generateGalaxy(0, resources.textures.planets.length)
  const startingSystem = stars.find((s) => s.name === "Lave")!
  const game: Game = {
    disableSpawning: true,
    player: getStartingPlayer(resources, startingSystem),
    stars: stars,
    localBubble: localBubble,
    currentScene: SceneEnum.Pregame,
    launching: null,
    hyperspace: null,
    currentSystem: startingSystem,
    marketItems: generateMarketItems(startingSystem),
    diagnostics: [],
    renderEffect: RenderEffect.None,
    isFPSEnabled: false,
    timeUntilNextSpawnChance: 0,
    extraVesselsSpawningDelay: 0,
    flashMessage: "",
    flashMessageIntervals: [],
    message: null,
    purchasingLaserType: null,
    ecmTimings: null,
    isInWitchspace: false,
  }

  let rootRenderer = createRootRenderer(
    gl,
    resources,
    createPregameSceneRenderer(gl, resources),
    createDashboardRenderer(gl, resources, dimensions.width, dimensions.dashboardHeight),
  )
  let update = createPregameLoop(game, gl, resources, rootRenderer)
  const resize = () => {
    rootRenderer = createRootRenderer(
      gl,
      resources,
      createPregameSceneRenderer(gl, resources),
      createDashboardRenderer(gl, resources, dimensions.width, dimensions.dashboardHeight),
    )
    update = createPregameLoop(game, gl, resources, rootRenderer)
  }

  return {
    resize: resize,
    update: (now: number, sz: Size) => update(now, sz),
  }
}

function createPregameLoop(game: Game, gl: WebGL2RenderingContext, resources: Resources, renderer: RendererEffectFunc) {
  const timeToStay = 6.0
  let then = 0
  let deltaTime = 0
  let isMovingIn = true
  let isMovingOut = false
  let timeSinceMovedIn = 0
  let currentShipIndex = 0
  let speed = startingZ / 1.5
  let askingToLoad = false
  let loadGameFromStorage = false

  function createShip() {
    game.localBubble.ships[0] = resources.ships.getIndexedShip(
      currentShipIndex,
      vec3.fromValues(0, 0.0, startingZ),
      vec3.fromValues(0.0, 0.0, -1.0),
    )
    game.localBubble.ships[0].roll = game.localBubble.ships[0].blueprint.maxRollSpeed
    game.localBubble.ships[0].pitch = -game.localBubble.ships[0].blueprint.maxPitchSpeed * 2
  }

  function nextShip() {
    currentShipIndex++
    if (currentShipIndex >= resources.ships.numberOfShips) {
      currentShipIndex = 0
    }
    createShip()
  }

  function previousShip() {
    currentShipIndex--
    if (currentShipIndex < 0) {
      currentShipIndex = resources.ships.numberOfShips - 1
    }
    createShip()
  }

  const keyDown = (e: KeyboardEvent) => {
    const existingPosition = game.localBubble.ships[0].position
    const existingRoll = game.localBubble.ships[0].roll
    const existingPitch = game.localBubble.ships[0].pitch
    if (e.key === "ArrowRight") {
      nextShip()
    } else if (e.key === "ArrowLeft") {
      previousShip()
    } else if (e.key === " " || e.key === "S" || e.key === "s") {
      if (game.currentScene === SceneEnum.LoadoutEditor) {
        game.currentScene = SceneEnum.Front
      } else {
        if (doesSaveExist()) {
          game.message = "Load existing commander (Y/N)?"
          askingToLoad = true
        } else {
          game.currentScene = SceneEnum.LoadoutEditor
        }
      }
    } else if (e.key === "]") {
      game.renderEffect = nextEffect(game.renderEffect)
    } else if (e.key === "[") {
      game.renderEffect = previousEffect(game.renderEffect)
    } else if ((e.key === "Y" || e.key === "y") && askingToLoad) {
      loadGameFromStorage = true
    } else if ((e.key === "N" || e.key === "n") && askingToLoad) {
      game.currentScene = SceneEnum.LoadoutEditor
    }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      game.localBubble.ships[0].position = existingPosition
      game.localBubble.ships[0].roll = existingRoll
      game.localBubble.ships[0].pitch = existingPitch
    }
  }

  window.addEventListener("keydown", keyDown)
  const unbindMouse = bindMouse(game.player.controlState)

  let isFirst = true
  game.message = "Press Space Or Fire, Commander"

  return (now: number, viewportExtent: Size) => {
    // we skip the first frame of the pregame screen as the time we will be given is based on the render time
    // and that initial number is large, if its used for the frame time then the initial ship will appear past the
    // camera
    if (!isFirst) {
      if (game.currentScene === SceneEnum.Front || loadGameFromStorage) {
        window.removeEventListener("keydown", keyDown)
        unbindMouse()
        const theNewGame = (loadGameFromStorage ? loadGame(gl, resources) : null) ?? newGame(gl, resources)
        if (!loadGameFromStorage) {
          theNewGame.player.equipment = { ...game.player.equipment }
        }
        return createGameScene(resources, gl, theNewGame)
      }

      now *= 0.001 // convert to seconds
      deltaTime = now - then
      then = now

      updateShipInstance(game.localBubble.ships[0], game.player, deltaTime)

      // we can't use the ships speed to move it in as that follows the direction of the nose orientation
      if (isMovingIn) {
        game.localBubble.ships[0].position[2] -= speed * deltaTime
        if (game.localBubble.ships[0].position[2] >= targetZ) {
          isMovingIn = false
          timeSinceMovedIn = now
        }
        // if anything causes a huge time delta (switching user seems to do it on a Mac) due to things being paused
        // then you can end out of the startingZ - targetZ range. If that happens then just reset by moving to the
        // next ship
        if (game.localBubble.ships[0].position[2] < startingZ) {
          nextShip()
          isMovingIn = true
          isMovingOut = false
        }
      } else if (isMovingOut) {
        game.localBubble.ships[0].position[2] += speed * deltaTime
        // if anything causes a huge time delta (switching user seems to do it on a Mac) due to things being paused
        // then you can end out of rhe startingZ - targetZ range. If that happens then just reset by moving to the
        // next ship
        if (game.localBubble.ships[0].position[2] <= startingZ || game.localBubble.ships[0].position[2] > targetZ) {
          nextShip()
          isMovingIn = true
          isMovingOut = false
        }
      } else if (now > timeSinceMovedIn + timeToStay) {
        isMovingOut = true
      }

      renderer(game, deltaTime, game.renderEffect)

      game.player.previousControlState = { ...game.player.controlState }
    } else {
      resources.soundEffects.bootUp()
      then = now * 0.001
      isFirst = false
    }
    return null
  }
}
