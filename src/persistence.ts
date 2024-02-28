import { Game, SceneEnum } from "./model/game"
import { generateMarketItems, MarketItem } from "./proceduralGeneration/marketItems"
import { ShipModelEnum } from "./model/shipBlueprint"
import { CombatRatingEnum, getStartingPlayer, LegalStatusEnum, PlayerEquipment } from "./model/player"
import { LocalBubble } from "./model/localBubble"
import { createSquareModel, createSquareModelWithLoadedTexture } from "./resources/models"
import { createStardust } from "./gameloop/stardust"
import { vec2, vec3 } from "gl-matrix"
import { generateGalaxy } from "./proceduralGeneration/starSystems"
import { randomiseSpawnDelta } from "./utilities"
import { Resources } from "./resources/resources"
import { worldSize } from "./constants"
import { RenderEffect } from "./renderer/rootRenderer"

interface SaveState {
  version: { major: number; minor: number; patch: number }
  currentStarSystemSeed: number[]
  galaxyIndex: number
  marketItems: MarketItem[] // we store the market items to stop someone loading and reloading to try and get better prices, of course they could always hack this JSON!
  player: {
    cursor: number[]
    blueprintModel: ShipModelEnum
    cash: number
    name: string
    legalStatus: LegalStatusEnum
    combatRating: CombatRatingEnum
    numberOfKills: number
    fuel: number
    currentNumberOfMissiles: number
    equipment: PlayerEquipment
    cargoHoldContents: number[]
  }
}

export function saveGame(game: Game) {
  const state: SaveState = {
    version: { major: 1, minor: 0, patch: 0 },
    currentStarSystemSeed: [game.currentSystem.seed.s0, game.currentSystem.seed.s1, game.currentSystem.seed.s2],
    galaxyIndex: game.player.galaxyIndex,
    marketItems: game.marketItems,
    player: {
      cursor: [game.player.scannerCursor[0], game.player.scannerCursor[1]],
      blueprintModel: game.player.blueprint.model,
      cash: game.player.cash,
      name: game.player.name,
      legalStatus: game.player.legalStatus,
      combatRating: game.player.combatRating,
      numberOfKills: game.player.numberOfKills,
      fuel: game.player.fuel,
      currentNumberOfMissiles: game.player.missiles.currentNumber,
      equipment: game.player.equipment,
      cargoHoldContents: game.player.cargoHoldContents,
    },
  }
  localStorage.setItem("save", JSON.stringify(state))
}

export function loadGame(gl: WebGL2RenderingContext, resources: Resources) {
  const json = localStorage.getItem("save")
  if (!json) return
  const state: SaveState = JSON.parse(json)
  const game = newGame(gl, resources)
  game.currentSystem = game.stars.find(
    (s) =>
      s.seed.s0 === state.currentStarSystemSeed[0] &&
      s.seed.s1 === state.currentStarSystemSeed[1] &&
      s.seed.s2 === state.currentStarSystemSeed[2],
  )!
  game.player.selectedSystem = game.currentSystem
  game.player.galaxyIndex = state.galaxyIndex
  game.marketItems = state.marketItems
  game.player.scannerCursor = vec2.fromValues(state.player.cursor[0], state.player.cursor[1])
  game.player.blueprint = resources.ships.getBlueprint(state.player.blueprintModel)
  game.player.cash = state.player.cash
  game.player.name = state.player.name
  game.player.legalStatus = state.player.legalStatus
  game.player.combatRating = state.player.combatRating
  game.player.numberOfKills = state.player.numberOfKills
  game.player.fuel = state.player.fuel
  game.player.missiles.currentNumber = state.player.currentNumberOfMissiles
  game.player.equipment = state.player.equipment
  game.player.cargoHoldContents = state.player.cargoHoldContents
}

export function doesSaveExist() {
  return localStorage.getItem("save") !== null
}

export function newGame(gl: WebGL2RenderingContext, resources: Resources) {
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
    disableSpawning: false,
    player: getStartingPlayer(resources, startingSystem),
    stars: stars,
    localBubble: localBubble,
    currentScene: SceneEnum.PlayerDetails,
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
  game.player.cargoHoldContents = game.marketItems.map(() => 0)

  return game
}
