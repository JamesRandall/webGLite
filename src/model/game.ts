import {Player} from "./player";
import {StarSystem} from "./starSystem";
import {LocalBubble} from "./localBubble";
import {MarketItem} from "../proceduralGeneration/marketItems";

export enum SceneEnum {
    Front,
    LocalMap,
    SystemDetails,
    PlayerDetails,
    Inventory,
    Launching,
    Hyperspace,
    BuyMarketItems
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
    currentSystem: StarSystem,
    marketItems: MarketItem[],
    player: Player
    localBubble: LocalBubble
    stars: StarSystem[]
    currentScene: SceneEnum
    launching: LaunchingData | null
    hyperspace: HyperspaceData | null
}