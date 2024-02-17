import { getStartingPlayer } from "../model/player"
import { bindKeys } from "../controls/bindKeys"
import { createSceneRenderer } from "../renderer/flight/sceneRenderer"
import { createStardust } from "../gameloop/stardust"
import { LocalBubble } from "../model/localBubble"
import { createSquareModel, createSquareModelWithLoadedTexture } from "../resources/models"
import { generateGalaxy } from "../proceduralGeneration/starSystems"
import { Game, SceneEnum } from "../model/game"
import { createGameLoop } from "../gameloop/gameLoop"
import { createDashboardRenderer } from "../renderer/dashboard/dashboard"
import { Resources } from "../resources/resources"
import { ShipInstance } from "../model/ShipInstance"
import { vec3 } from "gl-matrix"
import { dimensions, worldSize } from "../constants"
import { generateMarketItems } from "../proceduralGeneration/marketItems"
import { bindMouse } from "../controls/bindMouse"
import { createRootRenderer, RenderEffect } from "../renderer/rootRenderer"
import { randomiseSpawnDelta } from "../utilities"
import { updateGameOnHyperspace } from "../gameloop/utilities/updateGameOnHyperspace"
import { updateGameOnLaunch } from "../gameloop/utilities/updateGameOnLaunch"

export function createTestScene(resources: Resources, gl: WebGL2RenderingContext, ships: ShipInstance[]) {
  //const clipSpaceRadius = 2048
  const clipSpaceRadius = worldSize

  const localBubble: LocalBubble = {
    sun: {
      position: [0, 0, clipSpaceRadius - 100],
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
    ships: [],
    explosions: [],
    station: null,
    stardust: createStardust(),
    sunPlanetLightingDirection: [0, 0, 0],
  }
  localBubble.sunPlanetLightingDirection = vec3.normalize(
    vec3.create(),
    vec3.subtract(vec3.create(), localBubble.sun.position, localBubble.planet.position),
  )

  const stars = generateGalaxy(0, resources.textures.planets.length)
  const startingSystem = stars.find((s) => s.name === "Lave")!
  const game: Game = {
    disableSpawning: true,
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
    timeUntilNextSpawnChance: randomiseSpawnDelta(),
    extraVesselsSpawningDelay: 0,
  }
  game.player.isDocked = false
  game.player.cargoHoldContents = game.marketItems.map(() => 0)
  game.player.selectedSystem = stars.find((s) => s.name === "Diso")!

  updateGameOnHyperspace(game, resources)
  game.localBubble.ships = [...game.localBubble.ships, ...ships]

  bindKeys(game.player.controlState)
  bindMouse(game.player.controlState)
  const sceneRenderer = createSceneRenderer(gl, resources)
  const dashboardRenderer = createDashboardRenderer(gl, resources, dimensions.width, dimensions.dashboardHeight)
  const rootRenderer = createRootRenderer(gl, resources, sceneRenderer, dashboardRenderer)
  return createGameLoop(resources, game, rootRenderer)
}
