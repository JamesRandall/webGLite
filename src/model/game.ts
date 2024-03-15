import { LaserMountEnum, LaserTypeEnum, Player } from "./player"
import { StarSystem } from "./starSystem"
import { LocalBubble } from "./localBubble"
import { MarketItem } from "../proceduralGeneration/marketItems"
import { RenderEffect } from "../renderer/rootRenderer"

export enum SceneEnum {
  Pregame,
  Front,
  Rear,
  Left,
  Right,
  LocalMap,
  LongRangeMap,
  SystemDetails,
  PlayerDetails,
  Inventory,
  Launching,
  Hyperspace,
  Witchspace,
  BuyMarketItems,
  BuyEquipment,
  Docking,
  PlayerExploding,
  PriceList,
  Instructions,
  LoadoutEditor,
}

export function getLaserMountForScene(scene: SceneEnum) {
  switch (scene) {
    case SceneEnum.Front:
      return LaserMountEnum.Front
    case SceneEnum.Right:
      return LaserMountEnum.Right
    case SceneEnum.Rear:
      return LaserMountEnum.Rear
    case SceneEnum.Left:
      return LaserMountEnum.Left
  }
  return LaserMountEnum.None
}

export interface LaunchingData {
  outboundRadii: number[]
  inboundRadii: number[]
}

export interface HyperspaceData {
  countdown: number
  rotation: number
  outboundRadii: number[]
  inboundRadii: number[]
}

export interface Game {
  disableSpawning: boolean
  currentSystem: StarSystem
  marketItems: MarketItem[]
  player: Player
  localBubble: LocalBubble
  stars: StarSystem[]
  currentScene: SceneEnum
  launching: LaunchingData | null
  hyperspace: HyperspaceData | null
  diagnostics: string[]
  renderEffect: RenderEffect
  isFPSEnabled: boolean
  timeUntilNextSpawnChance: number
  extraVesselsSpawningDelay: number
  flashMessage: string
  flashMessageIntervals: number[]
  message: string | null
  purchasingLaserType: LaserTypeEnum | null
  ecmTimings: { timeRemaining: number; warmUpTimeRemaining: number } | null
  // Rather than deal with null planets and suns everywhere we instead just don't render them
  // and fix the altitude when we are in witchspace
  isInWitchspace: boolean
}
export function flashMessage(game: Game, message: string) {
  const flashSpeed = 0.5
  game.message = null
  game.flashMessage = message
  game.flashMessageIntervals = [flashSpeed, flashSpeed, flashSpeed, flashSpeed, flashSpeed, flashSpeed]
}
