import { LaserTypeEnum, Player } from "./player"
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
  BuyMarketItems,
  BuyEquipment,
  Docking,
  PlayerExploding,
  PriceList,
  Instructions,
  LoadoutEditor,
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
}
export function flashMessage(game: Game, message: string) {
  const flashSpeed = 0.5
  game.message = null
  game.flashMessage = message
  game.flashMessageIntervals = [flashSpeed, flashSpeed, flashSpeed, flashSpeed, flashSpeed, flashSpeed]
}
