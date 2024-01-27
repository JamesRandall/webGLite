import { Resources } from "../resources/resources"
import { vec3 } from "gl-matrix"
import { dimensions, scannerRadialWorldRange } from "../constants"
import { LocalBubble } from "../model/localBubble"
import { createSquareModel, createSquareModelWithTexture } from "../resources/models"
import { createStardust } from "../gameloop/stardust"
import { createPregameSceneRenderer } from "../renderer/pregame/sceneRenderer"
import { createDashboardRenderer } from "../renderer/dashboard/dashboard"
import { generateGalaxy } from "../proceduralGeneration/starSystems"
import { Game, SceneEnum } from "../model/game"
import { getStartingPlayer } from "../model/player"
import { RendererEffectFunc, Scene } from "./scene"
import { Size } from "../model/geometry"
import { updateShipInstance } from "../gameloop/updateShipInstance"
import { createGameScene } from "./gameScene"
import { generateMarketItems } from "../proceduralGeneration/marketItems"
import { createRootRenderer, nextEffect, previousEffect, RenderEffect } from "../renderer/rootRenderer"

const startingZ = -scannerRadialWorldRange[2]
const targetZ = -scannerRadialWorldRange[2] / 24.0

export function createPregameScene(resources: Resources, gl: WebGLRenderingContext) {
  const clipSpaceRadius = 512
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
      model: createSquareModelWithTexture(gl, "/starmask.png"),
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
    },
    clipSpaceRadius: clipSpaceRadius,
    ships: ships,
    station: null,
    stardust: createStardust(),
    sunPlanetLightingDirection: [0, 0, 0],
  }
  const stars = generateGalaxy(0, resources.textures.planets.length)
  const startingSystem = stars.find((s) => s.name === "Lave")!
  const game: Game = {
    player: getStartingPlayer(resources, startingSystem),
    stars: stars,
    localBubble: localBubble,
    currentScene: SceneEnum.Front,
    launching: null,
    hyperspace: null,
    currentSystem: startingSystem,
    marketItems: generateMarketItems(startingSystem),
    diagnostics: [],
    renderEffect: RenderEffect.None,
    isFPSEnabled: false,
  }

  const sceneRenderer = createPregameSceneRenderer(gl, resources)
  const dashboardRenderer = createDashboardRenderer(gl, resources, dimensions.width, dimensions.dashboardHeight)
  const rootRenderer = createRootRenderer(gl, resources, sceneRenderer, dashboardRenderer)
  return createPregameLoop(game, gl, resources, rootRenderer)
}

function createPregameLoop(game: Game, gl: WebGLRenderingContext, resources: Resources, renderer: RendererEffectFunc) {
  const timeToStay = 6.0
  let then = 0
  let deltaTime = 0
  let isMovingIn = true
  let isMovingOut = false
  let timeSinceMovedIn = 0
  let currentShipIndex = 0
  let speed = startingZ / 2
  let startGame = false

  function createShip() {
    game.localBubble.ships[0] = resources.ships.getIndexedShip(
      currentShipIndex,
      vec3.fromValues(0, 0.0, startingZ),
      vec3.fromValues(0.0, 0.0, -1.0),
    )
    game.localBubble.ships[0].roll = game.localBubble.ships[0].blueprint.maxRollSpeed * 2
    game.localBubble.ships[0].pitch = -game.localBubble.ships[0].blueprint.maxPitchSpeed
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
    } else if (e.key === " ") {
      startGame = true
    } else if (e.key === "]") {
      game.renderEffect = nextEffect(game.renderEffect)
    } else if (e.key === "[") {
      game.renderEffect = previousEffect(game.renderEffect)
    }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      game.localBubble.ships[0].position = existingPosition
      game.localBubble.ships[0].roll = existingRoll
      game.localBubble.ships[0].pitch = existingPitch
    }
  }

  window.addEventListener("keydown", keyDown)

  const scene: Scene = {
    update: (now: number, viewportExtent: Size) => {
      if (startGame) {
        window.removeEventListener("keydown", keyDown)
        return createGameScene(resources, gl, game.renderEffect)
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
      } else if (isMovingOut) {
        game.localBubble.ships[0].position[2] += speed * deltaTime
        if (game.localBubble.ships[0].position[2] <= startingZ) {
          nextShip()
          isMovingIn = true
          isMovingOut = false
        }
      } else if (now > timeSinceMovedIn + timeToStay) {
        isMovingOut = true
      }

      renderer(game, deltaTime, game.renderEffect)
      return null
    },
  }
  return scene
}
