import { Player } from "./player"
import { StarSystem } from "./starSystem"
import { LocalBubble } from "./localBubble"
import { MarketItem } from "../proceduralGeneration/marketItems"
import { RenderEffect } from "../renderer/rootRenderer"

export enum SceneEnum {
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
}
